import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const { packageId } = await request.json()
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

    // 5. Insert Transaksi ke Supabase (Status Pending)
    const { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        order_id: orderId,
        amount: pkg.price,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting transaction:', insertError)
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 })
    }

    // 6. Buat Payload untuk Midtrans Snap
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: pkg.price
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
