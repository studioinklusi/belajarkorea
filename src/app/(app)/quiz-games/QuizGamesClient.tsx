'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaGamepad, FaPuzzlePiece, FaKeyboard, FaLanguage, FaTrophy, 
  FaLock, FaArrowRight, FaBolt, FaAward, FaStar
} from 'react-icons/fa6';

import { syncLegacyScores } from './actions';

interface QuizGamesClientProps {
  userId: string;
  userName: string;
  initialTotalXP: number;
  initialMaxHighScore: number;
  initialMaxWpm: number;
  initialMaxSurvivalScore: number;
  hasScoresInDb: boolean;
  isSubscribed: boolean;
}

export default function QuizGamesClient({ 
  userId, 
  userName,
  initialTotalXP,
  initialMaxHighScore,
  initialMaxWpm,
  initialMaxSurvivalScore,
  hasScoresInDb,
  isSubscribed,
}: QuizGamesClientProps) {
  const [totalXP, setTotalXP] = useState<number>(initialTotalXP);
  const [maxHighScore, setMaxHighScore] = useState<number>(initialMaxHighScore);
  const [maxWpm, setMaxWpm] = useState<number>(initialMaxWpm);
  const [maxSurvivalScore, setMaxSurvivalScore] = useState<number>(initialMaxSurvivalScore);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [selectedGameName, setSelectedGameName] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // If DB has no scores, check if legacy data exists in localStorage
      if (!hasScoresInDb) {
        const storedXP = localStorage.getItem(`tsuha_hangul_xp_${userId}`);
        const storedHighScores = localStorage.getItem(`tsuha_hangul_highscores_${userId}`);
        const storedWPM = localStorage.getItem(`tsuha_hangul_typing_wpm_${userId}`);

        const xp = storedXP ? parseInt(storedXP, 10) : 0;
        let highscores: Record<string, number> = {};
        if (storedHighScores) {
          try {
            highscores = JSON.parse(storedHighScores);
          } catch (e) {
            console.error('Error parsing legacy highscores:', e);
          }
        }
        const typingWpm = storedWPM ? parseInt(storedWPM, 10) : 0;

        // Only sync if there is actual legacy data to sync
        if (xp > 0 || Object.keys(highscores).length > 0 || typingWpm > 0) {
          syncLegacyScores({ xp, highscores, typingWpm })
            .then((res) => {
              if (res.success && res.synced) {
                console.log('Legacy game progress successfully synced to database!');
                // Update local state to show legacy synced stats immediately
                setTotalXP(xp);
                
                const scores = Object.values(highscores);
                if (scores.length > 0) {
                  setMaxHighScore(Math.max(...scores) * 10);
                }
                
                if (typingWpm > 0) {
                  setMaxWpm(typingWpm);
                }
              }
            })
            .catch((err) => {
              console.error('Failed to sync legacy game progress:', err);
            });
        }
      }
    }
  }, [userId, hasScoresInDb]);

  // Determine Rank and level up details based on XP
  const getRankDetails = (xp: number) => {
    if (xp >= 1000) {
      return {
        name: 'Master Hangul 👑',
        color: 'text-violet-600 border-violet-200 bg-violet-50',
        currentMin: 1000,
        nextMax: null,
        nextName: null,
        progressPercent: 100,
        remainingXp: 0,
      };
    }
    if (xp >= 500) {
      const currentMin = 500;
      const nextMax = 1000;
      const progressPercent = Math.min(100, Math.max(0, ((xp - currentMin) / (nextMax - currentMin)) * 100));
      return {
        name: 'Prajurit Hangul 🛡️',
        color: 'text-indigo-600 border-indigo-200 bg-indigo-50',
        currentMin,
        nextMax,
        nextName: 'Master Hangul 👑',
        progressPercent,
        remainingXp: nextMax - xp,
      };
    }
    if (xp >= 200) {
      const currentMin = 200;
      const nextMax = 500;
      const progressPercent = Math.min(100, Math.max(0, ((xp - currentMin) / (nextMax - currentMin)) * 100));
      return {
        name: 'Penjelajah Hangul 🗺️',
        color: 'text-emerald-600 border-emerald-200 bg-emerald-50',
        currentMin,
        nextMax,
        nextName: 'Prajurit Hangul 🛡️',
        progressPercent,
        remainingXp: nextMax - xp,
      };
    }
    if (xp >= 50) {
      const currentMin = 50;
      const nextMax = 200;
      const progressPercent = Math.min(100, Math.max(0, ((xp - currentMin) / (nextMax - currentMin)) * 100));
      return {
        name: 'Pembelajar Aktif ⚡',
        color: 'text-amber-600 border-amber-200 bg-amber-50',
        currentMin,
        nextMax,
        nextName: 'Penjelajah Hangul 🗺️',
        progressPercent,
        remainingXp: nextMax - xp,
      };
    }
    const currentMin = 0;
    const nextMax = 50;
    const progressPercent = Math.min(100, Math.max(0, ((xp - currentMin) / (nextMax - currentMin)) * 100));
    return {
      name: 'Sikembar Pemula 🌱',
      color: 'text-gray-500 border-gray-200 bg-gray-50',
      currentMin,
      nextMax,
      nextName: 'Pembelajar Aktif ⚡',
      progressPercent,
      remainingXp: nextMax - xp,
    };
  };

  const rank = getRankDetails(totalXP);

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
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0 z-10 items-stretch justify-center">
          {/* XP Stat Badge */}
          <div className="bg-amber-50/60 border border-amber-200/30 shadow-xs p-4 rounded-3xl flex items-center gap-4 shrink-0 w-full sm:w-48">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shrink-0">
              <FaBolt className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Total Energi</p>
              <p className="text-xl font-black text-gray-900 leading-none mt-1.5">{totalXP} <span className="text-xs font-bold text-amber-600">XP</span></p>
            </div>
          </div>

          {/* Rank Badge */}
          <div className="bg-violet-50/60 border border-violet-200/30 shadow-xs p-4 rounded-3xl flex flex-col justify-between gap-3 shrink-0 w-full sm:w-72">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <FaAward className="w-5 h-5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Pangkat Belajar</p>
                <span className={`inline-block text-xs font-extrabold mt-1 px-2 py-0.5 rounded-md border whitespace-nowrap ${rank.color}`}>
                  {rank.name}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-400">
                <span>{totalXP} / {rank.nextMax ?? 'Max'} XP</span>
                {rank.remainingXp > 0 && rank.nextName ? (
                  <span className="text-violet-600">{rank.remainingXp} XP lagi ke {rank.nextName.split(' ')[0]}</span>
                ) : (
                  <span className="text-violet-600">Tingkat Maksimal 🎉</span>
                )}
              </div>
              <div className="w-full bg-violet-100/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${rank.progressPercent}%` }}
                ></div>
              </div>
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

              {maxHighScore > 0 && isSubscribed && (
                <span className="bg-green-50 border border-green-200/50 text-green-700 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  🏆 Skor Tertinggi: {maxHighScore}%
                </span>
              )}

              {!isSubscribed && (
                <span className="bg-amber-50 border border-amber-200/50 text-amber-800 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <FaLock className="w-2.5 h-2.5" /> Premium
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

          {isSubscribed ? (
            <Link
              href="/quiz-games/tebak-hangul"
              className="relative z-10 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg active:scale-98 cursor-pointer border border-transparent"
            >
              Main Sekarang <FaArrowRight />
            </Link>
          ) : (
            <button
              onClick={() => {
                setSelectedGameName('Tebak Hangul');
                setShowPremiumModal(true);
              }}
              className="relative z-10 w-full py-4 bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:shadow-lg active:scale-98 cursor-pointer border border-transparent"
            >
              Buka Akses Premium <FaLock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CARD 2: TYPING CHALLENGE (ACTIVE) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:shadow-xl hover:scale-[1.01] transform transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-pink-100/40 to-rose-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-100 via-rose-50 to-pink-50 text-pink-600 flex items-center justify-center font-bold text-lg shadow-sm border border-pink-200/30">
                <FaKeyboard className="w-5 h-5 animate-pulse" />
              </div>

              {maxWpm > 0 && isSubscribed && (
                <span className="bg-green-50 border border-green-200/50 text-green-700 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  🏆 Terbaik: {maxWpm} WPM
                </span>
              )}

              {!isSubscribed && (
                <span className="bg-pink-50 border border-pink-200/50 text-pink-800 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <FaLock className="w-2.5 h-2.5" /> Premium
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

          {isSubscribed ? (
            <Link
              href="/quiz-games/typing-challenge"
              className="relative z-10 w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg active:scale-98 cursor-pointer border border-transparent"
            >
              Main Sekarang <FaArrowRight />
            </Link>
          ) : (
            <button
              onClick={() => {
                setSelectedGameName('Typing Challenge');
                setShowPremiumModal(true);
              }}
              className="relative z-10 w-full py-4 bg-gradient-to-r from-pink-500/80 to-rose-500/80 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:shadow-lg active:scale-98 cursor-pointer border border-transparent"
            >
              Buka Akses Premium <FaLock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CARD 3: HANGUL SURVIVAL (ACTIVE) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:shadow-xl hover:scale-[1.01] transform transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-100/40 to-violet-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-100 via-violet-50 to-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm border border-indigo-200/30">
                <FaStar className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>

              {maxSurvivalScore > 0 && (
                <span className="bg-green-50 border border-green-200/50 text-green-700 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  🏆 Terbaik: {maxSurvivalScore} Poin
                </span>
              )}
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 mt-5 group-hover:text-indigo-600 transition-colors">
              Hangul Survival
            </h3>
            <p className="text-[11px] text-indigo-600 font-extrabold tracking-wide uppercase mt-0.5">
              Ketik cepat untuk bertahan hidup!
            </p>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mt-3 mb-8">
              Ketik kosakata Korea dengan gesit untuk menghindari objek terbang yang menyerang karakter chibi Anda. Pertahankan combo dan raih skor tertinggi!
            </p>
          </div>

          <Link
            href="/quiz-games/hangul-survival"
            className="relative z-10 w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg active:scale-98 cursor-pointer border border-transparent"
          >
            Main Sekarang <FaArrowRight />
          </Link>
        </div>

        {/* CARD 4: VOCABULARY QUIZ (COMING SOON) */}
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

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl p-6 relative overflow-hidden text-center animate-in zoom-in-95 duration-200">
            {/* Background glow decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-amber-400/20 to-orange-500/0 rounded-full blur-2xl pointer-events-none"></div>
            
            {/* Premium Icon Badge */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-3xl shadow-lg mb-6 relative z-10">
              <FaLock className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-gray-900 leading-tight">
              Akses Premium Diperlukan 👑
            </h3>
            <p className="text-xs text-amber-600 font-extrabold uppercase tracking-widest mt-1.5">
              Fitur Premium Terkunci
            </p>
            
            <p className="text-sm text-gray-500 font-medium leading-relaxed mt-4 mb-6 px-2">
              Game <span className="text-gray-900 font-bold">{selectedGameName}</span> dirancang khusus untuk membantu mempercepat proses belajar Anda secara mendalam. Berlangganan sekarang untuk membuka semua kuis, materi, cerita, dan latihan premium Tsuha!
            </p>

            <div className="space-y-2.5 relative z-10">
              <Link
                href="/pricing"
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer border border-transparent"
              >
                Lihat Paket Berlangganan <FaArrowRight />
              </Link>
              <button
                onClick={() => setShowPremiumModal(false)}
                className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 font-bold rounded-2xl border border-gray-200 transition-all cursor-pointer"
              >
                Kembali Nanti
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
