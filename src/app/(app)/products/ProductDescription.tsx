'use client'

import { useState } from 'react'

export default function ProductDescription({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Jika deskripsi pendek, tidak perlu tombol "Baca Selengkapnya"
  const isLongDescription = description && description.length > 80

  if (!description) return <div className="mb-4 flex-1" />

  const renderDescription = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        let displayName = part
        try {
          const urlObj = new URL(part)
          // Tampilkan hostname + path awal agar tidak terlalu panjang
          displayName = urlObj.hostname + (urlObj.pathname !== '/' ? (urlObj.pathname.length > 20 ? urlObj.pathname.substring(0, 20) + '...' : urlObj.pathname) : '')
        } catch (e) {
          // fallback jika parsing gagal
        }
        
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 hover:text-violet-800 hover:underline font-bold inline-flex items-center gap-0.5 break-all"
          >
            {displayName}
            <svg className="w-3 h-3 inline shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )
      }
      return part
    })
  }

  return (
    <div className="mb-4 flex-1 flex flex-col">
      <p className={`text-sm text-gray-500 whitespace-pre-line transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''}`}>
        {renderDescription(description)}
      </p>
      {isLongDescription && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 w-max transition-colors"
        >
          {isExpanded ? 'Tutup Detail' : 'Baca Selengkapnya'}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  )
}
