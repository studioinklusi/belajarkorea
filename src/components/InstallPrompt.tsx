'use client'

import { useState, useEffect } from 'react'
import { FaDownload, FaXmark, FaApple } from 'react-icons/fa6'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed)
      // Show again after 3 days
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Listen for native install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Always show banner on mobile after 2 seconds
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setTimeout(() => setShowBanner(true), 2000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    // If native prompt is available (Android/Chrome), use it
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
      return
    }

    // iOS: show step-by-step guide
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    // Fallback: for Android browsers that don't trigger beforeinstallprompt
    // Show generic instructions
    setShowIOSGuide(true) // reuse modal with Android text
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSGuide(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showBanner) return null

  return (
    <>
      {/* Install Banner - visible on mobile only */}
      <div className="md:hidden fixed bottom-20 left-3 right-3 z-[60] animate-slide-up">
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-2xl p-3.5 shadow-xl shadow-violet-500/25 flex items-center gap-3">
          {/* Icon */}
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
            <FaDownload className="w-5 h-5 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Download App</p>
            <p className="text-white/70 text-[11px] leading-tight mt-0.5">
              Akses lebih cepat dari Home Screen
            </p>
          </div>

          {/* Install Button */}
          <button
            onClick={handleInstall}
            className="bg-white text-violet-600 px-4 py-2 rounded-xl text-xs font-bold shrink-0 hover:bg-violet-50 active:scale-95 transition-all shadow-sm"
          >
            Install
          </button>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white p-1 shrink-0"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={handleDismiss}>
          <div 
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {isIOS ? <FaApple className="w-5 h-5" /> : <FaDownload className="w-5 h-5 text-violet-600" />}
                {isIOS ? 'Install di iPhone' : 'Install App'}
              </h3>
              <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1">
                <FaXmark className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                    <p className="text-gray-600 text-sm pt-0.5">
                      Tap ikon <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">⬆️ Share</span> di toolbar Safari (bawah layar)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                    <p className="text-gray-600 text-sm pt-0.5">
                      Scroll ke bawah dan pilih <strong>&quot;Add to Home Screen&quot;</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                    <p className="text-gray-600 text-sm pt-0.5">
                      Ketuk <strong>&quot;Add&quot;</strong> — selesai! App akan muncul di Home Screen 🎉
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                    <p className="text-gray-600 text-sm pt-0.5">
                      Tap menu <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">⋮</span> di pojok kanan atas Chrome
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                    <p className="text-gray-600 text-sm pt-0.5">
                      Pilih <strong>&quot;Install app&quot;</strong> atau <strong>&quot;Add to Home Screen&quot;</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                    <p className="text-gray-600 text-sm pt-0.5">
                      Ketuk <strong>&quot;Install&quot;</strong> — selesai! App akan muncul di Home Screen 🎉
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
            >
              Oke, saya mengerti!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
