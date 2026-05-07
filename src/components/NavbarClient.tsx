'use client'

import Link from 'next/link'
import { FaHandSparkles, FaRobot, FaHouse, FaBookOpen, FaUser, FaBox } from 'react-icons/fa6'
import MobileMenu from './MobileMenu'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from '@/lib/i18n'

import { type User } from '@supabase/supabase-js'

interface NavbarClientProps {
  user: User | null
  profile: { role: string; full_name: string | null } | null
  isAdmin: boolean
  activePage?: 'dashboard' | 'courses' | 'products' | 'pricing' | 'ai-buddy'
  isLandingPage?: boolean
  signoutAction: () => void
}

export default function NavbarClient({ user, profile, isAdmin, activePage, isLandingPage, signoutAction }: NavbarClientProps) {
  const { t, locale } = useTranslation()

  const linkClass = (page: string) => 
    activePage === page 
      ? "bg-violet-50 text-violet-700 px-4 py-2.5 rounded-full text-sm font-bold shadow-sm" 
      : "text-gray-500 hover:text-violet-600 px-4 py-2.5 rounded-full text-sm font-bold transition-colors"

  return (
    <>
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center md:gap-6">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-500/30">
                K
              </div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-gray-900">
                belajarkorea<span className="text-violet-600">.id</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-2">
              {isLandingPage ? (
                <>
                  <Link href="/courses" className="text-gray-600 hover:text-violet-600 px-4 py-2.5 font-bold transition-colors">{t('common.courses')}</Link>
                  <Link href="/products" className="text-gray-600 hover:text-violet-600 px-4 py-2.5 font-bold transition-colors">{t('common.products')}</Link>
                  <Link href="/pricing" className="text-gray-600 hover:text-violet-600 px-4 py-2.5 font-bold transition-colors">{t('common.pricing')}</Link>
                </>
              ) : (
                <>
                  {user && (
                    <Link href="/dashboard" className={linkClass('dashboard')}>{t('common.dashboard')}</Link>
                  )}
                  {user && (
                    <Link 
                      href="/ai-buddy" 
                      className="flex items-center gap-1.5 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 rounded-full text-sm font-bold hover:bg-violet-50 transition-colors"
                    >
                      <FaRobot className="text-violet-500 w-4 h-4" /> {t('common.aiBuddy')}
                    </Link>
                  )}
                  <Link href="/courses" className={linkClass('courses')}>{t('common.courses')}</Link>
                  <Link href="/products" className={linkClass('products')}>{t('common.products')}</Link>
                  <Link href="/pricing" className={linkClass('pricing')}>{t('common.pricing')}</Link>
                  {isAdmin && (
                    <Link href="/admin" className="text-gray-500 hover:text-rose-600 px-4 py-2.5 rounded-full text-sm font-bold transition-colors">{t('common.adminPanel')}</Link>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* <LanguageSwitcher /> - Disabled temporarily as requested */}
            {user ? (
              isLandingPage ? (
                <Link 
                  href="/dashboard" 
                  className="hidden md:block bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {t('dashboard.myCourses')}
                </Link>
              ) : (
                <>
                  <span className="text-sm font-bold text-gray-700 hidden sm:flex items-center gap-2">
                    {locale === 'en' ? 'Hello' : '안녕'}, {profile?.full_name?.split(' ')[0] || 'Chingu'}! <FaHandSparkles className="text-yellow-500" />
                  </span>
                  <form action={signoutAction} className="hidden md:block">
                    <button
                      type="submit"
                      className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 px-5 py-2.5 rounded-full text-sm font-bold transition-colors"
                    >
                      {t('common.logout')}
                    </button>
                  </form>
                </>
              )
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="text-gray-600 font-bold hover:text-gray-900 px-4 py-2">{t('common.login')}</Link>
                <Link 
                  href="/register" 
                  className="bg-violet-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-violet-700 transition-all shadow-md shadow-violet-200 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {locale === 'en' ? 'Start Learning' : 'Mulai Belajar'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile Bottom Navigation (PWA style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-16 px-2">
          {/* 1. Beranda */}
          <Link 
            href="/" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              (!activePage && isLandingPage) ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FaHouse className={`w-5 h-5 transition-transform ${(!activePage && isLandingPage) ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold">Beranda</span>
          </Link>

          {/* 2. Program Belajar */}
          <Link 
            href="/courses" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activePage === 'courses' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FaBookOpen className={`w-5 h-5 transition-transform ${activePage === 'courses' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold">Belajar</span>
          </Link>

          {/* 3. AI Buddy / Produk */}
          {user ? (
            <Link 
              href="/ai-buddy" 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                activePage === 'ai-buddy' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <FaRobot className={`w-5 h-5 transition-transform ${activePage === 'ai-buddy' ? 'scale-110 text-violet-600' : ''}`} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse"></span>
              </div>
              <span className={`text-[10px] font-bold ${activePage === 'ai-buddy' ? 'text-violet-600' : 'text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500'}`}>AI Buddy</span>
            </Link>
          ) : (
            <Link 
              href="/products" 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                activePage === 'products' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaBox className={`w-5 h-5 transition-transform ${activePage === 'products' ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-bold">Produk</span>
            </Link>
          )}

          {/* 4. Dashboard / Login */}
          {user ? (
            <Link 
              href="/dashboard" 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                activePage === 'dashboard' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaUser className={`w-5 h-5 transition-transform ${activePage === 'dashboard' ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-bold">Profil</span>
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-gray-600"
            >
              <FaUser className="w-5 h-5" />
              <span className="text-[10px] font-bold">Masuk</span>
            </Link>
          )}
          
          {/* 5. Mobile Menu (More) */}
          <div className="md:hidden flex flex-col items-center justify-center w-full h-full">
            <MobileMenu isLoggedIn={!!user} isAdmin={isAdmin} activePage={activePage} signoutAction={signoutAction} isLandingPage={isLandingPage} />
          </div>
        </div>
      </div>
    </>
  )
}
