'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Extend Window interface for YouTube IFrame API
declare global {
  interface Window {
    YT: unknown
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

interface YouTubePlayerProps {
  videoId: string
  lessonId: string
  title: string
  durationSeconds: number | null
}

export default function YouTubePlayer({ videoId, lessonId, title, durationSeconds }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<string>(`yt-player-${lessonId}`)
  const watchedSecondsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSaveRef = useRef(0)
  const [watchPercent, setWatchPercent] = useState(0)
  const [autoCompleted, setAutoCompleted] = useState(false)

  // Save watch progress to server
  const saveProgress = useCallback(async (seconds: number) => {
    // Only save every 15 seconds to avoid too many requests
    if (Math.abs(seconds - lastSaveRef.current) < 15) return
    lastSaveRef.current = seconds

    try {
      await fetch('/api/progress/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          watch_duration: Math.round(seconds),
        }),
      })
    } catch (err) {
      console.error('Failed to save watch progress:', err)
    }
  }, [lessonId])

  // Auto-mark as completed when 80%+ watched
  const checkAutoComplete = useCallback(async (seconds: number) => {
    if (autoCompleted || !durationSeconds || durationSeconds === 0) return
    
    const percent = Math.min(100, Math.round((seconds / durationSeconds) * 100))
    setWatchPercent(percent)

    if (percent >= 80) {
      setAutoCompleted(true)
      try {
        await fetch('/api/progress/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson_id: lessonId,
            watch_duration: Math.round(seconds),
            mark_complete: true,
          }),
        })
      } catch (err) {
        console.error('Failed to auto-complete:', err)
      }
    }
  }, [lessonId, durationSeconds, autoCompleted])

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
        playerRef.current.destroy()
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          autoplay: 1,
        },
        events: {
          onStateChange: (event: unknown) => {
            // YT.PlayerState.PLAYING === 1
            if (event.data === 1) {
              // Start tracking when video is playing
              if (intervalRef.current) clearInterval(intervalRef.current)
              intervalRef.current = setInterval(() => {
                watchedSecondsRef.current += 1
                saveProgress(watchedSecondsRef.current)
                checkAutoComplete(watchedSecondsRef.current)
              }, 1000)
            } else {
              // Pause tracking when video is paused/ended/buffering
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              // Save immediately on pause/end
              if (watchedSecondsRef.current > 0) {
                saveProgress(watchedSecondsRef.current)
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
  }, [videoId, saveProgress, checkAutoComplete])

  return (
    <div className="relative w-full bg-black aspect-video shadow-2xl">
      <div id={containerRef.current} className="absolute top-0 left-0 w-full h-full" />
      
      {/* Watch Progress Indicator */}
      {durationSeconds && durationSeconds > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="h-1 bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000 ease-out"
              style={{ width: `${watchPercent}%` }}
            />
          </div>
          {autoCompleted && (
            <div className="absolute bottom-2 right-2 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 animate-bounce">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Otomatis ditandai selesai!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
