'use client'

import { useState } from 'react'
import { FaTrophy, FaCircleCheck, FaCircleXmark } from 'react-icons/fa6'
import QuizModal from './QuizModal'

export default function LessonClient({ 
  lessonId, 
  lessonName,
  bestAttempt
}: { 
  lessonId: string; 
  lessonName: string;
  bestAttempt?: { score: number; passed: boolean } | null;
}) {
  const [showQuiz, setShowQuiz] = useState(false)

  return (
    <>
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            <FaTrophy />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white mb-1">Kuis Pemahaman Materi</h3>
            {bestAttempt ? (
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${bestAttempt.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'} flex items-center gap-1.5`}>
                  {bestAttempt.passed ? <FaCircleCheck /> : <FaCircleXmark />}
                  {bestAttempt.passed ? 'Lulus' : 'Belum Lulus'}
                </span>
                <span className="text-sm font-bold text-gray-300">
                  Nilai Terbaik: <span className={bestAttempt.passed ? 'text-emerald-400' : 'text-rose-400'}>{bestAttempt.score}</span>
                </span>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-4 sm:mb-0">Uji seberapa paham Anda dengan materi ini sebelum lanjut ke pelajaran berikutnya.</p>
            )}
          </div>
          <button 
            onClick={() => setShowQuiz(true)}
            className="px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-full transition-colors flex items-center gap-2 flex-shrink-0"
          >
            {bestAttempt ? 'Coba Lagi' : 'Mulai Kuis'}
          </button>
        </div>
      </div>

      {showQuiz && (
        <QuizModal 
          lessonId={lessonId} 
          lessonName={lessonName} 
          onClose={() => setShowQuiz(false)} 
        />
      )}
    </>
  )
}
