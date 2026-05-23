'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaGamepad, FaVolumeHigh, FaHeart, FaTrophy, FaArrowRight, 
  FaRotateLeft, FaCircleCheck, FaCircleXmark, FaArrowLeft, FaGraduationCap
} from 'react-icons/fa6';
import { saveGameScore, syncLegacyScores } from '../actions';

// -------------------------------------------------------------
// DATA HANGUL
// -------------------------------------------------------------
interface HangulItem {
  hangul: string;
  romanization: string;
  name?: string;
  exampleKo?: string;
  exampleId?: string;
}

const basicConsonants: HangulItem[] = [
  { hangul: 'ㄱ', romanization: 'g/k', name: 'Giyeok', exampleKo: '가구', exampleId: 'gagu (furnitur)' },
  { hangul: 'ㄴ', romanization: 'n', name: 'Nieun', exampleKo: '나라', exampleId: 'nara (negara)' },
  { hangul: 'ㄷ', romanization: 'd/t', name: 'Digeut', exampleKo: '다리', exampleId: 'dari (kaki)' },
  { hangul: 'ㄹ', romanization: 'r/l', name: 'Rieul', exampleKo: '라디오', exampleId: 'radio (radio)' },
  { hangul: 'ㅁ', romanization: 'm', name: 'Mieum', exampleKo: '머리', exampleId: 'meori (kepala)' },
  { hangul: 'ㅂ', romanization: 'b/p', name: 'Bieup', exampleKo: '바지', exampleId: 'baji (celana)' },
  { hangul: 'ㅅ', romanization: 's', name: 'Siot', exampleKo: '사과', exampleId: 'sagwa (apel)' },
  { hangul: 'ㅇ', romanization: 'ng', name: 'Ieung', exampleKo: '어머니', exampleId: 'eomeoni (ibu)' },
  { hangul: 'ㅈ', romanization: 'j', name: 'Jieut', exampleKo: '지도', exampleId: 'jido (peta)' },
  { hangul: 'ㅊ', romanization: 'ch', name: 'Chieut', exampleKo: '치마', exampleId: 'chima (rok)' },
  { hangul: 'ㅋ', romanization: 'k', name: 'Kieuk', exampleKo: '코', exampleId: 'ko (hidung)' },
  { hangul: 'ㅌ', romanization: 't', name: 'Tieut', exampleKo: '토끼', exampleId: 'tokki (kelinci)' },
  { hangul: 'ㅍ', romanization: 'p', name: 'Pieup', exampleKo: '피자', exampleId: 'pija (piza)' },
  { hangul: 'ㅎ', romanization: 'h', name: 'Hieut', exampleKo: '하늘', exampleId: 'haneul (langit)' },
];

const basicVowels: HangulItem[] = [
  { hangul: 'ㅏ', romanization: 'a', exampleKo: '아이', exampleId: 'ai (anak)' },
  { hangul: 'ㅑ', romanization: 'ya', exampleKo: '야구', exampleId: 'yagu (bisbol)' },
  { hangul: 'ㅓ', romanization: 'eo', exampleKo: '어디', exampleId: 'eodi (di mana)' },
  { hangul: 'ㅕ', romanization: 'yeo', exampleKo: '여우', exampleId: 'yeou (rubah)' },
  { hangul: 'ㅗ', romanization: 'o', exampleKo: '오이', exampleId: 'oi (mentimun)' },
  { hangul: 'ㅛ', romanization: 'yo', exampleKo: '요리', exampleId: 'yori (memasak)' },
  { hangul: 'ㅜ', romanization: 'u', exampleKo: '우유', exampleId: 'uyu (susu)' },
  { hangul: 'ㅠ', romanization: 'yu', exampleKo: '유리', exampleId: 'yuri (kaca)' },
  { hangul: 'ㅡ', romanization: 'eu', exampleKo: '음식', exampleId: 'eumsik (makanan)' },
  { hangul: 'ㅣ', romanization: 'i', exampleKo: '이름', exampleId: 'ireum (nama)' },
];

const doubleConsonants: HangulItem[] = [
  { hangul: 'ㄲ', romanization: 'kk', name: 'Ssang-giyeok', exampleKo: '꼬리', exampleId: 'kkori (ekor)' },
  { hangul: 'ㄸ', romanization: 'tt', name: 'Ssang-digeut', exampleKo: '띠', exampleId: 'tti (sabuk)' },
  { hangul: 'ㅃ', romanization: 'pp', name: 'Ssang-bieup', exampleKo: '뽀뽀', exampleId: 'ppoppo (kecupan)' },
  { hangul: 'ㅆ', romanization: 'ss', name: 'Ssang-siot', exampleKo: '쌀', exampleId: 'ssal (beras)' },
  { hangul: 'ㅉ', romanization: 'jj', name: 'Ssang-jieut', exampleKo: '짜장면', exampleId: 'jjajangmyeon (mi saus hitam)' },
];

const doubleVowels: HangulItem[] = [
  { hangul: 'ㅐ', romanization: 'ae', exampleKo: '새', exampleId: 'sae (burung)' },
  { hangul: 'ㅒ', romanization: 'yae', exampleKo: '얘기', exampleId: 'yaegi (cerita/obrolan)' },
  { hangul: 'ㅔ', romanization: 'e', exampleKo: '게', exampleId: 'ge (kepiting)' },
  { hangul: 'ㅖ', romanization: 'ye', exampleKo: '시계', exampleId: 'sigye (jam)' },
  { hangul: 'ㅘ', romanization: 'wa', exampleKo: '과자', exampleId: 'gwaja (camilan)' },
  { hangul: 'ㅙ', romanization: 'wae', exampleKo: '돼지', exampleId: 'dwaeji (babi)' },
  { hangul: 'ㅚ', romanization: 'oe', exampleKo: '회사', exampleId: 'hoesa (perusahaan)' },
  { hangul: 'ㅝ', romanization: 'wo', exampleKo: '원', exampleId: 'won (mata uang Won)' },
  { hangul: 'ㅞ', romanization: 'we', exampleKo: '웨딩', exampleId: 'weding (pernikahan)' },
  { hangul: 'ㅟ', romanization: 'wi', exampleKo: '귀', exampleId: 'gwi (telinga)' },
  { hangul: 'ㅢ', romanization: 'ui', exampleKo: '의사', exampleId: 'uisa (dokter)' },
];

interface LevelConfig {
  id: string;
  name: string;
  description: string;
  colorClass: string;
  iconBg: string;
  gradient: string;
  items: HangulItem[];
}

const levels: LevelConfig[] = [
  {
    id: 'konsonan-dasar',
    name: 'Konsonan Dasar',
    description: '14 Konsonan utama bahasa Korea',
    colorClass: 'amber',
    iconBg: 'bg-amber-100 text-amber-600 border border-amber-200/50',
    gradient: 'from-amber-500 to-orange-500',
    items: basicConsonants,
  },
  {
    id: 'vokal-dasar',
    name: 'Vokal Dasar',
    description: '10 Vokal utama pembentuk suku kata',
    colorClass: 'pink',
    iconBg: 'bg-pink-100 text-pink-600 border border-pink-200/50',
    gradient: 'from-pink-500 to-rose-500',
    items: basicVowels,
  },
  {
    id: 'konsonan-ganda',
    name: 'Konsonan Ganda',
    description: '5 Konsonan ganda dengan penekanan kuat',
    colorClass: 'indigo',
    iconBg: 'bg-indigo-100 text-indigo-600 border border-indigo-200/50',
    gradient: 'from-indigo-500 to-violet-500',
    items: doubleConsonants,
  },
  {
    id: 'vokal-ganda',
    name: 'Vokal Ganda (Diftong)',
    description: '11 Vokal gabungan & variasi bunyi',
    colorClass: 'violet',
    iconBg: 'bg-violet-100 text-violet-600 border border-violet-200/50',
    gradient: 'from-violet-500 to-purple-500',
    items: doubleVowels,
  },
  {
    id: 'campuran',
    name: 'Campuran Lengkap',
    description: 'Campuran semua huruf konsonan & vokal',
    colorClass: 'emerald',
    iconBg: 'bg-emerald-100 text-emerald-600 border border-emerald-200/50',
    gradient: 'from-emerald-500 to-teal-500',
    items: [...basicConsonants, ...basicVowels, ...doubleConsonants, ...doubleVowels],
  },
];

interface TebakHangulClientProps {
  userId: string;
  userName: string;
  initialTotalXP: number;
  initialHighScores: Record<string, number>;
  hasScoresInDb: boolean;
}

interface Question {
  target: HangulItem;
  type: 'hangul-to-roman' | 'roman-to-hangul';
  options: string[]; // can be hangul characters or romanizations
}

export default function TebakHangulClient({ 
  userId, 
  userName,
  initialTotalXP,
  initialHighScores,
  hasScoresInDb,
}: TebakHangulClientProps) {
  const router = useRouter();

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'completed'>('menu');
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);
  
  // Play stats
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [earnedXP, setEarnedXP] = useState<number>(0);
  
  // Selection feedback state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [shakeActive, setShakeActive] = useState<boolean>(false);

  // User Stats (loaded from props, with fallback caching)
  const [totalXP, setTotalXP] = useState<number>(initialTotalXP);
  const [highScores, setHighScores] = useState<Record<string, number>>(initialHighScores);

  // TTS status
  const [voicesLoaded, setVoicesLoaded] = useState<boolean>(false);

  // Load user stats on mount and perform legacy sync if DB is empty
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!hasScoresInDb) {
        const storedXP = localStorage.getItem(`tsuha_hangul_xp_${userId}`);
        const storedHighScores = localStorage.getItem(`tsuha_hangul_highscores_${userId}`);
        const storedWPM = localStorage.getItem(`tsuha_hangul_typing_wpm_${userId}`);

        const xp = storedXP ? parseInt(storedXP, 10) : 0;
        let hs: Record<string, number> = {};
        if (storedHighScores) {
          try {
            hs = JSON.parse(storedHighScores);
          } catch (e) {
            console.error(e);
          }
        }
        const typingWpm = storedWPM ? parseInt(storedWPM, 10) : 0;

        if (xp > 0 || Object.keys(hs).length > 0 || typingWpm > 0) {
          syncLegacyScores({ xp, highscores: hs, typingWpm })
            .then((res) => {
              if (res.success && res.synced) {
                console.log('Legacy game progress successfully synced to database from Tebak Hangul page!');
                setTotalXP(xp);
                setHighScores(hs);
              }
            })
            .catch((err) => {
              console.error('Failed to sync legacy game progress from Tebak Hangul page:', err);
            });
        }
      }
    }

    // Trigger loading TTS voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const handleVoices = () => {
        setVoicesLoaded(true);
      };
      window.speechSynthesis.onvoiceschanged = handleVoices;
      // Chrome/Safari often have voices populated already
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoicesLoaded(true);
      }
    }
  }, [userId, hasScoresInDb]);

  // Audio synthesis helper
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.8;

      const voices = window.speechSynthesis.getVoices();
      const koreanVoice = voices.find(v => v.lang.startsWith('ko'));
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Error playing TTS voice:', e);
    }
  };

  // Helper to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Start a new game session
  const startGame = (level: LevelConfig) => {
    setSelectedLevel(level);
    setLives(3);
    setScore(0);
    setEarnedXP(0);
    setCurrentIndex(0);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);

    // Generate 10 questions
    const generatedQuestions: Question[] = [];
    const sourceItems = level.items;

    for (let i = 0; i < 10; i++) {
      // Pick target
      const target = sourceItems[Math.floor(Math.random() * sourceItems.length)];
      // Choose question type: 50% hangul-to-roman, 50% roman-to-hangul
      const type = Math.random() > 0.5 ? 'hangul-to-roman' : 'roman-to-hangul';

      // Gather options
      const correctVal = type === 'hangul-to-roman' ? target.romanization : target.hangul;
      const optionPool = sourceItems
        .filter(item => item.hangul !== target.hangul)
        .map(item => (type === 'hangul-to-roman' ? item.romanization : item.hangul));

      // Unique options
      const uniqueOptions = Array.from(new Set(optionPool));
      
      // Shuffle & pick 3 distractors
      const distractors = shuffleArray(uniqueOptions).slice(0, 3);
      
      // Combine and shuffle
      const finalOptions = shuffleArray([correctVal, ...distractors]);

      generatedQuestions.push({
        target,
        type,
        options: finalOptions,
      });
    }

    setQuestions(generatedQuestions);
    setGameState('playing');

    // Auto voice output on first question if it starts with Hangul display
    setTimeout(() => {
      const firstQ = generatedQuestions[0];
      if (firstQ.type === 'hangul-to-roman') {
        speak(firstQ.target.hangul);
      }
    }, 400);
  };

  // Handle option select
  const selectOption = (option: string) => {
    if (hasAnswered) return;

    setSelectedAnswer(option);
    const currentQuestion = questions[currentIndex];
    const correctVal = currentQuestion.type === 'hangul-to-roman' 
      ? currentQuestion.target.romanization 
      : currentQuestion.target.hangul;

    const answerIsCorrect = option === correctVal;
    setIsCorrect(answerIsCorrect);
    setHasAnswered(true);

    if (answerIsCorrect) {
      setScore(prev => prev + 1);
      setEarnedXP(prev => prev + 10);
      // Play sound
      speak(currentQuestion.target.hangul);
    } else {
      setLives(prev => prev - 1);
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 500);
    }
  };

  // Next question
  const nextQuestion = () => {
    const nextIdx = currentIndex + 1;

    // Check if game over (no lives)
    if (lives <= 0) {
      setGameState('gameover');
      return;
    }

    if (nextIdx >= 10) {
      // Completed!
      finishGame();
    } else {
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setHasAnswered(false);

      // Auto speak Hangul if displayed
      const nextQ = questions[nextIdx];
      if (nextQ.type === 'hangul-to-roman') {
        setTimeout(() => speak(nextQ.target.hangul), 200);
      }
    }
  };

  // Finish game & save data
  const finishGame = () => {
    const finalScore = score;
    // Add bonus XP if perfect score
    const bonus = finalScore === 10 ? 50 : 0;
    const finalEarnedXP = (finalScore * 10) + bonus;
    setEarnedXP(finalEarnedXP);

    if (selectedLevel) {
      const levelId = selectedLevel.id;
      const currentHighScore = highScores[levelId] || 0;
      
      // Update high score
      const newHighScores = { ...highScores };
      if (finalScore > currentHighScore) {
        newHighScores[levelId] = finalScore;
        setHighScores(newHighScores);
        localStorage.setItem(`tsuha_hangul_highscores_${userId}`, JSON.stringify(newHighScores));
      }

      // Update total XP
      const newTotalXP = totalXP + finalEarnedXP;
      setTotalXP(newTotalXP);
      localStorage.setItem(`tsuha_hangul_xp_${userId}`, newTotalXP.toString());

      // Save to Supabase database (Server Action)
      saveGameScore({
        gameSlug: 'tebak-hangul',
        gameMode: levelId,
        score: finalScore,
        accuracy: finalScore * 10,
        xpEarned: finalEarnedXP,
      }).then(res => {
        if (res.error) {
          console.error('Failed to save score to database:', res.error);
        } else {
          console.log('Score successfully saved to database!');
        }
      }).catch(err => {
        console.error('Network error saving score to database:', err);
      });
    }

    setGameState('completed');
  };

  // Restart after gameover
  const retryGame = () => {
    if (selectedLevel) {
      startGame(selectedLevel);
    }
  };

  // Back to level selection
  const backToMenu = () => {
    setGameState('menu');
    setSelectedLevel(null);
  };

  return (
    <main className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 select-none font-sans">
      {/* ----------------------------------------------------------- */}
      {/* 1. SCREEN: MENU SELEKSI LEVEL */}
      {/* ----------------------------------------------------------- */}
      {gameState === 'menu' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Back Button */}
          <div className="mb-6 flex justify-start">
            <Link 
              href="/quiz-games" 
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 px-4 py-2 rounded-full border border-gray-200 transition-all shadow-sm cursor-pointer"
            >
              <FaArrowLeft className="w-4 h-4" /> Kembali ke Hub
            </Link>
          </div>

          {/* Header */}
          <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200/50 flex items-center justify-center text-amber-600 shadow-md">
                  <FaGamepad className="w-6 h-6" />
                </span>
                Tebak Hangul
              </h1>
              <p className="mt-2 text-gray-500 font-medium">
                Quiz cepat multiple choice untuk melatih refleks membaca huruf Korea.
              </p>
            </div>
            
            {/* User Stat Badge */}
            <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-3xl flex items-center gap-4 w-full sm:w-auto shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
                <FaTrophy className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Total Skor</p>
                <p className="text-lg font-black text-gray-900 leading-none mt-0.5">{totalXP} <span className="text-xs font-semibold text-amber-600">XP</span></p>
              </div>
            </div>
          </div>

          {/* Level List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => {
              const hs = highScores[level.id] !== undefined ? highScores[level.id] : null;
              
              return (
                <div 
                  key={level.id}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:scale-[1.01] transform transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-gray-100 to-gray-50/20 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${level.iconBg}`}>
                        {level.id === 'campuran' ? '✨' : level.items[0]?.hangul}
                      </div>

                      {hs !== null && (
                        <span className="bg-green-50 border border-green-200/50 text-green-700 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                          🏆 HS: {hs * 10}%
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-extrabold text-gray-900 mt-5 group-hover:text-violet-600 transition-colors">
                      {level.name}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed mt-1 mb-8">
                      {level.description}
                    </p>
                  </div>

                  <button
                    onClick={() => startGame(level)}
                    className="relative z-10 w-full py-4 bg-gray-50 hover:bg-gray-900 hover:text-white text-gray-700 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-900 shadow-xs hover:shadow-lg"
                  >
                    Mulai Belajar <FaArrowRight />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 2. SCREEN: GAMEPLAY IN-PROGRESS */}
      {/* ----------------------------------------------------------- */}
      {gameState === 'playing' && selectedLevel && questions.length > 0 && (
        <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header Dashboard Game */}
          <div className="flex items-center justify-between gap-6 mb-8">
            {/* Back Button */}
            <button 
              onClick={backToMenu}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-white transition-all shadow-xs"
              aria-label="Kembali ke menu"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>

            {/* Progress Tracker */}
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                <span>Soal {currentIndex + 1} dari 10</span>
                <span>Skor: {score * 10} XP</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentIndex / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Lives / Hearts */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((heart) => (
                <FaHeart 
                  key={heart} 
                  className={`w-6 h-6 transition-all duration-300 ${
                    heart <= lives 
                      ? 'text-rose-500 scale-100 drop-shadow-xs' 
                      : 'text-gray-200 scale-90'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* QUESTION BOX */}
          <div className={`bg-white border border-gray-100 shadow-xl rounded-3xl p-8 text-center relative overflow-hidden mb-6 ${shakeActive ? 'animate-shake' : ''}`}>
            
            {/* Speech synthesis speaker button */}
            <button
              onClick={() => speak(questions[currentIndex].target.hangul)}
              className="absolute top-6 right-6 w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center hover:bg-amber-100 active:scale-95 transition-all shadow-xs border border-amber-200/20"
              title="Dengarkan Pengucapan Suara"
            >
              <FaVolumeHigh className="w-5 h-5" />
            </button>

            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 border border-gray-100 px-3 py-1 rounded-full inline-block mb-6">
              {questions[currentIndex].type === 'hangul-to-roman' 
                ? 'Bagaimana cara membaca huruf ini?' 
                : 'Pilih huruf Hangul untuk bunyi berikut:'}
            </span>

            {/* Large Question Display */}
            <div className="my-6">
              <h2 className={`font-black text-gray-900 tracking-tight leading-none ${
                questions[currentIndex].type === 'hangul-to-roman' 
                  ? 'text-8xl font-ko font-medium py-3 text-violet-600' 
                  : 'text-6xl text-amber-600 py-3 uppercase'
              }`}>
                {questions[currentIndex].type === 'hangul-to-roman' 
                  ? questions[currentIndex].target.hangul 
                  : questions[currentIndex].target.romanization}
              </h2>
            </div>
            
            {/* Example hint if exists */}
            {hasAnswered && questions[currentIndex].target.exampleKo && (
              <div className="mt-4 p-3 bg-violet-50/50 rounded-2xl border border-violet-100/30 text-xs font-semibold inline-block text-violet-700 animate-in fade-in duration-200">
                Contoh: <span className="font-ko font-extrabold">{questions[currentIndex].target.exampleKo}</span> = {questions[currentIndex].target.exampleId}
              </div>
            )}
          </div>

          {/* OPTIONS GRID */}
          <div className="grid grid-cols-2 gap-4">
            {questions[currentIndex].options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const currentQuestion = questions[currentIndex];
              const correctVal = currentQuestion.type === 'hangul-to-roman' 
                ? currentQuestion.target.romanization 
                : currentQuestion.target.hangul;
              
              const isAnswerCorrect = option === correctVal;

              let btnStyle = "bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200 shadow-sm";
              let statusIcon = null;

              if (hasAnswered) {
                if (isAnswerCorrect) {
                  // Always highlight correct answer in green after selection
                  btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-md ring-2 ring-emerald-500/10";
                  statusIcon = <FaCircleCheck className="w-5 h-5 text-emerald-600 shrink-0" />;
                } else if (isSelected) {
                  // Highlight incorrect selected answer in red
                  btnStyle = "bg-rose-50 border-rose-300 text-rose-700 shadow-md ring-2 ring-rose-500/10";
                  statusIcon = <FaCircleXmark className="w-5 h-5 text-rose-600 shrink-0" />;
                } else {
                  // Fade out other non-selected answers
                  btnStyle = "bg-white border-gray-100 text-gray-400 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => selectOption(option)}
                  disabled={hasAnswered}
                  className={`w-full py-6 px-4 rounded-3xl font-extrabold text-2xl transition-all transform duration-300 flex items-center justify-between border-2 gap-3 cursor-pointer ${
                    !hasAnswered ? 'active:scale-98 hover:scale-[1.01] hover:shadow-md' : ''
                  } ${btnStyle}`}
                >
                  <span className={`w-full text-center ${option.length > 2 ? 'text-lg sm:text-xl font-bold' : 'font-ko font-medium text-3xl'}`}>
                    {option}
                  </span>
                  {statusIcon}
                </button>
              );
            })}
          </div>

          {/* DUOLINGO STYLE SLIDE-UP BOTTOM BAR FOR ANSWER RESPONSE */}
          {hasAnswered && (
            <div className={`mt-8 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-6 duration-300 shadow-md ${
              isCorrect 
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border border-rose-100 text-rose-800'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {isCorrect ? '🎉' : '😢'}
                </span>
                <div>
                  <h4 className="text-base font-black">
                    {isCorrect ? 'Benar sekali!' : 'Kurang tepat'}
                  </h4>
                  <p className="text-xs font-semibold opacity-90 mt-0.5">
                    {isCorrect 
                      ? `Kamu mendapatkan +10 XP!` 
                      : `Jawaban benar: ${
                          questions[currentIndex].type === 'hangul-to-roman'
                            ? `[${questions[currentIndex].target.romanization}]`
                            : `"${questions[currentIndex].target.hangul}"`
                        }`}
                  </p>
                </div>
              </div>
              <button
                onClick={nextQuestion}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white shadow-md active:scale-95 transition-all flex items-center gap-2 w-full sm:w-auto justify-center ${
                  isCorrect 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Lanjut <FaArrowRight />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 3. SCREEN: GAME OVER */}
      {/* ----------------------------------------------------------- */}
      {gameState === 'gameover' && selectedLevel && (
        <div className="max-w-md mx-auto text-center py-12 px-6 bg-white border border-gray-100 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FaCircleXmark className="w-12 h-12" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Sesi Berakhir</h2>
          <p className="text-gray-500 text-sm font-semibold mb-8">
            Kamu kehabisan nyawa kali ini. Jangan menyerah, ayo latih lagi memori membaca Hangul-mu!
          </p>

          {/* Stats Summary */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-8 flex justify-around">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Benar</p>
              <p className="text-2xl font-black text-gray-800">{score} / 10</p>
            </div>
            <div className="border-r border-gray-200"></div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">XP Diperoleh</p>
              <p className="text-2xl font-black text-amber-600">+{score * 10} XP</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={retryGame}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaRotateLeft /> Coba Lagi
            </button>
            <button
              onClick={backToMenu}
              className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-200 transition-all cursor-pointer"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 4. SCREEN: GAME COMPLETED */}
      {/* ----------------------------------------------------------- */}
      {gameState === 'completed' && selectedLevel && (
        <div className="max-w-md mx-auto text-center py-12 px-6 bg-white border border-gray-100 shadow-2xl rounded-3xl relative overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Confetti Visual effect using simple floating emojis */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-10 left-10 text-3xl animate-bounce duration-1000">🎉</div>
            <div className="absolute top-20 right-10 text-2xl animate-bounce duration-750 delay-200">⭐</div>
            <div className="absolute bottom-20 left-16 text-3xl animate-bounce duration-1000 delay-500">✨</div>
            <div className="absolute bottom-10 right-20 text-4xl animate-bounce duration-500 delay-100">🎉</div>
          </div>

          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20 transform hover:scale-105 transition-transform duration-300">
              <FaTrophy className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Hebat, Chingu!</h2>
            <p className="text-gray-500 text-sm font-semibold mb-8">
              Kamu telah menyelesaikan sesi Tebak Hangul tingkat <span className="text-amber-600 font-extrabold">{selectedLevel.name}</span>.
            </p>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-amber-50/70 border border-amber-200/30 p-4 rounded-2xl">
                <span className="text-xl block mb-1">🎯</span>
                <span className="text-2xl font-black text-amber-700 block">{score * 10}%</span>
                <span className="text-[9px] font-black text-amber-500 uppercase">Akurasi</span>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/30 p-4 rounded-2xl">
                <span className="text-xl block mb-1">⚡</span>
                <span className="text-2xl font-black text-emerald-700 block">+{score * 10}</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase">Skor XP</span>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200/30 p-4 rounded-2xl">
                <span className="text-xl block mb-1">🎁</span>
                <span className="text-2xl font-black text-indigo-700 block">+{score === 10 ? '50' : '0'}</span>
                <span className="text-[9px] font-black text-indigo-500 uppercase">Bonus 10/10</span>
              </div>
            </div>

            {/* Total XP Earned */}
            <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-2xl p-4 border border-violet-100/50 mb-8">
              <p className="text-xs font-bold text-violet-700">Total XP Diperoleh:</p>
              <p className="text-2xl font-black text-gray-900 mt-1">+{earnedXP} XP</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={retryGame}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaRotateLeft /> Main Lagi
              </button>
              <button
                onClick={backToMenu}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-200 transition-all cursor-pointer"
              >
                Kembali ke Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
