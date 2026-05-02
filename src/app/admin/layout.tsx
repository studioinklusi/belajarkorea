import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../(auth)/auth/actions'
import AdminMobileNav from './AdminMobileNav'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || !['content_admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header & Nav */}
      <AdminMobileNav signoutAction={signout} />

      {/* Sidebar Admin (Desktop) */}
      <AdminSidebar signoutAction={signout} />

      {/* Main Content Admin */}
      <main className="flex-1 overflow-y-auto h-screen bg-[#FAFAFA]">
        {children}
      </main>
    </div>
  )
}
