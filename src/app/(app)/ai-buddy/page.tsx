import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AiBuddyClient from './AiBuddyClient'

export const metadata = {
  title: 'AI Buddy - Tsuha.id',
  description: 'Latihan ngobrol bahasa Korea dengan AI Tutor',
}

export default async function AIBuddyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirectTo=/ai-buddy')
  }

  // Cek admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'content_admin'

  // Cek langganan
  let hasActiveSub = false
  if (!isAdmin) {
    const { data: activeSubs } = await supabase
      .from('v_active_subscriptions')
      .select('id')
      .eq('user_id', user.id).eq('computed_status', 'active')
      .limit(1)
      
    hasActiveSub = activeSubs && activeSubs.length > 0
  } else {
    hasActiveSub = true
  }

  if (!hasActiveSub) {
    redirect('/pricing?reason=ai-buddy')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <AiBuddyClient />
    </div>
  )
}
