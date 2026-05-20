'use client';

import { useState } from 'react';
import { 
  FaVolumeHigh, FaArrowLeft, FaCheck, FaRotate, 
  FaSpinner, FaCircleCheck, FaChartSimple,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa6';

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
}

interface ReviewSessionProps {
  cards: Flashcard[];
  onBack: () => void;
  onFinish: (results: { cardId: string; rating: string }[]) => void;
}

export default function ReviewSession({ cards, onBack, onFinish }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<{ cardId: string; rating: string }[]>([]);

  const activeCard = cards[currentIndex];

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const playTTS = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent card flipping when clicking voice button
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
    }
  };

  const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (isSubmitting || !activeCard) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/flashcards/${activeCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) throw new Error('Failed to update SRS parameters');

      // Record to session history
      const newHistory = [...history, { cardId: activeCard.id, rating }];
      setHistory(newHistory);

      // Advance to next card or finish session
      if (currentIndex < cards.length - 1) {
        setFlipped(false);
        setCurrentIndex(currentIndex + 1);
      } else {
        onFinish(newHistory);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengirimkan penilaian. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Replace target word with underline to hide it in the cloze test
  const getHiddenSentence = (sentence: string, targetWord: string) => {
    if (!sentence || !targetWord) return '';
    return sentence.split(targetWord).join(' _____ ');
  };

  const cardStyleFront: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    inset: 0,
  };
  
  const cardStyleBack: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    inset: 0,
    transform: 'rotateY(180deg)',
  };

  const cardInnerStyle = (isFlipped: boolean): React.CSSProperties => ({
    position: 'relative',
    width: '100%',
    height: '100%',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    transformStyle: 'preserve-3d',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  });

  const ratingCounts = {
    again: history.filter(h => h.rating === 'again').length,
    hard: history.filter(h => h.rating === 'hard').length,
    good: history.filter(h => h.rating === 'good').length,
    easy: history.filter(h => h.rating === 'easy').length,
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-8rem)] justify-between select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaArrowLeft /> Keluar
        </button>
        <div className="text-sm font-black text-gray-400 tracking-wider">
          Progress: <span className="text-violet-600 font-extrabold">{currentIndex + 1}</span> / {cards.length}
        </div>
      </div>

      {/* Spaced Repetition Card Area */}
      <div className="flex-1 flex flex-col justify-center min-h-[360px] max-h-[460px]">
        <div 
          onClick={handleFlip}
          className="w-full h-full relative cursor-pointer"
          style={{ perspective: '1000px' }}
        >
          <div style={cardInnerStyle(flipped)}>
            {/* FRONT OF THE CARD */}
            <div 
              style={cardStyleFront}
              className="bg-white rounded-3xl p-8 border border-orange-100 shadow-lg flex flex-col justify-between items-center text-center"
            >
              <div className="w-full flex justify-between items-center text-gray-300 text-xs shrink-0">
                <span className="font-bold tracking-widest uppercase bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md">Box {activeCard.box_level}</span>
                <span className="flex items-center gap-1"><FaRotate /> Ketuk untuk melihat arti</span>
              </div>

              <div className="my-auto space-y-6">
                {/* Target Word */}
                <div className="space-y-2">
                  <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-none font-ko">
                    {activeCard.word_ko}
                  </h2>
                </div>

                {/* Sentence Context (Cloze Test) */}
                <div className="max-w-sm mx-auto">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Lengkapi Kalimat</p>
                  <p className="text-xl font-bold text-gray-800 leading-relaxed font-ko">
                    {getHiddenSentence(activeCard.context_sentence_ko, activeCard.word_ko)}
                  </p>
                </div>
              </div>

              {/* TTS Button */}
              <button
                onClick={(e) => playTTS(activeCard.word_ko, e)}
                className="mt-auto p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-xs"
                title="Dengarkan pengucapan"
              >
                <FaVolumeHigh className="w-5 h-5" />
              </button>
            </div>

            {/* BACK OF THE CARD */}
            <div 
              style={cardStyleBack}
              className="bg-white rounded-3xl p-8 border border-violet-100 shadow-lg flex flex-col justify-between items-center text-center overflow-y-auto"
            >
              <div className="w-full flex justify-between items-center text-gray-300 text-xs shrink-0">
                <span className="font-bold tracking-widest uppercase bg-violet-50 text-violet-700 px-2.5 py-1 rounded-md">Jawaban</span>
                <span className="flex items-center gap-1"><FaRotate /> Ketuk untuk kembali</span>
              </div>

              <div className="my-auto space-y-6 w-full py-4">
                {/* Word & Romanization */}
                <div>
                  <h2 className="text-4xl font-black text-gray-900 font-ko">{activeCard.word_ko}</h2>
                  {activeCard.romanization && (
                    <p className="text-xs text-gray-400 font-bold mt-1">[{activeCard.romanization}]</p>
                  )}
                </div>

                {/* Word specs & Translation */}
                <div className="space-y-3">
                  <div className="flex justify-center gap-3">
                    {activeCard.part_of_speech && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-md tracking-wider">
                        {activeCard.part_of_speech}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-bold">
                      Kamus: <span className="font-extrabold text-gray-800">{activeCard.word_base_ko}</span>
                    </span>
                  </div>

                  <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4 max-w-sm mx-auto">
                    <p className="text-xs font-black text-violet-800 uppercase tracking-widest mb-0.5">Arti Kata</p>
                    <p className="text-lg font-bold text-violet-950">{activeCard.translation_id}</p>
                  </div>
                </div>

                {/* Context Sentence translation */}
                <div className="border-t border-gray-50 pt-4 max-w-sm mx-auto">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Kalimat Konteks</p>
                  <p className="text-base font-bold text-gray-950 leading-relaxed font-ko">
                    {activeCard.context_sentence_ko.split(activeCard.word_ko).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="bg-yellow-100 text-yellow-900 px-0.5 rounded font-extrabold">{activeCard.word_ko}</span>
                        )}
                      </span>
                    ))}
                  </p>
                  <p className="text-sm text-gray-500 font-semibold italic mt-1 leading-snug">
                    "{activeCard.context_sentence_id}"
                  </p>
                </div>
              </div>

              {/* TTS Button */}
              <button
                onClick={(e) => playTTS(activeCard.word_ko, e)}
                className="mt-auto p-3 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-xs"
                title="Dengarkan pengucapan"
              >
                <FaVolumeHigh className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Previous / Next Navigation */}
      <div className="mt-5 shrink-0 flex items-center gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-bold text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95"
        >
          <FaChevronLeft className="w-3 h-3" /> Sebelumnya
        </button>
        <div className="flex-1 text-center">
          <div className="flex justify-center gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFlipped(false); setCurrentIndex(i); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? 'bg-violet-600 w-4'
                    : history.find(h => h.cardId === cards[i].id)
                    ? 'bg-violet-200'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-bold text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95"
        >
          Berikutnya <FaChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* SRS Rating Actions (Only visible when flipped) */}
      <div className="mt-3 shrink-0">
        {flipped ? (
          <div className="space-y-3">
            <p className="text-center text-xs font-extrabold text-gray-400 uppercase tracking-widest">
              Seberapa baik Anda mengingat kata ini?
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={() => handleRate('again')}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl transition-all border border-rose-200/50 shadow-xs active:scale-95"
              >
                <span className="text-lg mb-0.5">🔴</span>
                <span className="text-xs">Lupa</span>
              </button>
              
              <button
                onClick={() => handleRate('hard')}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-2xl transition-all border border-amber-200/50 shadow-xs active:scale-95"
              >
                <span className="text-lg mb-0.5">🟡</span>
                <span className="text-xs">Ragu</span>
              </button>
              
              <button
                onClick={() => handleRate('good')}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl transition-all border border-indigo-200/50 shadow-xs active:scale-95"
              >
                <span className="text-lg mb-0.5">🔵</span>
                <span className="text-xs">Ingat</span>
              </button>
              
              <button
                onClick={() => handleRate('easy')}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl transition-all border border-emerald-200/50 shadow-xs active:scale-95"
              >
                <span className="text-lg mb-0.5">🟢</span>
                <span className="text-xs">Mudah</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleFlip}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
          >
            Tampilkan Terjemahan
          </button>
        )}
      </div>
    </div>
  );
}
