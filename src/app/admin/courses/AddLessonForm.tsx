'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaXmark, FaSpinner, FaCircleCheck, FaYoutube } from 'react-icons/fa6'

export default function AddLessonForm({ courseId, courseName, onClose }: { courseId: string; courseName: string; onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [videoId, setVideoId] = useState('')

  // Ekstrak YouTube Video ID dari berbagai format URL
  function extractVideoId(input: string): string {
    // Jika sudah berupa ID saja (11 karakter)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim()

    try {
      const url = new URL(input)
      // youtu.be/VIDEO_ID
      if (url.hostname === 'youtu.be') return url.pathname.slice(1)
      // youtube.com/watch?v=VIDEO_ID
      const v = url.searchParams.get('v')
      if (v) return v
    } catch {
      // bukan URL valid, kembalikan apa adanya
    }
    return input.trim()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const rawVideoInput = form.get('youtube_video_id') as string
    const extractedId = extractVideoId(rawVideoInput)

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          title: form.get('title'),
          description: form.get('description'),
          youtube_video_id: extractedId,
          duration_seconds: parseInt(form.get('duration_seconds') as string) || null,
          sort_order: parseInt(form.get('sort_order') as string) || 0,
          is_published: form.get('is_published') === 'true',
          is_preview: form.get('is_preview') === 'true',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan materi')

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
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Materi Berhasil Ditambahkan!</h3>
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

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Tambah Materi Video</h2>
        <p className="text-gray-500 mb-8">Untuk kursus: <span className="font-bold text-violet-600">{courseName}</span></p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Judul Materi *</label>
            <input type="text" name="title" required placeholder="Contoh: Mengenal Huruf Hangul Vokal" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
            <textarea name="description" rows={2} placeholder="Penjelasan singkat tentang materi ini..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FaYoutube className="text-red-500" /> Link / ID Video YouTube *
            </label>
            <input
              type="text"
              name="youtube_video_id"
              required
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="Tempel link YouTube atau ID video (misal: dQw4w9WgXcQ)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
            />
            {videoId && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <img
                  src={`https://img.youtube.com/vi/${extractVideoId(videoId)}/mqdefault.jpg`}
                  alt="Video preview"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Durasi (detik)</label>
              <input type="number" name="duration_seconds" placeholder="600" min="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Urutan</label>
              <input type="number" name="sort_order" defaultValue={0} min="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select name="is_published" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white">
                <option value="false">Draft</option>
                <option value="true">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gratis (Preview)?</label>
              <select name="is_preview" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white">
                <option value="false">Tidak (Perlu Langganan)</option>
                <option value="true">Ya (Bisa Ditonton Gratis)</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-200">
            {loading ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : 'Tambahkan Materi'}
          </button>
        </form>
      </div>
    </div>
  )
}
