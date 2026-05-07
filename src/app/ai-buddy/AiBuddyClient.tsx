'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { FaPaperPlane, FaArrowsRotate, FaMicrophone, FaMicrophoneSlash, FaVolumeHigh, FaRobot, FaChevronDown, FaSliders } from 'react-icons/fa6'
import { useTranslation } from '@/lib/i18n'

// === Types ===
type KoreanLevel = 'beginner' | 'intermediate' | 'advanced'
type Persona = 'teman' | 'pacar' | 'profesional' | 'sunbae' | 'idol' | 'penjual'
interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

// === Configuration ===
const LEVELS: { id: KoreanLevel; label: string; name: string; emoji: string; color: string; activeClass: string }[] = [
  { id: 'beginner', label: 'Pemula', name: '초급', emoji: '🟢', color: 'emerald', activeClass: 'bg-white text-emerald-700 shadow-sm' },
  { id: 'intermediate', label: 'Menengah', name: '중급', emoji: '🟡', color: 'amber', activeClass: 'bg-white text-amber-700 shadow-sm' },
  { id: 'advanced', label: 'Mahir', name: '고급', emoji: '🔴', color: 'rose', activeClass: 'bg-white text-rose-700 shadow-sm' },
]

const PERSONAS: { id: Persona; emoji: string; name: string; desc: string }[] = [
  { id: 'teman', emoji: '👫', name: 'Teman', desc: 'Casual & gaul' },
  { id: 'pacar', emoji: '💕', name: 'Pacar', desc: 'Mesra & romantis' },
  { id: 'profesional', emoji: '💼', name: 'Profesional', desc: 'Formal & bisnis' },
  { id: 'sunbae', emoji: '👴', name: 'Sunbae', desc: 'Senior & mentor' },
  { id: 'idol', emoji: '🎤', name: 'Idol', desc: 'Fanmeeting style' },
  { id: 'penjual', emoji: '🧑‍🍳', name: 'Penjual', desc: 'Simulasi belanja' },
]

// === Greeting Messages ===
function getGreeting(level: KoreanLevel, persona: Persona): string {
  if (level === 'beginner') {
    return `안녕하세요! 👋 (Annyeonghaseyo! - Halo!)\n\nSaya tutor Korea Anda! Saya akan membantu Anda belajar bahasa Korea dari dasar. 😊\n\nJangan takut salah, saya akan membimbing Anda pelan-pelan.\n\n오늘 기분이 어때요?\n🔤 Oneul gibuni eottaeyo?\n🇮🇩 Bagaimana perasaanmu hari ini?`
  }
  if (level === 'intermediate') {
    return `안녕하세요! 오늘도 같이 연습해요! 💪\n🇮🇩 Halo! Ayo latihan lagi hari ini!\n\n오늘 뭐 했어요? 재미있는 일 있었어요?`
  }
  const greetings: Record<Persona, string> = {
    teman: `야~ 안녕! 왔어? ㅋㅋ\n오늘 뭐했어? 나 완전 심심했거든 ㅎㅎ`,
    pacar: `자기야~ 보고싶었어! 💕\n오늘 하루 어땠어? 힘들진 않았어? ㅠㅠ`,
    profesional: `안녕하세요, 좋은 아침이에요! ☕\n오늘 회의 준비는 잘 되셨어요? 혹시 도움이 필요하시면 말씀해 주세요.`,
    sunbae: `어, 왔어? 반갑다!\n요즘 어떻게 지내? 공부는 잘 되고 있어? 내가 좀 도와줄까? ㅎㅎ`,
    idol: `와~ 안녕하세요! 만나서 정말 반가워요! 🎤✨\n오늘 이렇게 와주셔서 너무 감동이에요 ㅠㅠ 어디서 오셨어요?`,
    penjual: `어서오세요~! 어서오세요~! 🙌\n뭐 찾으시는 거 있으세요? 오늘 특별히 맛있는 거 많이 들어왔어요! 한번 구경해 보세요!`,
  }
  return greetings[persona]
}

export default function AiBuddyClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<KoreanLevel>('beginner')
  const [selectedPersona, setSelectedPersona] = useState<Persona>('teman')
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { t, locale } = useTranslation()
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Translations for dynamic arrays
  const translateLevel = (id: string) => {
    if (locale === 'en') {
      if (id === 'beginner') return 'Beginner'
      if (id === 'intermediate') return 'Intermediate'
      if (id === 'advanced') return 'Advanced'
    }
    if (id === 'beginner') return 'Pemula'
    if (id === 'intermediate') return 'Menengah'
    if (id === 'advanced') return 'Mahir'
    return id
  }

  const translatePersonaDesc = (id: string, origDesc: string) => {
    if (locale !== 'en') return origDesc
    const map: Record<string, string> = {
      teman: 'Casual & friendly',
      pacar: 'Sweet & romantic',
      profesional: 'Formal & business',
      sunbae: 'Senior & mentor',
      idol: 'Fanmeeting style',
      penjual: 'Shopping simulation'
    }
    return map[id] || origDesc
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (messages.length > 1) scrollToBottom()
  }, [messages, scrollToBottom])

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'model', text: getGreeting(selectedLevel, selectedPersona) }])
    }
  }, [messages.length, selectedLevel, selectedPersona])

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setHasSpeechSupport(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'ko-KR'
        recognition.onstart = () => setIsListening(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let transcript = ''
          for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript
          }
          setInput(transcript)
        }
        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)
        recognitionRef.current = recognition
      }
    }
  }, [])

  const handleLevelChange = (level: KoreanLevel) => {
    if (level === selectedLevel) return
    setSelectedLevel(level)
    if (level !== 'advanced') setSelectedPersona('teman')
    setMessages([])
  }

  const handlePersonaChange = (persona: Persona) => {
    if (persona === selectedPersona) return
    setSelectedPersona(persona)
    setShowPersonaDropdown(false)
    setMessages([])
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      setInput('')
      recognitionRef.current?.start()
    }
  }

  const handleListen = (text: string) => {
    const lines = text.split('\n')
    const koreanLine = lines.find(line => /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(line)) || text
    const cleanText = koreanLine.replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s.,!?]/g, '').trim()
    const utterance = new SpeechSynthesisUtterance(cleanText || text)
    utterance.lang = 'ko-KR'
    utterance.rate = selectedLevel === 'beginner' ? 0.8 : 0.95
    window.speechSynthesis.speak(utterance)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMessage = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages,
          message: userMessage,
          level: selectedLevel,
          persona: selectedPersona,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages([...newMessages, { role: 'model', text: data.response }])
    } catch {
      setMessages([...newMessages, { role: 'model', text: '❌ Maaf, terjadi kesalahan. Ayo coba lagi!' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => setMessages([])

  const activePersona = PERSONAS.find(p => p.id === selectedPersona)!

  return (
    <div className="flex flex-col h-[calc(100vh-204px)] md:h-[calc(100vh-80px)] bg-[#FAFAFA] font-sans selection:bg-violet-200 selection:text-violet-900">

      {/* ===== HEADER & CONTROLS ===== */}
      {/* ===== HEADER & CONTROLS ===== */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100/50 shrink-0 z-10">
        <div className="max-w-3xl mx-auto w-full px-4 py-2.5 sm:px-6 sm:py-3 flex flex-col gap-3">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
                  showSettings 
                    ? 'bg-violet-100 text-violet-700 border-violet-200' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FaSliders className="w-3.5 h-3.5" />
                <span>{locale === 'en' ? 'AI Settings' : 'Pengaturan AI'}</span>
                <FaChevronDown className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>

              {/* Active Status Badge (only when collapsed) */}
              {!showSettings && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold bg-gray-50 border border-gray-100 text-gray-500">
                  <span>{LEVELS.find(l => l.id === selectedLevel)?.emoji} {translateLevel(selectedLevel)}</span>
                  {selectedLevel === 'advanced' && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{PERSONAS.find(p => p.id === selectedPersona)?.emoji} {PERSONAS.find(p => p.id === selectedPersona)?.name}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-violet-100"
              title="Reset Percakapan"
            >
              <FaArrowsRotate className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Collapsible Settings Area */}
          {showSettings && (
            <div className="pt-3 pb-2 border-t border-gray-100/50 flex flex-col gap-3.5 animate-fade-in-up">
              {/* Level Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full">
                <span className="sm:w-[72px] text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest shrink-0 ml-1 sm:ml-0">Level</span>
                <div className="flex bg-gray-100/80 p-1 rounded-xl w-full sm:w-max">
                  {LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => handleLevelChange(level.id)}
                      className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-sm font-bold transition-all whitespace-nowrap text-center ${
                        selectedLevel === level.id
                          ? level.activeClass
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      {level.emoji} <span className="hidden min-[375px]:inline">{translateLevel(level.id)}</span><span className="min-[375px]:hidden">{translateLevel(level.id)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona Selector — Only Advanced */}
              {selectedLevel === 'advanced' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full">
                  <span className="sm:w-[72px] text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest shrink-0 ml-1 sm:ml-0">Persona</span>
                  
                  {/* Desktop: inline buttons */}
                  <div className="hidden sm:flex bg-gray-100/80 p-1 rounded-xl shrink-0">
                    {PERSONAS.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => handlePersonaChange(persona.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                          selectedPersona === persona.id
                            ? 'bg-white text-violet-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                        title={translatePersonaDesc(persona.id, persona.desc)}
                      >
                        {persona.emoji} {persona.name}
                      </button>
                    ))}
                  </div>

                  {/* Mobile: dropdown */}
                  <div className="relative sm:hidden w-full">
                    <button
                      onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
                      className="flex w-full justify-between items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 ring-1 ring-violet-200 shadow-sm"
                    >
                      <span>{activePersona.emoji} {activePersona.name}</span>
                      <FaChevronDown className={`w-3 h-3 transition-transform ${showPersonaDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showPersonaDropdown && (
                      <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                        {PERSONAS.map((persona) => (
                          <button
                            key={persona.id}
                            onClick={() => handlePersonaChange(persona.id)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                              selectedPersona === persona.id
                                ? 'bg-violet-50 text-violet-700'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span>{persona.emoji}</span>
                            <div>
                              <div>{persona.name}</div>
                              <div className="text-[10px] font-medium text-gray-400">{translatePersonaDesc(persona.id, persona.desc)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== CHAT AREA ===== */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-br-lg shadow-lg shadow-violet-200/50'
                    : 'bg-white text-gray-800 rounded-bl-lg shadow-sm border border-gray-100/80'
                }`}
              >
                {message.role === 'model' ? (
                  <div className="flex flex-col gap-2">
                    <div className="prose prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-headings:text-gray-900 whitespace-pre-wrap">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                    <button
                      onClick={() => handleListen(message.text)}
                      className="self-start flex items-center gap-1.5 px-3 py-1.5 mt-1 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-full transition-colors border border-violet-100"
                    >
                      <FaVolumeHigh className="w-3 h-3" /> Dengarkan
                    </button>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{message.text}</p>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="bg-white text-gray-500 rounded-3xl rounded-bl-lg px-5 py-4 shadow-sm border border-gray-100/80 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm font-bold text-violet-500">{locale === 'en' ? 'Typing...' : 'Sedang mengetik...'}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ===== INPUT AREA ===== */}
      <footer className="md:relative fixed bottom-16 md:bottom-auto left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-2.5 sm:p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-40">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          {/* Speech Button */}
          {hasSpeechSupport && (
            <button
              onClick={toggleListening}
              className={`p-3 rounded-2xl shrink-0 transition-all ${
                isListening
                  ? 'bg-violet-100 text-violet-600 animate-pulse ring-2 ring-violet-300 shadow-sm shadow-violet-200'
                  : 'bg-gray-50 text-gray-400 hover:bg-violet-50 hover:text-violet-500 border border-gray-100'
              }`}
              title={isListening ? 'Berhenti mendengarkan' : 'Mulai berbicara (Korea)'}
            >
              {isListening ? <FaMicrophoneSlash className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
            </button>
          )}

          {/* Text Input */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              className="w-full bg-white border border-gray-200 text-gray-800 rounded-2xl pl-4 pr-12 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none overflow-hidden min-h-[44px] max-h-[120px] shadow-sm transition-shadow focus:shadow-violet-100"
              rows={1}
              placeholder={isListening ? (locale === 'en' ? 'Listening...' : 'Mendengarkan...') : t('aiBuddy.placeholder')}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 bottom-1.5 w-9 h-9 grid place-items-center bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-full hover:from-violet-700 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200/50 hover:shadow-lg active:scale-95"
            >
              <FaPaperPlane className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
