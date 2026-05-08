'use client'

import { FaPrint } from 'react-icons/fa6'

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
    >
      <FaPrint className="w-4 h-4" /> 
      <span className="hidden sm:inline">Cetak / Simpan PDF</span>
    </button>
  )
}
