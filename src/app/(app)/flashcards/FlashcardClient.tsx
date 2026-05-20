'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  FaGraduationCap, FaLayerGroup, FaPlus, FaCircleCheck, 
  FaRotate, FaBookOpen, FaCircleInfo, FaArrowRight, FaHourglassHalf 
} from 'react-icons/fa6';
import ReviewSession from '@/components/flashcards/ReviewSession';

interface Flashcard {
  id: string;
  word_ko: string;
  word_base_ko: string;
  translation_id: string;
  romanization?: string | null;
  part_of_speech?: string | null;
  context_sentence_ko: string;
  context_sentence_id: string;
  story_id?: string | null;
  box_level: number;
  next_review_at: string;
}

interface FlashcardClientProps {
  initialFlashcards: Flashcard[];
  userId: string;
}

export default function FlashcardClient({ initialFlashcards, userId }: FlashcardClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewMode, setReviewMode] = useState<'due' | 'all'>('due');
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<{ cardId: string; rating: string }[]>([]);

  // Function to reload cards from database after reviews
  const reloadFlashcards = async () => {
    const { data, error } = await supabase
      .from('user_flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('next_review_at', { ascending: true });

    if (!error && data) {
      setFlashcards(data);
    }
  };

  const now = new Date();
  
  // Calculate cards due today (next_review_at <= now)
  const dueCards = flashcards.filter(c => new Date(c.next_review_at) <= now);
  
  // Leitner box levels counts (1-5)
  const boxCounts = [1, 2, 3, 4, 5].map(box => 
    flashcards.filter(c => c.box_level === box).length
  );

  const startReviewSession = (mode: 'due' | 'all') => {
    setReviewMode(mode);
    setIsReviewing(true);
    setShowSummary(false);
  };

  const handleSessionFinish = (results: { cardId: string; rating: string }[]) => {
    setSessionResults(results);
    setIsReviewing(false);
    setShowSummary(true);
    reloadFlashcards(); // refresh local cards state
  };

  // If in review mode
  if (isReviewing) {
    const cardsToReview = reviewMode === 'due' ? dueCards : flashcards;
    return (
      <ReviewSession
        cards={cardsToReview}
        onBack={() => setIsReviewing(false)}
        onFinish={handleSessionFinish}
      />
    );
  }

  // If showing post-session summary
  if (showSummary) {
    const ratingCounts = {
      again: sessionResults.filter(r => r.rating === 'again').length,
      hard: sessionResults.filter(r => r.rating === 'hard').length,
      good: sessionResults.filter(r => r.rating === 'good').length,
      easy: sessionResults.filter(r => r.rating === 'easy').length,
    };

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center select-none font-sans">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <FaCircleCheck className="w-12 h-12" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Review Selesai!</h2>
        <p className="text-gray-500 text-sm font-semibold mb-8">
          Kamu telah menyelesaikan sesi spaced repetition (SRS) hari ini. Berikut hasil performamu:
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-rose-50 border border-rose-200/50 p-4 rounded-2xl">
            <span className="text-xl block mb-1">🔴</span>
            <span className="text-2xl font-black text-rose-700 block">{ratingCounts.again}</span>
            <span className="text-[10px] font-bold text-rose-500 uppercase">Lupa</span>
          </div>

          <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl">
            <span className="text-xl block mb-1">🟡</span>
            <span className="text-2xl font-black text-amber-700 block">{ratingCounts.hard}</span>
            <span className="text-[10px] font-bold text-amber-500 uppercase">Ragu</span>
          </div>

          <div className="bg-indigo-50 border border-indigo-200/50 p-4 rounded-2xl">
            <span className="text-xl block mb-1">🔵</span>
            <span className="text-2xl font-black text-indigo-700 block">{ratingCounts.good}</span>
            <span className="text-[10px] font-bold text-indigo-500 uppercase">Ingat</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/50 p-4 rounded-2xl">
            <span className="text-xl block mb-1">🟢</span>
            <span className="text-2xl font-black text-emerald-700 block">{ratingCounts.easy}</span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Mudah</span>
          </div>
        </div>

        <button
          onClick={() => setShowSummary(false)}
          className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <FaGraduationCap className="text-violet-600 shrink-0" /> Flashcards & SRS
          </h1>
          <p className="mt-2 text-gray-500 font-medium">
            Review kosakata pentingmu menggunakan algoritma Spaced Repetition (SM-2).
          </p>
        </div>
        <Link
          href="/stories"
          className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <FaBookOpen className="w-5 h-5" /> Cari Kosakata Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Stats and CTA */}
        <div className="lg:col-span-1 space-y-6">
          {/* Due Today Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-4 relative z-10 flex items-center gap-2">
              <FaHourglassHalf className="text-violet-500" /> Jadwal Review
            </h3>

            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-5xl font-black text-gray-900 tracking-tight">
                  {dueCards.length}
                </p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Kartu Jatuh Tempo Hari Ini</p>
              </div>

              {dueCards.length > 0 ? (
                <button
                  onClick={() => startReviewSession('due')}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  Mulai Review Hari Ini <FaArrowRight />
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-xs font-semibold leading-relaxed">
                  🎉 Hebat! Kamu sudah menyelesaikan semua review untuk hari ini. Silakan baca artikel baru untuk menambah kosakata Korea-mu!
                </div>
              )}

              {flashcards.length > 0 && (
                <button
                  onClick={() => startReviewSession('all')}
                  className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-200 text-xs transition-all flex items-center justify-center gap-2"
                >
                  Latih Mandiri ({flashcards.length} Semua Kartu)
                </button>
              )}
            </div>
          </div>

          {/* Leitner Box Level Distributions */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaLayerGroup className="text-amber-500" /> Distribusi Leitner Box
            </h3>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((box, i) => {
                const count = boxCounts[i];
                const total = flashcards.length;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={box}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-600">Box {box} ({box === 1 ? 'Mulai' : box === 5 ? 'Master' : 'Latihan'})</span>
                      <span className="text-gray-900">{count} kartu ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          box === 1 ? 'bg-rose-500' :
                          box === 2 ? 'bg-amber-500' :
                          box === 3 ? 'bg-indigo-500' :
                          box === 4 ? 'bg-blue-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Saved Word Cards Directory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaPlus className="text-violet-600" /> Direktori Kosakata ({flashcards.length})
            </h3>

            {flashcards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {flashcards.map((card) => {
                  const isDue = new Date(card.next_review_at) <= now;
                  
                  return (
                    <div 
                      key={card.id}
                      className="border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-violet-100 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white ${
                            card.box_level === 1 ? 'bg-rose-500' :
                            card.box_level === 2 ? 'bg-amber-500' :
                            card.box_level === 3 ? 'bg-indigo-500' :
                            card.box_level === 4 ? 'bg-blue-500' :
                            'bg-emerald-500'
                          }`}>
                            Box {card.box_level}
                          </span>

                          {isDue ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                              <FaRotate className="w-2.5 h-2.5 animate-spin-slow" /> Butuh Review
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-gray-400">
                              Review: {new Date(card.next_review_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>

                        <h4 className="text-lg font-black text-gray-900 font-ko">{card.word_ko}</h4>
                        {card.romanization && (
                          <p className="text-[10px] text-gray-400 font-semibold mb-2">[{card.romanization}]</p>
                        )}
                        <p className="text-sm font-semibold text-gray-700 leading-normal">{card.translation_id}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-400">
                        Kamus: <span className="text-gray-800">{card.word_base_ko}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <FaCircleInfo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-gray-900">Belum Ada Flashcard</h4>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1 mb-6">
                  Kamu belum menyimpan kosakata baru. Baca cerita Korea pilihan kami untuk menambahkan kosakata pertamamu!
                </p>
                <Link
                  href="/stories"
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-xs font-bold shadow-xs transition-all inline-block"
                >
                  Mulai Membaca Cerita
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
