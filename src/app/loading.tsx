import { FaSpinner } from 'react-icons/fa6'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] font-sans">
      <div className="flex flex-col items-center">
        {/* Logo Container with Pulse Effect */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-3xl animate-pulse blur-md opacity-40"></div>
          <div className="absolute inset-1 bg-white rounded-2xl z-10 flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="Tsuha.id" className="w-14 h-14 object-contain animate-pulse" />
          </div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 tracking-tight mb-3">
          Tsuha.id
        </h2>
        <div className="flex items-center gap-2 text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <FaSpinner className="animate-spin text-violet-500 w-4 h-4" />
          <span className="text-sm font-bold tracking-wide">Memuat halaman...</span>
        </div>
      </div>
    </div>
  )
}
