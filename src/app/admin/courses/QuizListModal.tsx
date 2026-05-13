'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaXmark, FaSpinner, FaPlus, FaTrash, FaPen, FaCircleQuestion, FaCircleCheck } from 'react-icons/fa6'
import AddQuizForm from './AddQuizForm'
import EditQuizForm from './EditQuizForm'

type QuizQuestion = {
  id: string
  lesson_id: string
  question_text: string
  options: Record<string, string>
  correct_answer: string
  explanation: string | null
  sort_order: number
}

export default function QuizListModal({ lessonId, lessonName, onClose }: { lessonId: string; lessonName: string; onClose: () => void }) {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)

  async function fetchQuestions() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/quizzes?lesson_id=${lessonId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memuat soal')
      setQuestions(data.questions || [])
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  async function handleDelete(questionId: string) {
    if (!confirm('Yakin ingin menghapus soal ini?')) return
    setDeletingId(questionId)
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus soal')
        return
      }
      // Remove from local state
      setQuestions(prev => prev.filter(q => q.id !== questionId))
      router.refresh()
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setDeletingId(null)
    }
  }

  function handleAddClose() {
    setShowAddForm(false)
    fetchQuestions()
  }

  function handleEditClose() {
    setEditingQuestion(null)
    fetchQuestions()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
            <FaXmark className="text-xl" />
          </button>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Kelola Soal Quiz</h2>
              <p className="text-gray-500">Materi: <span className="font-bold text-violet-600">{lessonName}</span></p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <FaSpinner className="animate-spin text-2xl mr-3" />
              <span className="font-medium">Memuat soal...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCircleQuestion className="text-2xl" />
              </div>
              <p className="text-gray-500 font-medium mb-2">Belum ada soal quiz untuk materi ini.</p>
              <p className="text-gray-400 text-sm">Klik tombol di bawah untuk menambahkan soal pertama.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, index) => (
                <div key={q.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:bg-gray-100/50 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center text-sm font-extrabold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-relaxed mb-2">{q.question_text}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Object.entries(q.options).map(([key, val]) => (
                          <span
                            key={key}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              key === q.correct_answer
                                ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                                : 'bg-white text-gray-600 ring-1 ring-gray-200'
                            }`}
                          >
                            <span className="font-extrabold">{key}.</span> {val}
                            {key === q.correct_answer && <FaCircleCheck className="text-green-500 ml-0.5" />}
                          </span>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-gray-400 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Soal"
                      >
                        <FaPen className="text-xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        disabled={deletingId === q.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus Soal"
                      >
                        {deletingId === q.id ? <FaSpinner className="animate-spin text-xs" /> : <FaTrash className="text-xs" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Question Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
          >
            <FaPlus /> Tambah Soal Baru
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      {showAddForm && (
        <AddQuizForm lessonId={lessonId} lessonName={lessonName} onClose={handleAddClose} />
      )}
      {editingQuestion && (
        <EditQuizForm question={editingQuestion} lessonName={lessonName} onClose={handleEditClose} />
      )}
    </>
  )
}
