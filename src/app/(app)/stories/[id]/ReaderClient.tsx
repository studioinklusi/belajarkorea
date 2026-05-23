'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  FaVolumeHigh, FaPlus, FaCheck, FaBookOpen, FaCircleInfo, 
  FaArrowLeft, FaCircleCheck, FaSpinner, FaCirclePlay, FaCircleQuestion 
} from 'react-icons/fa6';

interface Token {
  t: string;
  l?: string;
}

interface Story {
  id: string;
  title_ko: string;
  title_id: string;
  title_en?: string | null;
  content_ko: string;
  content_id: string;
  content_en?: string | null;
  content_tokens: any; // Token[]
  level: string;
  category: string;
}

interface ReaderClientProps {
  story: Story;
  userId: string;
  initialCompleted: boolean;
}

interface TranslationResult {
  word_ko: string;
  word_base_ko: string;
  romanization: string;
  part_of_speech: string;
  translation_id: string;
  context_sentence_ko: string;
  context_sentence_id: string;
  explanation: string;
}

export default function ReaderClient({ story, userId, initialCompleted }: ReaderClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [contextSentence, setContextSentence] = useState<string | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  
  const [isLoadingTranslation, setIsLoadingTranslation] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  
  const [savedFlashcards, setSavedFlashcards] = useState<Set<string>>(new Set());
  const [isSavingFlashcard, setIsSavingFlashcard] = useState<boolean>(false);
  
  const [isCompleted, setIsCompleted] = useState<boolean>(initialCompleted);
  const [isCompletingProgress, setIsCompletingProgress] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false);

  const tokens = (story.content_tokens as Token[]) || [];

  // Fetch already saved flashcards for this story to show "Tersimpan" states
  useEffect(() => {
    async function loadSavedFlashcards() {
      const { data, error } = await supabase
        .from('user_flashcards')
        .select('word_ko, context_sentence_ko')
        .eq('user_id', userId)
        .eq('story_id', story.id);

      if (!error && data) {
        const cardKeys = new Set(data.map(item => `${item.word_ko}|${item.context_sentence_ko}`));
        setSavedFlashcards(cardKeys);
      }
    }
    loadSavedFlashcards();
  }, [userId, story.id]);

  // Extract sentence context on word click
  const handleWordClick = async (clickedWord: string, index: number) => {
    setSelectedWordIndex(index);
    setSelectedWord(clickedWord);
    setTranslation(null);
    setTranslationError(null);
    setIsMobilePanelOpen(true);

    // Reconstruct sentence surrounding the clicked word
    let startIndex = index;
    while (startIndex > 0) {
      const prevText = tokens[startIndex - 1].t;
      if (prevText.includes('.') || prevText.includes('?') || prevText.includes('!') || prevText.includes('\n')) {
        break;
      }
      startIndex--;
    }

    let endIndex = index;
    while (endIndex < tokens.length - 1) {
      const nextText = tokens[endIndex + 1].t;
      if (nextText.includes('.') || nextText.includes('?') || nextText.includes('!') || nextText.includes('\n')) {
        break;
      }
      endIndex++;
    }

    const reconstructedSentence = tokens
      .slice(startIndex, endIndex + 1)
      .map(t => t.t)
      .join('')
      .trim();

    setContextSentence(reconstructedSentence);
    setIsLoadingTranslation(true);

    try {
      const response = await fetch('/api/translate-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: clickedWord, context: reconstructedSentence }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch translation');
      }

      const result = await response.json();
      setTranslation(result);
    } catch (err: any) {
      console.error(err);
      setTranslationError(err.message || 'Gagal menerjemahkan kata. Coba lagi.');
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  // Web Speech Synthesis Korean Pronunciation (TTS)
  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find(v => v.lang.startsWith('ko'));
      if (koVoice) {
        utterance.voice = koVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Pencarian suara (TTS) tidak didukung pada browser Anda.');
    }
  };

  // Add Word to Personal Flashcards
  const handleAddToFlashcard = async () => {
    if (!translation) return;

    setIsSavingFlashcard(true);
    try {
      const cardKey = `${translation.word_ko}|${translation.context_sentence_ko}`;
      
      const { error } = await supabase
        .from('user_flashcards')
        .insert({
          user_id: userId,
          word_ko: translation.word_ko,
          word_base_ko: translation.word_base_ko,
          translation_id: translation.translation_id,
          romanization: translation.romanization,
          part_of_speech: translation.part_of_speech,
          context_sentence_ko: translation.context_sentence_ko,
          context_sentence_id: translation.context_sentence_id,
          story_id: story.id,
          box_level: 1,
          interval_days: 1,
          ease_factor: 2.5,
          repetitions: 0,
        });

      if (error) {
        if (error.code === '23505') {
          // Already exists in DB, just mark it locally
          const updated = new Set(savedFlashcards);
          updated.add(cardKey);
          setSavedFlashcards(updated);
        } else {
          throw error;
        }
      } else {
        const updated = new Set(savedFlashcards);
        updated.add(cardKey);
        setSavedFlashcards(updated);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan flashcard. Silakan coba lagi.');
    } finally {
      setIsSavingFlashcard(false);
    }
  };

  // Mark Story Reading as Complete
  const handleMarkAsCompleted = async () => {
    setIsCompletingProgress(true);
    try {
      const { error } = await supabase
        .from('user_stories_progress')
        .upsert({
          user_id: userId,
          story_id: story.id,
          is_completed: true,
          last_read_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setIsCompleted(true);
      setShowCelebration(true);
    } catch (err: any) {
      console.error(err);
      alert('Gagal memperbarui progres membaca. Coba lagi.');
    } finally {
      setIsCompletingProgress(false);
    }
  };

  const isCurrentCardSaved = translation 
    ? savedFlashcards.has(`${translation.word_ko}|${translation.context_sentence_ko}`)
    : false;

  // Helper to render Study Panel contents (to avoid duplicate code on mobile vs desktop)
  const renderStudyPanelContent = () => {
    return (
      <>
        {/* Case 1: No word selected */}
        {!selectedWord && (
          <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-500 shadow-xs">
              <FaBookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Panduan Membaca</h3>
            <ul className="text-left text-sm text-gray-500 space-y-2.5 max-w-xs font-medium">
              <li className="flex gap-2">
                <span className="text-amber-500 font-bold">1.</span>
                <span>Baca teks Hangul di sebelah kiri secara perlahan.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 font-bold">2.</span>
                <span>Ketuk kata Korea yang asing untuk memanggil translator AI.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 font-bold">3.</span>
                <span>Simpan kata sebagai flashcard menggunakan tombol "+ Simpan".</span>
              </li>
            </ul>
          </div>
        )}

        {/* Case 2: Loading Translation */}
        {isLoadingTranslation && (
          <div className="text-center py-20 flex-1 flex flex-col items-center justify-center">
            <FaSpinner className="animate-spin text-4xl text-amber-500 mb-4" />
            <p className="text-sm text-gray-500 font-bold">AI sedang menganalisis tata bahasa...</p>
          </div>
        )}

        {/* Case 3: Error loading */}
        {translationError && (
          <div className="text-center py-10 flex-1 flex flex-col items-center justify-center text-red-500">
            <p className="text-sm font-bold mb-4">{translationError}</p>
            <button 
              onClick={() => handleWordClick(selectedWord!, selectedWordIndex!)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-full text-xs font-black transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Case 4: Translation Loaded */}
        {translation && !isLoadingTranslation && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Header Information */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {translation.word_ko}
                  </h2>
                  <span className="text-xs text-gray-400 font-bold">
                    [{translation.romanization}]
                  </span>
                </div>
                
                <button
                  onClick={() => playAudio(translation.word_ko)}
                  className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-2xl shadow-xs transition-colors flex items-center justify-center"
                  title="Dengarkan pengucapan"
                >
                  <FaVolumeHigh className="w-5 h-5" />
                </button>
              </div>

              {/* Word Specs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-md tracking-wider">
                    {translation.part_of_speech}
                  </span>
                  <span className="text-xs text-gray-500 font-bold">
                    Kamus: <span className="font-extrabold text-gray-800">{translation.word_base_ko}</span>
                  </span>
                </div>

                {/* Word Definition */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-sm font-black text-gray-500 uppercase tracking-wider mb-1">Terjemahan Kata</p>
                  <p className="text-lg font-bold text-gray-900">{translation.translation_id}</p>
                </div>

                {/* Context Specific Explanation */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Tata Bahasa / Analisis</p>
                  <p className="text-sm text-gray-600 leading-relaxed font-semibold">
                    {translation.explanation}
                  </p>
                </div>

                {/* Sentence Context */}
                <div className="border-t border-gray-50 pt-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Kalimat Contoh</p>
                  <div className="text-base font-bold text-gray-800 leading-relaxed mb-1">
                    {translation.context_sentence_ko.split(translation.word_ko).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="bg-yellow-100 text-yellow-900 px-0.5 rounded">{translation.word_ko}</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 font-semibold italic">
                    "{translation.context_sentence_id}"
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Add to Flashcard Action */}
            <div className="pt-6 border-t border-gray-100 mt-6 shrink-0">
              {isCurrentCardSaved ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-50 border border-green-200 text-green-700 font-bold rounded-full text-sm cursor-not-allowed"
                >
                  <FaCheck /> Sudah Tersimpan di Flashcard
                </button>
              ) : (
                <button
                  onClick={handleAddToFlashcard}
                  disabled={isSavingFlashcard}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full text-sm shadow-md hover:shadow-lg transition-all"
                >
                  {isSavingFlashcard ? (
                    <>
                      <FaSpinner className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <FaPlus /> Simpan ke Flashcard
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-16 flex flex-col font-sans relative">
      {/* Top Sticky Bar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-orange-100 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.push('/stories')}
            className="p-2 hover:bg-orange-50 rounded-full text-gray-600 transition-colors flex items-center gap-1 font-bold text-sm"
          >
            <FaArrowLeft /> Kembali
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
              {story.level}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Story Text */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-10 border border-orange-100 shadow-xs">
          {/* Cover & Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight">{story.title_ko}</h1>
          <p className="text-gray-500 text-lg font-semibold mb-8">{story.title_id}</p>

          {/* Interactive Korean Text Block */}
          <div className="text-2xl sm:text-3xl leading-loose sm:leading-[3rem] font-medium text-gray-800 select-none border-b border-orange-50 pb-8 mb-8 tracking-wide font-ko">
            {tokens.map((token, index) => {
              // Paragraph breaks
              if (token.t.includes('\n')) {
                return <span key={index} className="block h-4" />;
              }

              // Clickable if it has a lemma (l) OR contains Hangul characters
              const isClickable = !!token.l || /[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/.test(token.t);

              // Non-clickable whitespace / punctuation
              if (!isClickable) {
                return (
                  <span key={index} className="text-gray-400">
                    {token.t}
                  </span>
                );
              }

              // Clickable Korean words
              const isSelected = selectedWordIndex === index;
              return (
                <span
                  key={index}
                  onClick={() => handleWordClick(token.t, index)}
                  className={`cursor-pointer hover:bg-amber-100 hover:text-amber-900 rounded px-1 transition-all inline-block leading-[2.5rem] duration-150 ${
                    isSelected 
                      ? 'bg-amber-200 text-amber-950 font-semibold shadow-xs ring-2 ring-amber-300 transform scale-105' 
                      : 'text-gray-800 border-b-2 border-dashed border-amber-200/50'
                  }`}
                >
                  {token.t}
                </span>
              );
            })}
          </div>

          {/* Parallel Indonesian Translation of entire Story */}
          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-black uppercase text-orange-800 tracking-wider flex items-center gap-2 mb-3">
              <FaCircleInfo /> Terjemahan Paragraf
            </h3>
            <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line font-medium">
              {story.content_id}
            </p>
          </div>

          {/* Complete Reading Button */}
          <div className="mt-8 flex justify-center">
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-6 py-3.5 rounded-full border border-green-200">
                <FaCircleCheck className="w-5 h-5" /> Cerita Sudah Selesai Dibaca
              </div>
            ) : (
              <button
                onClick={handleMarkAsCompleted}
                disabled={isCompletingProgress}
                className="px-8 py-3.5 bg-gray-950 hover:bg-gray-900 text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                {isCompletingProgress ? (
                  <>
                    <FaSpinner className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <FaCircleCheck /> Selesai Membaca
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Translation Popover & Study Panel (Desktop only) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm min-h-[300px] flex flex-col justify-between">
            {renderStudyPanelContent()}
          </div>
        </div>
      </div>

      {/* Floating Guide Button for Mobile (lg:hidden, positioned above mobile bottom nav) */}
      <button
        onClick={() => {
          setSelectedWord(null);
          setSelectedWordIndex(null);
          setTranslation(null);
          setIsMobilePanelOpen(true);
        }}
        className="fixed bottom-20 right-6 lg:hidden z-30 w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-orange-400/50"
        title="Panduan Membaca"
      >
        <FaCircleQuestion className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Sheet Panel (lg:hidden) */}
      {isMobilePanelOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity" 
            onClick={() => {
              setIsMobilePanelOpen(false);
              setSelectedWord(null);
              setSelectedWordIndex(null);
              setTranslation(null);
            }}
          />
          {/* Bottom Sheet Card */}
          <div className="relative bg-white rounded-t-[2rem] border-t border-orange-100 p-6 pb-10 shadow-2xl z-50 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 flex flex-col">
            {/* Drag Handle indicator */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5 shrink-0" />
            
            {/* Close Button (X icon) */}
            <button
              onClick={() => {
                setIsMobilePanelOpen(false);
                setSelectedWord(null);
                setSelectedWordIndex(null);
                setTranslation(null);
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-650 rounded-full hover:bg-gray-100 transition-colors"
              title="Tutup"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex-1 overflow-y-auto pr-1">
              {renderStudyPanelContent()}
            </div>
          </div>
        </div>
      )}

      {/* Celebration Overlay Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-orange-50 transform scale-100 transition-all duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <FaCircleCheck className="w-12 h-12" />
            </div>
            
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">🎉 Selamat Membaca!</h3>
            <p className="text-gray-500 text-sm font-semibold mb-6">
              Kamu berhasil menyelesaikan cerita ini. Pertahankan konsistensi belajarmu untuk mempercepat penguasaan bahasa Korea!
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowCelebration(false);
                  router.push('/stories');
                }}
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-full text-sm transition-all"
              >
                Kembali ke Daftar Cerita
              </button>
              
              <Link
                href="/flashcards"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold rounded-full text-sm transition-all"
              >
                <FaCirclePlay /> Latih Flashcard Baru
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
