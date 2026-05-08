import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VouchersClient from './VouchersClient'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Kelola Voucher & Promo - Admin Panel',
}

export default async function AdminVouchersPage() {
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

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin')
  }

  // Fetch all vouchers
  const { data: vouchers } = await supabaseAdmin
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all packages for the dropdown selection
  const { data: packages } = await supabaseAdmin
    .from('packages')
    .select('id, name, duration_days')
    .order('sort_order', { ascending: true })

  return <VouchersClient vouchers={vouchers || []} packages={packages || []} />
}
