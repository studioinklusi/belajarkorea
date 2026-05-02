import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FaUsers, FaCrown, FaBook, FaMoneyBillTrendUp, FaReceipt,
  FaBox, FaClockRotateLeft, FaTriangleExclamation,
  FaCircleCheck, FaCircleXmark, FaHourglass, FaArrowRight,
  FaUserPlus, FaCartShopping, FaBolt
} from 'react-icons/fa6'

// Helper: format Rupiah
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

// Helper: relative time in Indonesian
function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['content_admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Use admin client for unrestricted queries
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // === PARALLEL QUERIES ===
  const [
    { count: usersCount },
    { count: subsCount },
    { count: coursesCount },
    { count: productsCount },
    { data: successTransactions },
    { count: pendingTxCount },
    { count: successTxCount },
    { count: failedTxCount },
    { data: expiringSubscriptions },
    { data: recentUsers },
    { data: recentTransactions },
  ] = await Promise.all([
    // 1. Total users
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    // 2. Active subscriptions
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['active', 'grace_period']),
    // 3. Total courses
    supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
    // 4. Total digital products
    supabaseAdmin.from('digital_products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    // 5. Revenue: sum of successful transactions
    supabaseAdmin.from('transactions').select('amount').eq('status', 'success'),
    // 6. Pending transactions count
    supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    // 7. Success transactions count
    supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'success'),
    // 8. Failed transactions count
    supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).in('status', ['failed', 'expired']),
    // 9. Subscriptions expiring within 7 days
    supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, expires_at, status, packages:package_id(name)')
      .in('status', ['active', 'grace_period'])
      .lte('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })
      .limit(10),
    // 10. Recent users (last 5)
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    // 11. Recent transactions (last 5)
    supabaseAdmin
      .from('transactions')
      .select('id, order_id, amount, status, payment_type, created_at, user_id, packages:package_id(name), products:product_id(title)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Calculate total revenue
  const totalRevenue = (successTransactions || []).reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0)

  // Get user names for expiring subs and recent transactions
  const allUserIds = [
    ...(expiringSubscriptions || []).map((s: any) => s.user_id),
    ...(recentTransactions || []).map((t: any) => t.user_id),
  ].filter(Boolean)
  const uniqueUserIds = [...new Set(allUserIds)]

  let userNameMap = new Map<string, string>()
  if (uniqueUserIds.length > 0) {
    const { data: userProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', uniqueUserIds)
    if (userProfiles) {
      userProfiles.forEach((p: any) => userNameMap.set(p.id, p.full_name || 'Tanpa Nama'))
    }
  }

  // Days remaining helper
  function daysRemaining(expiresAt: string): number {
    return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }

  // Transaction status config
  function getTxStatusConfig(status: string) {
    switch (status) {
      case 'success': return { label: 'Berhasil', color: 'text-emerald-600 bg-emerald-50', icon: FaCircleCheck }
      case 'pending': return { label: 'Menunggu', color: 'text-amber-600 bg-amber-50', icon: FaHourglass }
      case 'failed': return { label: 'Gagal', color: 'text-red-600 bg-red-50', icon: FaCircleXmark }
      case 'expired': return { label: 'Kedaluwarsa', color: 'text-gray-500 bg-gray-50', icon: FaClockRotateLeft }
      default: return { label: status, color: 'text-gray-500 bg-gray-50', icon: FaHourglass }
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Ringkasan Sistem</h1>
        <p className="mt-2 text-gray-500 text-base sm:text-lg">Pantau performa dan konten platform belajarkorea.id Anda.</p>
      </div>

      {/* === STAT CARDS ROW 1 (3 columns) === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Total Users */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <FaUsers className="text-lg" />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Total Pengguna</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{usersCount || 0}</h3>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <FaCrown className="text-lg" />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Langganan Aktif</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{subsCount || 0}</h3>
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-violet-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-11 h-11 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-3">
              <FaBook className="text-lg" />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Total Kursus</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{coursesCount || 0}</h3>
          </div>
        </div>
      </div>

      {/* === STAT CARDS ROW 2 (3 columns) === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 sm:p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center mb-3">
              <FaMoneyBillTrendUp className="text-lg" />
            </div>
            <p className="text-xs font-bold text-emerald-100 mb-1 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{formatRupiah(totalRevenue)}</h3>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-11 h-11 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3">
              <FaReceipt className="text-lg" />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Total Transaksi</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{(pendingTxCount || 0) + (successTxCount || 0) + (failedTxCount || 0)}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs font-bold">
              <span className="text-emerald-600">{successTxCount || 0} berhasil</span>
              <span className="text-gray-300">•</span>
              <span className="text-amber-600">{pendingTxCount || 0} pending</span>
              <span className="text-gray-300">•</span>
              <span className="text-red-500">{failedTxCount || 0} gagal</span>
            </div>
          </div>
        </div>

        {/* Digital Products */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-fuchsia-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-11 h-11 bg-fuchsia-100 text-fuchsia-600 rounded-xl flex items-center justify-center mb-3">
              <FaBox className="text-lg" />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Produk Digital</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{productsCount || 0}</h3>
          </div>
        </div>
      </div>

      {/* === BOTTOM SECTION: 2 columns === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* --- Expiring Subscriptions --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <FaTriangleExclamation className="text-sm" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Langganan Akan Habis</h2>
                <p className="text-[11px] text-gray-400 font-medium">Dalam 7 hari ke depan</p>
              </div>
            </div>
            <Link href="/admin/users" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 hover:underline">
              Lihat semua <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(!expiringSubscriptions || expiringSubscriptions.length === 0) ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaCircleCheck className="text-xl" />
                </div>
                <p className="text-sm font-bold text-gray-400">Semua langganan aman! 👍</p>
                <p className="text-xs text-gray-300 mt-1">Tidak ada yang akan habis dalam 7 hari</p>
              </div>
            ) : (
              expiringSubscriptions.map((sub: any) => {
                const days = daysRemaining(sub.expires_at)
                const isUrgent = days <= 2
                return (
                  <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {days}h
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{userNameMap.get(sub.user_id) || 'User'}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{(sub.packages as any)?.name || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                        {days === 0 ? 'Hari ini' : `${days} hari lagi`}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(sub.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* --- Recent Activity --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center">
                <FaBolt className="text-sm" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Aktivitas Terbaru</h2>
                <p className="text-[11px] text-gray-400 font-medium">User baru & transaksi masuk</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {/* Recent user registrations */}
            {(recentUsers || []).map((u: any) => (
              <div key={`user-${u.id}`} className="p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <FaUserPlus className="text-xs" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {u.full_name || 'User Baru'}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">Mendaftar</p>
                </div>
                <span className="text-[11px] text-gray-400 font-medium shrink-0">{timeAgo(u.created_at)}</span>
              </div>
            ))}

            {/* Recent transactions */}
            {(recentTransactions || []).map((tx: any) => {
              const config = getTxStatusConfig(tx.status)
              const StatusIcon = config.icon
              return (
                <div key={`tx-${tx.id}`} className="p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                    <FaCartShopping className="text-xs" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {userNameMap.get(tx.user_id) || 'User'} — {(tx.packages as any)?.name || (tx.products as any)?.title || 'Produk'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${config.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {config.label}
                      </span>
                      <span className="text-[11px] text-gray-500 font-bold">{formatRupiah(tx.amount)}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium shrink-0">{timeAgo(tx.created_at)}</span>
                </div>
              )
            })}

            {/* Empty state */}
            {(recentUsers || []).length === 0 && (recentTransactions || []).length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-gray-400">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
