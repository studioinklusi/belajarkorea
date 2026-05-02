import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cron job: auto-expire transaksi pending yang sudah lebih dari 24 jam
// Dipanggil oleh Vercel Cron setiap 1 jam

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Verifikasi cron secret (keamanan agar tidak bisa dipanggil sembarang orang)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 jam lalu

    // Cari semua transaksi pending yang dibuat lebih dari 24 jam lalu
    const { data: staleTransactions, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('id, order_id, created_at')
      .eq('status', 'pending')
      .lt('created_at', cutoffTime)

    if (fetchError) {
      console.error('Error fetching stale transactions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    if (!staleTransactions || staleTransactions.length === 0) {
      return NextResponse.json({ message: 'No stale transactions found', expired: 0 })
    }

    // Update semua transaksi basi ke expired
    const staleIds = staleTransactions.map(tx => tx.id)

    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ 
        status: 'expired',
        metadata: { expired_by: 'cron_auto_cleanup', expired_at: new Date().toISOString() }
      })
      .in('id', staleIds)

    if (updateError) {
      console.error('Error updating stale transactions:', updateError)
      return NextResponse.json({ error: 'Failed to update transactions' }, { status: 500 })
    }

    console.log(`Cron: Auto-expired ${staleIds.length} stale transactions`)

    return NextResponse.json({ 
      message: `Auto-expired ${staleIds.length} stale transactions`,
      expired: staleIds.length,
      ids: staleIds
    })

  } catch (error: any) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
