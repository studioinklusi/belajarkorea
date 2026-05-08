import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { snap } from '@/lib/midtrans'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting (5 checkout attempts per minute per IP)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const limit = rateLimit(`checkout-${ip}`, 5, 60 * 1000)
    
    if (!limit.success) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan checkout. Harap tunggu sebentar." },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    // 1. Verifikasi Session User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse Request Body
    const { packageId, voucherCode } = await request.json()
    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    // 3. Ambil Detail Package
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Ambil Profil User untuk data customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 4. Generate Order ID
    const orderId = `PKG-${Date.now()}-${user.id.substring(0, 6).toUpperCase()}`

    // 4.5. Hitung Diskon jika ada Voucher
    let finalPrice = pkg.price
    let discountAmount = 0
    let voucherId = null

    if (voucherCode) {
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode)
        .eq('is_active', true)
        .single()

      if (voucher) {
        // Abaikan jika tidak berlaku untuk paket ini
        if (!voucher.applicable_package_ids || voucher.applicable_package_ids.includes(pkg.id)) {
          if (voucher.discount_type === 'percentage') {
            discountAmount = Math.floor((pkg.price * voucher.discount_value) / 100)
            if (voucher.max_discount && discountAmount > voucher.max_discount) {
              discountAmount = voucher.max_discount
            }
          } else {
            discountAmount = voucher.discount_value
          }
          finalPrice = Math.max(0, pkg.price - discountAmount)
          voucherId = voucher.id
        }
      }
    }

    const isFree = finalPrice === 0

    // 5. Insert Transaksi ke Supabase
    const { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        order_id: orderId,
        amount: finalPrice,
        status: isFree ? 'success' : 'pending',
        voucher_id: voucherId,
        discount_amount: discountAmount
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting transaction:', insertError)
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 })
    }

    // Update current_uses voucher jika digunakan
    if (voucherId) {
      // Bypass RLS menggunakan supabaseAdmin karena user biasa tidak punya akses UPDATE ke tabel vouchers
      supabaseAdmin.from('vouchers').select('current_uses').eq('id', voucherId).single().then(({data}) => {
        if(data) supabaseAdmin.from('vouchers').update({current_uses: data.current_uses + 1}).eq('id', voucherId).then()
      }).catch(console.error)
    }

    // Jika Gratis (100% diskon), langsung selesaikan tanpa Midtrans
    if (isFree) {
      // Insert subscription record langsung
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + pkg.duration_days)

      await supabaseAdmin.from('subscriptions').insert({
        user_id: user.id,
        package_id: pkg.id,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })

      return NextResponse.json({ isFree: true, orderId })
    }

    // 6. Buat Payload untuk Midtrans Snap
    const parameter: any = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalPrice
      },
      customer_details: {
        first_name: profile?.full_name || 'Pelanggan',
        email: user.email,
      },
      item_details: [{
        id: pkg.slug,
        price: pkg.price,
        quantity: 1,
        name: `Langganan ${pkg.name} (${pkg.duration_days} Hari)`
      }]
    }

    if (discountAmount > 0) {
      parameter.item_details.push({
        id: 'DISCOUNT',
        price: -discountAmount,
        quantity: 1,
        name: `Voucher Diskon (${voucherCode})`
      })
    }

    // 7. Request Snap Token ke Midtrans
    const transactionSnap = await snap.createTransaction(parameter)
    const snapToken = transactionSnap.token

    // 8. Update Transaksi dengan Snap Token
    // Kita butuh admin override jika RLS memblokir update (biasanya user bisa update transaksinya sendiri berdasarkan kebijakan yang kita buat, tapi menggunakan service_role key lebih aman untuk webhook/api internal)
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ snap_token: snapToken })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating snap token:', updateError)
    }

    // Return token ke client
    return NextResponse.json({ token: snapToken, orderId })
    
  } catch (error: unknown) {
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
