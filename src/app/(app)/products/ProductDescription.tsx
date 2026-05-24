'use client'

import { useState } from 'react'

export default function ProductDescription({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Jika deskripsi pendek, tidak perlu tombol "Baca Selengkapnya"
  const isLongDescription = description && description.length > 80

  if (!description) return <div className="mb-4 flex-1" />

  const renderDescription = (text: string) => {
    // Regex untuk mendeteksi markdown link [Label](URL) ATAU raw URL
    const combinedRegex = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+)/g
    const parts = text.split(combinedRegex)
    
    return parts.map((part, index) => {
      // 1. Cek apakah bagian ini adalah Markdown Link: [Label](URL)
      const mdMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
      if (mdMatch) {
        const label = mdMatch[1]
        const url = mdMatch[2]
        
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-extrabold rounded-xl border border-violet-100 hover:border-violet-200 transition-all shadow-xs my-1 mr-2 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            {label}
          </a>
        )
      }
      
      // 2. Cek apakah bagian ini adalah Raw URL
      const isRawUrl = part.match(/^https?:\/\/[^\s]+$/)
      if (isRawUrl) {
        let displayName = part
        try {
          const urlObj = new URL(part)
          displayName = urlObj.hostname + (urlObj.pathname !== '/' ? (urlObj.pathname.length > 20 ? urlObj.pathname.substring(0, 20) + '...' : urlObj.pathname) : '')
        } catch (e) {
          // fallback
        }
        
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 hover:text-violet-800 hover:underline font-bold inline-flex items-center gap-0.5 break-all cursor-pointer"
          >
            {displayName}
            <svg className="w-3 h-3 inline shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )
      }
      
      // 3. Teks biasa
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
