'use client'

import { useState } from 'react'
import { FaDownload, FaSpinner } from 'react-icons/fa6'

export default function PrintButton() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setIsDownloading(true)
    setError('')
    try {
      const { toPng } = await import('html-to-image')
      const container = document.getElementById('certificate-container')
      if (!container) {
        setError('Elemen sertifikat tidak ditemukan.')
        return
      }

      // Save original styles to restore after capture
      const originalWidth = container.style.width
      const originalMinWidth = container.style.minWidth
      const originalMaxWidth = container.style.maxWidth
      const originalHeight = container.style.height
      const originalMinHeight = container.style.minHeight
      const originalOverflow = container.style.overflow

      // Force the container to render at a fixed desktop size for consistent capture
      // This ensures mobile devices produce the same result as desktop
      const FIXED_WIDTH = 1056
      const FIXED_HEIGHT = Math.round(FIXED_WIDTH / 1.414) // Match A4 landscape aspect ratio

      container.style.width = `${FIXED_WIDTH}px`
      container.style.minWidth = `${FIXED_WIDTH}px`
      container.style.maxWidth = `${FIXED_WIDTH}px`
      container.style.height = `${FIXED_HEIGHT}px`
      container.style.minHeight = `${FIXED_HEIGHT}px`
      container.style.overflow = 'hidden'

      // Force layout reflow so the browser renders at the new size
      container.getBoundingClientRect()

      // Small delay to let fonts/images settle at the new size
      await new Promise(resolve => setTimeout(resolve, 300))

      // Run toPng twice - first call warms up fonts/images, second produces clean result
      await toPng(container, { quality: 1, pixelRatio: 1, skipAutoScale: true, width: FIXED_WIDTH, height: FIXED_HEIGHT }).catch(() => {})
      
      const dataUrl = await toPng(container, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
        width: FIXED_WIDTH,
        height: FIXED_HEIGHT,
        fetchRequestInit: {
          mode: 'cors',
          credentials: 'same-origin',
        },
      })

      // Restore original styles
      container.style.width = originalWidth
      container.style.minWidth = originalMinWidth
      container.style.maxWidth = originalMaxWidth
      container.style.height = originalHeight
      container.style.minHeight = originalMinHeight
      container.style.overflow = originalOverflow

      const link = document.createElement('a')
      link.download = 'Sertifikat-Tsuha.id.png'
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
      setError('Gagal mengunduh. Silakan screenshot manual (Ctrl+Shift+S).')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-xs text-rose-500 font-medium hidden sm:inline">{error}</span>
      )}
      <button 
        onClick={handleDownload}
        disabled={isDownloading}
        className="text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
      >
        {isDownloading ? (
          <>
            <FaSpinner className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Mengunduh...</span>
          </>
        ) : (
          <>
            <FaDownload className="w-4 h-4" /> 
            <span className="hidden sm:inline">Download Sertifikat</span>
          </>
        )}
      </button>
    </div>
  )
}
