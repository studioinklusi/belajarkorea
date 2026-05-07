import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Cron job: auto-expire subscriptions that have passed their expires_at or grace_until
// Expected schedule: 0 */6 * * * (Every 6 hours)

export async function GET(request: Request) {
  // Verifikasi cron secret (keamanan)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()
    
    // 1. ACTIVE -> GRACE_PERIOD
    // Cari subscription active yang expires_at-nya sudah lewat
    const { data: toGracePeriod, error: err1 } = await supabaseAdmin
      .from('subscriptions')
      .select('id, expires_at')
      .eq('status', 'active')
      .lt('expires_at', now)

    let gracePeriodCount = 0
    if (toGracePeriod && toGracePeriod.length > 0) {
      for (const sub of toGracePeriod) {
        // Set grace_until = expires_at + 3 days
        const graceDate = new Date(sub.expires_at)
        graceDate.setDate(graceDate.getDate() + 3)

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'grace_period',
            grace_until: graceDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id)
      }
      gracePeriodCount = toGracePeriod.length
    }

    // 2. GRACE_PERIOD -> EXPIRED
    // Cari subscription grace_period yang grace_until-nya sudah lewat
    const { data: toExpired, error: err2 } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('status', 'grace_period')
      .lt('grace_until', now)

    let expiredCount = 0
    if (toExpired && toExpired.length > 0) {
      const expiredIds = toExpired.map(sub => sub.id)
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .in('id', expiredIds)
      expiredCount = expiredIds.length
    }

    if (err1 || err2) {
      console.error('Cron error fetching subscriptions:', { err1, err2 })
    }

    return NextResponse.json({
      success: true,
      processed: {
        toGracePeriod: gracePeriodCount,
        toExpired: expiredCount
      },
      timestamp: now
    })

  } catch (error) {
    console.error('Expire subscriptions cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
