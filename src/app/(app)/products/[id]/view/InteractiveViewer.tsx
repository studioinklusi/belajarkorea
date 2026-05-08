'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FaArrowLeft, FaExpand, FaCompress } from 'react-icons/fa6'

type Product = {
  id: string
  title: string
  description: string | null
  file_path: string
  product_type: string
}

export default function InteractiveViewer({ product }: { product: Product }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/products"
            className="flex items-center gap-2 text-gray-500 hover:text-violet-600 transition-colors shrink-0"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-bold">Kembali</span>
          </Link>
          <div className="h-6 w-px bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">{product.title}</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Materi Interaktif</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-violet-100 text-violet-700 uppercase tracking-wider">
            🎮 Interaktif
          </span>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            title={isFullscreen ? 'Keluar fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Iframe Content */}
      <div className="flex-1 flex flex-col">
        <iframe
          src={product.file_path}
          className="flex-1 w-full border-0"
          style={{ minHeight: 'calc(100vh - 120px)' }}
          allow="autoplay; fullscreen; microphone"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title={product.title}
        />
      </div>
    </div>
  )
}
