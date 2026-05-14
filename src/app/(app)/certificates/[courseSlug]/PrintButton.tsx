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
      const html2canvas = (await import('html2canvas')).default
      const container = document.getElementById('certificate-container')
      if (!container) {
        setError('Elemen sertifikat tidak ditemukan.')
        return
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Gagal membuat gambar. Coba lagi.')
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = 'Sertifikat-Tsuha.id.png'
        link.href = url
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (err) {
      console.error('Download failed:', err)
      setError('Gagal mengunduh. Silakan coba lagi atau screenshot manual.')
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
