'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaXmark, FaSpinner, FaCircleCheck, FaPen } from 'react-icons/fa6'

type QuizQuestion = {
  id: string
  lesson_id: string
  question_text: string
  options: Record<string, string>
  correct_answer: string
  explanation: string | null
  sort_order: number
}

export default function EditQuizForm({ question, lessonName, onClose }: { question: QuizQuestion; lessonName: string; onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [questionText, setQuestionText] = useState(question.question_text)
  const [options, setOptions] = useState({
    A: question.options?.A || '',
    B: question.options?.B || '',
    C: question.options?.C || '',
    D: question.options?.D || '',
  })
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer)
  const [explanation, setExplanation] = useState(question.explanation || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validasi minimal
    if (!questionText.trim()) {
      setError('Pertanyaan tidak boleh kosong')
      setLoading(false)
      return
    }
    const filledOptions = Object.entries(options).filter(([, v]) => v.trim())
    if (filledOptions.length < 2) {
      setError('Minimal 2 pilihan jawaban harus diisi')
      setLoading(false)
      return
    }
    if (!options[correctAnswer as keyof typeof options]?.trim()) {
      setError('Jawaban benar harus merujuk ke pilihan yang terisi')
      setLoading(false)
      return
    }

    // Hanya kirim opsi yang terisi
    const cleanOptions: Record<string, string> = {}
    for (const [key, val] of Object.entries(options)) {
      if (val.trim()) cleanOptions[key] = val.trim()
    }

    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          question_text: questionText,
          options: cleanOptions,
          correct_answer: correctAnswer,
          explanation: explanation || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengupdate soal')

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

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCircleCheck className="text-4xl" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Soal Berhasil Diperbarui!</h3>
          <p className="text-gray-500">Halaman akan dimuat ulang...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
          <FaXmark className="text-xl" />
        </button>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Edit Soal Quiz</h2>
        <p className="text-gray-500 mb-8">Materi: <span className="font-bold text-violet-600">{lessonName}</span></p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pertanyaan */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Pertanyaan *</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              rows={3}
              placeholder="Contoh: Apa arti dari 사랑 (sarang)?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Pilihan Jawaban */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Pilihan Jawaban *</label>
            {(['A', 'B', 'C', 'D'] as const).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(key)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-all ${
                    correctAnswer === key
                      ? 'bg-green-500 text-white shadow-md shadow-green-200 scale-110'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {key}
                </button>
                <input
                  type="text"
                  value={options[key]}
                  onChange={(e) => setOptions({ ...options, [key]: e.target.value })}
                  placeholder={`Pilihan ${key}${key <= 'B' ? ' (wajib)' : ' (opsional)'}`}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
                />
              </div>
            ))}
            <p className="text-xs text-gray-400">Klik huruf (A/B/C/D) untuk memilih jawaban yang benar. Jawaban benar akan berwarna hijau.</p>
          </div>

          {/* Penjelasan */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Penjelasan (opsional)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Penjelasan mengapa jawaban tersebut benar..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
          >
            {loading ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : <><FaPen /> Simpan Perubahan</>}
          </button>
        </form>
      </div>
    </div>
  )
}
