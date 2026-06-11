import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { signout } from '@/app/(auth)/auth/actions'
import NavbarClient from './NavbarClient'

export default async function Navbar({ isLandingPage, isAuthPage }: { isLandingPage?: boolean; isAuthPage?: boolean }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  // Read cached profile from middleware cookie (avoids extra DB query)
  let profile: { role: string; full_name: string | null } | null = null
  if (user) {
    const cookieStore = await cookies()
    const profileCookie = cookieStore.get('x-user-profile')
    if (profileCookie?.value) {
      try {
        profile = JSON.parse(profileCookie.value)
      } catch {
        // Fallback: fetch from DB if cookie is malformed
        const { data } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        profile = data
      }
    } else {
      // Fallback: fetch from DB if cookie is missing
      const { data } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      profile = data
    }
  }

  const isAdmin = profile?.role === 'content_admin' || profile?.role === 'super_admin'

  // Fetch subscription status
  let isPremium = false
  if (user) {
    const { data: activeSubs } = await supabase
      .from('v_active_subscriptions')
      .select('package_slug')
      .eq('user_id', user.id)
      .eq('computed_status', 'active')
    const activeBaseSlugs = activeSubs?.map(s => s.package_slug.split('-')[0]) || []
    isPremium = activeBaseSlugs.includes('pro') || activeBaseSlugs.includes('premium') || isAdmin
  }

  const effectiveIsLandingPage = user ? false : isLandingPage

  return (
    <NavbarClient 
      user={user}
      profile={profile}
      isAdmin={isAdmin}
      isLandingPage={effectiveIsLandingPage}
      isAuthPage={isAuthPage}
      signoutAction={signout}
      isPremium={isPremium}
    />
  )
}
