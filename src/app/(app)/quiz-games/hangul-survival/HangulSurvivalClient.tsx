'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaGamepad, FaHeart, FaTrophy, FaArrowLeft, FaRotateLeft, 
  FaVolumeHigh, FaVolumeXmark, FaBolt, FaKeyboard, FaShieldHalved, FaSkull
} from 'react-icons/fa6';
import { saveGameScore } from '../actions';

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

function assembleJamos(jamos: string[]): string {
  const CHOSEONG_MAP: Record<string, number> = {};
  CHOSEONG.forEach((char, idx) => {
    CHOSEONG_MAP[char] = idx;
  });

  const JUNGSEONG_MAP: Record<string, number> = {};
  JUNGSEONG.forEach((char, idx) => {
    JUNGSEONG_MAP[char] = idx;
  });

  const JONGSEONG_MAP: Record<string, number> = {};
  JONGSEONG.forEach((char, idx) => {
    if (char) JONGSEONG_MAP[char] = idx;
  });

  const VOWEL_COMBINATIONS: Record<string, string> = {
    'ㅗㅏ': 'ㅘ',
    'ㅗㅐ': 'ㅙ',
    'ㅗㅣ': 'ㅚ',
    'ㅜㅓ': 'ㅝ',
    'ㅜㅔ': 'ㅞ',
    'ㅜㅣ': 'ㅟ',
    'ㅡㅣ': 'ㅢ'
  };

  const JONG_COMBINATIONS: Record<string, string> = {
    'ㄱㅅ': 'ㄳ',
    'ㄴㅈ': 'ㄵ',
    'ㄴㅎ': 'ㄶ',
    'ㄹㄱ': 'ㄺ',
    'ㄹㅁ': 'ㄻ',
    'ㄹㅂ': 'ㄼ',
    'ㄹㅅ': 'ㄽ',
    'ㄹㅌ': 'ㄾ',
    'ㄹㅍ': 'ㄿ',
    'ㄹㅎ': 'ㅀ',
    'ㅂㅅ': 'ㅄ'
  };

  let result = '';
  let i = 0;
  
  while (i < jamos.length) {
    const C = jamos[i];
    
    // Check if C is a valid choseong consonant
    if (CHOSEONG_MAP[C] === undefined) {
      result += C;
      i++;
      continue;
    }
    
    // Check if next is a vowel
    const V1 = jamos[i + 1];
    if (!V1 || JUNGSEONG_MAP[V1] === undefined) {
      result += C;
      i++;
      continue;
    }
    
    // We have a core syllable: C + V1
    let V = V1;
    let nextIdx = i + 2;
    
    // Check for compound vowel
    const V2 = jamos[i + 2];
    if (V2 && JUNGSEONG_MAP[V2] !== undefined) {
      const combinedV = VOWEL_COMBINATIONS[V + V2];
      if (combinedV) {
        V = combinedV;
        nextIdx = i + 3;
      }
    }
    
    // Check if there is a consonant that can be jongseong
    const J1 = jamos[nextIdx];
    if (J1 && JONGSEONG_MAP[J1] !== undefined) {
      // Is J1 followed by a vowel? If so, J1 is pulled to the next syllable as choseong
      const nextJamo = jamos[nextIdx + 1];
      if (nextJamo && JUNGSEONG_MAP[nextJamo] !== undefined) {
        // No jongseong for this syllable
        const charCode = 0xAC00 + (CHOSEONG_MAP[C] * 588) + (JUNGSEONG_MAP[V] * 28) + 0;
        result += String.fromCharCode(charCode);
        i = nextIdx;
        continue;
      }
      
      // J1 can be jongseong. Can it combine with J2 to form a compound jongseong?
      const J2 = jamos[nextIdx + 1];
      if (J2 && JONGSEONG_MAP[J2] !== undefined) {
        const combinedJ = JONG_COMBINATIONS[J1 + J2];
        if (combinedJ) {
          // Check if J2 is followed by a vowel
          const postJ2 = jamos[nextIdx + 2];
          if (postJ2 && JUNGSEONG_MAP[postJ2] !== undefined) {
            // J2 is pulled to the next syllable, so current syllable only has single jongseong J1
            const charCode = 0xAC00 + (CHOSEONG_MAP[C] * 588) + (JUNGSEONG_MAP[V] * 28) + JONGSEONG_MAP[J1];
            result += String.fromCharCode(charCode);
            i = nextIdx + 1; // start next syllable at J2
            continue;
          } else {
            // Compound jongseong is valid
            const charCode = 0xAC00 + (CHOSEONG_MAP[C] * 588) + (JUNGSEONG_MAP[V] * 28) + JONGSEONG_MAP[combinedJ];
            result += String.fromCharCode(charCode);
            i = nextIdx + 2;
            continue;
          }
        }
      }
      
      // Single jongseong J1 is valid
      const charCode = 0xAC00 + (CHOSEONG_MAP[C] * 588) + (JUNGSEONG_MAP[V] * 28) + JONGSEONG_MAP[J1];
      result += String.fromCharCode(charCode);
      i = nextIdx + 1;
    } else {
      // No jongseong
      const charCode = 0xAC00 + (CHOSEONG_MAP[C] * 588) + (JUNGSEONG_MAP[V] * 28) + 0;
      result += String.fromCharCode(charCode);
      i = nextIdx;
    }
  }
  
  return result;
}

// -------------------------------------------------------------
// WORD POOLS & ENEMY DEFINITIONS
// -------------------------------------------------------------
interface WordItem {
  word: string;
  romanization: string;
  translation: string;
}

const beginnerWords: WordItem[] = [
  { word: '집', romanization: 'jib', translation: 'Rumah' },
  { word: '밥', romanization: 'bab', translation: 'Nasi / Makanan' },
  { word: '물', romanization: 'mul', translation: 'Air' },
  { word: '책', romanization: 'chaek', translation: 'Buku' },
  { word: '빵', romanization: 'ppang', translation: 'Roti' },
  { word: '꽃', romanization: 'kkot', translation: 'Bunga' },
  { word: '달', romanization: 'dal', translation: 'Bulan' },
  { word: '해', romanization: 'hae', translation: 'Matahari' },
  { word: '별', romanization: 'byeol', translation: 'Bintang' },
  { word: '눈', romanization: 'nun', translation: 'Mata / Salju' },
  { word: '입', romanization: 'ib', translation: 'Mulut' },
  { word: '귀', romanization: 'gwi', translation: 'Telinga' },
  { word: '손', romanization: 'son', translation: 'Tangan' },
  { word: '발', romanization: 'bal', translation: 'Kaki' },
  { word: '숲', romanization: 'sup', translation: 'Hutan' },
  { word: '강', romanization: 'gang', translation: 'Sungai' },
  { word: '산', romanization: 'san', translation: 'Gunung' },
  { word: '새', romanization: 'sae', translation: 'Burung' }
];

const vocabularyWords: WordItem[] = [
  { word: '학교', romanization: 'hakgyo', translation: 'Sekolah' },
  { word: '친구', romanization: 'chingu', translation: 'Teman' },
  { word: '고양이', romanization: 'goyangi', translation: 'Kucing' },
  { word: '강아지', romanization: 'gangaji', translation: 'Anjing' },
  { word: '사랑', romanization: 'sarang', translation: 'Cinta' },
  { word: '하늘', romanization: 'haneul', translation: 'Langit' },
  { word: '바다', romanization: 'bada', translation: 'Laut' },
  { word: '커피', romanization: 'kopi', translation: 'Kopi' },
  { word: '우유', romanization: 'uyu', translation: 'Susu' },
  { word: '선생님', romanization: 'seonseangnim', translation: 'Guru' },
  { word: '학생', romanization: 'hakseang', translation: 'Siswa' },
  { word: '음식', romanization: 'eumsik', translation: 'Makanan' },
  { word: '한국어', romanization: 'hangugo', translation: 'Bahasa Korea' },
  { word: '노래', romanization: 'norae', translation: 'Lagu' },
  { word: '영화', romanization: 'yeonghwa', translation: 'Film' },
  { word: '사과', romanization: 'sagwa', translation: 'Apel' },
  { word: '가족', romanization: 'gajok', translation: 'Keluarga' }
];

const sentenceWords: WordItem[] = [
  { word: '안녕하세요', romanization: 'annyeonghaseyo', translation: 'Halo / Apa kabar' },
  { word: '감사합니다', romanization: 'gamsahabnida', translation: 'Terima kasih' },
  { word: '사랑해요', romanization: 'saranghaeyo', translation: 'Aku mencintaimu' },
  { word: '날씨가 좋아요', romanization: 'nalssiga johayo', translation: 'Cuacanya bagus' },
  { word: '밥을 먹었어요', romanization: 'babeul meogeosseoyo', translation: 'Sudah makan nasi' },
  { word: '이름이 뭐예요', romanization: 'ireumi mwoyeyo', translation: 'Siapa namamu?' },
  { word: '만na서 반가워요', romanization: 'mannaso bangawoyo', translation: 'Senang bertemu denganmu' },
  { word: '한국어를 공부해요', romanization: 'hangugoreul gongbuhaeyo', translation: 'Belajar bahasa Korea' },
  { word: '어디에 가요', romanization: 'eodie gayo', translation: 'Pergi ke mana?' },
  { word: '지금 몇 시예요', romanization: 'jigeum myeot siyeyo', translation: 'Sekarang jam berapa?' }
];

const enemyTemplates = [
  { emoji: '🥊', name: 'Tinju Terbang', color: 'from-red-400 to-rose-600', action: 'dodge' },
  { emoji: '🌶️', name: 'Cabai Pedas', color: 'from-orange-400 to-red-500', action: 'jump' },
  { emoji: '📝', name: 'Kertas Ujian', color: 'from-amber-400 to-yellow-600', action: 'block' },
  { emoji: '🦠', name: 'Slime Lucu', color: 'from-emerald-400 to-green-600', action: 'attack' },
  { emoji: '😡', name: 'Emoji Marah', color: 'from-pink-400 to-purple-600', action: 'attack' }
];

interface ModeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  textColor: string;
  gradient: string;
  xpPerWord: number;
  spawnSpeedMs: number;
  initialSpeed: number; // speed across screen in seconds
  targetWords?: number; // target words to clear to win
}

const gameModes: ModeConfig[] = [
  {
    id: 'beginner',
    name: 'Beginner Survival',
    description: 'Mengetik suku kata dasar dengan musuh bergerak lambat.',
    icon: '🌱',
    iconBg: 'bg-pink-100 text-pink-600 border border-pink-200/50',
    textColor: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-500',
    xpPerWord: 5,
    spawnSpeedMs: 5000,
    initialSpeed: 9.0,
    targetWords: 15
  },
  {
    id: 'vocab',
    name: 'Vocabulary Survival',
    description: 'Gunakan kosakata bahasa Korea umum. Kecepatan meningkat.',
    icon: '📖',
    iconBg: 'bg-amber-100 text-amber-600 border border-amber-200/50',
    textColor: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-500',
    xpPerWord: 10,
    spawnSpeedMs: 4000,
    initialSpeed: 7.5,
    targetWords: 20
  },
  {
    id: 'sentence',
    name: 'Sentence Survival',
    description: 'Kalimat pendek dengan spasi. Menuntut fokus tinggi!',
    icon: '✍️',
    iconBg: 'bg-violet-100 text-violet-600 border border-violet-200/50',
    textColor: 'text-violet-600',
    gradient: 'from-violet-500 to-fuchsia-500',
    xpPerWord: 20,
    spawnSpeedMs: 5500,
    initialSpeed: 10.0,
    targetWords: 10
  },
  {
    id: 'speed',
    name: 'Speed Survival',
    description: 'Refleks kilat! Musuh menyerang dengan sangat cepat!',
    icon: '⚡',
    iconBg: 'bg-sky-100 text-sky-600 border border-sky-200/50',
    textColor: 'text-sky-600',
    gradient: 'from-sky-500 to-blue-500',
    xpPerWord: 15,
    spawnSpeedMs: 2500,
    initialSpeed: 5.0,
    targetWords: 25
  },
  {
    id: 'boss',
    name: 'Boss Battle Mode',
    description: 'Kalahkan Raja Slime Raksasa dengan mengetik beruntun!',
    icon: '👾',
    iconBg: 'bg-red-100 text-red-600 border border-red-200/50',
    textColor: 'text-red-600',
    gradient: 'from-red-500 to-purple-600',
    xpPerWord: 30,
    spawnSpeedMs: 5000,
    initialSpeed: 8.0
  }
];

// Standard Keyboard layout
interface KeyboardKey {
  eng: string;
  ko: string;
  koShift?: string;
  row: number;
}

const keyboardLayout: KeyboardKey[] = [
  { eng: 'Q', ko: 'ㅂ', koShift: 'ㅃ', row: 1 },
  { eng: 'W', ko: 'ㅈ', koShift: 'ㅉ', row: 1 },
  { eng: 'E', ko: 'ㄷ', koShift: 'ㄸ', row: 1 },
  { eng: 'R', ko: 'ㄱ', koShift: 'ㄲ', row: 1 },
  { eng: 'T', ko: 'ㅅ', koShift: 'ㅆ', row: 1 },
  { eng: 'Y', ko: 'ㅛ', row: 1 },
  { eng: 'O', ko: 'ㅐ', koShift: 'ㅒ', row: 1 },
  { eng: 'P', ko: 'ㅔ', koShift: 'ㅖ', row: 1 },
  { eng: 'U', ko: 'ㅕ', row: 1 },
  { eng: 'I', ko: 'ㅑ', row: 1 },
  
  { eng: 'A', ko: 'ㅁ', row: 2 },
  { eng: 'S', ko: 'ㄴ', row: 2 },
  { eng: 'D', ko: 'ㅇ', row: 2 },
  { eng: 'F', ko: 'ㄹ', row: 2 },
  { eng: 'G', ko: 'ㅎ', row: 2 },
  { eng: 'H', ko: 'ㅗ', row: 2 },
  { eng: 'J', ko: 'ㅓ', row: 2 },
  { eng: 'K', ko: 'ㅏ', row: 2 },
  { eng: 'L', ko: 'ㅣ', row: 2 },
  
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
    if (key.ko === jamo) return { eng: key.eng, shift: false };
    if (key.koShift === jamo) return { eng: key.eng, shift: true };
  }
  return null;
}

// -------------------------------------------------------------
// GAME STATE INTERFACES
// -------------------------------------------------------------
interface ActiveEnemy {
  id: string;
  word: string;
  romanization: string;
  translation: string;
  emoji: string;
  color: string;
  action: string;
  x: number; // 0 to 100 representing % from left
  speed: number; // % progress per frame
  isDefeated: boolean;
  isAttacking: boolean;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  emoji?: string;
  size: number;
  alpha: number;
}

interface VisualLog {
  id: string;
  text: string;
  type: 'correct' | 'wrong' | 'combo';
  x: number;
  y: number;
}

interface HangulSurvivalClientProps {
  userId: string;
  userName: string;
  initialTotalXP: number;
  initialMaxScore: number;
  hasScoresInDb: boolean;
}

let audioCtx: AudioContext | null = null;

export default function HangulSurvivalClient({
  userId,
  userName,
  initialTotalXP,
  initialMaxScore,
  hasScoresInDb
}: HangulSurvivalClientProps) {
  const router = useRouter();

  // General controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'menu' | 'countdown' | 'playing' | 'result'>('menu');
  const [selectedMode, setSelectedMode] = useState<ModeConfig | null>(null);

  // Gameplay values
  const [hp, setHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [wordsCleared, setWordsCleared] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [typoCount, setTypoCount] = useState<number>(0);
  const [correctKeypresses, setCorrectKeypresses] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [totalXP, setTotalXP] = useState<number>(initialTotalXP);
  const [maxScore, setMaxScore] = useState<number>(initialMaxScore);

  // Chibi Character visual states
  const [characterState, setCharacterState] = useState<'idle' | 'jump' | 'dodge' | 'hit' | 'attack'>('idle');
  const [showDangerWarning, setShowDangerWarning] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [showSlowMoEffect, setShowSlowMoEffect] = useState<boolean>(false);

  // Game Arena Entities
  const [enemies, setEnemies] = useState<ActiveEnemy[]>([]);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const [inputVal, setInputVal] = useState<string>('');
  const [showImeWarning, setShowImeWarning] = useState<boolean>(false);

  // Particles & Logs
  const [particles, setParticles] = useState<Particle[]>([]);
  const [logs, setLogs] = useState<VisualLog[]>([]);

  // Boss Battle Stats
  const [bossHp, setBossHp] = useState<number>(100);
  const [bossState, setBossState] = useState<'idle' | 'attack' | 'hit'>('idle');

  // Interactive settings
  const [countdownVal, setCountdownVal] = useState<number>(3);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const enemiesRef = useRef<ActiveEnemy[]>([]);
  const wordsClearedRef = useRef<number>(0);

  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);

  useEffect(() => {
    wordsClearedRef.current = wordsCleared;
  }, [wordsCleared]);

  // Immersive Mode: Hide global site navigation when playing on mobile
  useEffect(() => {
    if (gameState === 'playing') {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('id', 'immersive-nav-hide-style');
      styleEl.innerHTML = `
        @media (max-width: 1024px) {
          nav.sticky,
          header,
          footer,
          .fixed.bottom-0.z-50 {
            display: none !important;
          }
          /* Remove padding bottom and standard margins from main content wrappers */
          main, .min-h-screen, body, .pb-20 {
            padding-bottom: 0px !important;
          }
        }
      `;
      document.head.appendChild(styleEl);
      return () => {
        const el = document.getElementById('immersive-nav-hide-style');
        if (el) document.head.removeChild(el);
      };
    }
  }, [gameState]);

  // Play synthesized audio
  const playSound = (type: 'type' | 'correct' | 'wrong' | 'hit' | 'combo' | 'gameover' | 'victory') => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const ctx = audioCtx;
      const now = ctx.currentTime;

      if (type === 'type') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'correct') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'wrong' || type === 'hit') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'combo') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const multiplier = Math.min(combo, 15) * 40;
        osc.frequency.setValueAtTime(440 + multiplier, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'gameover') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(300, now);
        osc1.frequency.linearRampToValueAtTime(100, now + 0.6);
        osc2.frequency.setValueAtTime(150, now);
        osc2.frequency.linearRampToValueAtTime(50, now + 0.6);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } else if (type === 'victory') {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.06, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
      }
    } catch (e) {
      console.warn('Audio synthesis suspended or blocked:', e);
    }
  };

  // Trigger auto focus of input field
  const triggerFocus = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Sync profile data on init
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasScoresInDb) {
      try {
        const storedXP = localStorage.getItem(`tsuha_hangul_xp_${userId}`);
        const xp = storedXP ? parseInt(storedXP, 10) : 0;
        if (xp > 0) setTotalXP(xp);
      } catch (e) {
        console.warn('LocalStorage is blocked or unavailable:', e);
      }
    }
  }, [userId, hasScoresInDb]);

  // Inject custom CSS animations once on mount for high performance and zero styled-jsx overhead
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes shake {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 2px) rotate(-1deg); }
        20%, 40%, 60%, 80% { transform: translate(4px, -2px) rotate(1deg); }
      }
      .animate-shake {
        animation: shake 0.4s ease-in-out;
      }
      @keyframes floating {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      .animate-float {
        animation: floating 3s ease-in-out infinite;
      }
      @keyframes dangerFlash {
        0%, 100% { background-color: transparent; }
        50% { background-color: rgba(239, 68, 68, 0.15); }
      }
      .danger-pulse {
        animation: dangerFlash 1.2s infinite;
      }
      @keyframes particleAnim {
        0% { transform: translate(-50%, -50%) translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Handle countdown triggers
  useEffect(() => {
    if (gameState !== 'countdown') return;
    const interval = setInterval(() => {
      setCountdownVal((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState('playing');
          setHp(100);
          setScore(0);
          setCombo(0);
          setMaxCombo(0);
          setTimer(0);
          timerRef.current = 0;
          setTimeSpent(0);
          setTypoCount(0);
          setCorrectKeypresses(0);
          setEnemies([]);
          setParticles([]);
          setLogs([]);
          setBossHp(100);
          setWordsCleared(0);
          lastSpawnTimeRef.current = Date.now();
          triggerFocus();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Main gameplay loop
  useEffect(() => {
    if (gameState !== 'playing' || !selectedMode) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const intervalTimer = setInterval(() => {
      setTimer((prev) => {
        const next = prev + 1;
        timerRef.current = next;
        return next;
      });
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    const updateFrame = () => {
      const now = Date.now();
      const currentDifficultyMultiplier = Math.min(1.8, 1 + timerRef.current / 45); // speed increases over time

      // 1. Spawning logic
      const maxEnemiesMap: Record<string, number> = {
        beginner: 2,
        vocab: 3,
        sentence: 2,
        speed: 4,
        boss: 1
      };
      const maxEnemies = maxEnemiesMap[selectedMode.id] || 3;

      const spawnSpeed = selectedMode.id === 'speed' ? 2200 : selectedMode.spawnSpeedMs;
      
      const lastEnemy = enemiesRef.current[enemiesRef.current.length - 1];
      const minGap = selectedMode.id === 'sentence' ? 35 : 25; // minimum % distance between centers
      const hasEnoughSpace = !lastEnemy || lastEnemy.x <= (100 - minGap);

      const isTargetReached = selectedMode.id !== 'boss' && selectedMode.targetWords && wordsClearedRef.current >= selectedMode.targetWords;

      if (
        !isTargetReached &&
        enemiesRef.current.length < maxEnemies &&
        hasEnoughSpace &&
        now - lastSpawnTimeRef.current > spawnSpeed / currentDifficultyMultiplier
      ) {
        // Decide pool
        let pool = beginnerWords;
        if (selectedMode.id === 'vocab') pool = vocabularyWords;
        else if (selectedMode.id === 'sentence') pool = sentenceWords;
        else if (selectedMode.id === 'speed') pool = [...beginnerWords, ...vocabularyWords];
        else if (selectedMode.id === 'boss') pool = [...beginnerWords, ...vocabularyWords];

        const wordObj = pool[Math.floor(Math.random() * pool.length)];
        const template = enemyTemplates[Math.floor(Math.random() * enemyTemplates.length)];

        const speedMultiplierMap: Record<string, number> = {
          beginner: 0.035,
          vocab: 0.04,
          sentence: 0.03,
          speed: 0.055,
          boss: 0.035
        };
        const baseSpeedMultiplier = speedMultiplierMap[selectedMode.id] || 0.04;
        const speed = 1.5 * currentDifficultyMultiplier * baseSpeedMultiplier;

        const newEnemy: ActiveEnemy = {
          id: Math.random().toString(),
          word: wordObj.word,
          romanization: wordObj.romanization,
          translation: wordObj.translation,
          emoji: template.emoji,
          color: template.color,
          action: template.action,
          x: 100, // starts at right
          speed: speed, // speed per frame
          isDefeated: false,
          isAttacking: false
        };

        setEnemies((prev) => [...prev, newEnemy]);
        lastSpawnTimeRef.current = now;
      }

      // 2. Entity update logic
      setEnemies((prevEnemies) => {
        let reachedPlayerCount = 0;
        const updated = prevEnemies.map((enemy) => {
          if (enemy.isDefeated) return enemy;
          
          let newX = enemy.x - enemy.speed;
          
          // Collision with player (reached around 15%)
          if (newX <= 15) {
            reachedPlayerCount++;
            return { ...enemy, isDefeated: true, x: 15 };
          }

          return { ...enemy, x: newX };
        });

        if (reachedPlayerCount > 0) {
          triggerPlayerHit(reachedPlayerCount * 15);
        }

        return updated.filter((enemy) => !enemy.isDefeated);
      });

      // 3. Particles physics updates (Disabled: Particles are now purely GPU CSS-animated)

      // 4. Update visual log durations
      setLogs((prev) => prev.slice(0, 4));

      // Request next frame
      gameLoopRef.current = requestAnimationFrame(updateFrame);
    };

    gameLoopRef.current = requestAnimationFrame(updateFrame);

    return () => {
      clearInterval(intervalTimer);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, selectedMode]);

  // Set the first enemy in line as the active input target
  useEffect(() => {
    if (enemies.length > 0) {
      // Find first non-defeated enemy in line
      const firstActive = enemies.findIndex((e) => !e.isDefeated && e.x > 15);
      setActiveWordIdx(firstActive);
    } else {
      setActiveWordIdx(-1);
    }
  }, [enemies]);

  // Danger warning at low HP
  useEffect(() => {
    if (hp <= 30 && hp > 0 && gameState === 'playing') {
      setShowDangerWarning(true);
    } else {
      setShowDangerWarning(false);
    }
  }, [hp, gameState]);

  // Trigger when player is hit by an obstacle
  const triggerPlayerHit = (damage: number) => {
    setCharacterState('hit');
    playSound('hit');
    setCombo(0);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 400);
    setTimeout(() => setCharacterState('idle'), 600);

    setHp((curr) => {
      const nextHp = curr - damage;
      if (nextHp <= 0) {
        finishGame(0);
        return 0;
      }
      return nextHp;
    });
  };

  // Spawn visual feedback particle explosions
  const spawnExplosion = (xPercent: number, yPercent: number, color: string, emoji?: string) => {
    const newParticles: Particle[] = [];
    const count = emoji ? 3 : 8; // Reduced particle count for performance
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      newParticles.push({
        id: Math.random().toString(),
        x: xPercent,
        y: yPercent,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // initial upward force
        color: color,
        emoji: i === 0 ? emoji : undefined,
        size: emoji ? 20 : 5 + Math.random() * 5,
        alpha: 1
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);

    // Clean up particles from state after CSS animation finishes (650ms)
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 650);
  };

  // Add floating combat text logs
  const addVisualLog = (text: string, type: 'correct' | 'wrong' | 'combo', x: number, y: number) => {
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(), text, type, x, y }
    ]);
  };

  const startGame = (mode: ModeConfig) => {
    setSelectedMode(mode);
    setCountdownVal(3);
    setGameState('countdown');
  };

  const finishGame = (forcedHp?: number) => {
    setGameState('result');
    playSound('gameover');
    
    // Calculate final metrics
    const finalHp = forcedHp !== undefined ? forcedHp : hp;
    const finalScore = score;
    const finalAccuracy = Math.round(
      (correctKeypresses + typoCount) > 0
        ? (correctKeypresses / (correctKeypresses + typoCount)) * 100
        : 100
    );

    // Save score to database
    if (selectedMode) {
      const bonusMultiplier = finalAccuracy === 100 ? 1.5 : 1.0;
      const earnedXp = Math.round(finalScore * selectedMode.xpPerWord * bonusMultiplier);
      const newXP = totalXP + earnedXp;
      setTotalXP(newXP);
      try {
        localStorage.setItem(`tsuha_hangul_xp_${userId}`, newXP.toString());
      } catch (e) {
        console.warn('LocalStorage is blocked or unavailable:', e);
      }

      if (finalScore > maxScore) {
        setMaxScore(finalScore);
      }

      saveGameScore({
        gameSlug: 'hangul-survival',
        gameMode: selectedMode.id,
        score: finalScore,
        accuracy: finalAccuracy,
        xpEarned: earnedXp
      }).then(res => {
        if (res.error) console.error('Error saving score:', res.error);
        else console.log('Score saved successfully!');
      }).catch(err => {
        console.error('Error sending request:', err);
      });
    }
  };

  // Shared match and metrics validator
  const checkInput = (val: string): boolean => {
    if (activeWordIdx === -1) return false;
    const targetEnemy = enemies[activeWordIdx];
    if (!targetEnemy) return false;
    const targetWord = targetEnemy.word;

    // Jamos decomposition matching
    const targetJamos = decomposeStringToJamos(targetWord);
    const inputJamos = decomposeStringToJamos(val);

    let isTypo = false;
    for (let i = 0; i < inputJamos.length; i++) {
      if (inputJamos[i] !== targetJamos[i]) {
        isTypo = true;
        break;
      }
    }

    if (isTypo) {
      playSound('wrong');
      setCombo(0);
      setTypoCount((prev) => prev + 1);
      addVisualLog('Salah!', 'wrong', 25, 45);
      if (/[a-zA-Z]/.test(val)) {
        setShowImeWarning(true);
      }
      return false;
    } else {
      setShowImeWarning(false);
      
      // Auto success when word fully matches
      if (val === targetWord) {
        // Trigger action based on item
        const actionType = targetEnemy.action;
        if (actionType === 'dodge') {
          setCharacterState('dodge');
          addVisualLog('Dodge! 💨', 'correct', 15, 30);
        } else if (actionType === 'jump') {
          setCharacterState('jump');
          addVisualLog('Jump! 🦘', 'correct', 15, 20);
        } else if (actionType === 'block') {
          setCharacterState('attack'); // attack-block swing
          addVisualLog('Block! 🛡️', 'correct', 15, 30);
        } else {
          setCharacterState('attack');
          addVisualLog('Serang! 💥', 'correct', 25, 35);
        }

        // Spawn visual feedback explosion
        spawnExplosion(targetEnemy.x, 45, 'bg-pink-400', targetEnemy.emoji);
        playSound('correct');

        // Update boss state if in boss battle
        if (selectedMode?.id === 'boss') {
          setBossState('hit');
          setBossHp((prev) => {
            const nextHp = prev - 8;
            if (nextHp <= 0) {
              setTimeout(() => {
                playSound('victory');
                setGameState('result');
              }, 600);
              return 0;
            }
            return nextHp;
          });
          setTimeout(() => setBossState('idle'), 500);
        } else if (selectedMode) {
          // Increment words cleared for normal modes
          setWordsCleared((prev) => {
            const next = prev + 1;
            if (selectedMode.targetWords && next >= selectedMode.targetWords) {
              setTimeout(() => {
                playSound('victory');
                setGameState('result');
              }, 600);
            }
            return next;
          });
        }

        // Metrics calculations
        setScore((prev) => prev + (selectedMode?.id === 'boss' ? 15 : 10) + Math.floor(combo / 5));
        setCombo((prev) => {
          const next = prev + 1;
          if (next > maxCombo) setMaxCombo(next);
          if (next % 5 === 0) {
            playSound('combo');
            addVisualLog(`${next} Combo! 🔥`, 'combo', 15, 15);
          }
          return next;
        });
        setCorrectKeypresses((prev) => prev + targetJamos.length);

        // Remove defeated enemy and reset input
        setEnemies((prev) => prev.filter((_, idx) => idx !== activeWordIdx));
        setInputVal('');
        
        // Reset player posture back to idle after animation
        setTimeout(() => {
          setCharacterState('idle');
        }, 500);
        return true;
      }
      return false;
    }
  };

  // Typing Input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Sanitization & bounds
    const maxLen = 40;
    if (val.length > maxLen) val = val.slice(0, maxLen);
    val = val.replace(/[\x00-\x1F\x7F-\x9F\r\n\t]/g, '');

    setInputVal(val);
    playSound('type');
    checkInput(val);
  };

  // Keyboard layout virtual keys handler
  const handleVirtualKeyClick = (keyKo: string) => {
    if (activeWordIdx === -1) return;
    const targetEnemy = enemies[activeWordIdx];
    if (!targetEnemy) return;

    const currentJamos = decomposeStringToJamos(inputVal);
    currentJamos.push(keyKo);
    const nextVal = assembleJamos(currentJamos);

    playSound('type');
    const matched = checkInput(nextVal);
    if (!matched) {
      setInputVal(nextVal);
    }
    triggerFocus();
  };

  // Keyboard layout virtual backspace handler
  const handleVirtualBackspace = () => {
    if (inputVal.length === 0) return;
    const currentJamos = decomposeStringToJamos(inputVal);
    currentJamos.pop();
    const nextVal = assembleJamos(currentJamos);

    playSound('type');
    setInputVal(nextVal);
    checkInput(nextVal);
    triggerFocus();
  };

  // Character SVG elements
  const renderChibiPlayer = () => {
    const isDodge = characterState === 'dodge';
    const isJump = characterState === 'jump';
    const isHit = characterState === 'hit';
    const isAttack = characterState === 'attack';

    let transformClass = 'translate-y-0 scale-100';
    if (isJump) transformClass = '-translate-y-20 scale-100';
    if (isDodge) transformClass = 'translate-y-8 scale-x-110 scale-y-75';
    if (isHit) transformClass = 'translate-x-[-20px] rotate-[-12deg]';
    if (isAttack) transformClass = 'translate-x-12 scale-110';

    return (
      <div className={`relative transition-all duration-300 w-24 h-24 sm:w-28 sm:h-28 z-20 ${transformClass}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Shadow */}
          <ellipse cx="50" cy="90" rx="35" ry="8" fill="rgba(0,0,0,0.15)" />

          {/* Body/Clothes (Cute Hanbok) */}
          <path d="M30 65 L70 65 L75 88 L25 88 Z" fill="#FFB7B2" />
          <path d="M50 65 L35 88 L65 88 Z" fill="#FFC6FF" />

          {/* Arms */}
          <circle cx={isAttack ? '82' : '26'} cy="72" r="7" fill="#FFE5EC" />
          <circle cx={isAttack ? '85' : '74'} cy="72" r="7" fill="#FFE5EC" />

          {/* Head (Chibi style) */}
          <circle cx="50" cy="40" r="28" fill="#FFE5EC" />

          {/* Hair (Korean style braids/bun) */}
          <circle cx="24" cy="40" r="8" fill="#4A4E69" />
          <circle cx="76" cy="40" r="8" fill="#4A4E69" />
          <path d="M22 25 C30 14, 70 14, 78 25 C82 32, 70 30, 50 32 C30 30, 18 32, 22 25 Z" fill="#4A4E69" />

          {/* Eyes */}
          {isHit ? (
            // dizzy eyes
            <>
              <path d="M35 38 L45 46 M45 38 L35 46" stroke="#4A4E69" strokeWidth="3" strokeLinecap="round" />
              <path d="M55 38 L65 46 M65 38 L55 46" stroke="#4A4E69" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="40" cy="42" r="3.5" fill="#4A4E69" />
              <circle cx="60" cy="42" r="3.5" fill="#4A4E69" />
              {/* Eye sparkle */}
              <circle cx="39" cy="41" r="1" fill="white" />
              <circle cx="59" cy="41" r="1" fill="white" />
            </>
          )}

          {/* Mouth */}
          {isHit ? (
            <path d="M46 54 Q50 50 54 54" stroke="#4A4E69" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : isAttack ? (
            <path d="M45 52 Q50 60 55 52" fill="#FFADAD" stroke="#4A4E69" strokeWidth="1.5" />
          ) : (
            <path d="M46 52 Q50 56 54 52" stroke="#4A4E69" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Cheeks (blush) */}
          <circle cx="34" cy="48" r="3" fill="#FF8FAB" opacity="0.6" />
          <circle cx="66" cy="48" r="3" fill="#FF8FAB" opacity="0.6" />
        </svg>

        {/* Attack aura */}
        {isAttack && (
          <div className="absolute inset-0 bg-sky-400/20 border border-sky-300 rounded-full animate-ping pointer-events-none scale-150" />
        )}
      </div>
    );
  };

  // Render Boss Monster SVG
  const renderBoss = () => {
    const isHit = bossState === 'hit';
    let transformClass = 'translate-y-0 scale-100';
    if (isHit) transformClass = 'translate-x-12 scale-x-90 scale-y-110';

    return (
      <div className={`relative transition-all duration-200 sm:w-44 sm:h-44 z-20 ${transformClass} ${isPlaying ? 'w-24 h-24' : 'w-36 h-36'}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          {/* Shadow */}
          <ellipse cx="50" cy="90" rx="42" ry="8" fill="rgba(0,0,0,0.15)" />

          {/* Slime body */}
          <path d="M15 80 C10 60, 10 30, 50 15 C90 30, 90 60, 85 80 C80 88, 20 88, 15 80 Z" fill={isHit ? '#FF8FAB' : '#B3E5FC'} stroke={isHit ? '#E91E63' : '#03A9F4'} strokeWidth="3" />

          {/* Cute crowns */}
          <path d="M40 16 L50 2 L60 16 Z" fill="#FFD700" stroke="#FFA000" strokeWidth="1.5" />
          <circle cx="50" cy="2" r="2.5" fill="#FFEB3B" />

          {/* Eyes */}
          {isHit ? (
            <>
              <path d="M30 38 L42 46 M42 38 L30 46" stroke="#37474F" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M58 38 L70 46 M70 38 L58 46" stroke="#37474F" strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="38" cy="42" r="5" fill="#37474F" />
              <circle cx="62" cy="42" r="5" fill="#37474F" />
              <circle cx="36" cy="40" r="1.5" fill="white" />
              <circle cx="60" cy="40" r="1.5" fill="white" />
            </>
          )}

          {/* Mouth */}
          {isHit ? (
            <ellipse cx="50" cy="58" rx="8" ry="4" fill="#880E4F" />
          ) : (
            <path d="M45 54 Q50 62 55 54" stroke="#37474F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* Cheeks */}
          <circle cx="28" cy="50" r="4.5" fill="#FFCDD2" opacity="0.8" />
          <circle cx="72" cy="50" r="4.5" fill="#FFCDD2" opacity="0.8" />
        </svg>

        {/* HP Bar floating above Boss */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 bg-gray-200 h-2.5 rounded-full overflow-hidden border border-gray-300">
          <div 
            className="bg-red-500 h-full transition-all duration-300"
            style={{ width: `${bossHp}%` }}
          />
        </div>
      </div>
    );
  };

  // Keyboard Helper details calculation
  const getNextJamoHighlight = () => {
    if (activeWordIdx === -1) return null;
    const targetEnemy = enemies[activeWordIdx];
    if (!targetEnemy) return null;
    const targetWord = targetEnemy.word;
    const targetJamos = decomposeStringToJamos(targetWord);
    const inputJamos = decomposeStringToJamos(inputVal);
    
    // Highlight next letter in sequence
    return targetJamos[inputJamos.length] || null;
  };

  const nextJamo = getNextJamoHighlight();
  const nextKey = nextJamo ? getKeyForJamo(nextJamo) : null;

  // Final performance evaluation WPM
  const timeSpentSec = timeSpent > 0 ? timeSpent : 1;
  const wpm = Math.round((correctKeypresses / 5) / (timeSpentSec / 60));
  const accuracy = Math.round(
    (correctKeypresses + typoCount) > 0
      ? (correctKeypresses / (correctKeypresses + typoCount)) * 100
      : 100
  );
  const xpReward = selectedMode 
    ? Math.round(score * selectedMode.xpPerWord * (accuracy / 100))
    : 0;

  const isPlaying = gameState === 'playing';

  return (
    <div className={`max-w-5xl mx-auto font-sans select-none relative transition-all duration-300 ${
      isPlaying ? 'pt-2 px-2 sm:pt-4 sm:px-4 pb-4' : 'pt-8 px-4 pb-16'
    } ${screenShake ? 'animate-shake' : ''}`}>
      
      {/* ------------------------------------------------------------- */}
      {/* STYLES FOR ANIMATIONS (Injected dynamically on mount) */}
      {/* ------------------------------------------------------------- */}

      {/* AUDIO MUTE TOGGLE (Result Screen Only) */}
      {gameState === 'result' && (
        <div className="absolute top-2 right-4 z-40">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-indigo-500 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <FaVolumeXmark className="w-4 h-4" /> : <FaVolumeHigh className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 1: MENU SELECTOR */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'menu' && (
        <div className="animate-in fade-in duration-300">
          <Link 
            href="/quiz-games"
            className="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" /> Kembali ke Hub
          </Link>

          {/* Heading intro card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-100/30 to-violet-50/10 rounded-bl-full -mr-12 -mt-12 opacity-60 pointer-events-none"></div>
            <div className="relative z-10 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                  <FaShieldHalved className="w-5 h-5 animate-pulse" />
                </span>
                Hangul Survival
              </h1>
              <p className="mt-2 text-gray-500 text-sm font-semibold max-w-lg">
                Uji kecepatan refleks jemari mengetik Hangul Korea. Lakukan hindaran, serangan balik, dan bertahanlah dari rintangan musuh secepat mungkin!
              </p>
            </div>
            
            {/* Stats XP */}
            <div className="bg-indigo-50/60 border border-indigo-200/30 p-4 rounded-2xl flex items-center gap-3 shrink-0 relative z-10 shadow-inner">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow">
                <FaBolt className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-extrabold uppercase">Total XP Anda</p>
                <p className="text-sm font-black text-gray-800 leading-none mt-0.5">{totalXP} XP</p>
              </div>
            </div>
          </div>

          {/* Modes Selection Grid */}
          <h2 className="text-lg font-black text-gray-800 mb-4 px-1">Pilih Tingkat Survival:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => startGame(mode)}
                className="bg-white border border-gray-100 hover:border-indigo-200 p-5 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 text-left flex items-start gap-4 cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-2xl ${mode.iconBg} flex items-center justify-center shrink-0 shadow-inner text-xl font-bold group-hover:scale-105 transition-transform`}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {mode.name}
                    </h3>
                    <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded border border-indigo-200">
                      +{mode.xpPerWord} XP / kata
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-400 mt-1 leading-relaxed">
                    {mode.description}
                  </p>
                  <div className="flex gap-4 mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    <span>⏱️ Kecepatan: {mode.initialSpeed}s</span>
                    <span>{mode.id === 'boss' ? '👿 Boss Battle' : `🎯 Target: ${mode.targetWords} Kata`}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 2: COUNTDOWN SCREEN */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'countdown' && selectedMode && (
        <div className="max-w-md mx-auto text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-lg flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mb-4">Bersiaplah!</span>
          <h2 className="text-xl font-black text-gray-800 mb-6 uppercase">{selectedMode.name}</h2>
          <div className="w-24 h-24 rounded-full bg-indigo-500 text-white flex items-center justify-center text-5xl font-black shadow-lg shadow-indigo-500/25 animate-ping duration-1000">
            {countdownVal}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 3: ACTIVE GAMEPLAY */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'playing' && selectedMode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-start">
          
          {/* LEFT COLUMN: HUD + PLAYING ARENA */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3 sm:space-y-6">
            
            {/* TOP SECTION: HUD BAR */}
            <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-wrap justify-between items-center relative overflow-hidden transition-all duration-300 ${
              isPlaying ? 'px-3 py-1.5 sm:py-2 gap-2 text-xs mb-3' : 'px-5 py-4 gap-4 mb-6'
            }`}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setGameState('menu')}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Keluar"
                >
                  <FaArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                >
                  {isMuted ? <FaVolumeXmark className="w-4 h-4" /> : <FaVolumeHigh className="w-4 h-4 text-gray-400" />}
                </button>
                <div>
                  {!isPlaying && <span className="text-[9px] text-gray-400 font-black uppercase">Survival Mode</span>}
                  <h4 className="text-xs font-black text-gray-800 leading-none">{selectedMode.name}</h4>
                </div>
              </div>

              {/* HP Bar */}
              <div className="flex-1 max-w-[120px] sm:max-w-[220px] mx-1 sm:mx-2 text-center">
                {!isPlaying && (
                  <div className="flex items-center justify-between text-[10px] font-black text-gray-400 mb-1">
                    <span>HP KARAKTER</span>
                    <span className={hp <= 30 ? 'text-red-500 animate-pulse' : 'text-gray-600'}>{hp}/100</span>
                  </div>
                )}
                <div className="w-full bg-gray-100 rounded-full h-2.5 sm:h-3 border border-gray-200/50 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      hp <= 30 ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-400 to-green-500'
                    }`}
                    style={{ width: `${hp}%` }}
                  />
                </div>
              </div>

              {/* Score & Combo */}
              <div className="flex items-center gap-2 sm:gap-4">
                {combo > 1 && (
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full animate-bounce">
                    🔥 {combo}
                  </span>
                )}
                <div className="text-right">
                  <span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase">Skor</span>
                  <p className="text-xs sm:text-base font-black text-gray-800 leading-none mt-0.5">{score}</p>
                </div>
                {selectedMode.id !== 'boss' && selectedMode.targetWords && (
                  <div className="text-right">
                    <span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase">Target</span>
                    <p className="text-xs sm:text-base font-black text-indigo-600 leading-none mt-0.5">
                      {wordsCleared} / {selectedMode.targetWords}
                    </p>
                  </div>
                )}
                <div className="text-right">
                  <span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase">Waktu</span>
                  <p className="text-xs sm:text-base font-black text-gray-800 leading-none mt-0.5">{timer}s</p>
                </div>
              </div>
            </div>

          {/* MIDDLE SECTION: GAMEPLAY ARENA */}
          <div 
            ref={arenaRef}
            className={`relative overflow-hidden w-full rounded-3xl bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 border border-sky-300 shadow-inner z-10 transition-all duration-300 ${
              showDangerWarning ? 'danger-pulse' : ''
            } ${
              isPlaying
                ? showVirtualKeyboard 
                  ? 'h-[170px] sm:h-[240px] md:h-[350px]' 
                  : 'h-[155px] sm:h-[220px] md:h-[350px]'
                : 'h-[220px] sm:h-[280px] md:h-[350px]'
            }`}
          >
            {/* Background Cute Clouds */}
            <div className="absolute top-8 left-12 text-5xl opacity-20 select-none pointer-events-none animate-float">☁️</div>
            <div className="absolute top-16 right-20 text-6xl opacity-15 select-none pointer-events-none animate-float" style={{ animationDelay: '1.5s' }}>☁️</div>

            {/* Combat visual log notifications */}
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`absolute pointer-events-none text-xs font-black uppercase z-30 transition-all duration-500 -translate-y-4 opacity-0 animate-in fade-in slide-in-from-bottom-2 ${
                  log.type === 'correct' ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200' : 
                  log.type === 'wrong' ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200' :
                  'text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200 text-sm animate-bounce'
                }`}
                style={{ left: `${log.x}%`, top: `${log.y}%` }}
              >
                {log.text}
              </div>
            ))}

            {/* Character placement */}
            <div className={`absolute left-[8%] sm:left-[12%] transition-all duration-300 ${
              isPlaying ? 'bottom-2' : 'bottom-6'
            }`}>
              {renderChibiPlayer()}
            </div>

            {/* Boss Battle placement */}
            {selectedMode.id === 'boss' && (
              <div className={`absolute right-[8%] sm:right-[12%] transition-all duration-300 ${
                isPlaying ? 'bottom-2' : 'bottom-8'
              }`}>
                {renderBoss()}
              </div>
            )}

            {/* Particle explosions mapping (CSS-animated for high performance) */}
            {particles.map((p) => (
              <div
                key={p.id}
                className={`absolute pointer-events-none select-none z-30 ${p.color}`}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  borderRadius: p.emoji ? '0' : '50%',
                  fontSize: p.emoji ? `${p.size}px` : 'inherit',
                  transform: 'translate(-50%, -50%)',
                  animation: 'particleAnim 0.6s ease-out forwards',
                  // Pass velocity values as CSS variables for custom translation
                  '--tx': `${p.vx * 12}px`,
                  '--ty': `${p.vy * 12}px`
                } as any}
              >
                {p.emoji || ''}
              </div>
            ))}

            {/* Active Flying Enemy Obstacles */}
            {enemies.map((enemy, idx) => {
              const isActiveTarget = idx === activeWordIdx;
              
              // Decompose for coloring typed vs untyped characters
              const enemyWord = enemy.word;
              const tJamos = decomposeStringToJamos(enemyWord);
              const iJamos = decomposeStringToJamos(inputVal);

              let currentJamoIdx = 0;
              const charRanges = enemyWord.split('').map((char) => {
                const len = decomposeCharacter(char).length;
                const range = { start: currentJamoIdx, end: currentJamoIdx + len };
                currentJamoIdx += len;
                return range;
              });

              return (
                <div
                  key={enemy.id}
                  className={`absolute -translate-x-1/2 flex flex-col items-center z-20 transition-[bottom] duration-300 ${
                    isPlaying ? 'bottom-2 sm:bottom-6' : 'bottom-16'
                  } space-y-1.5 sm:space-y-3`}
                  style={{ left: `${enemy.x}%` }}
                >
                  {/* Bubble Word card (Top) */}
                  <div className={`px-2 py-1 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border bg-white shadow-lg flex flex-col items-center gap-0.5 text-center min-w-[60px] sm:min-w-[70px] ${
                    isActiveTarget ? 'ring-2 ring-indigo-400 scale-105 border-indigo-200' : 'border-gray-100'
                  }`}>
                    {/* Hangul text highlight styling */}
                    <div className="flex justify-center items-center tracking-wide">
                      {enemyWord.split('').map((char, index) => {
                        const range = charRanges[index];
                        let charClass = 'text-gray-400';

                        if (!isActiveTarget) {
                          charClass = 'text-gray-800 font-extrabold';
                        } else if (iJamos.length <= range.start) {
                          charClass = 'text-gray-400 font-extrabold';
                        } else if (iJamos.length > range.start && iJamos.length < range.end) {
                          const subInput = iJamos.slice(range.start, iJamos.length);
                          const subTarget = tJamos.slice(range.start, iJamos.length);
                          const isMatch = subInput.every((j, i) => j === subTarget[i]);
                          charClass = isMatch ? 'text-indigo-600 font-black' : 'text-rose-500 font-black';
                        } else {
                          const subInput = iJamos.slice(range.start, range.end);
                          const subTarget = tJamos.slice(range.start, range.end);
                          const isMatch = subInput.every((j, i) => j === subTarget[i]);
                          charClass = isMatch ? 'text-indigo-500 font-extrabold' : 'text-rose-500 font-extrabold';
                        }

                        return (
                          <span key={index} className={`text-xs sm:text-base font-sans leading-none ${charClass}`}>
                            {char}
                          </span>
                        );
                      })}
                    </div>

                    {/* Hint details */}
                    <span className="text-[8px] sm:text-[9px] text-gray-400 italic leading-none">{enemy.romanization}</span>
                    <span className="text-[7px] sm:text-[8px] text-indigo-500 font-bold leading-none mt-0.5">{enemy.translation}</span>
                  </div>

                  {/* Danger border (Bottom) */}
                  <div 
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${enemy.color} text-white flex items-center justify-center text-xl sm:text-3xl shadow-md border-2 ${
                      isActiveTarget 
                        ? 'border-indigo-400 ring-4 ring-indigo-200/50 scale-105 sm:scale-110 animate-pulse' 
                        : 'border-white'
                    } ${enemy.x <= 35 ? 'animate-bounce border-red-500' : ''}`}
                  >
                    {enemy.emoji}
                  </div>

                  {/* Warning line beneath active danger target */}
                  {isActiveTarget && (
                    <div className="absolute w-1 h-32 bottom-0 left-1/2 -translate-x-1/2 border-l border-dashed border-indigo-400 opacity-20 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
          
          </div>

          {/* RIGHT COLUMN: TYPING INPUT + KEYBOARD HELPER */}
          <div className={`lg:col-span-5 xl:col-span-4 transition-all duration-300 ${isPlaying ? 'space-y-3' : 'space-y-6'}`}>
            
            {/* TYPING AREA */}
            <div className={`w-full max-w-md mx-auto relative bg-white border border-gray-100 rounded-3xl shadow-sm transition-all duration-300 ${
              isPlaying ? 'p-3 sm:p-5' : 'p-6'
            }`}>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block mb-2 text-center leading-none">
              {activeWordIdx !== -1 
                ? `Ketik Hangul Kata Target: "${enemies[activeWordIdx]?.word}"` 
                : 'Menunggu target musuh...'}
            </span>

            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              inputMode={showVirtualKeyboard ? 'none' : 'text'}
              className={`w-full border bg-[#FAFAFA] rounded-2xl font-sans font-bold text-center tracking-widest text-gray-800 focus:outline-none focus:bg-white transition-all shadow-inner border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 ${
                isPlaying ? 'py-2.5 px-4 text-base sm:text-xl' : 'py-4 px-6 text-xl'
              }`}
              placeholder="Mulai mengetik Hangul..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              disabled={activeWordIdx === -1}
            />

            {showImeWarning && (
              <div className="mt-3 text-center text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 py-2 px-3 rounded-2xl animate-in fade-in duration-200">
                ⚠️ Harap aktifkan/pilih <strong>Keyboard Korea (Hangul)</strong> di sistem OS/HP kamu terlebih dahulu!
              </div>
            )}

            {/* Mobile Keyboard helper toggle */}
            <div className="flex justify-between items-center mt-2.5 sm:mt-4">
              <button
                onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <FaKeyboard className="w-3.5 h-3.5" /> 
                {showVirtualKeyboard ? 'Sembunyikan Keyboard Visual' : 'Tampilkan Keyboard Visual'}
              </button>
              
              <button
                onClick={() => setInputVal('')}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
              >
                Reset Input
              </button>
            </div>
          </div>

          {/* VIRTUAL KEYBOARD LAYOUT HELPER */}
          {showVirtualKeyboard && (
            <div className="w-full max-w-xl mx-auto animate-in fade-in duration-300">
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-3 sm:p-5 space-y-1.5 shadow-inner">
                {/* Row layout render */}
                {[1, 2, 3].map((rowNum) => (
                  <div key={rowNum} className="flex justify-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-1.5">
                    {keyboardLayout
                      .filter((k) => k.row === rowNum)
                      .map((k) => {
                        const isTargetHighlight = nextKey?.eng === k.eng;
                        const isShiftRequired = nextKey?.shift === true;
                        
                        return (
                          <button
                            key={k.eng}
                            onClick={() => handleVirtualKeyClick(isShiftRequired && k.koShift ? k.koShift : k.ko)}
                            className={`h-10 w-8 sm:h-12 sm:w-11 lg:h-11 lg:w-9 xl:h-12 xl:w-11 rounded-xl flex flex-col justify-between p-1 border text-center transition-all cursor-pointer ${
                              isTargetHighlight
                                ? 'bg-indigo-500 text-white border-indigo-600 scale-105 animate-pulse shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-xs text-xs font-semibold'
                            }`}
                          >
                            <span className={`text-[8px] block text-left leading-none ${isTargetHighlight ? 'text-indigo-100' : 'text-gray-300'}`}>
                              {k.eng}
                            </span>
                            <span className="text-xs sm:text-base font-extrabold leading-none pb-0.5">
                              {isShiftRequired && isTargetHighlight && k.koShift ? k.koShift : k.ko}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                ))}

                {/* Bottom helpers */}
                <div className="flex justify-center gap-2 mt-2">
                  <div 
                    className={`h-9 px-4 rounded-xl flex items-center justify-center border text-[9px] font-black transition-all ${
                      nextKey?.shift
                        ? 'bg-indigo-500 text-white border-indigo-600 animate-pulse shadow'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    SHIFT
                  </div>
                  <button
                    onClick={() => handleVirtualKeyClick(' ')}
                    className={`h-9 w-24 sm:w-36 lg:w-28 xl:w-36 rounded-xl flex items-center justify-center border text-[9px] font-bold transition-all cursor-pointer ${
                      nextJamo === ' '
                        ? 'bg-indigo-500 text-white border-indigo-600 animate-pulse shadow'
                        : 'bg-white text-gray-300 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    SPACEBAR
                  </button>
                  <button
                    onClick={handleVirtualBackspace}
                    className="h-9 px-4 rounded-xl flex items-center justify-center border text-[9px] font-black bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    BACKSPACE
                  </button>
                </div>
              </div>
            </div>
          )}

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 4: RESULT / STATS SCREEN */}
      {/* ------------------------------------------------------------- */}
      {gameState === 'result' && selectedMode && (
        <div className="max-w-md mx-auto text-center py-10 px-6 bg-white border border-gray-100 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-100/40 to-violet-50/10 rounded-bl-full -mr-12 -mt-12 opacity-50 z-0"></div>

          <div className="relative z-10 font-sans">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-500 text-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/25">
              <FaTrophy className="w-10 h-10 animate-bounce" />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">
              {hp > 0 ? 'Selamat! 🏆' : 'Game Over 💀'}
            </h2>
            <p className="text-gray-500 text-xs font-semibold mb-6">
              Sesi survival mode <span className="text-indigo-600 font-extrabold">{selectedMode.name}</span> selesai.
            </p>

            {/* Performance Grid metrics */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-indigo-50/60 border border-indigo-200/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-lg block mb-1">⚡</span>
                <span className="text-2xl font-black text-indigo-700 block">{score}</span>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wide">Skor Akhir</span>
              </div>

              <div className="bg-amber-50/60 border border-amber-200/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-lg block mb-1">🎯</span>
                <span className="text-2xl font-black text-amber-700 block">{accuracy}%</span>
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

            {/* Evaluation messages */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6">
              <p className="text-xs font-bold text-gray-500 leading-relaxed">
                {hp > 0 ? (
                  selectedMode.id === 'boss'
                    ? 'Luar biasa! Kamu berhasil mengalahkan Raja Slime Raksasa dan memenangkan Boss Battle! 👾🏆'
                    : `Selamat! Kamu berhasil menuntaskan tantangan ${selectedMode.name} dengan mengalahkan semua target rintangan! 🎉`
                ) : (
                  score >= 200 
                    ? 'Luar biasa! Refleks memori jari-jarimu mengetik Hangul sangat terlatih. Kamu adalah master survival!' 
                    : score >= 100
                    ? 'Bagus sekali! Kecepatan mengetikmu sudah mumpuni untuk bertahan hidup dari rintangan menengah.'
                    : 'Terus berlatih! Biasakan letak tuts Hangul agar refleks menghindar dan bertahanmu semakin tajam.'
                )}
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="space-y-2">
              <button
                onClick={() => startGame(selectedMode)}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
              >
                <FaRotateLeft className="w-3.5 h-3.5" /> Main Lagi
              </button>
              <button
                onClick={() => {
                  setGameState('menu');
                  setSelectedMode(null);
                }}
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
