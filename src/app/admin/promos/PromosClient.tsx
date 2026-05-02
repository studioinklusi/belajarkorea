'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FaPlus, FaTrash, FaPen, FaCheck, FaXmark } from 'react-icons/fa6'

interface Promo {
  id: string
  title: string
  description: string | null
  image_url: string | null
  link_url: string | null
  is_active: boolean
}

export default function PromosClient({ initialPromos }: { initialPromos: Promo[] }) {
  const [promos, setPromos] = useState<Promo[]>(initialPromos)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const supabase = createClient()

  const openModal = (promo?: Promo) => {
    if (promo) {
      setEditingPromo(promo)
      setTitle(promo.title)
      setDescription(promo.description || '')
      setImageUrl(promo.image_url || '')
      setLinkUrl(promo.link_url || '')
      setIsActive(promo.is_active)
    } else {
      setEditingPromo(null)
      setTitle('')
      setDescription('')
      setImageUrl('')
      setLinkUrl('')
      setIsActive(true)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPromo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const promoData = {
      title,
      description: description || null,
      image_url: imageUrl || null,
      link_url: linkUrl || null,
      is_active: isActive
    }

    if (editingPromo) {
      // Update
      const { data, error } = await supabase
        .from('promos')
        .update(promoData)
        .eq('id', editingPromo.id)
        .select()
        .single()

      if (error) {
        alert('Gagal memperbarui promo')
      } else {
        setPromos(promos.map(p => p.id === editingPromo.id ? data : p))
        alert('Promo diperbarui')
        closeModal()
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('promos')
        .insert([promoData])
        .select()
        .single()

      if (error) {
        alert('Gagal menambah promo')
      } else {
        setPromos([data, ...promos])
        alert('Promo ditambahkan')
        closeModal()
      }
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus promo ini?')) return

    const { error } = await supabase
      .from('promos')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus promo')
    } else {
      setPromos(promos.filter(p => p.id !== id))
      alert('Promo dihapus')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('promos')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      alert('Gagal mengubah status')
    } else {
      setPromos(promos.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
      alert(!currentStatus ? 'Promo diaktifkan' : 'Promo dinonaktifkan')
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Promo</h1>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">Atur banner promo yang muncul di dashboard pengguna.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <FaPlus /> <span className="hidden sm:inline">Tambah Promo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map(promo => (
          <div key={promo.id} className={`bg-white rounded-2xl shadow-sm border ${promo.is_active ? 'border-violet-200 shadow-violet-100' : 'border-gray-200'} p-6 relative overflow-hidden group transition-all`}>
            {promo.is_active && (
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">
                <FaCheck className="w-3 h-3" /> Aktif
              </div>
            )}
            {!promo.is_active && (
              <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                <FaXmark className="w-3 h-3" /> Nonaktif
              </div>
            )}
            
            <h3 className="text-xl font-bold text-gray-900 mb-2 pr-20">{promo.title}</h3>
            {promo.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{promo.description}</p>}
            
            <div className="flex items-center gap-2 mt-6">
              <button 
                onClick={() => toggleStatus(promo.id, promo.is_active)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${promo.is_active ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
              >
                {promo.is_active ? 'Matikan' : 'Aktifkan'}
              </button>
              <button onClick={() => openModal(promo)} className="p-2 text-violet-600 border border-violet-200 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors">
                <FaPen />
              </button>
              <button onClick={() => handleDelete(promo.id)} className="p-2 text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl text-gray-500">
            Belum ada promo yang ditambahkan.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <FaXmark className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Judul Promo *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Contoh: Diskon Kemerdekaan 50%"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Pendek</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Klaim promo terbatas ini sebelum kehabisan!"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL Link Tujuan</label>
                <input 
                  type="text" 
                  value={linkUrl} 
                  onChange={e => setLinkUrl(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="/pricing"
                />
                <p className="text-xs text-gray-500 mt-1">Gunakan /pricing atau https://link-eksternal.com</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Gambar Background (URL Opsional)</label>
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={isActive} 
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">
                  Langsung Aktifkan Promo Ini
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
