import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionsClient from './TransactionsClient'

export default async function AdminTransactionsPage() {
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

  // Fetch all transactions with related data
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('*, packages:package_id(name, slug), products:product_id(title)')
    .order('created_at', { ascending: false })

  // Fetch user profiles for name mapping
  const userIds = [...new Set((transactions || []).map((t: any) => t.user_id))]
  let userMap = new Map<string, { full_name: string; email: string }>()

  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    // Also get emails from auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const emailMap = new Map<string, string>()
    if (authUsers?.users) {
      authUsers.users.forEach((u: any) => emailMap.set(u.id, u.email || ''))
    }

    if (profiles) {
      profiles.forEach((p: any) => {
        userMap.set(p.id, {
          full_name: p.full_name || 'Tanpa Nama',
          email: emailMap.get(p.id) || '-',
        })
      })
    }
  }

  // Merge user info into transactions
  const enrichedTransactions = (transactions || []).map((tx: any) => ({
    ...tx,
    user_name: userMap.get(tx.user_id)?.full_name || 'Tanpa Nama',
    user_email: userMap.get(tx.user_id)?.email || '-',
    package_name: tx.packages?.name || null,
    product_title: tx.products?.title || null,
  }))

  // Compute stats
  const stats = {
    total: enrichedTransactions.length,
    success: enrichedTransactions.filter((t: any) => t.status === 'success').length,
    pending: enrichedTransactions.filter((t: any) => t.status === 'pending').length,
    failed: enrichedTransactions.filter((t: any) => ['failed', 'expired'].includes(t.status)).length,
    totalRevenue: enrichedTransactions
      .filter((t: any) => t.status === 'success')
      .reduce((sum: number, t: any) => sum + t.amount, 0),
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <TransactionsClient transactions={enrichedTransactions} stats={stats} />
    </div>
  )
}
