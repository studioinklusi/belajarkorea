'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaGamepad, FaPuzzlePiece, FaKeyboard, FaLanguage, FaTrophy, 
  FaLock, FaArrowRight, FaBolt, FaAward, FaStar
} from 'react-icons/fa6';

interface QuizGamesClientProps {
  userId: string;
  userName: string;
}

export default function QuizGamesClient({ userId, userName }: QuizGamesClientProps) {
  const [totalXP, setTotalXP] = useState<number>(0);
  const [maxHighScore, setMaxHighScore] = useState<number>(0);
  const [maxWpm, setMaxWpm] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load total XP
      const storedXP = localStorage.getItem(`tsuha_hangul_xp_${userId}`);
      if (storedXP) {
        setTotalXP(parseInt(storedXP, 10));
      }

      // Load highscores and find the max high score
      const storedHighScores = localStorage.getItem(`tsuha_hangul_highscores_${userId}`);
      if (storedHighScores) {
        try {
          const highScores: Record<string, number> = JSON.parse(storedHighScores);
          const scores = Object.values(highScores);
          if (scores.length > 0) {
            setMaxHighScore(Math.max(...scores) * 10); // convert 0-10 score to percentage 0-100
          }
        } catch (e) {
          console.error('Error parsing highscores in hub:', e);
        }
      }

      // Load typing high score (WPM)
      const storedWPM = localStorage.getItem(`tsuha_hangul_typing_wpm_${userId}`);
      if (storedWPM) {
        setMaxWpm(parseInt(storedWPM, 10));
      }
    }
  }, [userId]);

  // Determine Rank based on XP
  const getRank = (xp: number) => {
    if (xp >= 1000) return { name: 'Master Hangul 👑', color: 'text-violet-600 border-violet-200 bg-violet-50' };
    if (xp >= 500) return { name: 'Prajurit Hangul 🛡️', color: 'text-indigo-600 border-indigo-200 bg-indigo-50' };
    if (xp >= 200) return { name: 'Penjelajah Hangul 🗺️', color: 'text-emerald-600 border-emerald-200 bg-emerald-50' };
    if (xp >= 50) return { name: 'Pembelajar Aktif ⚡', color: 'text-amber-600 border-amber-200 bg-amber-50' };
    return { name: 'Sikembar Pemula 🌱', color: 'text-gray-500 border-gray-200 bg-gray-50' };
  };

  const rank = getRank(totalXP);

  return (
    <main className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 select-none font-sans animate-in fade-in duration-300">
      
      {/* ----------------------------------------------------------- */}
      {/* HEADER SECTION */}
      {/* ----------------------------------------------------------- */}
      <div className="mb-10 text-center sm:text-left flex flex-col lg:flex-row justify-between items-center gap-6 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-100/30 to-fuchsia-50/10 rounded-bl-full -mr-16 -mt-16 opacity-60 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-100 via-amber-50 to-sky-100 border border-pink-200/30 flex items-center justify-center text-pink-600 shadow-md animate-bounce duration-1000">
              <FaGamepad className="w-6 h-6 animate-pulse" />
            </span>
            Quiz & Games
          </h1>
          <p className="mt-3 text-gray-500 font-medium text-sm sm:text-base max-w-xl">
            Halo, <span className="text-violet-600 font-black">{userName}</span>! Siap mengasah kemampuan bahasa Korea-mu? Pilih game interaktif di bawah dan kumpulkan XP-mu!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto shrink-0 z-10 justify-center">
          {/* XP Stat Badge */}
          <div className="bg-amber-50/60 border border-amber-200/30 shadow-xs p-3.5 sm:p-4 rounded-3xl flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
              <FaBolt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-left">
              <p className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-wider">Total Energi</p>
              <p className="text-base sm:text-lg font-black text-gray-900 leading-none mt-0.5">{totalXP} <span className="text-[10px] sm:text-xs font-semibold text-amber-600">XP</span></p>
            </div>
          </div>

          {/* Rank Badge */}
          <div className="bg-violet-50/60 border border-violet-200/30 shadow-xs p-3.5 sm:p-4 rounded-3xl flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md">
              <FaAward className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-left">
              <p className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-wider">Pangkat Belajar</p>
              <span className={`inline-block text-xs font-extrabold mt-1 px-2 py-0.5 rounded-md border whitespace-nowrap ${rank.color}`}>
                {rank.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* GAMES GRID SECTION */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: TEBAK HANGUL (ACTIVE) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:shadow-xl hover:scale-[1.01] transform transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-amber-100/40 to-orange-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-100 via-yellow-50 to-orange-100 text-amber-600 flex items-center justify-center font-bold text-lg shadow-sm border border-amber-200/30">
                <FaPuzzlePiece className="w-5 h-5" />
              </div>

              {maxHighScore > 0 && (
                <span className="bg-green-50 border border-green-200/50 text-green-700 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  🏆 Skor Tertinggi: {maxHighScore}%
                </span>
              )}
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 mt-5 group-hover:text-amber-600 transition-colors">
              Tebak Hangul
            </h3>
            <p className="text-[11px] text-amber-600 font-extrabold tracking-wide uppercase mt-0.5">
              Quiz cepat mengenal huruf Korea
            </p>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mt-3 mb-8">
              Mini game pilihan ganda interaktif untuk melatih refleks ingatan membaca konsonan, vokal, dan diftong Hangul secara instan dan ringan.
            </p>
          </div>

          <Link
            href="/quiz-games/tebak-hangul"
            className="relative z-10 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg active:scale-98 cursor-pointer border border-transparent"
          >
            Main Sekarang <FaArrowRight />
          </Link>
        </div>

        {/* CARD 2: TYPING CHALLENGE (ACTIVE) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:shadow-xl hover:scale-[1.01] transform transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-pink-100/40 to-rose-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-100 via-rose-50 to-pink-50 text-pink-600 flex items-center justify-center font-bold text-lg shadow-sm border border-pink-200/30">
                <FaKeyboard className="w-5 h-5 animate-pulse" />
              </div>

              {maxWpm > 0 && (
                <span className="bg-green-50 border border-green-200/50 text-green-700 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  🏆 Terbaik: {maxWpm} WPM
                </span>
              )}
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 mt-5 group-hover:text-pink-600 transition-colors">
              Typing Challenge
            </h3>
            <p className="text-[11px] text-pink-600 font-extrabold tracking-wide uppercase mt-0.5">
              Latihan mengetik cepat Hangul
            </p>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mt-3 mb-8">
              Tantang dirimu untuk mengetik kosa kata atau kalimat bahasa Korea dengan cepat dan tepat menggunakan layout keyboard Hangul standar.
            </p>
          </div>

          <Link
            href="/quiz-games/typing-challenge"
            className="relative z-10 w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg active:scale-98 cursor-pointer border border-transparent"
          >
            Main Sekarang <FaArrowRight />
          </Link>
        </div>

        {/* CARD 3: VOCABULARY QUIZ (COMING SOON) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between group relative overflow-hidden opacity-80 border-dashed">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-sky-50 to-blue-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center font-bold text-lg shadow-xs border border-sky-100/50">
                <FaLanguage className="w-5 h-5" />
              </div>
              <span className="bg-gray-100 border border-gray-200/50 text-gray-500 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                <FaLock className="w-2.5 h-2.5" /> Segera Hadir
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-gray-400 mt-5">
              Vocabulary Quiz
            </h3>
            <p className="text-[11px] text-sky-400 font-extrabold tracking-wide uppercase mt-0.5">
              Kuis kosakata berbasis waktu
            </p>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mt-3 mb-8">
              Uji pemahaman arti kosakata bahasa Korea dari berbagai tingkat materi (TOPIK I & II) dengan format kuis kilat pilihan ganda.
            </p>
          </div>

          <button
            disabled
            className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Terkunci <FaLock className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CARD 4: DAILY CHALLENGE (COMING SOON) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between group relative overflow-hidden opacity-80 border-dashed">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-50 to-violet-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-lg shadow-xs border border-indigo-100/50">
                <FaStar className="w-5 h-5 animate-pulse" />
              </div>
              <span className="bg-gray-100 border border-gray-200/50 text-gray-500 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                <FaLock className="w-2.5 h-2.5" /> Segera Hadir
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-gray-400 mt-5">
              Daily Challenge
            </h3>
            <p className="text-[11px] text-indigo-400 font-extrabold tracking-wide uppercase mt-0.5">
              Misi harian & bonus XP
            </p>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mt-3 mb-8">
              Pertahankan streak belajarmu dengan menyelesaikan quest harian khusus. Raih reward XP ganda untuk menaikkan peringkat pangkat belajarmu.
            </p>
          </div>

          <button
            disabled
            className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Terkunci <FaLock className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CARD 5: MINI GAMES (COMING SOON) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between group relative overflow-hidden opacity-80 border-dashed">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-emerald-50 to-teal-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold text-lg shadow-xs border border-emerald-100/50">
                <FaGamepad className="w-5 h-5" />
              </div>
              <span className="bg-gray-100 border border-gray-200/50 text-gray-500 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                <FaLock className="w-2.5 h-2.5" /> Segera Hadir
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-gray-400 mt-5">
              Mini Games
            </h3>
            <p className="text-[11px] text-emerald-400 font-extrabold tracking-wide uppercase mt-0.5">
              Game Interaktif & Edukatif
            </p>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mt-3 mb-8">
              Pilihan game interaktif seru lainnya yang membantu memperkuat pemahaman partikel kalimat, percakapan mendasar, dan tata bahasa Korea.
            </p>
          </div>

          <button
            disabled
            className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Terkunci <FaLock className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </main>
  );
}
