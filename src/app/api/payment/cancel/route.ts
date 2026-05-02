import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verifikasi user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Hanya bisa cancel transaksi milik sendiri yang masih pending
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Hanya update jika masih pending (jangan timpa status success/failed)
    if (transaction.status !== 'pending') {
      return NextResponse.json({ message: 'Transaction is no longer pending', status: transaction.status })
    }

    // Update status ke expired
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: 'expired',
        metadata: { cancelled_by: 'user_closed_popup', cancelled_at: new Date().toISOString() }
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error cancelling transaction:', updateError)
      return NextResponse.json({ error: 'Failed to cancel transaction' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Transaction cancelled successfully' })

  } catch (error: any) {
    console.error('Cancel transaction error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
