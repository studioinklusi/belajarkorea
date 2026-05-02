import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PackagesClient from './PackagesClient'

export default async function AdminPackagesPage() {
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

  // Use admin client for unrestricted queries
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: packages } = await supabaseAdmin
    .from('packages')
    .select('*')
    .order('sort_order', { ascending: true })

  // Stats: Active subscribers per package
  const { data: activeSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('package_id')
    .in('status', ['active', 'grace_period'])

  const subsCountByPackage = (activeSubs || []).reduce((acc: Record<string, number>, sub: any) => {
    acc[sub.package_id] = (acc[sub.package_id] || 0) + 1
    return acc
  }, {})

  const enrichedPackages = (packages || []).map((pkg: any) => ({
    ...pkg,
    active_users: subsCountByPackage[pkg.id] || 0
  }))

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <PackagesClient packages={enrichedPackages} />
    </div>
  )
}
