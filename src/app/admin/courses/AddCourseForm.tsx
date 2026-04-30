'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaXmark, FaSpinner, FaCircleCheck, FaImage } from 'react-icons/fa6'

export default function AddCourseForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [thumbPreview, setThumbPreview] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        body: form,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal membuat kursus')

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCircleCheck className="text-4xl" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Kursus Berhasil Dibuat!</h3>
          <p className="text-gray-500">Halaman akan dimuat ulang...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
          <FaXmark className="text-xl" />
        </button>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Buat Kursus Baru</h2>
        <p className="text-gray-500 mb-8">Siapkan program belajar untuk murid Anda.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Judul Kursus *</label>
            <input type="text" name="title" required placeholder="Contoh: Belajar Hangul dari Nol" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
            <textarea name="description" rows={3} placeholder="Jelaskan apa yang akan dipelajari murid..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Level *</label>
              <select name="level" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Urutan</label>
              <input type="number" name="sort_order" defaultValue={0} min="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <select name="is_published" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white">
              <option value="false">Draft (Belum Tayang)</option>
              <option value="true">Published (Tayang)</option>
            </select>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail Kursus</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-6 cursor-pointer transition-colors group bg-gray-50 hover:bg-blue-50">
              <input
                type="file"
                name="thumbnail"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setThumbPreview(URL.createObjectURL(f))
                }}
              />
              {thumbPreview ? (
                <img src={thumbPreview} alt="Preview" className="w-full max-h-40 object-contain rounded-xl" />
              ) : (
                <>
                  <FaImage className="text-2xl text-gray-300 group-hover:text-blue-500 transition-colors mb-2" />
                  <span className="text-xs text-gray-500">Klik untuk upload gambar cover kursus (opsional)</span>
                </>
              )}
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-200">
            {loading ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : 'Buat Kursus'}
          </button>
        </form>
      </div>
    </div>
  )
}
