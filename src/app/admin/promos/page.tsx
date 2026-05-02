import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PromosClient from './PromosClient'

export const metadata = {
  title: 'Kelola Promo - Admin Panel',
}

export default async function AdminPromosPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch promos
  const { data: promos } = await supabase
    .from('promos')
    .select('*')
    .order('created_at', { ascending: false })

  return <PromosClient initialPromos={promos || []} />
}
