import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { coreApi } from '@/lib/midtrans'

export async function POST(request: Request) {
  let rawBody = ''
  try {
    rawBody = await request.text()
    const payload = JSON.parse(rawBody)

    // 1. Verifikasi payload menggunakan Midtrans Core API
    // Midtrans SDK otomatis memverifikasi signature key di balik layar
    const statusResponse = await coreApi.transaction.notification(payload)
    
    const orderId = statusResponse.order_id
    const transactionStatus = statusResponse.transaction_status
    const fraudStatus = statusResponse.fraud_status

    console.log(`Webhook received for Order ID: ${orderId}, Status: ${transactionStatus}`)

    // 2. Ambil Transaksi dari DB
    const { data: transaction, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('*, packages(*)')
      .eq('order_id', orderId)
      .single()

    if (txnError || !transaction) {
      console.error(`Transaction not found for Order ID: ${orderId}`)
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 })
    }

    // 3. Tentukan status baru
    let newStatus = 'pending'

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        newStatus = 'pending' // Masih direview (kartu kredit)
      } else if (fraudStatus == 'accept') {
        newStatus = 'success'
      }
    } else if (transactionStatus == 'settlement') {
      newStatus = 'success'
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny') {
      newStatus = 'failed'
    } else if (transactionStatus == 'expire') {
      newStatus = 'expired'
    } else if (transactionStatus == 'pending') {
      newStatus = 'pending'
    }

    // Hindari update jika status sudah success sebelumnya (mencegah duplicate processing)
    if (transaction.status === 'success' && newStatus === 'success') {
      return NextResponse.json({ message: 'Transaction already processed' })
    }

    // 4. Update tabel transaksi
    await supabaseAdmin
      .from('transactions')
      .update({ 
        status: newStatus,
        payment_type: statusResponse.payment_type,
        midtrans_order_id: statusResponse.transaction_id,
        metadata: statusResponse,
        webhook_received_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // 5. Jika Success, Aktifkan Subscription ATAU Produk
    if (newStatus === 'success') {
      if (transaction.package_id && transaction.packages) {
        // Logika Subscription (Paket Kursus)
        const packageId = transaction.package_id
        const durationDays = transaction.packages.duration_days
        
        // Cek apakah user sudah punya subscription untuk package ini
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', transaction.user_id)
          .eq('package_id', packageId)
          .single()

        const newExpiresAt = new Date()
        newExpiresAt.setDate(newExpiresAt.getDate() + durationDays)

        if (existingSub) {
          // Update/Perpanjang subscription yang ada
          let baseDate = new Date()
          if (['active', 'grace_period'].includes(existingSub.status) && new Date(existingSub.expires_at) > new Date()) {
            baseDate = new Date(existingSub.expires_at)
          }
          
          baseDate.setDate(baseDate.getDate() + durationDays)

          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'active',
              expires_at: baseDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSub.id)
        } else {
          // Buat subscription baru
          await supabaseAdmin
            .from('subscriptions')
            .insert({
              user_id: transaction.user_id,
              package_id: packageId,
              status: 'active',
              started_at: new Date().toISOString(),
              expires_at: newExpiresAt.toISOString()
            })
        }
      } else if (transaction.product_id) {
        // Logika Produk Digital
        // Cek apakah sudah terbeli (menghindari duplikasi)
        const { data: existingPurchase } = await supabaseAdmin
          .from('product_purchases')
          .select('id')
          .eq('user_id', transaction.user_id)
          .eq('product_id', transaction.product_id)
          .single()

        if (!existingPurchase) {
          await supabaseAdmin
            .from('product_purchases')
            .insert({
              user_id: transaction.user_id,
              product_id: transaction.product_id,
              transaction_id: transaction.id,
              download_count: 0
            })
        }
      }
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })

  } catch (error: unknown) {
    // Audit logging untuk kegagalan webhook (misal: invalid signature dari attacker)
    console.error('CRITICAL Webhook Error:', {
      message: (error as Error).message,
      stack: error.stack,
      rawBody: rawBody.substring(0, 500) // Log 500 karakter pertama dari payload
    })
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
