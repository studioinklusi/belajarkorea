import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Helper: verify caller is super_admin
async function verifySuperAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') return null
  return user
}

// ========== GET: List all users with subscription info ==========
export async function GET() {
  try {
    const caller = await verifySuperAdmin()
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch profiles
    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, role, created_at')
      .order('created_at', { ascending: false })

    if (profilesErr) {
      return NextResponse.json({ error: profilesErr.message }, { status: 500 })
    }

    // Fetch emails from auth.users using admin client
    const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authErr) {
      console.error('Auth list error:', authErr)
    }

    // Build email + ban map
    const emailMap = new Map<string, string>()
    const banMap = new Map<string, string | null>()
    if (authUsers?.users) {
      authUsers.users.forEach((u: { id: string; email?: string }) => {
        emailMap.set(u.id, u.email || '')
        banMap.set(u.id, u.banned_until || null)
      })
    }

    // Fetch active subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, status, expires_at, packages:package_id(name)')
      .in('status', ['active', 'grace_period'])

    const subMap = new Map<string, any>()
    if (subscriptions) {
      subscriptions.forEach((s: { user_id: string }) => {
        subMap.set(s.user_id, {
          status: s.status,
          expires_at: s.expires_at,
          package_name: s.packages?.name || '-',
        })
      })
    }

    const users = (profiles || []).map((p: { id: string; full_name?: string }) => {
      const bannedUntil = banMap.get(p.id)
      const isBanned = bannedUntil ? new Date(bannedUntil) > new Date() : false
      return {
        ...p,
        email: emailMap.get(p.id) || '-',
        subscription: subMap.get(p.id) || null,
        is_banned: isBanned,
      }
    })

    return NextResponse.json({ users })
  } catch (error: unknown) {
    console.error('List users error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ========== PATCH: Update user role ==========
export async function PATCH(request: Request) {
  try {
    const caller = await verifySuperAdmin()
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, role } = await request.json()

    if (!user_id || !role) {
      return NextResponse.json({ error: 'user_id dan role wajib diisi' }, { status: 400 })
    }

    const validRoles = ['student', 'content_admin', 'super_admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    // Prevent self-demotion
    if (user_id === caller.id && role !== 'super_admin') {
      return NextResponse.json({ error: 'Anda tidak bisa menurunkan role Anda sendiri' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', user_id)

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Role berhasil diperbarui' })
  } catch (error: unknown) {
    console.error('Update role error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ========== POST: Grant subscription manually ==========
export async function POST(request: Request) {
  try {
    const caller = await verifySuperAdmin()
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, package_id, duration_days, note } = await request.json()

    if (!user_id || !package_id) {
      return NextResponse.json({ error: 'user_id dan package_id wajib diisi' }, { status: 400 })
    }

    // Get package info
    const { data: pkg, error: pkgErr } = await supabaseAdmin
      .from('packages')
      .select('id, name, duration_days')
      .eq('id', package_id)
      .single()

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    const actualDuration = duration_days || pkg.duration_days || 30

    // Check if user already has an active subscription
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, expires_at')
      .eq('user_id', user_id)
      .in('status', ['active', 'grace_period'])
      .single()

    const now = new Date()
    let startDate = now
    let expiresAt: Date

    if (existingSub) {
      // Extend existing subscription
      const currentExpiry = new Date(existingSub.expires_at)
      if (currentExpiry > now) {
        startDate = currentExpiry // start from current expiry
      }
      expiresAt = new Date(startDate.getTime() + actualDuration * 24 * 60 * 60 * 1000)

      const { error: updateErr } = await supabaseAdmin
        .from('subscriptions')
        .update({
          package_id: package_id,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub.id)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
    } else {
      // Create new subscription
      expiresAt = new Date(now.getTime() + actualDuration * 24 * 60 * 60 * 1000)

      const { error: insertErr } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id,
          package_id,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
    }

    // Create a transaction record for audit trail
    const orderId = `MANUAL-${Date.now()}-${caller.id.substring(0, 6).toUpperCase()}`

    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id,
        package_id,
        order_id: orderId,
        amount: 0,
        status: 'success',
        payment_type: 'manual_grant',
        metadata: {
          granted_by: caller.id,
          note: note || 'Langganan diberikan manual oleh admin',
          duration_days: actualDuration,
        },
      })

    return NextResponse.json({
      message: 'Langganan berhasil diberikan',
      expires_at: expiresAt.toISOString(),
      extended: !!existingSub,
    })
  } catch (error: unknown) {
    console.error('Grant subscription error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ========== PUT: Ban / Unban user ==========
export async function PUT(request: Request) {
  try {
    const caller = await verifySuperAdmin()
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, action } = await request.json()

    if (!user_id || !['ban', 'unban'].includes(action)) {
      return NextResponse.json({ error: 'user_id dan action (ban/unban) wajib diisi' }, { status: 400 })
    }

    // Prevent self-ban
    if (user_id === caller.id) {
      return NextResponse.json({ error: 'Anda tidak bisa memblokir akun Anda sendiri' }, { status: 400 })
    }

    if (action === 'ban') {
      // Ban for 100 years (effectively permanent)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: '876000h',
      })

      if (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
      }

      return NextResponse.json({ message: 'Pengguna berhasil diblokir' })
    } else {
      // Unban: set ban_duration to 'none'
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: 'none',
      })

      if (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
      }

      return NextResponse.json({ message: 'Pengguna berhasil diaktifkan kembali' })
    }
  } catch (error: unknown) {
    console.error('Ban/unban error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
