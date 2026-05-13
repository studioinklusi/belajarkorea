import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { coreApi } from '@/lib/midtrans'
import crypto from 'crypto'

// ============================================================
// Midtrans Webhook Signature Verification
// Formula: SHA512(order_id + status_code + gross_amount + server_key)
// Docs: https://docs.midtrans.com/reference/receiving-notifications
// ============================================================

function verifySignature(payload: {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) {
    console.error('MIDTRANS_SERVER_KEY not set — cannot verify webhook signature')
    return false
  }

  const input = payload.order_id + payload.status_code + payload.gross_amount + serverKey
  const expectedSignature = crypto.createHash('sha512').update(input).digest('hex')

  return expectedSignature === payload.signature_key
}

export async function POST(request: Request) {
  let rawBody = ''
  try {
    rawBody = await request.text()
    const payload = JSON.parse(rawBody)

    // ─────────────────────────────────────────────────────────
    // LAYER 1: Verifikasi Signature Key
    // Pastikan notifikasi benar-benar datang dari Midtrans,
    // bukan dari pihak luar yang mencoba memanipulasi database.
    // ─────────────────────────────────────────────────────────
    if (!payload.signature_key) {
      console.error('WEBHOOK REJECTED: Missing signature_key in payload', {
        order_id: payload.order_id,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json({ error: 'Missing signature' }, { status: 403 })
    }

    if (!verifySignature(payload)) {
      console.error('WEBHOOK REJECTED: Invalid signature_key — possible tampering!', {
        order_id: payload.order_id,
        status_code: payload.status_code,
        gross_amount: payload.gross_amount,
        received_signature: payload.signature_key?.substring(0, 20) + '...',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // ─────────────────────────────────────────────────────────
    // LAYER 2: Double-check via Midtrans API
    // Setelah signature valid, kita tetap query ulang status
    // ke Midtrans API sebagai sumber kebenaran kedua.
    // ─────────────────────────────────────────────────────────
    const statusResponse = await coreApi.transaction.notification(payload)
    
    const orderId = statusResponse.order_id
    const transactionStatus = statusResponse.transaction_status
    const fraudStatus = statusResponse.fraud_status

    console.log(`Webhook verified & received for Order ID: ${orderId}, Status: ${transactionStatus}`)

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

    // ─────────────────────────────────────────────────────────
    // LAYER 3: Validasi gross_amount cocok dengan amount di DB
    // Mencegah attacker yang membuat transaksi Rp1 untuk item
    // seharga Rp100.000 lalu mengirim webhook yang valid.
    // ─────────────────────────────────────────────────────────
    const webhookAmount = parseFloat(statusResponse.gross_amount)
    if (webhookAmount !== transaction.amount) {
      console.error('WEBHOOK REJECTED: Amount mismatch!', {
        order_id: orderId,
        webhook_amount: webhookAmount,
        db_amount: transaction.amount,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 403 })
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
    const err = error as Error
    // Audit logging untuk kegagalan webhook (misal: invalid JSON, Midtrans API error)
    console.error('CRITICAL Webhook Error:', {
      message: err.message,
      stack: err.stack,
      rawBody: rawBody.substring(0, 500) // Log 500 karakter pertama dari payload
    })
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

