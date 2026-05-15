'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaArrowRotateRight, FaXmark } from 'react-icons/fa6'

export default function SWUpdateNotifier() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      // Tell the waiting SW to skip waiting and activate
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    // Reload the page to load the new version
    window.location.reload()
  }, [waitingWorker])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')

        // Check if there's already a waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setShowUpdate(true)
        }

        // Listen for new service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            // When the new SW is installed and waiting to activate
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker)
              setShowUpdate(true)
            }
          })
        })

        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_UPDATED') {
            // SW was updated, refresh to get new content
            setShowUpdate(true)
          }
        })

        // When a new SW takes control (after skipWaiting), reload for fresh content
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })

        // Periodically check for updates (every 30 minutes)
        setInterval(() => {
          registration.update()
        }, 30 * 60 * 1000)

      } catch (error) {
        console.log('SW registration failed:', error)
      }
    }

    registerSW()
  }, [])

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[200] animate-slide-up">
      <div className="bg-white border border-violet-200 rounded-2xl shadow-2xl shadow-violet-500/10 p-4 sm:p-5 max-w-sm w-full mx-auto sm:mx-0 flex items-center gap-4">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <FaArrowRotateRight className="text-violet-600 text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Update Tersedia! 🚀</p>
          <p className="text-xs text-gray-500 mt-0.5">Versi terbaru sudah siap.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleUpdate}
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            Update
          </button>
          <button
            onClick={() => setShowUpdate(false)}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Tutup"
          >
            <FaXmark className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}} />
    </div>
  )
}
