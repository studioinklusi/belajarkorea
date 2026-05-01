import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function AdminUsersPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify super_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin')
  }

  // Use admin client to fetch all data
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch profiles
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, role, created_at')
    .order('created_at', { ascending: false })

  // Fetch auth users for emails
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

  const emailMap = new Map<string, string>()
  const banMap = new Map<string, string | null>()
  if (authUsers?.users) {
    authUsers.users.forEach((u: any) => {
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
    subscriptions.forEach((s: any) => {
      subMap.set(s.user_id, {
        status: s.status,
        expires_at: s.expires_at,
        package_name: s.packages?.name || '-',
      })
    })
  }

  // Merge users
  const users = (profiles || []).map((p: any) => {
    const bannedUntil = banMap.get(p.id)
    const isBanned = bannedUntil ? new Date(bannedUntil) > new Date() : false
    return {
      ...p,
      email: emailMap.get(p.id) || '-',
      subscription: subMap.get(p.id) || null,
      is_banned: isBanned,
    }
  })

  // Fetch available packages for grant subscription form
  const { data: packages } = await supabaseAdmin
    .from('packages')
    .select('id, name, duration_days, price')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <UsersClient users={users} packages={packages || []} />
    </div>
  )
}
