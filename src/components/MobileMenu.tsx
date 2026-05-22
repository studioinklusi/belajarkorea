'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaEllipsis, FaXmark, FaRightFromBracket, FaGear, FaTag, FaShieldHalved, FaDownload } from 'react-icons/fa6'

interface MobileMenuProps {
  isLoggedIn: boolean
  isAdmin: boolean
  activePage?: string
  signoutAction?: () => void
  isLandingPage?: boolean
}

export default function MobileMenu({ isLoggedIn, isAdmin, activePage, signoutAction, isLandingPage }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger Button - shown as "More" icon in bottom nav */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-gray-600"
        aria-label="Menu Lainnya"
      >
        <FaEllipsis className="w-5 h-5" />
        <span className="text-[10px] font-bold">Lainnya</span>
      </button>

      {/* Bottom Sheet Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] pt-4 pb-safe z-[61] animate-slide-up flex flex-col">
            {/* Header / Handle */}
            <div className="flex justify-between items-center px-6 pb-2">
              <div className="w-6 h-6"></div> {/* Spacer for centering handle */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              <button onClick={() => setIsOpen(false)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full">
                <FaXmark className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1 px-4 pb-4 mt-2">
              {/* Pricing */}
              <Link 
                href="/pricing" 
                onClick={() => setIsOpen(false)} 
                className="flex items-center gap-3 text-gray-700 hover:bg-violet-50 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                <FaTag className="w-4 h-4 text-violet-500" />
                Berlangganan
              </Link>

              {/* Products */}
              <Link 
                href="/products" 
                onClick={() => setIsOpen(false)} 
                className="flex items-center gap-3 text-gray-700 hover:bg-violet-50 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                <FaGear className="w-4 h-4 text-gray-400" />
                Produk Digital
              </Link>

              {/* Install App */}
              <button 
                onClick={() => {
                  setIsOpen(false)
                  window.dispatchEvent(new Event('trigger-pwa-install'))
                }} 
                className="flex items-center gap-3 text-violet-700 bg-violet-50 hover:bg-violet-100 px-4 py-3 rounded-xl text-sm font-bold transition-colors w-full text-left"
              >
                <FaDownload className="w-4 h-4 text-violet-600" />
                Install Aplikasi
              </button>

              {/* Admin Panel */}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  onClick={() => setIsOpen(false)} 
                  className="flex items-center gap-3 text-gray-700 hover:bg-violet-50 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
                >
                  <FaShieldHalved className="w-4 h-4 text-rose-500" />
                  Panel Admin
                </Link>
              )}

              {/* Logout */}
              {isLoggedIn && (
                <div className="mt-1 pt-2 border-t border-gray-100">
                  <form action="/auth/signout" method="POST">
                    <button 
                      type="submit" 
                      className="w-full flex items-center gap-3 text-rose-600 hover:bg-rose-50 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                      <FaRightFromBracket className="w-4 h-4" />
                      Keluar
                    </button>
                  </form>
                </div>
              )}

              {/* Login/Register for guests */}
              {!isLoggedIn && (
                <div className="mt-1 pt-2 border-t border-gray-100 flex flex-col gap-2">
                  <Link 
                    href="/login" 
                    onClick={() => setIsOpen(false)} 
                    className="block text-center text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setIsOpen(false)} 
                    className="block text-center bg-violet-600 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-violet-700 transition-colors"
                  >
                    Mulai Belajar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
