'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FaCircleCheck } from 'react-icons/fa6'

// Extend Window interface for YouTube IFrame API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

interface YouTubePlayerProps {
  videoId: string
  lessonId: string
  title: string
  durationSeconds: number | null
  isCompleted?: boolean
  initialWatchDuration?: number
}

export default function YouTubePlayer({
  videoId,
  lessonId,
  title,
  durationSeconds,
  isCompleted = false,
  initialWatchDuration = 0,
}: YouTubePlayerProps) {
  const router = useRouter()
  const playerRef = useRef<any>(null)
  const containerRef = useRef<string>(`yt-player-${lessonId}`)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSaveRef = useRef(0)
  const autoCompletedRef = useRef(isCompleted)
  const [showAutoCompletedToast, setShowAutoCompletedToast] = useState(false)

  // Save watch progress to server
  const saveProgress = useCallback(async (seconds: number, markComplete = false) => {
    // Only throttle normal periodic saves, but always save when markComplete is true
    if (!markComplete && Math.abs(seconds - lastSaveRef.current) < 15) return
    lastSaveRef.current = seconds

    try {
      const res = await fetch('/api/progress/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          watch_duration: Math.round(seconds),
          mark_complete: markComplete,
        }),
      })

      if (markComplete && res.ok) {
        autoCompletedRef.current = true
        setShowAutoCompletedToast(true)
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to save watch progress:', err)
    }
  }, [lessonId, router])

  // Auto-mark as completed when 80%+ watched
  const checkAutoComplete = useCallback((currentTime: number, actualDuration: number) => {
    if (autoCompletedRef.current) return

    const duration = actualDuration > 0 ? actualDuration : (durationSeconds || 0)
    if (duration > 0 && currentTime >= duration * 0.8) {
      autoCompletedRef.current = true
      saveProgress(duration, true)
    }
  }, [durationSeconds, saveProgress])

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          autoplay: 1,
        },
        events: {
          onStateChange: (event: any) => {
            const playerState = event.data

            // YT.PlayerState.PLAYING === 1
            if (playerState === 1) {
              if (intervalRef.current) clearInterval(intervalRef.current)
              intervalRef.current = setInterval(() => {
                if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return

                const currentTime = playerRef.current.getCurrentTime() || 0
                const actualDuration = (typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() : 0) || durationSeconds || 0

                saveProgress(currentTime, false)
                checkAutoComplete(currentTime, actualDuration)
              }, 1000)
            } else if (playerState === 0) {
              // YT.PlayerState.ENDED === 0 -> Video finished completely!
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              const actualDuration = (playerRef.current && typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() : 0) || durationSeconds || 1
              saveProgress(actualDuration, true)
            } else {
              // Pause tracking when video is paused/buffering
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                const currentTime = playerRef.current.getCurrentTime() || 0
                if (currentTime > 0) {
                  saveProgress(currentTime, false)
                }
              }
            }
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
      }
      window.onYouTubeIframeAPIReady = undefined
    }
  }, [videoId, durationSeconds, saveProgress, checkAutoComplete])

  return (
    <div className="relative w-full bg-black aspect-video shadow-2xl">
      <div id={containerRef.current} className="absolute top-0 left-0 w-full h-full" />

      {/* Floating Auto-Completed Notification Toast */}
      {showAutoCompletedToast && (
        <div className="absolute top-4 right-4 z-20 bg-emerald-600/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border border-emerald-400/40 animate-bounce">
          <FaCircleCheck className="w-4 h-4 text-emerald-200" />
          <span>Materi otomatis diselesaikan!</span>
        </div>
      )}
    </div>
  )
}
