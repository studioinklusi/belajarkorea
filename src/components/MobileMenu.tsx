'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaEllipsis, FaXmark, FaRightFromBracket, FaGear, FaTag, FaShieldHalved } from 'react-icons/fa6'

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
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
          isOpen ? 'text-violet-600' : 'text-gray-400'
        }`}
        aria-label="Menu Lainnya"
      >
        {isOpen ? <FaXmark className="w-5 h-5" /> : <FaEllipsis className="w-5 h-5" />}
        <span className="text-[10px] font-bold">Lainnya</span>
      </button>

      {/* Bottom Sheet Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55]" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu Panel */}
          <div className="fixed bottom-16 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] py-5 px-4 z-[56] animate-slide-up">
            {/* Handle bar */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            
            <div className="flex flex-col gap-1">
              {/* Pricing */}
              <Link 
                href="/pricing" 
                onClick={() => setIsOpen(false)} 
                className="flex items-center gap-3 text-gray-700 hover:bg-violet-50 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                <FaTag className="w-4 h-4 text-violet-500" />
                Harga & Paket
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
              {isLoggedIn && signoutAction && (
                <div className="mt-1 pt-2 border-t border-gray-100">
                  <form action={signoutAction}>
                    <button 
                      type="submit" 
                      onClick={() => setIsOpen(false)} 
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
