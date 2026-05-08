import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Harap login terlebih dahulu' }, { status: 401 })
    }

    const { code, packageId } = await request.json()
    if (!code || !packageId) {
      return NextResponse.json({ error: 'Kode voucher dan Paket wajib diisi' }, { status: 400 })
    }

    // Ambil detail paket
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('price, id')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // Cari voucher
    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (voucherError || !voucher) {
      return NextResponse.json({ error: 'Kode voucher tidak valid' }, { status: 404 })
    }

    if (!voucher.is_active) {
      return NextResponse.json({ error: 'Voucher sudah tidak aktif' }, { status: 400 })
    }

    // Validasi kuota
    if (voucher.max_uses !== null && voucher.current_uses >= voucher.max_uses) {
      return NextResponse.json({ error: 'Kuota penggunaan voucher ini sudah habis' }, { status: 400 })
    }

    // Validasi masa berlaku
    const now = new Date()
    if (voucher.valid_from && new Date(voucher.valid_from) > now) {
      return NextResponse.json({ error: 'Voucher ini belum bisa digunakan' }, { status: 400 })
    }
    if (voucher.valid_until && new Date(voucher.valid_until) < now) {
      return NextResponse.json({ error: 'Voucher ini sudah kedaluwarsa' }, { status: 400 })
    }

    // Validasi paket
    if (voucher.applicable_package_ids && voucher.applicable_package_ids.length > 0) {
      if (!voucher.applicable_package_ids.includes(pkg.id)) {
        return NextResponse.json({ error: 'Voucher ini tidak berlaku untuk paket yang Anda pilih' }, { status: 400 })
      }
    }

    // Validasi jika user sudah pernah pakai voucher ini
    // (Bisa dilonggarkan jika admin mengizinkan pakai berkali-kali, tapi standar biasanya 1x per user)
    const { data: pastUsage } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('voucher_id', voucher.id)
      .in('status', ['success', 'settlement'])
      .limit(1)

    if (pastUsage && pastUsage.length > 0) {
      return NextResponse.json({ error: 'Anda sudah pernah menggunakan voucher ini sebelumnya' }, { status: 400 })
    }

    // Hitung diskon
    let discountAmount = 0
    if (voucher.discount_type === 'percentage') {
      discountAmount = Math.floor((pkg.price * voucher.discount_value) / 100)
      if (voucher.max_discount && discountAmount > voucher.max_discount) {
        discountAmount = voucher.max_discount
      }
    } else {
      discountAmount = voucher.discount_value
    }

    // Pastikan harga akhir tidak negatif
    const finalPrice = Math.max(0, pkg.price - discountAmount)
    
    // Perbaikan: Jangan kembalikan error jika finalPrice 0.
    // Transaksi dengan Rp 0 bisa diselesaikan secara otomatis nantinya di create-subscription
    
    return NextResponse.json({
      success: true,
      voucherId: voucher.id,
      discountAmount,
      finalPrice
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
