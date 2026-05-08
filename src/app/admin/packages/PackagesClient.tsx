'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaCrown, FaPen, FaCheck, FaXmark, FaSpinner, FaEye, FaEyeSlash, FaUsers, FaPlus } from 'react-icons/fa6'

type Package = {
  id: string
  name: string
  slug: string
  price: number
  duration_days: number
  description: string
  features: string[] | null
  is_active: boolean
  active_users: number
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function PackagesClient({ packages }: { packages: Package[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  // Edit form state
  const [editPrice, setEditPrice] = useState<number>(0)
  const [editDescription, setEditDescription] = useState<string>('')
  const [editFeatures, setEditFeatures] = useState<string>('')
  const [editIsActive, setEditIsActive] = useState<boolean>(true)

  // Add form state
  const [isAdding, setIsAdding] = useState(false)
  const [newPkgName, setNewPkgName] = useState('')
  const [newPkgSlug, setNewPkgSlug] = useState('')
  const [newPkgPrice, setNewPkgPrice] = useState(0)
  const [newPkgDuration, setNewPkgDuration] = useState(30)
  const [newPkgDesc, setNewPkgDesc] = useState('')
  const [newPkgFeatures, setNewPkgFeatures] = useState('')

  function handleEditClick(pkg: Package) {
    setEditingId(pkg.id)
    setEditPrice(pkg.price)
    setEditDescription(pkg.description || '')
    setEditFeatures(pkg.features ? pkg.features.join('\n') : '')
    setEditIsActive(pkg.is_active)
  }

  function handleCancelEdit() {
    setEditingId(null)
  }

  async function handleSave(pkgId: string) {
    setSavingId(pkgId)
    
    // Parse features from newline-separated string to array
    const featuresArray = editFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)

    try {
      const res = await fetch('/api/admin/packages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkgId,
          price: editPrice,
          description: editDescription,
          features: featuresArray,
          is_active: editIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan perubahan')
        return
      }

      setEditingId(null)
      router.refresh()
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleToggleStatus(pkgId: string, currentStatus: boolean) {
    if (!confirm(`Anda yakin ingin ${currentStatus ? 'menonaktifkan' : 'mengaktifkan'} paket ini?`)) return
    
    setSavingId(pkgId)
    try {
      const res = await fetch('/api/admin/packages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkgId,
          is_active: !currentStatus,
        }),
      })

      if (!res.ok) throw new Error()
      router.refresh()
    } catch (error) {
      alert('Gagal mengubah status paket.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleCreate() {
    if (!newPkgName || !newPkgSlug || !newPkgPrice || !newPkgDuration) {
      alert('Mohon lengkapi Nama, Slug, Harga, dan Durasi')
      return
    }

    setSavingId('new')
    const featuresArray = newPkgFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)

    try {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPkgName,
          slug: newPkgSlug,
          price: newPkgPrice,
          duration_days: newPkgDuration,
          description: newPkgDesc,
          features: featuresArray,
          sort_order: packages.length * 10,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Gagal membuat paket')
        return
      }

      setIsAdding(false)
      setNewPkgName('')
      setNewPkgSlug('')
      setNewPkgPrice(0)
      setNewPkgDuration(30)
      setNewPkgDesc('')
      setNewPkgFeatures('')
      router.refresh()
    } catch (error) {
      alert('Terjadi kesalahan saat membuat paket.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Paket Langganan</h1>
          <p className="mt-2 text-gray-500 text-lg">Atur harga, deskripsi, dan fitur untuk tiap paket (Basic, Pro, Premium).</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="bg-violet-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-violet-700 transition-all shadow-md shadow-violet-200 flex items-center gap-2 disabled:opacity-50"
        >
          <FaPlus /> Tambah Paket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdding && (
          <div className="bg-white rounded-3xl shadow-md border border-violet-300 ring-2 ring-violet-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">Paket Baru</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-gray-500">Nama Paket</label>
                  <input type="text" value={newPkgName} onChange={(e) => setNewPkgName(e.target.value)} placeholder="Contoh: Pro (3 Bulan)" className="w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-gray-500">Slug (ID Unik)</label>
                  <input type="text" value={newPkgSlug} onChange={(e) => setNewPkgSlug(e.target.value)} placeholder="Contoh: pro-3-month" className="w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-gray-500">Harga (Rp)</label>
                    <input type="number" value={newPkgPrice} onChange={(e) => setNewPkgPrice(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-violet-500 outline-none" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-gray-500">Durasi</label>
                    <input type="number" value={newPkgDuration} onChange={(e) => setNewPkgDuration(parseInt(e.target.value) || 0)} placeholder="Hari" className="w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-violet-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-gray-500">Deskripsi Singkat</label>
                <input type="text" value={newPkgDesc} onChange={(e) => setNewPkgDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-gray-500">Fitur (1 baris per fitur)</label>
                <textarea value={newPkgFeatures} onChange={(e) => setNewPkgFeatures(e.target.value)} rows={5} className="w-full px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
              <button onClick={handleCreate} disabled={savingId === 'new'} className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-violet-700 flex justify-center gap-2 disabled:opacity-70">
                {savingId === 'new' ? <FaSpinner className="animate-spin" /> : <FaCheck />} Simpan
              </button>
              <button onClick={() => setIsAdding(false)} disabled={savingId === 'new'} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 flex justify-center gap-2">
                <FaXmark /> Batal
              </button>
            </div>
          </div>
        )}

        {packages.map((pkg) => {
          const isEditing = editingId === pkg.id
          const isSaving = savingId === pkg.id

          return (
            <div 
              key={pkg.id} 
              className={`bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col transition-all ${
                !pkg.is_active ? 'border-gray-200 opacity-80' : 
                pkg.slug === 'premium' ? 'border-violet-200 ring-1 ring-violet-100' : 'border-gray-100 hover:shadow-md'
              }`}
            >
              {/* Header */}
              <div className={`p-6 border-b ${
                pkg.slug === 'premium' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                    pkg.slug === 'premium' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600'
                  }`}>
                    <FaCrown />
                  </div>
                  {!isEditing && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      pkg.is_active 
                        ? (pkg.slug === 'premium' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700')
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {pkg.is_active ? <FaEye /> : <FaEyeSlash />}
                      {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  )}
                </div>
                <h2 className={`text-2xl font-extrabold ${pkg.slug === 'premium' ? 'text-white' : 'text-gray-900'}`}>
                  {pkg.name}
                </h2>
                
                {isEditing ? (
                  <div className="mt-3">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${pkg.slug === 'premium' ? 'text-violet-100' : 'text-gray-500'}`}>
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg text-gray-900 font-bold outline-none border focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                ) : (
                  <p className={`text-3xl font-extrabold mt-2 ${pkg.slug === 'premium' ? 'text-white' : 'text-gray-900'}`}>
                    {formatRupiah(pkg.price)}
                    <span className={`text-sm font-medium ml-1 ${pkg.slug === 'premium' ? 'text-violet-100' : 'text-gray-500'}`}>
                      /{pkg.duration_days} hari
                    </span>
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col gap-5">
                {/* Active Users Stat */}
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold">
                  <FaUsers />
                  {pkg.active_users} pengguna aktif
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi Singkat</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-gray-700 border focus:border-violet-500 outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  ) : (
                    <p className="text-gray-700 text-sm font-medium">{pkg.description || '-'}</p>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fitur</h3>
                  {isEditing ? (
                    <textarea
                      value={editFeatures}
                      onChange={(e) => setEditFeatures(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg text-sm text-gray-700 border focus:border-violet-500 outline-none focus:ring-1 focus:ring-violet-500"
                      placeholder="Masukkan fitur (satu baris per fitur)"
                    />
                  ) : (
                    <ul className="space-y-2">
                      {(pkg.features || []).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 font-medium">
                          <FaCheck className="text-emerald-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSave(pkg.id)}
                      disabled={isSaving}
                      className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                      Simpan
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaXmark /> Batal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(pkg)}
                      disabled={savingId !== null}
                      className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPen className="text-xs" /> Edit Paket
                    </button>
                    <button
                      onClick={() => handleToggleStatus(pkg.id, pkg.is_active)}
                      disabled={savingId !== null}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm border flex items-center justify-center transition-colors ${
                        pkg.is_active 
                          ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={pkg.is_active ? 'Nonaktifkan Paket' : 'Aktifkan Paket'}
                    >
                      {savingId === pkg.id ? <FaSpinner className="animate-spin" /> : (pkg.is_active ? <FaEyeSlash /> : <FaEye />)}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
