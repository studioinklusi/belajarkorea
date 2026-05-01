'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaXmark, FaSpinner, FaCircleCheck, FaPen, FaYoutube, FaLink } from 'react-icons/fa6'

export default function EditLessonForm({ lesson, onClose }: { lesson: any; onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(lesson.title)
  const [description, setDescription] = useState(lesson.description || '')
  const [youtubeId, setYoutubeId] = useState(lesson.youtube_video_id)
  const [duration, setDuration] = useState(lesson.duration_seconds ? Math.floor(lesson.duration_seconds / 60).toString() : '')
  const [sortOrder, setSortOrder] = useState(lesson.sort_order.toString())
  const [isPreview, setIsPreview] = useState(lesson.is_preview)
  const [isPublished, setIsPublished] = useState(lesson.is_published)
  const [resourceTitle, setResourceTitle] = useState(lesson.resource_title || '')
  const [resourceUrl, setResourceUrl] = useState(lesson.resource_url || '')

  function extractYoutubeId(urlOrId: string) {
    if (!urlOrId.includes('youtube.com') && !urlOrId.includes('youtu.be')) return urlOrId
    try {
      const url = new URL(urlOrId)
      if (url.hostname === 'youtu.be') return url.pathname.slice(1)
      if (url.searchParams.has('v')) return url.searchParams.get('v') || urlOrId
    } catch {
      return urlOrId
    }
    return urlOrId
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanYoutubeId = extractYoutubeId(youtubeId)
    const durationSeconds = duration ? parseInt(duration) * 60 : null

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lesson.id,
          title,
          description,
          youtube_video_id: cleanYoutubeId,
          duration_seconds: durationSeconds,
          sort_order: parseInt(sortOrder) || 0,
          is_preview: isPreview,
          is_published: isPublished,
          resource_title: resourceTitle,
          resource_url: resourceUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengupdate materi')

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
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Materi Diperbarui!</h3>
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

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Edit Materi</h2>
        <p className="text-gray-500 mb-8">Ubah informasi untuk materi video ini.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Judul Materi *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FaYoutube className="text-red-500 text-lg" /> Link / ID Video YouTube *
            </label>
            <input
              type="text"
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              required
              placeholder="Contoh: dQw4w9WgXcQ atau URL lengkap"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Durasi (Menit)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                placeholder="Misal: 15"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Urutan Tampil</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi Singkat</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm resize-none"
            />
          </div>

          <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <FaLink className="text-violet-500" /> Materi Pendukung (Opsional)
            </h4>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nama File / Tombol</label>
              <input
                type="text"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Contoh: Download PDF Latihan"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Link URL (Google Drive / Notion / PDF)</label>
              <input
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={isPreview}
                onChange={(e) => setIsPreview(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <div>
                <p className="font-bold text-sm text-gray-900">Jadikan Free Preview</p>
                <p className="text-xs text-gray-500 mt-0.5">Bisa ditonton tanpa langganan.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <div>
                <p className="font-bold text-sm text-gray-900">Publikasikan Materi</p>
                <p className="text-xs text-gray-500 mt-0.5">Materi akan muncul di daftar kursus.</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-200 mt-6"
          >
            {loading ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : <><FaPen /> Simpan Perubahan</>}
          </button>
        </form>
      </div>
    </div>
  )
}
