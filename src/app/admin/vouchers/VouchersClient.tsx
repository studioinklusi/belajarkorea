'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaTicket, FaPlus, FaTrash, FaCheck, FaXmark, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa6'

interface Package {
  id: string
  name: string
  duration_days: number
}

interface Voucher {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount: number | null
  max_uses: number | null
  current_uses: number
  valid_from: string | null
  valid_until: string | null
  applicable_package_ids: string[] | null
  is_active: boolean
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function VouchersClient({ vouchers, packages }: { vouchers: Voucher[], packages: Package[] }) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Form states
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('')
  const [maxUses, setMaxUses] = useState<number | ''>('')
  const [applicablePackages, setApplicablePackages] = useState<string[]>([])

  const openModal = () => {
    setCode('')
    setDiscountType('percentage')
    setDiscountValue(0)
    setMaxDiscount('')
    setMaxUses('')
    setApplicablePackages([])
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handlePackageToggle = (pkgId: string) => {
    if (applicablePackages.includes(pkgId)) {
      setApplicablePackages(prev => prev.filter(id => id !== pkgId))
    } else {
      setApplicablePackages(prev => [...prev, pkgId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || discountValue <= 0) {
      alert('Kode voucher dan nilai diskon harus diisi.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discount_type: discountType,
          discount_value: discountValue,
          max_discount: maxDiscount === '' ? null : maxDiscount,
          max_uses: maxUses === '' ? null : maxUses,
          applicable_package_ids: applicablePackages.length > 0 ? applicablePackages : null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert('Voucher berhasil dibuat!')
      closeModal()
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Gagal membuat voucher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setLoadingId(id)
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert('Gagal mengubah status voucher')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus voucher ini? Jika sudah pernah dipakai, voucher tidak bisa dihapus dan hanya bisa dinonaktifkan.')) return
    
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/vouchers?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus voucher')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Voucher</h1>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">Buat kode promo khusus untuk memotong harga paket langganan.</p>
        </div>
        <button
          onClick={openModal}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <FaPlus /> <span>Tambah Voucher Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Kode Promo</th>
                <th className="px-6 py-4">Nilai Diskon</th>
                <th className="px-6 py-4">Batas Pakai</th>
                <th className="px-6 py-4">Berlaku Untuk</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vouchers.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                        <FaTicket />
                      </div>
                      <span className="font-extrabold text-gray-900 font-mono tracking-wider">{v.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-emerald-600">
                      {v.discount_type === 'percentage' ? `${v.discount_value}%` : formatRupiah(v.discount_value)}
                    </div>
                    {v.discount_type === 'percentage' && v.max_discount && (
                      <div className="text-xs text-gray-500 mt-0.5">Maks {formatRupiah(v.max_discount)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">
                      {v.current_uses} / {v.max_uses ? v.max_uses : 'Tak Terbatas'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {v.applicable_package_ids && v.applicable_package_ids.length > 0 ? (
                      <div className="flex -space-x-1 overflow-hidden">
                        {v.applicable_package_ids.map(id => {
                          const pkgName = packages.find(p => p.id === id)?.name || 'Unknown'
                          return <span key={id} title={pkgName} className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {pkgName}
                          </span>
                        })}
                      </div>
                    ) : (
                      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">
                        Semua Paket
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      v.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {v.is_active ? <FaCheck /> : <FaXmark />}
                      {v.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(v.id, v.is_active)}
                        disabled={loadingId === v.id}
                        className={`p-2 rounded-lg border transition-colors ${
                          v.is_active 
                            ? 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={v.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {loadingId === v.id ? <FaSpinner className="animate-spin" /> : (v.is_active ? <FaEyeSlash /> : <FaEye />)}
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id)}
                        disabled={loadingId === v.id}
                        className="p-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        {loadingId === v.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 border-dashed">
                    Belum ada voucher yang dibuat. Klik tombol <span className="font-bold text-violet-600">Tambah Voucher Baru</span> di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaTicket className="text-violet-500" /> Tambah Voucher Baru
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <FaXmark className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              
              <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kode Voucher (Huruf Besar)</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => setCode(e.target.value.toUpperCase())} 
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-xl font-bold text-violet-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 uppercase tracking-widest placeholder-gray-300"
                  placeholder="MERDEKA50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipe Diskon</label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setDiscountType('percentage')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${discountType === 'percentage' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                      Persen (%)
                    </button>
                    <button type="button" onClick={() => setDiscountType('fixed')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${discountType === 'fixed' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                      Nominal (Rp)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Nilai Diskon {discountType === 'percentage' ? '(%)' : '(Rp)'}
                  </label>
                  <input 
                    type="number" 
                    value={discountValue || ''} 
                    onChange={e => setDiscountValue(Number(e.target.value))} 
                    required
                    min="1"
                    max={discountType === 'percentage' ? "100" : undefined}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                    placeholder={discountType === 'percentage' ? "Contoh: 20" : "Contoh: 50000"}
                  />
                </div>
              </div>

              {discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Maksimal Diskon Rp (Opsional)</label>
                  <input 
                    type="number" 
                    value={maxDiscount} 
                    onChange={e => setMaxDiscount(e.target.value ? Number(e.target.value) : '')} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                    placeholder="Biarkan kosong jika tanpa batas maksimal"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Batas Penggunaan / Kuota (Opsional)</label>
                <input 
                  type="number" 
                  value={maxUses} 
                  onChange={e => setMaxUses(e.target.value ? Number(e.target.value) : '')} 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Contoh: 100 (Hanya untuk 100 orang pertama)"
                />
              </div>

              <div className="border-t pt-6 mt-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">Boleh Digunakan Untuk Paket Apa Saja?</label>
                <p className="text-xs text-gray-500 mb-4">Biarkan kosong jika voucher ini berlaku untuk SEMUA paket langganan.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                  {packages.map(pkg => {
                    const isSelected = applicablePackages.includes(pkg.id)
                    return (
                      <div 
                        key={pkg.id} 
                        onClick={() => handlePackageToggle(pkg.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? 'bg-violet-50 border-violet-500 ring-1 ring-violet-500' : 'bg-white border-gray-200 hover:border-violet-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-violet-600 text-white' : 'bg-gray-100 border border-gray-300'
                        }`}>
                          {isSelected && <FaCheck className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isSelected ? 'text-violet-900' : 'text-gray-700'}`}>{pkg.name}</div>
                          <div className="text-xs text-gray-500">{pkg.duration_days} Hari</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : 'Buat Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
