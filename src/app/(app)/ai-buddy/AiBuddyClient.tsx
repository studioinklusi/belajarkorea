'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { 
  FaPaperPlane, FaArrowsRotate, FaMicrophone, FaMicrophoneSlash, 
  FaVolumeHigh, FaRobot, FaChevronDown, FaSliders, 
  FaPlus, FaTrash, FaXmark, FaChevronLeft 
} from 'react-icons/fa6'
import { FaHistory } from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// === Types ===
type KoreanLevel = 'beginner' | 'intermediate' | 'advanced'
type Persona = 'teman' | 'pacar' | 'profesional' | 'sunbae' | 'idol' | 'penjual'
interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  level: KoreanLevel
  persona: Persona
  timestamp: number
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

// Helpers outside React Component to satisfy compiler purity rules
function generateSessionId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  // Fallback RFC4122 version 4 compliant UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function AiBuddyClient({ userId }: { userId?: string }) {
  const router = useRouter()
  const supabase = createClient()

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

  // Sessions and navigation warning states
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null)
  const [pendingFormSubmit, setPendingFormSubmit] = useState<HTMLFormElement | null>(null)
  const [isBackNavigation, setIsBackNavigation] = useState(false)

  const hasUnsavedChanges = messages.length > 1 || input.trim() !== ''
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  const hasPushedStateRef = useRef(false)

  // Sync ref with state
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  // Handle popstate setup (push dummy state when page becomes dirty)
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (hasUnsavedChanges && !hasPushedStateRef.current) {
      window.history.pushState({ noExitConfirm: true }, '', window.location.href)
      hasPushedStateRef.current = true
    } else if (!hasUnsavedChanges && hasPushedStateRef.current) {
      // If changes are cleared, reset the state ref
      hasPushedStateRef.current = false
    }
  }, [hasUnsavedChanges])

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

  // Set default showHistorySidebar to true on desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowHistorySidebar(true)
    }
  }, [])

  // Load sessions from Supabase on mount
  useEffect(() => {
    const loadSessions = async () => {
      setIsLoadingHistory(true)
      const { data, error } = await supabase
        .from('ai_buddy_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error loading sessions:', error)
        setIsLoadingHistory(false)
        return
      }

      if (data && data.length > 0) {
        const formattedSessions: ChatSession[] = data.map(row => ({
          id: row.id,
          title: row.title,
          messages: row.messages as ChatMessage[],
          level: row.level as KoreanLevel,
          persona: row.persona as Persona,
          timestamp: new Date(row.updated_at).getTime()
        }))
        setSessions(formattedSessions)
        const latest = formattedSessions[0]
        setCurrentSessionId(latest.id)
        setMessages(latest.messages)
        setSelectedLevel(latest.level)
        setSelectedPersona(latest.persona)
      } else {
        // Fallback: Create first initial session in Supabase
        const initialId = generateSessionId()
        const initialGreeting = getGreeting(selectedLevel, selectedPersona)
        const defaultSession: ChatSession = {
          id: initialId,
          title: locale === 'en' ? 'New Chat' : 'Percakapan Baru',
          messages: [{ role: 'model', text: initialGreeting }],
          level: selectedLevel,
          persona: selectedPersona,
          timestamp: Date.now()
        }

        const { error: insertError } = await supabase
          .from('ai_buddy_sessions')
          .insert({
            id: initialId,
            user_id: userId,
            title: defaultSession.title,
            messages: defaultSession.messages,
            level: defaultSession.level,
            persona: defaultSession.persona
          })

        if (!insertError) {
          setSessions([defaultSession])
          setCurrentSessionId(initialId)
          setMessages(defaultSession.messages)
        } else {
          console.error('Error creating initial session:', insertError)
        }
      }
      setIsLoadingHistory(false)
    }

    if (userId) {
      loadSessions()
    }
  }, [userId, locale])

  // Helper to update session content in Supabase and state
  const updateSessionData = async (
    sessionId: string,
    updatedMessages: ChatMessage[],
    level: KoreanLevel,
    persona: Persona
  ) => {
    let title = ''
    const currentSession = sessions.find(s => s.id === sessionId)
    if (currentSession) {
      title = currentSession.title
    }

    if (!title || title === 'Percakapan Baru' || title === 'New Chat' || title.startsWith('Obrolan') || title.startsWith('Chat')) {
      const firstUserMessage = updatedMessages.find(m => m.role === 'user')
      if (firstUserMessage) {
        title = firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '')
      } else {
        const personaName = PERSONAS.find(p => p.id === persona)?.name || ''
        const levelName = LEVELS.find(l => l.id === level)?.label || ''
        title = locale === 'en' ? `Chat ${levelName} (${personaName})` : `Obrolan ${levelName} (${personaName})`
      }
    }

    // Update locally first for immediate responsiveness
    setSessions(prevSessions => {
      const exists = prevSessions.some(s => s.id === sessionId)
      if (!exists) {
        const newSessionObj: ChatSession = {
          id: sessionId,
          title,
          messages: updatedMessages,
          level,
          persona,
          timestamp: Date.now()
        }
        return [newSessionObj, ...prevSessions].sort((a, b) => b.timestamp - a.timestamp)
      }
      const updated = prevSessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: updatedMessages,
            level,
            persona,
            title,
            timestamp: Date.now()
          }
        }
        return s
      })
      return updated.sort((a, b) => b.timestamp - a.timestamp)
    })

    // Update in Supabase (will trigger database updated_at update)
    const { error } = await supabase
      .from('ai_buddy_sessions')
      .update({
        title,
        messages: updatedMessages,
        level,
        persona,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error updating session:', error)
    }
  }

  // Intercept anchor tag navigation clicks
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!hasUnsavedChangesRef.current) return

      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      
      if (anchor && anchor.href) {
        const urlString = anchor.href
        if (anchor.target === '_blank' || urlString.startsWith('mailto:') || urlString.startsWith('tel:') || anchor.hasAttribute('download')) {
          return
        }

        let targetUrl: URL
        try {
          targetUrl = new URL(urlString, window.location.href)
        } catch {
          return
        }

        const currentUrl = new URL(window.location.href)
        if (targetUrl.origin === currentUrl.origin && !targetUrl.pathname.startsWith('/ai-buddy')) {
          e.preventDefault()
          e.stopPropagation()
          setPendingNavigationUrl(urlString)
          setIsBackNavigation(false)
          setShowExitConfirmation(true)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick, true)
    return () => document.removeEventListener('click', handleAnchorClick, true)
  }, [])

  // Intercept form submissions (e.g. logout form submit)
  useEffect(() => {
    const handleFormSubmit = (e: SubmitEvent) => {
      if (!hasUnsavedChangesRef.current) return

      const form = e.target as HTMLFormElement
      const action = form.getAttribute('action')
      
      if (action && (action.startsWith('/auth/signout') || !action.startsWith('/ai-buddy'))) {
        e.preventDefault()
        e.stopPropagation()
        setPendingFormSubmit(form)
        setIsBackNavigation(false)
        setShowExitConfirmation(true)
      }
    }

    document.addEventListener('submit', handleFormSubmit, true)
    return () => document.removeEventListener('submit', handleFormSubmit, true)
  }, [])

  // Intercept browser back/forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = (e: PopStateEvent) => {
      if (!hasUnsavedChangesRef.current) {
        if (hasPushedStateRef.current) {
          hasPushedStateRef.current = false
          window.history.back()
        }
        return
      }

      // Re-push state immediately to lock navigation and keep user on page
      window.history.pushState({ noExitConfirm: true }, '', window.location.href)
      
      setIsBackNavigation(true)
      setShowExitConfirmation(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Prevent refresh/page reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleConfirmExit = () => {
    setShowExitConfirmation(false)
    
    // Clear flag so we don't block the actual final navigation/exit
    hasUnsavedChangesRef.current = false
    hasPushedStateRef.current = false
    
    if (pendingNavigationUrl) {
      router.push(pendingNavigationUrl)
    } else if (pendingFormSubmit) {
      pendingFormSubmit.submit()
    } else if (isBackNavigation) {
      window.history.go(-2)
    }
  }

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setHasSpeechSupport(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'ko-KR'
        recognition.onstart = () => setIsListening(true)
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

  const handleLevelChange = async (level: KoreanLevel) => {
    if (level === selectedLevel) return
    
    const newPersona = level !== 'advanced' ? 'teman' : selectedPersona
    const isCurrentSessionEmpty = messages.length <= 1

    if (isCurrentSessionEmpty && currentSessionId) {
      // Sesi kosong: update level & sapaan pada sesi aktif saat ini
      setSelectedLevel(level)
      if (level !== 'advanced') setSelectedPersona('teman')
      
      const initialMessages = [{ role: 'model', text: getGreeting(level, newPersona) }] as ChatMessage[]
      setMessages(initialMessages)
      await updateSessionData(currentSessionId, initialMessages, level, newPersona)
    } else {
      // Sesi sudah berjalan: otomatis buat sesi baru (auto-branching)
      await handleNewChat(level, newPersona)
    }
  }

  const handlePersonaChange = async (persona: Persona) => {
    if (persona === selectedPersona) return
    
    setShowPersonaDropdown(false)
    const isCurrentSessionEmpty = messages.length <= 1

    if (isCurrentSessionEmpty && currentSessionId) {
      // Sesi kosong: update persona & sapaan pada sesi aktif saat ini
      setSelectedPersona(persona)
      
      const initialMessages = [{ role: 'model', text: getGreeting(selectedLevel, persona) }] as ChatMessage[]
      setMessages(initialMessages)
      await updateSessionData(currentSessionId, initialMessages, selectedLevel, persona)
    } else {
      // Sesi sudah berjalan: otomatis buat sesi baru (auto-branching)
      await handleNewChat(selectedLevel, persona)
    }
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
    if (textareaRef.current) {
      textareaRef.current.value = ''
      textareaRef.current.style.height = 'auto'
    }
    
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)
    
    if (currentSessionId) {
      updateSessionData(currentSessionId, newMessages, selectedLevel, selectedPersona)
    }

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
      if (data.error) {
        if (data.error === "LIMIT_REACHED") {
          const limitMessages: ChatMessage[] = [...newMessages, { role: 'model', text: `🔒 **KUOTA HABIS**\n\n${data.message}\n\n[➡️ Klik di sini untuk Upgrade Paket](/pricing)` }]
          setMessages(limitMessages)
          if (currentSessionId) {
            updateSessionData(currentSessionId, limitMessages, selectedLevel, selectedPersona)
          }
          return
        }
        throw new Error(data.error)
      }
      
      const successMessages: ChatMessage[] = [...newMessages, { role: 'model', text: data.response }]
      setMessages(successMessages)
      if (currentSessionId) {
        updateSessionData(currentSessionId, successMessages, selectedLevel, selectedPersona)
      }
    } catch {
      const errorMessages: ChatMessage[] = [...newMessages, { role: 'model', text: '❌ Maaf, terjadi kesalahan. Ayo coba lagi!' }]
      setMessages(errorMessages)
      if (currentSessionId) {
        updateSessionData(currentSessionId, errorMessages, selectedLevel, selectedPersona)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (e.nativeEvent.isComposing) return
      handleSend()
    }
  }

  const handleReset = () => {
    const initialMessages = [{ role: 'model', text: getGreeting(selectedLevel, selectedPersona) }] as ChatMessage[]
    setMessages(initialMessages)
    if (currentSessionId) {
      updateSessionData(currentSessionId, initialMessages, selectedLevel, selectedPersona)
    }
  }

  // Session Handlers
  const handleNewChat = async (overrideLevel?: KoreanLevel, overridePersona?: Persona) => {
    const levelToUse = overrideLevel || selectedLevel
    const personaToUse = overridePersona || selectedPersona

    const newId = generateSessionId()
    const initialGreeting = getGreeting(levelToUse, personaToUse)
    const newSession: ChatSession = {
      id: newId,
      title: locale === 'en' ? 'New Chat' : 'Percakapan Baru',
      messages: [{ role: 'model', text: initialGreeting }],
      level: levelToUse,
      persona: personaToUse,
      timestamp: Date.now()
    }
    
    // Insert into Supabase
    const { error } = await supabase
      .from('ai_buddy_sessions')
      .insert({
        id: newId,
        user_id: userId,
        title: newSession.title,
        messages: newSession.messages,
        level: newSession.level,
        persona: newSession.persona
      })

    if (error) {
      console.error('Error creating new session:', error)
      return
    }

    // Refresh history from Supabase (the database trigger may prune the oldest session)
    const { data: updatedData } = await supabase
      .from('ai_buddy_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (updatedData) {
      const formatted = updatedData.map(row => ({
        id: row.id,
        title: row.title,
        messages: row.messages as ChatMessage[],
        level: row.level as KoreanLevel,
        persona: row.persona as Persona,
        timestamp: new Date(row.updated_at).getTime()
      }))
      setSessions(formatted)
    }

    setCurrentSessionId(newId)
    setMessages(newSession.messages)
    setSelectedLevel(levelToUse)
    setSelectedPersona(personaToUse)
  }

  const handleSwitchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return
    
    setCurrentSessionId(session.id)
    setMessages(session.messages)
    setSelectedLevel(session.level)
    setSelectedPersona(session.persona)
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setShowHistorySidebar(false)
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Delete from Supabase
    const { error } = await supabase
      .from('ai_buddy_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      console.error('Error deleting session:', error)
      return
    }

    // Refresh list from database
    const { data: updatedData } = await supabase
      .from('ai_buddy_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (updatedData && updatedData.length > 0) {
      const formatted = updatedData.map(row => ({
        id: row.id,
        title: row.title,
        messages: row.messages as ChatMessage[],
        level: row.level as KoreanLevel,
        persona: row.persona as Persona,
        timestamp: new Date(row.updated_at).getTime()
      }))
      setSessions(formatted)
      
      if (currentSessionId === sessionId) {
        const latest = formatted[0]
        setCurrentSessionId(latest.id)
        setMessages(latest.messages)
        setSelectedLevel(latest.level)
        setSelectedPersona(latest.persona)
      }
    } else {
      // Fallback if no sessions remain: create a default one
      const newId = generateSessionId()
      const initialGreeting = getGreeting(selectedLevel, selectedPersona)
      const defaultSession: ChatSession = {
        id: newId,
        title: locale === 'en' ? 'New Chat' : 'Percakapan Baru',
        messages: [{ role: 'model', text: initialGreeting }],
        level: selectedLevel,
        persona: selectedPersona,
        timestamp: Date.now()
      }

      const { error: insertError } = await supabase
        .from('ai_buddy_sessions')
        .insert({
          id: newId,
          user_id: userId,
          title: defaultSession.title,
          messages: defaultSession.messages,
          level: defaultSession.level,
          persona: defaultSession.persona
        })

      if (!insertError) {
        setSessions([defaultSession])
        setCurrentSessionId(newId)
        setMessages(defaultSession.messages)
      } else {
        console.error('Error creating default session after delete:', insertError)
      }
    }
  }

  const activePersona = PERSONAS.find(p => p.id === selectedPersona)!

  return (
    <div className="flex w-full chat-container-mobile bg-[#FAFAFA] font-sans selection:bg-violet-200 selection:text-violet-900 overflow-hidden relative">
      
      {/* ===== SIDEBAR DRAWER BACKDROP (Mobile only) ===== */}
      {showHistorySidebar && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[51] md:hidden animate-fade-in"
          onClick={() => setShowHistorySidebar(false)}
        />
      )}

      {/* ===== SIDEBAR RIWAYAT ===== */}
      <aside 
        className={`absolute md:relative inset-y-0 left-0 w-[280px] sm:w-80 bg-white border-r border-gray-100/80 z-[52] md:z-30 flex flex-col h-full transform transition-transform duration-300 md:transform-none shrink-0 ${
          showHistorySidebar ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
            <FaHistory className="w-4 h-4 text-violet-600 animate-pulse" />
            <span>{locale === 'en' ? 'Chat History' : 'Riwayat Obrolan'}</span>
          </h2>
          <button 
            onClick={() => setShowHistorySidebar(false)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 shrink-0">
          <button 
            onClick={handleNewChat}
            disabled={isLoadingHistory}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-bold text-sm shadow-md shadow-violet-200/50 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span>{locale === 'en' ? 'New Chat' : 'Percakapan Baru'}</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
          {isLoadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-3.5 bg-white border border-gray-100 rounded-2xl animate-pulse">
                  <div className="flex gap-1.5 mb-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2.5 bg-gray-100 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId
              const dateStr = new Date(session.timestamp).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
              return (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                    isActive
                      ? 'bg-violet-50/70 border-violet-100 text-violet-700 shadow-sm shadow-violet-50'
                      : 'bg-white border-gray-100 hover:bg-gray-50/80 text-gray-700'
                  }`}
                >
                  <button
                    onClick={() => handleSwitchSession(session.id)}
                    className="flex-1 text-left min-w-0 pr-2 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[10px]">{LEVELS.find(l => l.id === session.level)?.emoji}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                        {translateLevel(session.level)}
                      </span>
                      <span className="text-[9px] font-bold text-gray-300">•</span>
                      <span className="text-[9px] font-bold text-gray-400">
                        {PERSONAS.find(p => p.id === session.persona)?.name}
                      </span>
                    </div>
                    <p className="text-xs font-bold truncate leading-tight">{session.title}</p>
                    <p className="text-[9px] font-semibold text-gray-400 mt-1">{dateStr}</p>
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 md:opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    title={locale === 'en' ? 'Delete conversation' : 'Hapus percakapan'}
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* ===== MAIN CHAT INTERFACE ===== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* ===== HEADER & CONTROLS ===== */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100/50 shrink-0 z-10">
          <div className="max-w-3xl mx-auto w-full px-4 py-2.5 sm:px-6 sm:py-3 flex flex-col gap-3">
            {/* Top Control Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* History Toggle Button */}
                <button
                  onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm cursor-pointer ${
                    showHistorySidebar 
                      ? 'bg-violet-100 text-violet-700 border-violet-200' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                  title={locale === 'en' ? 'Toggle history' : 'Buka riwayat'}
                >
                  <FaHistory className="w-3.5 h-3.5" />
                  <span>{locale === 'en' ? 'History' : 'Riwayat'}</span>
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm cursor-pointer ${
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
                disabled={isLoadingHistory}
                className="px-3 py-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all flex items-center gap-1.5 text-[11px] sm:text-xs font-bold border border-gray-100 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset Percakapan"
              >
                <FaArrowsRotate className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Collapsible Settings Area */}
            {showSettings && (
              <div className="pt-3 pb-2 border-t border-gray-100/50 flex flex-col gap-3.5 animate-fade-in-up">
                {/* Level Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
                  <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest shrink-0">Level</span>
                  <div className="flex bg-gray-100/80 p-1 rounded-xl w-full overflow-x-auto hide-scrollbar snap-x">
                    {LEVELS.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => handleLevelChange(level.id)}
                        className={`flex-none snap-start px-4 py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all whitespace-nowrap text-center cursor-pointer ${
                          selectedLevel === level.id
                            ? level.activeClass
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                      >
                        {level.emoji} <span>{translateLevel(level.id)}</span>
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
                          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
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
                        className="flex w-full justify-between items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 ring-1 ring-violet-200 shadow-sm cursor-pointer"
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
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          <div className="max-w-3xl mx-auto space-y-5 pb-28 md:pb-0">
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
                        className="self-start flex items-center gap-1.5 px-3 py-1.5 mt-1 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-full transition-colors border border-violet-100 cursor-pointer"
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
        <footer className="chat-footer-mobile left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-2.5 sm:p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-40">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            {/* Speech Button */}
            {hasSpeechSupport && (
              <button
                onClick={toggleListening}
                disabled={isLoadingHistory}
                className={`p-3 rounded-2xl shrink-0 transition-all cursor-pointer ${
                  isListening
                    ? 'bg-violet-100 text-violet-600 animate-pulse ring-2 ring-violet-300 shadow-sm shadow-violet-200'
                    : 'bg-gray-50 text-gray-400 hover:bg-violet-50 hover:text-violet-500 border border-gray-100'
                } ${isLoadingHistory ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isListening ? 'Berhenti mendengarkan' : 'Mulai berbicara (Korea)'}
              >
                {isListening ? <FaMicrophoneSlash className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
              </button>
            )}

            {/* Text Input Wrapper */}
            <div className="flex-1 flex items-end bg-white border border-gray-200 rounded-2xl p-1 focus-within:ring-2 focus-within:ring-violet-400 focus-within:border-transparent transition-all shadow-sm focus-within:shadow-violet-100">
              <textarea
                ref={textareaRef}
                className="flex-1 bg-transparent text-gray-800 pl-3 pr-2 py-2 text-sm sm:text-base focus:outline-none resize-none overflow-hidden min-h-[36px] max-h-[120px] leading-relaxed disabled:opacity-50"
                rows={1}
                placeholder={
                  isLoadingHistory
                    ? (locale === 'en' ? 'Loading history...' : 'Memuat riwayat...')
                    : isListening
                      ? (locale === 'en' ? 'Listening...' : 'Mendengarkan...')
                      : t('aiBuddy.placeholder')
                }
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading || isLoadingHistory}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isLoadingHistory}
                className="w-9 h-9 shrink-0 flex items-center justify-center bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200/50 hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <FaPaperPlane className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ===== EXIT CONFIRMATION MODAL ===== */}
      {showExitConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100/80 text-center animate-scale-in">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <FaRobot className="w-8 h-8 text-amber-500 animate-bounce" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">
              {locale === 'en' ? 'Leave Chat?' : 'Tinggalkan Obrolan?'}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {locale === 'en' 
                ? 'Your active conversation is safely saved in the history. Are you sure you want to leave?' 
                : 'Percakapan aktif Anda aman tersimpan di riwayat. Apakah Anda yakin ingin keluar?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExitConfirmation(false)
                  setPendingNavigationUrl(null)
                  setPendingFormSubmit(null)
                  setIsBackNavigation(false)
                }}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                {locale === 'en' ? 'Stay Here' : 'Tetap di Sini'}
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white shadow-md shadow-violet-100 hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
              >
                {locale === 'en' ? 'Leave' : 'Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
