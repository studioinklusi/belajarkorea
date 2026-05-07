import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FaArrowLeft, FaUserGraduate, FaUserShield, FaCrown,
  FaBook, FaBox, FaReceipt, FaCalendarDays, FaEnvelope,
  FaCircleCheck, FaClock, FaCircleXmark, FaGift, FaChartLine, FaBan
} from 'react-icons/fa6'

const roleLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  student: { label: 'Siswa', color: 'bg-blue-100 text-blue-700', icon: FaUserGraduate },
  content_admin: { label: 'Admin Konten', color: 'bg-amber-100 text-amber-700', icon: FaUserShield },
  super_admin: { label: 'Super Admin', color: 'bg-rose-100 text-rose-700', icon: FaCrown },
}

const statusColors: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
  refunded: 'bg-violet-100 text-violet-700',
}

const statusLabels: Record<string, string> = {
  success: 'Berhasil',
  pending: 'Menunggu',
  failed: 'Gagal',
  expired: 'Kedaluwarsa',
  refunded: 'Dikembalikan',
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params

  const supabase = await createServerClient()
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) redirect('/login')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'super_admin') {
    redirect('/admin')
  }



  // 1. Profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, role, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (!profile) redirect('/admin/users')

  // 2. Email & Ban Status from auth
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId)
  const email = authData?.user?.email || '-'
  const bannedUntil = authData?.user?.banned_until
  const isBanned = bannedUntil ? new Date(bannedUntil) > new Date() : false

  // 3. All subscriptions (history)
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('id, status, started_at, expires_at, grace_until, created_at, packages:package_id(name, duration_days, price)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // 4. Product purchases
  const { data: purchases } = await supabaseAdmin
    .from('product_purchases')
    .select('id, download_count, created_at, digital_products:product_id(title, product_type, price)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // 5. Transactions
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('id, order_id, amount, status, payment_type, metadata, created_at, packages:package_id(name), digital_products:product_id(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  // 6. Course progress
  const { data: courseProgress } = await supabaseAdmin
    .from('v_course_progress')
    .select('*')
    .eq('user_id', userId)

  const roleInfo = roleLabels[profile.role] || roleLabels.student
  const RoleIcon = roleInfo.icon
  const activeSub = (subscriptions || []).find((s: { user_id: string }) => s.status === 'active' || s.status === 'grace_period')

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Back Button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-violet-600 transition-colors mb-6"
      >
        <FaArrowLeft className="text-xs" /> Kembali ke Daftar Pengguna
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-2xl flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 overflow-hidden shadow-lg shadow-violet-200">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (profile.full_name || email || '?')[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 truncate">
              {profile.full_name || 'Nama Belum Diisi'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <FaEnvelope className="text-xs text-gray-400" /> {email}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <FaCalendarDays className="text-xs text-gray-400" />
                Bergabung {new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${roleInfo.color}`}>
              <RoleIcon className="text-xs" />
              {roleInfo.label}
            </span>
            {isBanned && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-700">
                <FaBan className="text-xs" />
                Akun Diblokir
              </span>
            )}
          </div>
        </div>

        {/* Active Subscription Banner */}
        {activeSub ? (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaCrown className="text-lg" />
            </div>
            <div>
              <p className="font-bold text-green-800">{(activeSub as any).packages?.name || 'Paket Aktif'}</p>
              <p className="text-xs text-green-600">
                Aktif hingga {new Date(activeSub.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                {activeSub.status === 'grace_period' && ' (Masa Tenggang)'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaClock />
            </div>
            <p className="text-sm text-gray-500 font-medium">Tidak memiliki langganan aktif</p>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Course Progress */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-sm" />
            </div>
            <h2 className="font-extrabold text-gray-900">Progres Belajar</h2>
          </div>

          {courseProgress && courseProgress.length > 0 ? (
            <div className="space-y-4">
              {courseProgress.map((cp: any) => {
                const pct = Math.round(cp.completion_percentage || 0)
                return (
                  <div key={cp.course_id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-bold text-gray-800 truncate">{cp.course_title}</p>
                      <span className="text-xs font-bold text-gray-500 flex-shrink-0 ml-2">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-violet-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {cp.completed_lessons}/{cp.total_lessons} pelajaran • Level {cp.course_level}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada progres belajar.</p>
          )}
        </div>

        {/* Product Purchases */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FaBox className="text-sm" />
            </div>
            <h2 className="font-extrabold text-gray-900">Produk Digital Dibeli</h2>
          </div>

          {purchases && purchases.length > 0 ? (
            <div className="space-y-3">
              {purchases.map((p: { id: string; full_name?: string }) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaBox className="text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{p.digital_products?.title || '-'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' • '}Diakses {p.download_count}x
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase">{p.digital_products?.product_type}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Belum membeli produk digital.</p>
          )}
        </div>

        {/* Subscription History */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <FaCrown className="text-sm" />
            </div>
            <h2 className="font-extrabold text-gray-900">Riwayat Langganan</h2>
          </div>

          {subscriptions && subscriptions.length > 0 ? (
            <div className="space-y-3">
              {subscriptions.map((s: { user_id: string }) => {
                const isActive = s.status === 'active' || s.status === 'grace_period'
                const isExpired = new Date(s.expires_at) < new Date()
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {isActive ? <FaCircleCheck className="text-xs" /> : isExpired ? <FaCircleXmark className="text-xs" /> : <FaClock className="text-xs" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{s.packages?.name || '-'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(s.started_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' → '}
                        {new Date(s.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? (s.status === 'grace_period' ? 'Masa Tenggang' : 'Aktif') : 'Berakhir'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Belum pernah berlangganan.</p>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <FaReceipt className="text-sm" />
            </div>
            <h2 className="font-extrabold text-gray-900">Riwayat Transaksi</h2>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((t: { user_id: string }) => {
                const isManual = t.payment_type === 'manual_grant'
                const itemName = t.packages?.name || t.digital_products?.title || '-'
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isManual ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                      {isManual ? <FaGift className="text-xs" /> : <FaReceipt className="text-xs" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{itemName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' • '}
                        {isManual ? 'Manual' : (t.payment_type || 'Online')}
                        {t.amount > 0 && ` • Rp ${t.amount.toLocaleString('id-ID')}`}
                      </p>
                      {isManual && t.metadata?.note && (
                        <p className="text-xs text-amber-600 mt-0.5 italic">📝 {t.metadata.note}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}`}>
                      {statusLabels[t.status] || t.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada riwayat transaksi.</p>
          )}
        </div>
      </div>
    </div>
  )
}
