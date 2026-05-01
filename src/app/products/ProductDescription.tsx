'use client'

import { useState } from 'react'

export default function ProductDescription({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Jika deskripsi pendek, tidak perlu tombol "Baca Selengkapnya"
  const isLongDescription = description && description.length > 80

  if (!description) return <div className="mb-4 flex-1" />

  return (
    <div className="mb-4 flex-1 flex flex-col">
      <p className={`text-sm text-gray-500 transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''}`}>
        {description}
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
