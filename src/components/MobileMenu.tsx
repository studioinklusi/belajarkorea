'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaBars, FaXmark, FaRobot, FaRightFromBracket } from 'react-icons/fa6'

interface MobileMenuProps {
  isLoggedIn: boolean
  isAdmin: boolean
  activePage?: string
  signoutAction?: () => void
}

export default function MobileMenu({ isLoggedIn, isAdmin, activePage, signoutAction }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const linkClass = (page: string) => 
    activePage === page 
      ? "block bg-violet-50 text-violet-700 px-4 py-3 rounded-xl text-base font-bold" 
      : "block text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl text-base font-bold transition-colors"

  return (
    <div className="md:hidden flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 active:bg-violet-100 active:scale-95 rounded-xl transition-all"
        aria-label="Toggle Menu"
      >
        {isOpen ? <FaXmark className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-2xl py-4 px-4 flex flex-col gap-2 z-50 animate-fade-in-up">
          {isLoggedIn && (
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className={linkClass('dashboard')}>
              Dashboard
            </Link>
          )}
          {isLoggedIn && (
            <Link 
              href="/ai-buddy" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-4 py-3 rounded-xl text-base font-bold shadow-md"
            >
              <FaRobot className="w-5 h-5" /> AI Korean Buddy
            </Link>
          )}
          <Link href="/courses" onClick={() => setIsOpen(false)} className={linkClass('courses')}>
            Program Belajar
          </Link>
          <Link href="/products" onClick={() => setIsOpen(false)} className={linkClass('products')}>
            Produk Digital
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-violet-600 hover:bg-violet-50 px-4 py-3 rounded-xl text-base font-bold transition-colors mt-2 border-t border-gray-100 pt-4">
              Panel Admin
            </Link>
          )}
          {isLoggedIn && signoutAction && (
            <div className={isAdmin ? "" : "mt-2 border-t border-gray-100 pt-4"}>
              <form action={signoutAction}>
                <button type="submit" onClick={() => setIsOpen(false)} className="w-full text-left text-base font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors">
                  <FaRightFromBracket className="w-5 h-5 text-rose-500" />
                  Keluar
                </button>
              </form>
            </div>
          )}
          {!isLoggedIn && (
            <div className="mt-2 border-t border-gray-100 pt-4 flex flex-col gap-2">
              <Link href="/login" onClick={() => setIsOpen(false)} className="block text-center text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl text-base font-bold transition-colors">
                Masuk
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)} className="block text-center bg-violet-600 text-white px-4 py-3 rounded-xl text-base font-bold shadow-md hover:bg-violet-700 transition-colors">
                Mulai Belajar
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
