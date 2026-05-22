'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaKeyboard, FaBolt, FaTrophy, FaArrowLeft, FaArrowRight, 
  FaRotateLeft, FaHeart, FaCircleCheck, FaRegLightbulb, FaVolumeHigh, FaVolumeXmark
} from 'react-icons/fa6';

// -------------------------------------------------------------
// JAMO DECOMPOSITION CONSTANTS & UTILITIES
// -------------------------------------------------------------
const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];
const JUNGSEONG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];
const JONGSEONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const COMPOUND_VOWELS: Record<string, string[]> = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ']
};

const COMPOUND_CONSONANTS: Record<string, string[]> = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ']
};

function flattenJamo(jamo: string): string[] {
  if (COMPOUND_VOWELS[jamo]) return COMPOUND_VOWELS[jamo];
  if (COMPOUND_CONSONANTS[jamo]) return COMPOUND_CONSONANTS[jamo];
  return [jamo];
}

function decomposeCharacter(char: string): string[] {
  const code = char.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const sIdx = code - 0xAC00;
    const cIdx = Math.floor(sIdx / 588);
    const vIdx = Math.floor((sIdx % 588) / 28);
    const jIdx = sIdx % 28;
    
    const choice = CHOSEONG[cIdx];
    const jung = JUNGSEONG[vIdx];
    const jong = JONGSEONG[jIdx];
    
    let result: string[] = [];
    result.push(...flattenJamo(choice));
    result.push(...flattenJamo(jung));
    if (jong) {
      result.push(...flattenJamo(jong));
    }
    return result;
  }
  if (code >= 0x3130 && code <= 0x318F) {
    return flattenJamo(char);
  }
  return [char];
}

function decomposeStringToJamos(text: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    result.push(...decomposeCharacter(text[i]));
  }
  return result;
}

// -------------------------------------------------------------
// GAME MODES & WORDS DATA
// -------------------------------------------------------------
interface WordItem {
  word: string;
  romanization: string;
  translation: string;
}

const beginnerWords: WordItem[] = [
  { word: '안', romanization: 'an', translation: 'Dalam / Tidak' },
  { word: '녕', romanization: 'nyeong', translation: 'Sejahtera' },
  { word: '집', romanization: 'jib', translation: 'Rumah' },
  { word: '밥', romanization: 'bab', translation: 'Nasi / Makanan' },
  { word: '물', romanization: 'mul', translation: 'Air' },
  { word: '책', romanization: 'chaek', translation: 'Buku' },
  { word: '빵', romanization: 'ppang', translation: 'Roti' },
  { word: '꽃', romanization: 'kkot', translation: 'Bunga' },
  { word: '달', romanization: 'dal', translation: 'Bulan' },
  { word: '해', romanization: 'hae', translation: 'Matahari' },
  { word: '가', romanization: 'ga', translation: 'Pergi' },
  { word: '나', romanization: 'na', translation: 'Saya (informal)' },
  { word: '너', romanization: 'neo', translation: 'Kamu' },
  { word: '별', romanization: 'byeol', translation: 'Bintang' },
  { word: '손', romanization: 'son', translation: 'Tangan' },
  { word: '발', romanization: 'bal', translation: 'Kaki' },
  { word: '눈', romanization: 'nun', translation: 'Mata / Salju' },
  { word: '입', romanization: 'ib', translation: 'Mulut' },
  { word: '귀', romanization: 'gwi', translation: 'Telinga' },
  { word: '숲', romanization: 'sup', translation: 'Hutan' }
];

const vocabularyWords: WordItem[] = [
  { word: '안녕하세요', romanization: 'annyeonghaseyo', translation: 'Halo / Apa kabar' },
  { word: '감사합니다', romanization: 'gamsahabnida', translation: 'Terima kasih' },
  { word: '고양이', romanization: 'goyangi', translation: 'Kucing' },
  { word: '강아지', romanization: 'gangaji', translation: 'Anjing' },
  { word: '사랑해요', romanization: 'saranghaeyo', translation: 'Aku mencintaimu' },
  { word: '학교', romanization: 'hakgyo', translation: 'Sekolah' },
  { word: '선생님', romanization: 'seonseangnim', translation: 'Guru' },
  { word: '학생', romanization: 'hakseang', translation: 'Siswa' },
  { word: '친구', romanization: 'chingu', translation: 'Teman' },
  { word: '바da', romanization: 'bada', translation: 'Laut' }, // Fix typo word
  { word: '바다', romanization: 'bada', translation: 'Laut' },
  { word: '하늘', romanization: 'haneul', translation: 'Langit' },
  { word: '음식', romanization: 'eumsik', translation: 'Makanan' },
  { word: '한국어', romanization: 'hangugo', translation: 'Bahasa Korea' },
  { word: '노래', romanization: 'norae', translation: 'Lagu' },
  { word: '영화', romanization: 'yeonghwa', translation: 'Film' },
  { word: '사과', romanization: 'sagwa', translation: 'Apel' },
  { word: '커피', romanization: 'kopi', translation: 'Kopi' },
  { word: '우유', romanization: 'uyu', translation: 'Susu' },
  { word: '가족', romanization: 'gajok', translation: 'Keluarga' },
  { word: '나라', romanization: 'nara', translation: 'Negara' }
].filter(item => item.word !== '바da'); // filter out the duplicate check

const sentenceWords: WordItem[] = [
  { word: '날씨가 좋아요', romanization: 'nalssiga johayo', translation: 'Cuacanya bagus' },
  { word: '밥을 먹었어요', romanization: 'babeul meogeosseoyo', translation: 'Sudah makan nasi' },
  { word: '이름이 뭐예요', romanization: 'ireumi mwoyeyo', translation: 'Siapa namamu?' },
  { word: '만나서 반가워요', romanization: 'mannaso bangawoyo', translation: 'Senang bertemu denganmu' },
  { word: '한국어를 공부해요', romanization: 'hangugoreul gongbuhaeyo', translation: 'Belajar bahasa Korea' },
  { word: '어디에 가요', romanization: 'eodie gayo', translation: 'Pergi ke mana?' },
  { word: '지금 몇 시예요', romanization: 'jigeum myeot siyeyo', translation: 'Sekarang jam berapa?' },
  { word: '저는 학생입니다', romanization: 'jeoneun hakseangimnida', translation: 'Saya adalah siswa' },
  { word: '오늘 뭐 해요', romanization: 'oneul mwo haeyo', translation: 'Hari ini melakukan apa?' },
  { word: '주말 잘 보내세요', romanization: 'jumal jal bonaeseyo', translation: 'Selamat menikmati akhir pekan' }
];

interface ModeConfig {
  id: string;
  name: string;
  description: string;
  iconBg: string;
  textColor: string;
  gradient: string;
  defaultTimer: number;
  wordTimer?: number;
  hasLives: boolean;
  xpPerWord: number;
  doubleXP?: boolean;
}

const gameModes: ModeConfig[] = [
  {
    id: 'beginner',
    name: 'Beginner Typing',
    description: 'Latih mengetik suku kata dasar tunggal',
    iconBg: 'bg-pink-100 text-pink-600 border border-pink-200/50',
    textColor: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-500',
    defaultTimer: 60,
    hasLives: false,
    xpPerWord: 5
  },
  {
    id: 'vocab',
    name: 'Vocabulary Typing',
    description: 'Mengetik kosa kata umum bahasa Korea',
    iconBg: 'bg-amber-100 text-amber-600 border border-amber-200/50',
    textColor: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-500',
    defaultTimer: 60,
    hasLives: false,
    xpPerWord: 8
  },
  {
    id: 'sentence',
    name: 'Sentence Typing',
    description: 'Mengetik kalimat pendek dengan spasi',
    iconBg: 'bg-violet-100 text-violet-600 border border-violet-200/50',
    textColor: 'text-violet-600',
    gradient: 'from-violet-500 to-fuchsia-500',
    defaultTimer: 90,
    hasLives: false,
    xpPerWord: 15
  },
  {
    id: 'speed',
    name: 'Speed Challenge',
    description: 'Kejar waktu! Tambahan +2s tiap kata benar',
    iconBg: 'bg-sky-100 text-sky-600 border border-sky-200/50',
    textColor: 'text-sky-600',
    gradient: 'from-sky-500 to-blue-500',
    defaultTimer: 30,
    hasLives: false,
    xpPerWord: 10
  },
  {
    id: 'survival',
    name: 'Survival Mode',
    description: '3 Nyawa. Batas waktu 7 detik per kata!',
    iconBg: 'bg-rose-100 text-rose-600 border border-rose-200/50',
    textColor: 'text-rose-600',
    gradient: 'from-rose-500 to-red-500',
    defaultTimer: 999, // infinite total timer, controlled by lives
    wordTimer: 7,
    hasLives: true,
    xpPerWord: 12
  },
  {
    id: 'daily',
    name: 'Daily Challenge',
    description: 'Misi harian spesial dengan Double XP!',
    iconBg: 'bg-emerald-100 text-emerald-600 border border-emerald-200/50',
    textColor: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-500',
    defaultTimer: 60,
    hasLives: false,
    xpPerWord: 20, // Double XP
    doubleXP: true
  }
];

// -------------------------------------------------------------
// KEYBOARD HELPER LAYOUT
// -------------------------------------------------------------
interface KeyboardKey {
  eng: string;
  ko: string;
  koShift?: string;
  row: number;
}

const keyboardLayout: KeyboardKey[] = [
  // Row 1
  { eng: 'Q', ko: 'ㅂ', koShift: 'ㅃ', row: 1 },
  { eng: 'W', ko: 'ㅈ', koShift: 'ㅉ', row: 1 },
  { eng: 'E', ko: 'ㄷ', koShift: 'ㄸ', row: 1 },
  { eng: 'R', ko: 'ㄱ', koShift: 'ㄲ', row: 1 },
  { eng: 'T', ko: 'ㅅ', koShift: 'ㅆ', row: 1 },
  { eng: 'Y', ko: 'ㅛ', row: 1 },
  { eng: 'U', ko: 'ㅕ', row: 1 },
  { eng: 'I', ko: 'ㅑ', row: 1 },
  { eng: 'O', ko: 'ㅐ', koShift: 'ㅒ', row: 1 },
  { eng: 'P', ko: 'ㅔ', koShift: 'ㅖ', row: 1 },
  
  // Row 2
  { eng: 'A', ko: 'ㅁ', row: 2 },
  { eng: 'S', ko: 'ㄴ', row: 2 },
  { eng: 'D', ko: 'ㅇ', row: 2 },
  { eng: 'F', ko: 'ㄹ', row: 2 },
  { eng: 'G', ko: 'ㅎ', row: 2 },
  { eng: 'H', ko: 'ㅗ', row: 2 },
  { eng: 'J', ko: 'ㅓ', row: 2 },
  { eng: 'K', ko: 'ㅏ', row: 2 },
  { eng: 'L', ko: 'ㅣ', row: 2 },
  
  // Row 3
  { eng: 'Z', ko: 'ㅋ', row: 3 },
  { eng: 'X', ko: 'ㅌ', row: 3 },
  { eng: 'C', ko: 'ㅊ', row: 3 },
  { eng: 'V', ko: 'ㅍ', row: 3 },
  { eng: 'B', ko: 'ㅠ', row: 3 },
  { eng: 'N', ko: 'ㅜ', row: 3 },
  { eng: 'M', ko: 'ㅡ', row: 3 },
];

function getKeyForJamo(jamo: string): { eng: string; shift: boolean } | null {
  for (const key of keyboardLayout) {
    if (key.ko === jamo) {
      return { eng: key.eng, shift: false };
    }
    if (key.koShift === jamo) {
      return { eng: key.eng, shift: true };
    }
  }
  return null;
}

// -------------------------------------------------------------
// COMPONENT IMPLEMENTATION
// -------------------------------------------------------------
interface TypingChallengeClientProps {
  userId: string;
  userName: string;
}

let globalAudioCtx: AudioContext | null = null;

export default function TypingChallengeClient({ userId, userName }: TypingChallengeClientProps) {
  const router = useRouter();

  // General audio volume settings
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const synthSound = (type: 'type' | 'correct' | 'wrong' | 'combo' | 'finish', comboCount: number = 0) => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!globalAudioCtx) {
        globalAudioCtx = new AudioCtx();
      }
      const ctx = globalAudioCtx;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      if (type === 'type') {
        // Keyboard click
        const bufSize = ctx.sampleRate * 0.015; // 15ms
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        filter.Q.value = 3;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } else if (type === 'correct') {
        // C5 - G5 Chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'triangle';
        osc2.type = 'triangle';
        const now = ctx.currentTime;
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(783.99, now + 0.06); // G5
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now + 0.06);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
      } else if (type === 'wrong') {
        // Low buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.12);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'combo') {
        // Rising pitch depending on combo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const now = ctx.currentTime;
        const baseFreq = 523.25; // C5
        const multiplier = Math.min(comboCount, 15) * 35;
        osc.frequency.setValueAtTime(baseFreq + multiplier, now);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'finish') {
        // Win arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major
        const now = ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          
          gain.gain.setValueAtTime(0.06, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.28);
        });
      }
    } catch (e) {
      console.warn('Audio synthesiser is blocked or failed', e);
    }
  };

  // State Management
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [selectedMode, setSelectedMode] = useState<ModeConfig | null>(null);

  // Active game logic states
  const [words, setWords] = useState<WordItem[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [wordTimeLeft, setWordTimeLeft] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  
  // Game metrics tracking
  const [score, setScore] = useState<number>(0); // count of completed words
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [typoCount, setTypoCount] = useState<number>(0);
  const [correctKeypresses, setCorrectKeypresses] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // UI state details
  const [shake, setShake] = useState<boolean>(false);
  const [perfectConfetti, setPerfectConfetti] = useState<boolean>(false);
  const [keyboardHelperActive, setKeyboardHelperActive] = useState<boolean>(true);
  const [showImeWarning, setShowImeWarning] = useState<boolean>(false);

  // Local Storage gamification totals
  const [totalXP, setTotalXP] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load profile XP
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedXP = localStorage.getItem(`tsuha_hangul_xp_${userId}`);
      if (storedXP) {
        const parsed = parseInt(storedXP, 10);
        setTotalXP(isNaN(parsed) ? 0 : parsed);
      }
    }
  }, [userId]);

  // Main game timers
  useEffect(() => {
    if (gameState !== 'playing' || !selectedMode) return;

    const timerInterval = setInterval(() => {
      // Manage total timer left
      if (selectedMode.id !== 'survival') {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
        setTimeSpent((prev) => prev + 1);
      } else {
        // Survival mode is word timer governed
        setWordTimeLeft((prev) => {
          if (prev <= 1) {
            // Expired word timer - lose a life!
            synthSound('wrong');
            setLives((currLives) => {
              if (currLives <= 1) {
                clearInterval(timerInterval);
                finishGame(0);
                return 0;
              }
              return currLives - 1;
            });
            setCombo(0);
            setTypoCount((t) => t + 1);
            // Skip to next word
            setInputVal('');
            setCurrentWordIdx((idx) => {
              // Loop if we run out of words
              if (idx >= words.length - 1) {
                // Reshuffle or loop
                return 0;
              }
              return idx + 1;
            });
            return selectedMode.wordTimer || 7;
          }
          return prev - 1;
        });
        setTimeSpent((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameState, selectedMode, words]);

  // Auto focus input
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [gameState]);

  // Generate word lists based on mode
  const startGame = (mode: ModeConfig) => {
    setSelectedMode(mode);
    let selectedWordsList: WordItem[] = [];

    if (mode.id === 'beginner') {
      // shuffle beginner words
      selectedWordsList = [...beginnerWords].sort(() => Math.random() - 0.5);
    } else if (mode.id === 'vocab') {
      selectedWordsList = [...vocabularyWords].sort(() => Math.random() - 0.5);
    } else if (mode.id === 'sentence') {
      selectedWordsList = [...sentenceWords].sort(() => Math.random() - 0.5);
    } else if (mode.id === 'speed') {
      selectedWordsList = [...beginnerWords, ...vocabularyWords].sort(() => Math.random() - 0.5);
    } else if (mode.id === 'survival') {
      selectedWordsList = [...beginnerWords, ...vocabularyWords].sort(() => Math.random() - 0.5);
    } else if (mode.id === 'daily') {
      // Deterministic shuffle using day of month to keep it identical for all users on a day
      const day = new Date().getDate();
      const allWords = [...beginnerWords, ...vocabularyWords, ...sentenceWords];
      selectedWordsList = allWords
        .map((value) => ({ value, sort: (value.word.charCodeAt(0) * day) % 100 }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
        .slice(0, 10); // Fixed 10 words daily
    }

    setWords(selectedWordsList);
    setCurrentWordIdx(0);
    setInputVal('');
    setTimeLeft(mode.defaultTimer);
    setWordTimeLeft(mode.wordTimer || 7);
    setLives(3);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTypoCount(0);
    setCorrectKeypresses(0);
    setTimeSpent(0);
    setShake(false);
    setPerfectConfetti(false);
    setShowImeWarning(false);
    
    setGameState('playing');
  };

  const finishGame = (forcedLives?: number) => {
    setGameState('result');
    synthSound('finish');
  };

  // Keyboard layout inputs tracking
  const targetWord = words[currentWordIdx]?.word || '';
  const targetJamos = decomposeStringToJamos(targetWord);
  const inputJamos = decomposeStringToJamos(inputVal);

  // Mapping each character of the target string to its Jamos range
  let currentJamoIdx = 0;
  const characterRanges = targetWord.split('').map((char) => {
    const len = decomposeCharacter(char).length;
    const range = { start: currentJamoIdx, end: currentJamoIdx + len };
    currentJamoIdx += len;
    return range;
  });

  // Calculate keyboard highlights
  const nextJamoToType = targetJamos[inputJamos.length];
  const nextKeyInfo = nextJamoToType ? getKeyForJamo(nextJamoToType) : null;

  // Realtime typing handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Safety limit: Enforce maximum length to prevent performance issues / browser freeze
    const maxInputLen = Math.max(targetWord.length + 10, 30);
    if (val.length > maxInputLen) {
      val = val.slice(0, maxInputLen);
    }
    
    // Safety sanitization: Remove non-printable control characters, newlines, and tabs
    val = val.replace(/[\x00-\x1F\x7F-\x9F\r\n\t]/g, '');
    
    // Stop if word completed and already matching (to prevent extra typing processing)
    if (inputVal === targetWord && val.length >= inputVal.length) {
      return;
    }

    setInputVal(val);
    synthSound('type');

    // Decompose new input value
    const newInputJamos = decomposeStringToJamos(val);

    // Validate typing progress
    let isTypo = false;
    for (let i = 0; i < newInputJamos.length; i++) {
      if (newInputJamos[i] !== targetJamos[i]) {
        isTypo = true;
        break;
      }
    }

    if (isTypo) {
      synthSound('wrong');
      setShake(true);
      setTypoCount((prev) => prev + 1);
      setCombo(0);
      setTimeout(() => setShake(false), 300);
      if (/[a-zA-Z]/.test(val)) {
        setShowImeWarning(true);
      }
    } else {
      setShowImeWarning(false);
      // Correct keystroke progress
      if (newInputJamos.length > inputJamos.length) {
        if (combo > 5) {
          synthSound('combo', combo);
        }
      }
      
      // Auto-advance if fully matches
      if (val === targetWord) {
        // Correct Word!
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        if (nextCombo > maxCombo) setMaxCombo(nextCombo);
        
        synthSound('correct');
        setScore((prev) => prev + 1);
        setCorrectKeypresses((prev) => prev + targetJamos.length);
        
        // Mode specific bonuses
        if (selectedMode?.id === 'speed') {
          setTimeLeft((prev) => Math.min(prev + 2, 30));
        }

        // Advance or Finish
        setTimeout(() => {
          setInputVal('');
          setWordTimeLeft(selectedMode?.wordTimer || 7);
          
          if (selectedMode?.id === 'daily' && currentWordIdx === 9) {
            // Daily challenge finishes after 10 words
            finishGame();
          } else if (currentWordIdx >= words.length - 1) {
            // All words cleared! Let's shuffle again or finish if it's sentence mode
            if (selectedMode?.id === 'sentence') {
              finishGame();
            } else {
              // Reshuffle and continue
              const reshuffled = [...words].sort(() => Math.random() - 0.5);
              setWords(reshuffled);
              setCurrentWordIdx(0);
            }
          } else {
            setCurrentWordIdx((prev) => prev + 1);
          }
        }, 150);
      }
    }
  };

  // Skip current word (Manual option or on Enter mismatch for survival)
  const skipWord = () => {
    setInputVal('');
    setWordTimeLeft(selectedMode?.wordTimer || 7);
    setCombo(0);
    setShowImeWarning(false);
    
    if (selectedMode?.id === 'survival') {
      setLives((curr) => {
        if (curr <= 1) {
          finishGame();
          return 0;
        }
        return curr - 1;
      });
    }

    if (currentWordIdx >= words.length - 1) {
      if (selectedMode?.id === 'sentence' || selectedMode?.id === 'daily') {
        finishGame();
      } else {
        const reshuffled = [...words].sort(() => Math.random() - 0.5);
        setWords(reshuffled);
        setCurrentWordIdx(0);
      }
    } else {
      setCurrentWordIdx((prev) => prev + 1);
    }
    inputRef.current?.focus();
  };

  // Metrics calculations for Result Screen
  const timeSpentSec = timeSpent > 0 ? timeSpent : 1;
  const rawWPM = Math.round((correctKeypresses / 5) / (timeSpentSec / 60));
  const calculatedAccuracy = Math.round(
    (correctKeypresses + typoCount) > 0 
      ? (correctKeypresses / (correctKeypresses + typoCount)) * 100 
      : 100
  );

  // Earned XP
  const xpReward = selectedMode 
    ? Math.round(score * selectedMode.xpPerWord * (calculatedAccuracy / 100))
    : 0;

  // Save rewards and Highscores to Local Storage
  const handleSaveResult = () => {
    if (!selectedMode) return;
    
    // Save XP
    const newXP = totalXP + xpReward;
    localStorage.setItem(`tsuha_hangul_xp_${userId}`, newXP.toString());
    setTotalXP(newXP);

    // Save typing score (WPM)
    const storedWpm = localStorage.getItem(`tsuha_hangul_typing_wpm_${userId}`);
    const parsedWpm = storedWpm ? parseInt(storedWpm, 10) : 0;
    const prevWpm = isNaN(parsedWpm) ? 0 : parsedWpm;
    if (rawWPM > prevWpm) {
      localStorage.setItem(`tsuha_hangul_typing_wpm_${userId}`, rawWPM.toString());
    }
  };

  useEffect(() => {
    if (gameState === 'result') {
      handleSaveResult();
      if (calculatedAccuracy === 100 && score > 0) {
        setPerfectConfetti(true);
      }
    }
  }, [gameState]);

  // Navigation handlers
  const backToMenu = () => {
    setGameState('menu');
    setSelectedMode(null);
  };

  const handleRetry = () => {
    if (selectedMode) {
      startGame(selectedMode);
    }
  };

  // Visual text cursor render helper
  const renderWordCharacters = () => {
    return targetWord.split('').map((char, index) => {
      const range = characterRanges[index];
      let charClass = 'text-gray-400 border-b-2 border-transparent';
      let isCurrent = false;

      if (inputJamos.length <= range.start) {
        // Untyped
        charClass = 'text-gray-300';
        if (inputJamos.length === range.start) {
          isCurrent = true;
        }
      } else if (inputJamos.length > range.start && inputJamos.length < range.end) {
        // Typing/Composing
        isCurrent = true;
        const subInput = inputJamos.slice(range.start, inputJamos.length);
        const subTarget = targetJamos.slice(range.start, inputJamos.length);
        const isMatch = subInput.every((jamo, idx) => jamo === subTarget[idx]);
        
        charClass = isMatch 
          ? 'text-pink-500 bg-pink-50 rounded-lg px-0.5 border-b-2 border-pink-400 font-extrabold' 
          : 'text-rose-500 bg-rose-50 rounded-lg px-0.5 border-b-2 border-rose-400 font-extrabold animate-shake';
      } else {
        // Typed (length >= range.end)
        const subInput = inputJamos.slice(range.start, range.end);
        const subTarget = targetJamos.slice(range.start, range.end);
        const isMatch = subInput.every((jamo, idx) => jamo === subTarget[idx]);
        
        charClass = isMatch 
          ? 'text-emerald-500 font-extrabold' 
          : 'text-rose-500 font-extrabold border-b-2 border-rose-300 bg-rose-50 px-0.5 rounded-lg';
      }

      return (
        <span key={index} className={`relative mx-0.5 text-4xl sm:text-5xl transition-all duration-150 inline-block font-sans ${charClass}`}>
          {char}
          {isCurrent && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full animate-pulse" />
          )}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto pt-8 px-4 font-sans select-none relative">
      
      {/* ------------------------------------------------------------- */}
      {/* PURE CSS STYLES FOR ANIMATIONS & CONFETTI */}
      {/* ------------------------------------------------------------- */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.25s ease-in-out;
        }
        @keyframes drift {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(350px) rotate(360deg); opacity: 0; }
        }
        .confetti-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: drift 3s linear forwards;
        }
      `}</style>

      {/* CONFETTI RENDER (PURE CSS PARTICLES FOR ZERO DEPENDENCIES) */}
      {perfectConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
          {Array.from({ length: 40 }).map((_, idx) => {
            const randomLeft = Math.random() * 100; // %
            const randomDelay = Math.random() * 2.5; // s
            const randomDuration = 2 + Math.random() * 2; // s
            const colors = ['bg-pink-400', 'bg-yellow-400', 'bg-sky-400', 'bg-emerald-400', 'bg-violet-400'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div 
                key={idx}
                className={`confetti-particle ${randomColor}`}
                style={{
                  left: `${randomLeft}%`,
                  animationDelay: `${randomDelay}s`,
                  animationDuration: `${randomDuration}s`
                }}
              />
            );
          })}
        </div>
      )}

      {/* AUDIO MUTE TOGGLE AT TOP RIGHT */}
      {gameState !== 'menu' && (
        <div className="absolute top-2 right-4 z-40 animate-in fade-in duration-300">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-pink-500 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <FaVolumeXmark className="w-4 h-4" /> : <FaVolumeHigh className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 1: MODE SELECTOR / MENU */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'menu' && (
        <div className="animate-in fade-in duration-300">
          {/* Back button */}
          <Link 
            href="/quiz-games"
            className="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" /> Kembali ke Hub
          </Link>

          {/* Heading info */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-100/30 to-rose-50/10 rounded-bl-full -mr-12 -mt-12 opacity-60 pointer-events-none"></div>
            <div className="relative z-10 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                <span className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shadow-sm">
                  <FaKeyboard className="w-5 h-5" />
                </span>
                Typing Challenge Hangul
              </h1>
              <p className="mt-2 text-gray-500 text-sm font-semibold max-w-lg">
                Uji dan tingkatkan kecepatan membaca kata Korea serta kelincahan jari Anda mengetik layout keyboard Korea (Dubeolsik) dengan interaktif!
              </p>
            </div>
            {totalXP > 0 && (
              <div className="bg-pink-50/60 border border-pink-200/30 p-4 rounded-2xl flex items-center gap-3 shrink-0 relative z-10 shadow-inner">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow">
                  <FaBolt className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase">Total XP Anda</p>
                  <p className="text-sm font-black text-gray-800 leading-none mt-0.5">{totalXP} XP</p>
                </div>
              </div>
            )}
          </div>

          {/* Modes Grid */}
          <h2 className="text-lg font-black text-gray-800 mb-4 px-1">Pilih Mode Permainan:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => startGame(mode)}
                className="bg-white border border-gray-100 hover:border-pink-200 p-5 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 text-left flex items-start gap-4 cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-2xl ${mode.iconBg} flex items-center justify-center shrink-0 shadow-inner text-xl font-bold group-hover:scale-105 transition-transform`}>
                  {mode.id === 'beginner' && '🌱'}
                  {mode.id === 'vocab' && '📖'}
                  {mode.id === 'sentence' && '✍️'}
                  {mode.id === 'speed' && '⚡'}
                  {mode.id === 'survival' && '❤️'}
                  {mode.id === 'daily' && '🎁'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-gray-900 group-hover:text-pink-600 transition-colors">
                      {mode.name}
                    </h3>
                    {mode.doubleXP && (
                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded border border-emerald-200">
                        Double XP
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-400 mt-1 leading-relaxed">
                    {mode.description}
                  </p>
                  <div className="flex gap-4 mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    <span>⏱️ {mode.id === 'survival' ? '7s / kata' : `${mode.defaultTimer}s`}</span>
                    <span>⭐ +{mode.xpPerWord} XP / kata</span>
                    <span>{mode.hasLives ? '❤️ 3 Nyawa' : '🧘 Tanpa Batas Nyawa'}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 2: GAMEPLAY ACTIVE */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'playing' && selectedMode && (
        <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Visual gradient accent */}
          <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${selectedMode.gradient}`} />

          {/* Top Section Stats */}
          <div className="flex flex-row justify-between items-center gap-4 mb-6 border-b border-gray-50 pb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={backToMenu}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                title="Keluar"
              >
                <FaArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-left">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase">Mode</span>
                <h4 className="text-xs font-black text-gray-800 leading-none">{selectedMode.name}</h4>
              </div>
            </div>

            {/* Timer Display */}
            <div className="flex-1 max-w-[120px] sm:max-w-[200px] text-center">
              {selectedMode.id === 'survival' ? (
                // Word level countdown for survival mode
                <div className="flex flex-col items-center">
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <FaHeart 
                        key={idx} 
                        className={`w-4 h-4 transition-all duration-300 ${
                          idx < lives ? 'text-red-500 scale-100' : 'text-gray-200 scale-90'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-red-500 h-full transition-all duration-1000"
                      style={{ width: `${(wordTimeLeft / 7) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-red-600 mt-1">{wordTimeLeft} detik tersisa</span>
                </div>
              ) : (
                // Total timed countdown
                <div className="w-full bg-gray-50 rounded-2xl py-1 px-3 border border-gray-100 flex items-center justify-center gap-1.5">
                  <span className="text-sm font-black text-gray-700">{timeLeft}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">detik</span>
                  <div className="w-12 bg-gray-200 h-1 rounded-full overflow-hidden ml-2 hidden sm:block">
                    <div 
                      className="bg-pink-500 h-full transition-all duration-1000"
                      style={{ width: `${(timeLeft / selectedMode.defaultTimer) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Score & Combo */}
            <div className="flex items-center gap-3">
              {combo > 1 && (
                <span className="bg-pink-50 text-pink-600 text-xs font-black px-2 py-1 rounded-full animate-bounce">
                  ⚡ {combo} Combo
                </span>
              )}
              <div className="text-right">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase">Skor Kata</span>
                <p className="text-base font-black text-gray-800 leading-none mt-0.5">{score}</p>
              </div>
            </div>
          </div>

          {/* Middle Section Question Display */}
          <div className="text-center py-6 sm:py-8 bg-gray-50/50 border border-dashed border-gray-100 rounded-2xl relative overflow-hidden mb-6">
            
            {/* Pronunciation & Meaning Hints */}
            <div className="flex justify-center gap-3 mb-3 text-xs font-extrabold">
              <span className="px-2.5 py-1 bg-white border border-gray-100 text-gray-500 rounded-full shadow-xs">
                Pronun: <span className="text-pink-500 italic">{words[currentWordIdx]?.romanization}</span>
              </span>
              <span className="px-2.5 py-1 bg-white border border-gray-100 text-gray-500 rounded-full shadow-xs">
                Arti: <span className="text-gray-700">{words[currentWordIdx]?.translation}</span>
              </span>
            </div>

            {/* Word Display with styled components */}
            <div className={`my-4 flex items-center justify-center gap-0.5 select-text tracking-wide ${shake ? 'animate-shake' : ''}`}>
              {renderWordCharacters()}
            </div>

            {/* Progress Indicator */}
            <p className="text-[10px] text-gray-400 font-extrabold mt-3 uppercase tracking-wider">
              {selectedMode.id === 'daily' ? `Kata ${currentWordIdx + 1} dari 10` : `Kosakata ke-${currentWordIdx + 1}`}
            </p>
          </div>

          {/* Bottom Section Typing Area */}
          <div className="max-w-md mx-auto mb-8 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              maxLength={Math.max(targetWord.length + 10, 30)}
              className={`w-full py-4 px-6 border bg-[#FAFAFA] rounded-2xl font-sans text-xl font-bold text-center tracking-widest text-gray-800 placeholder-gray-300 focus:outline-none focus:bg-white transition-all shadow-inner ${
                shake 
                  ? 'border-rose-400 ring-4 ring-rose-100/50' 
                  : 'border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100/50'
              }`}
              placeholder="Ketik Hangul di sini..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {inputVal && (
              <button
                onClick={skipWord}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Lewati (Skip)
              </button>
            )}
            {showImeWarning && (
              <div className="mt-3 text-center text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 py-2.5 px-4 rounded-2xl animate-in fade-in duration-200">
                ⚠️ Kamu mengetik huruf Latin. Harap aktifkan/pilih <strong>Keyboard Korea (Hangul)</strong> di sistem OS/HP kamu terlebih dahulu!
              </div>
            )}
          </div>

          {/* Keyboard Layout Helper */}
          {keyboardHelperActive && (
            <div className="border-t border-gray-50 pt-5 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-3 px-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <FaRegLightbulb className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> Petunjuk Keyboard Hangul
                </span>
                <button
                  onClick={() => setKeyboardHelperActive(false)}
                  className="text-[9px] font-bold text-gray-400 hover:text-pink-500 transition-colors"
                >
                  Sembunyikan
                </button>
              </div>

              {/* Layout Keyboard Standard */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-2.5 sm:p-4 space-y-1.5 max-w-xl mx-auto">
                
                {/* Keyboard Rows */}
                {[1, 2, 3].map((rowNum) => (
                  <div key={rowNum} className="flex justify-center gap-1 sm:gap-1.5">
                    {keyboardLayout
                      .filter((key) => key.row === rowNum)
                      .map((key) => {
                        const isNextBaseKey = nextKeyInfo?.eng === key.eng;
                        const isHighlight = isNextBaseKey;
                        const isShiftRequired = nextKeyInfo?.shift === true;
                        
                        return (
                          <div
                            key={key.eng}
                            className={`h-9 w-7 sm:h-12 sm:w-10 rounded-lg flex flex-col justify-between p-0.5 sm:p-1.5 border text-center transition-all ${
                              isHighlight
                                ? 'bg-pink-500 text-white border-pink-600 scale-105 animate-pulse shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 shadow-xs text-xs font-semibold'
                            }`}
                          >
                            <span className={`text-[8px] sm:text-[9px] block text-left ${isHighlight ? 'text-pink-100' : 'text-gray-300'}`}>
                              {key.eng}
                            </span>
                            <span className="text-xs sm:text-base font-extrabold leading-none pb-0.5">
                              {isShiftRequired && isHighlight && key.koShift ? key.koShift : key.ko}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ))}

                {/* Bottom Row Helper (Shift and Space indicators) */}
                <div className="flex justify-center gap-1.5 mt-2">
                  <div 
                    className={`h-9 sm:h-11 px-3 rounded-lg flex items-center justify-center border text-[9px] font-black transition-all ${
                      nextKeyInfo?.shift
                        ? 'bg-pink-500 text-white border-pink-600 animate-pulse shadow'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    SHIFT
                  </div>
                  <div 
                    className={`h-9 sm:h-11 w-32 sm:w-48 rounded-lg flex items-center justify-center border text-[9px] font-bold transition-all ${
                      nextJamoToType === ' '
                        ? 'bg-pink-500 text-white border-pink-600 animate-pulse shadow'
                        : 'bg-white text-gray-300 border-gray-200'
                    }`}
                  >
                    SPACEBAR
                  </div>
                </div>

              </div>
            </div>
          )}

          {!keyboardHelperActive && (
            <div className="text-center pt-2">
              <button
                onClick={() => setKeyboardHelperActive(true)}
                className="text-[10px] font-bold text-pink-500 hover:text-pink-600 hover:underline transition-all"
              >
                Tampilkan petunjuk keyboard visual
              </button>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 3: RESULT / SUMMARY */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'result' && selectedMode && (
        <div className="max-w-md mx-auto text-center py-10 px-6 bg-white border border-gray-100 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
          
          {/* Card background styling */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-pink-100/40 to-rose-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>

          <div className="relative z-10">
            
            {/* Visual Trophy */}
            <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-pink-500/25">
              <FaTrophy className="w-10 h-10 animate-bounce duration-1000" />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">
              {calculatedAccuracy === 100 ? 'Sempurna! 🌟' : 'Kerja Bagus! 🎉'}
            </h2>
            <p className="text-gray-500 text-xs font-semibold mb-6">
              Sesi mengetik mode <span className="text-pink-600 font-extrabold">{selectedMode.name}</span> selesai.
            </p>

            {/* Performance Metrics Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-pink-50/60 border border-pink-200/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-lg block mb-1">⚡</span>
                <span className="text-2xl font-black text-pink-700 block">{rawWPM}</span>
                <span className="text-[9px] font-black text-pink-500 uppercase tracking-wide">WPM (Kecepatan)</span>
              </div>

              <div className="bg-amber-50/60 border border-amber-200/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-lg block mb-1">🎯</span>
                <span className="text-2xl font-black text-amber-700 block">{calculatedAccuracy}%</span>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-wide">Akurasi</span>
              </div>

              <div className="bg-violet-50/60 border border-violet-200/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-lg block mb-1">🔥</span>
                <span className="text-2xl font-black text-violet-700 block">{maxCombo}</span>
                <span className="text-[9px] font-black text-violet-500 uppercase tracking-wide">Kombo Max</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-lg block mb-1">🎁</span>
                <span className="text-2xl font-black text-emerald-700 block">+{xpReward}</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wide">Energi XP</span>
              </div>
            </div>

            {/* Motivational message */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6">
              <p className="text-xs font-bold text-gray-500 leading-relaxed">
                {rawWPM >= 40 
                  ? 'Luar biasa! Jari-jarimu menari dengan indah di keyboard Hangul. Terus tingkatkan rekor WPM-mu!' 
                  : rawWPM >= 20
                  ? 'Kecepatan mengetikmu sudah cukup bagus! Ayo biasakan letak tombol keyboard agar bisa mengetik lebih cepat lagi.'
                  : 'Bagus untuk pemula! Ulangi terus untuk melatih refleks memori jari-jarimu mengetik huruf Hangul.'}
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
              >
                <FaRotateLeft className="w-3.5 h-3.5" /> Main Lagi
              </button>
              <button
                onClick={backToMenu}
                className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-200 hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Kembali ke Menu
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
