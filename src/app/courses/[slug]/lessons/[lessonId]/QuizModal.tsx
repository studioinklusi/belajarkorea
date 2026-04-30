'use client'

import { useState, useEffect } from 'react'
import { FaXmark, FaSpinner, FaChevronRight, FaChevronLeft, FaCheck, FaCircleCheck, FaCircleXmark, FaTrophy, FaLightbulb } from 'react-icons/fa6'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

type Question = {
  id: string
  question_text: string
  options: Record<string, string>
  explanation: string | null
}

export default function QuizModal({ lessonId, lessonName, onClose }: { lessonId: string; lessonName: string; onClose: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null)
  
  const { width, height } = useWindowSize()

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/quizzes?lesson_id=${lessonId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal mengambil kuis')
        setQuestions(data.questions)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [lessonId])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim kuis')
      setResult(data)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-violet-500 text-4xl mx-auto mb-4" />
          <p className="text-white font-bold">Menyiapkan kuis untukmu...</p>
        </div>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaLightbulb className="text-4xl" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Belum Ada Kuis</h3>
          <p className="text-gray-500 mb-8">{error || 'Maaf, sepertinya belum ada soal untuk materi ini. Beritahu admin ya!'}</p>
          <button onClick={onClose} className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold transition-all hover:bg-violet-700 shadow-lg shadow-violet-200">
            Tutup
          </button>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
        {result.passed && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} colors={['#8B5CF6', '#D946EF', '#6366F1', '#10B981']} />}
        
        <div className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full text-center shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden animate-fade-in-up">
          {/* Decorative background circle */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 ${result.passed ? 'bg-green-500' : 'bg-rose-500'}`}></div>
          
          <div className="relative z-10">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 text-5xl shadow-2xl transform rotate-3 ${
              result.passed ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white' : 'bg-gradient-to-br from-rose-400 to-red-600 text-white'
            }`}>
              {result.passed ? <FaTrophy /> : <FaCircleXmark />}
            </div>

            <h3 className="text-3xl font-black text-gray-900 mb-2">
              {result.passed ? 'Chukahae! 🎉' : 'Ayo Semangat Lagi! 💪'}
            </h3>
            <p className="text-gray-500 font-medium mb-10">
              {result.passed 
                ? 'Kamu luar biasa! Kamu sudah menguasai materi ini dengan sangat baik.' 
                : 'Jangan menyerah! Ulangi videonya sedikit lagi dan coba kuisnya kembali.'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Skor Akhir</p>
                <p className={`text-4xl font-black ${result.passed ? 'text-green-600' : 'text-rose-600'}`}>{result.score}</p>
              </div>
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Benar</p>
                <p className="text-4xl font-black text-gray-900">{result.correct}<span className="text-lg text-gray-300">/{result.total}</span></p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition-all"
              >
                Tutup
              </button>
              {!result.passed && (
                <button 
                  onClick={() => { setResult(null); setCurrentIndex(0); setAnswers({}); }}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-violet-200"
                >
                  Coba Lagi
                </button>
              )}
              {result.passed && (
                <button 
                  onClick={onClose}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-violet-200"
                >
                  Selesai
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-900">Kuis Pemahaman</h2>
            <p className="text-sm text-gray-400 font-medium">{lessonName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full flex items-center justify-center transition-colors">
            <FaXmark />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-2">
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            {questions.map((_, idx) => (
              <div 
                key={idx}
                className={`h-full border-r border-white last:border-0 transition-all duration-500 ${
                  idx <= currentIndex ? 'bg-violet-500' : 'bg-gray-100'
                }`}
                style={{ width: `${100 / questions.length}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pertanyaan {currentIndex + 1} dari {questions.length}</span>
            <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-10">
          <h3 className="text-2xl font-extrabold text-gray-900 leading-tight mb-8">
            {currentQuestion.question_text}
          </h3>

          <div className="space-y-4">
            {Object.entries(currentQuestion.options).map(([key, val]) => {
              const isSelected = answers[currentQuestion.id] === key
              return (
                <button
                  key={key}
                  onClick={() => setAnswers({ ...answers, [currentQuestion.id]: key })}
                  className={`w-full text-left p-6 rounded-3xl border-2 transition-all group flex items-center gap-5 ${
                    isSelected 
                      ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-100' 
                      : 'border-gray-100 hover:border-violet-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${
                    isSelected ? 'bg-violet-500 text-white rotate-6' : 'bg-gray-100 text-gray-400 group-hover:text-violet-500'
                  }`}>
                    {key}
                  </div>
                  <span className={`text-lg font-bold flex-1 ${isSelected ? 'text-violet-900' : 'text-gray-700'}`}>
                    {val}
                  </span>
                  {isSelected && (
                    <div className="w-6 h-6 bg-violet-500 text-white rounded-full flex items-center justify-center animate-scale-in">
                      <FaCheck className="text-xs" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between gap-4">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-white disabled:opacity-0 transition-all"
          >
            <FaChevronLeft /> Sebelumnya
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2 transform active:scale-95"
            >
              {submitting ? <FaSpinner className="animate-spin" /> : 'Kirim Jawaban'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              disabled={!answers[currentQuestion.id]}
              className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700 disabled:bg-violet-100 disabled:text-violet-300 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2 transform active:scale-95"
            >
              Selanjutnya <FaChevronRight />
            </button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />
    </div>
  )
}
