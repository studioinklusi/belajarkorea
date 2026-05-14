'use client'

import { useState } from 'react'
import { FaDownload, FaSpinner } from 'react-icons/fa6'

export default function PrintButton() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const container = document.getElementById('certificate-container')
      if (!container) return

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `Sertifikat-Tsuha.id.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
      // Fallback to print dialog
      window.print()
    } finally {
      setIsDownloading(false)
    }
  }

  return (
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
  )
}
