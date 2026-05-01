import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Build email map
    const emailMap = new Map<string, string>()
    if (authUsers?.users) {
      authUsers.users.forEach((u: any) => {
        emailMap.set(u.id, u.email || '')
      })
    }

    // Fetch active subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, status, expires_at, packages:package_id(name)')
      .in('status', ['active', 'grace_period'])

    const subMap = new Map<string, any>()
    if (subscriptions) {
      subscriptions.forEach((s: any) => {
        subMap.set(s.user_id, {
          status: s.status,
          expires_at: s.expires_at,
          package_name: s.packages?.name || '-',
        })
      })
    }

    // Merge data
    const users = (profiles || []).map((p: any) => ({
      ...p,
      email: emailMap.get(p.id) || '-',
      subscription: subMap.get(p.id) || null,
    }))

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('List users error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Role berhasil diperbarui' })
  } catch (error: any) {
    console.error('Update role error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
