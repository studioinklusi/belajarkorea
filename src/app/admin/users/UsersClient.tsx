'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaUsers, FaCrown, FaUserShield, FaUserGraduate, FaSpinner, FaMagnifyingGlass, FaChevronDown, FaGift } from 'react-icons/fa6'
import GrantSubscriptionForm from './GrantSubscriptionForm'

type UserSubscription = {
  status: string
  expires_at: string
  package_name: string
}

type UserProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
  role: string
  created_at: string
  subscription: UserSubscription | null
}

type Package = {
  id: string
  name: string
  duration_days: number
  price: number
}

const roleLabels: Record<string, { label: string; color: string; icon: any }> = {
  student: { label: 'Siswa', color: 'bg-blue-100 text-blue-700', icon: FaUserGraduate },
  content_admin: { label: 'Admin Konten', color: 'bg-amber-100 text-amber-700', icon: FaUserShield },
  super_admin: { label: 'Super Admin', color: 'bg-rose-100 text-rose-700', icon: FaCrown },
}

export default function UsersClient({ users, packages }: { users: UserProfile[] | null; packages: Package[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [grantingUser, setGrantingUser] = useState<UserProfile | null>(null)

  async function handleRoleChange(userId: string, newRole: string) {
    if (!confirm(`Ubah role pengguna ini menjadi "${roleLabels[newRole]?.label || newRole}"?`)) return

    setUpdatingId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Gagal mengubah role')
        return
      }

      router.refresh()
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = (users || []).filter((u) => {
    const matchSearch =
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const totalAdmins = (users || []).filter((u) => u.role !== 'student').length
  const totalWithSub = (users || []).filter((u) => u.subscription).length

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Pengguna</h1>
          <p className="mt-2 text-gray-500 text-lg">Pantau dan atur akses pengguna platform.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <FaUsers className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Total Pengguna</p>
            <p className="text-2xl font-extrabold text-gray-900">{(users || []).length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
            <FaCrown className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Berlangganan Aktif</p>
            <p className="text-2xl font-extrabold text-gray-900">{totalWithSub}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <FaUserShield className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Admin</p>
            <p className="text-2xl font-extrabold text-gray-900">{totalAdmins}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white"
          />
        </div>
        <div className="relative">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white font-bold text-gray-700"
          >
            <option value="all">Semua Role</option>
            <option value="student">Siswa</option>
            <option value="content_admin">Admin Konten</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm">Pengguna</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm">Role</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm">Langganan</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm">Bergabung</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const roleInfo = roleLabels[user.role] || roleLabels.student
                  const RoleIcon = roleInfo.icon

                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                            {user.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (user.full_name || user.email || '?')[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{user.full_name || 'Belum diisi'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${roleInfo.color}`}>
                          <RoleIcon className="text-[10px]" />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {user.subscription ? (
                          <div>
                            <p className="text-sm font-bold text-green-700">{user.subscription.package_name}</p>
                            <p className="text-xs text-gray-500">
                              s.d. {new Date(user.subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Tidak ada</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Grant Subscription Button */}
                          <button
                            onClick={() => setGrantingUser(user)}
                            className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Berikan Langganan"
                          >
                            <FaGift />
                          </button>

                          {/* Role Change */}
                          {updatingId === user.id ? (
                            <FaSpinner className="animate-spin text-violet-500" />
                          ) : (
                            <div className="relative inline-block">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="appearance-none text-xs font-bold py-2 pl-3 pr-7 rounded-lg border border-gray-200 bg-white hover:border-violet-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all cursor-pointer"
                              >
                                <option value="student">Siswa</option>
                                <option value="content_admin">Admin Konten</option>
                                <option value="super_admin">Super Admin</option>
                              </select>
                              <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[8px]" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="text-2xl" />
            </div>
            <p className="text-gray-500 font-medium">
              {search || filterRole !== 'all' ? 'Tidak ada pengguna yang cocok dengan filter.' : 'Belum ada pengguna terdaftar.'}
            </p>
          </div>
        )}
      </div>

      {/* User Count Footer */}
      <div className="mt-4 text-right">
        <p className="text-xs text-gray-400">
          Menampilkan {filteredUsers.length} dari {(users || []).length} pengguna
        </p>
      </div>

      {/* Grant Subscription Modal */}
      {grantingUser && (
        <GrantSubscriptionForm
          user={{ id: grantingUser.id, full_name: grantingUser.full_name, email: grantingUser.email }}
          packages={packages}
          onClose={() => setGrantingUser(null)}
        />
      )}
    </>
  )
}
