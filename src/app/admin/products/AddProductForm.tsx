'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaCloudArrowUp, FaXmark, FaSpinner, FaCircleCheck, FaImage } from 'react-icons/fa6'

export default function AddProductForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [thumbPreview, setThumbPreview] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData,
      })

      let data;
      try {
        data = await res.json()
      } catch (e) {
        const text = await res.text();
        throw new Error(res.status === 413 ? 'Ukuran file terlalu besar (Maksimal 4.5MB).' : `Error: ${res.statusText}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Gagal menambahkan produk')
      }

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCircleCheck className="text-4xl" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Produk Berhasil Ditambahkan!</h3>
          <p className="text-gray-500">Halaman akan dimuat ulang secara otomatis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"
        >
          <FaXmark className="text-xl" />
        </button>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Tambah Produk Digital</h2>
        <p className="text-gray-500 mb-8">Unggah E-Book, Template, atau berkas digital lainnya.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Produk */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Produk *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="Contoh: E-Book 1000 Kosakata Korea"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Jelaskan isi produk digital Anda..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Harga & Tipe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Harga (Rp) *</label>
              <input
                type="number"
                name="price"
                required
                min="0"
                placeholder="49000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tipe Produk</label>
              <select
                name="product_type"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white"
              >
                <option value="pdf">PDF / E-Book</option>
                <option value="template">Template</option>
                <option value="interactive">Interaktif (HTML)</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Limit Download & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Limit Download</label>
              <input
                type="number"
                name="download_limit"
                defaultValue={5}
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select
                name="is_active"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white"
              >
                <option value="true">Aktif (Dijual)</option>
                <option value="false">Draft (Disembunyikan)</option>
              </select>
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail / Cover</label>
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
                  <span className="text-xs text-gray-500">Klik untuk upload gambar cover (opsional)</span>
                </>
              )}
            </label>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Upload File (atau gunakan Link)</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-violet-400 rounded-2xl p-8 cursor-pointer transition-colors group bg-gray-50 hover:bg-violet-50">
              <input
                type="file"
                name="file"
                onChange={handleFileChange}
                accept=".pdf,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                className="hidden"
              />
              <FaCloudArrowUp className="text-3xl text-gray-300 group-hover:text-violet-500 transition-colors mb-3" />
              {fileName ? (
                <span className="text-sm font-bold text-violet-700">{fileName}</span>
              ) : (
                <span className="text-sm text-gray-500">Klik untuk memilih file (PDF, ZIP, dll)</span>
              )}
            </label>

            <div className="mt-4">
              <p className="text-xs font-bold text-gray-500 mb-2 text-center">ATAU</p>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gunakan Link Eksternal</label>
              <input
                type="url"
                name="external_url"
                placeholder="https://drive.google.com/... atau https://notion.so/..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Jika diisi, Anda tidak perlu mengupload file di atas.</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> Mengunggah...
              </>
            ) : (
              <>
                <FaCloudArrowUp /> Tambahkan Produk
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
