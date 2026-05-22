'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FaHandSparkles, FaRobot, FaHouse, FaBookOpen, FaUser, FaBox, FaDownload,
  FaChevronDown, FaUserShield, FaArrowRightFromBracket, FaGraduationCap, FaLayerGroup,
  FaXmark, FaGamepad
} from 'react-icons/fa6'
import MobileMenu from './MobileMenu'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from '@/lib/i18n'

import { usePathname } from 'next/navigation'
import { type User } from '@supabase/supabase-js'

interface NavbarClientProps {
  user: User | null
  profile: { role: string; full_name: string | null } | null
  isAdmin: boolean
  isLandingPage?: boolean
  signoutAction: () => void
}

export default function NavbarClient({ user, profile, isAdmin, isLandingPage, signoutAction }: NavbarClientProps) {
  const { t, locale } = useTranslation()
  const pathname = usePathname()
  
  const [isLearningOpen, setIsLearningOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileLearningOpen, setIsMobileLearningOpen] = useState(false)
  
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('#learning-dropdown-btn') && !target.closest('#learning-dropdown-menu')) {
        setIsLearningOpen(false)
      }
      if (!target.closest('#profile-dropdown-btn') && !target.closest('#profile-dropdown-menu')) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Auto close mobile learning sheet on path change
  useEffect(() => {
    setIsMobileLearningOpen(false)
  }, [pathname])
  
  let activePage = ''
  if (pathname) {
    if (pathname.startsWith('/dashboard')) activePage = 'dashboard'
    else if (pathname.startsWith('/courses')) activePage = 'courses'
    else if (pathname.startsWith('/stories')) activePage = 'stories'
    else if (pathname.startsWith('/flashcards')) activePage = 'flashcards'
    else if (pathname.startsWith('/products')) activePage = 'products'
    else if (pathname.startsWith('/pricing')) activePage = 'pricing'
    else if (pathname.startsWith('/ai-buddy')) activePage = 'ai-buddy'
    else if (pathname.startsWith('/quiz-games')) activePage = 'quiz-games'
    else if (pathname.startsWith('/profile')) activePage = 'profile'
  }

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
              <img src="/logo.png" alt="Tsuha.id" className="w-10 h-10 rounded-xl shadow-lg shadow-violet-500/30 object-cover" />
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-gray-900">
                Tsuha<span className="text-violet-600">.id</span>
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
                    <div className="relative">
                      <button
                        id="learning-dropdown-btn"
                        onClick={() => {
                          setIsLearningOpen(!isLearningOpen);
                          setIsProfileOpen(false);
                        }}
                        className={`flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                          isLearningOpen || ['courses', 'stories', 'flashcards', 'ai-buddy', 'quiz-games'].includes(activePage)
                            ? "bg-violet-50 text-violet-700 shadow-sm"
                            : "text-gray-500 hover:text-violet-600 hover:bg-gray-50"
                        }`}
                      >
                        Belajar
                        <FaChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${isLearningOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isLearningOpen && (
                        <div 
                          id="learning-dropdown-menu" 
                          className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 bg-white rounded-3xl border border-gray-100 shadow-2xl p-4 z-50 grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                          <Link 
                            href="/courses" 
                            onClick={() => setIsLearningOpen(false)}
                            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-violet-50/50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold shrink-0">
                              <FaGraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-gray-900 group-hover:text-violet-700 transition-colors">Kursus Mandiri</p>
                              <p className="text-[11px] text-gray-400 font-semibold leading-none mt-0.5">Video & materi terstruktur</p>
                            </div>
                          </Link>

                          <Link 
                            href="/stories" 
                            onClick={() => setIsLearningOpen(false)}
                            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-orange-50/50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                              <FaBookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-gray-900 group-hover:text-orange-700 transition-colors">Membaca Cerita</p>
                              <p className="text-[11px] text-gray-400 font-semibold leading-none mt-0.5">Ketuk terjemah interaktif</p>
                            </div>
                          </Link>

                          <Link 
                            href="/flashcards" 
                            onClick={() => setIsLearningOpen(false)}
                            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-emerald-50/50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                              <FaLayerGroup className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors">Flashcard & SRS</p>
                              <p className="text-[11px] text-gray-400 font-semibold leading-none mt-0.5">Spaced repetition kosakata</p>
                            </div>
                          </Link>

                          <Link 
                            href="/ai-buddy" 
                            onClick={() => setIsLearningOpen(false)}
                            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-fuchsia-50/50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center font-bold shrink-0">
                              <FaRobot className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-gray-900 group-hover:text-fuchsia-700 transition-colors">AI Buddy</p>
                              <p className="text-[11px] text-gray-400 font-semibold leading-none mt-0.5">Percakapan interaktif AI</p>
                            </div>
                          </Link>

                          <Link 
                            href="/quiz-games" 
                            onClick={() => setIsLearningOpen(false)}
                            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-pink-50/50 hover:backdrop-blur-md transition-all duration-300 transform hover:scale-[1.02] group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-100 via-amber-50 to-sky-100 text-pink-600 flex items-center justify-center font-bold shrink-0 shadow-xs border border-pink-200/30">
                              <FaGamepad className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-gray-900 group-hover:text-pink-700 transition-colors">Quiz & Games</p>
                              <p className="text-[11px] text-gray-400 font-semibold leading-none mt-0.5">Tebak Hangul & latihan interaktif</p>
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                  <Link href="/products" className={linkClass('products')}>{t('common.products')}</Link>
                  <Link href="/pricing" className={linkClass('pricing')}>{t('common.pricing')}</Link>
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
                <div className="relative hidden md:block">
                  <button
                    id="profile-dropdown-btn"
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsLearningOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-1.5 pr-3 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-100 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-extrabold text-gray-700 max-w-[90px] truncate leading-none">
                      {profile?.full_name?.split(' ')[0] || 'Chingu'}
                    </span>
                    <FaChevronDown className={`w-2.5 h-2.5 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div 
                      id="profile-dropdown-menu" 
                      className="absolute right-0 mt-3 w-64 bg-white rounded-3xl border border-gray-100 shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      <div className="px-5 py-2.5 border-b border-gray-50 mb-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider leading-none mb-1">Masuk Sebagai</p>
                        <p className="text-sm font-extrabold text-gray-900 truncate leading-tight">{profile?.full_name || 'User Tsuha'}</p>
                        <p className="text-[11px] font-semibold text-gray-500 truncate mt-0.5">{user.email}</p>
                        <div className="inline-block mt-2 px-2.5 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                          {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role === 'content_admin' ? 'Admin Konten' : 'Member'}
                        </div>
                      </div>

                      <div className="px-2 space-y-0.5">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-extrabold text-gray-600 hover:text-violet-700 hover:bg-violet-50/50 rounded-2xl transition-colors"
                        >
                          <FaUser className="w-4 h-4 text-violet-500" /> Profil Saya
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-extrabold text-gray-600 hover:text-rose-700 hover:bg-rose-50/50 rounded-2xl transition-colors"
                          >
                            <FaUserShield className="w-4 h-4 text-rose-500" /> Panel Admin
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            window.dispatchEvent(new Event('trigger-pwa-install'));
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-extrabold text-gray-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-2xl transition-colors text-left cursor-pointer"
                        >
                          <FaDownload className="w-4 h-4 text-blue-500" /> Install Aplikasi
                        </button>
                      </div>

                      <div className="border-t border-gray-50 my-2"></div>

                      <div className="px-2">
                        <form action={signoutAction} className="w-full">
                          <button
                            type="submit"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-extrabold text-gray-600 hover:text-red-700 hover:bg-red-50/50 rounded-2xl transition-colors text-left cursor-pointer"
                          >
                            <FaArrowRightFromBracket className="w-4 h-4 text-red-500" /> Keluar
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
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
          {/* 1. Beranda / Dashboard */}
          <Link 
            href={user ? "/dashboard" : "/"} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              (user ? activePage === 'dashboard' : (!activePage && isLandingPage)) ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FaHouse className={`w-5 h-5 transition-transform ${(user ? activePage === 'dashboard' : (!activePage && isLandingPage)) ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold">Beranda</span>
          </Link>

          {/* 2. Program Belajar (Mobile: Opens Bottom Sheet if logged in, otherwise goes to courses) */}
          {user ? (
            <button 
              onClick={() => setIsMobileLearningOpen(true)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                ['courses', 'stories', 'flashcards', 'ai-buddy', 'quiz-games'].includes(activePage) ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaBookOpen className={`w-5 h-5 transition-transform ${['courses', 'stories', 'flashcards', 'ai-buddy', 'quiz-games'].includes(activePage) ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-bold">Belajar</span>
            </button>
          ) : (
            <Link 
              href="/courses" 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                activePage === 'courses' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaBookOpen className={`w-5 h-5 transition-transform ${activePage === 'courses' ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-bold">Belajar</span>
            </Link>
          )}

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

          {/* 4. Profil / Login */}
          {user ? (
            <Link 
              href="/profile" 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                activePage === 'profile' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaUser className={`w-5 h-5 transition-transform ${activePage === 'profile' ? 'scale-110' : ''}`} />
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

      {/* Mobile Learning Modules Bottom Sheet */}
      {isMobileLearningOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity md:hidden" 
            onClick={() => setIsMobileLearningOpen(false)} 
          />
          
          {/* Menu Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] pt-4 pb-safe z-[61] animate-slide-up flex flex-col md:hidden">
            {/* Header / Handle */}
            <div className="flex justify-between items-center px-6 pb-2">
              <span className="text-sm font-black text-gray-900">Menu Belajar</span>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              <button 
                onClick={() => setIsMobileLearningOpen(false)} 
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full"
              >
                <FaXmark className="w-4 h-4" />
              </button>
            </div>
            
            {/* Learning Modules Options */}
            <div className="flex flex-col gap-2 px-4 pb-6 mt-3 max-h-[70vh] overflow-y-auto">
              <Link 
                href="/courses" 
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${
                  activePage === 'courses' 
                    ? 'bg-violet-50/70 border-violet-100' 
                    : 'hover:bg-gray-50 border-transparent'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold shrink-0">
                  <FaGraduationCap className="w-5.5 h-5.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-gray-900">Kursus Mandiri</p>
                  <p className="text-[11px] text-gray-400 font-semibold leading-tight mt-0.5">Video materi terstruktur gratis & interaktif</p>
                </div>
              </Link>

              <Link 
                href="/stories" 
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${
                  activePage === 'stories' 
                    ? 'bg-orange-50/70 border-orange-100' 
                    : 'hover:bg-gray-50 border-transparent'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                  <FaBookOpen className="w-5.5 h-5.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-gray-900">Membaca Cerita</p>
                  <p className="text-[11px] text-gray-400 font-semibold leading-tight mt-0.5">Ketuk kosa kata terjemah & jadikan flashcard</p>
                </div>
              </Link>

              <Link 
                href="/flashcards" 
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${
                  activePage === 'flashcards' 
                    ? 'bg-emerald-50/70 border-emerald-100' 
                    : 'hover:bg-gray-50 border-transparent'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <FaLayerGroup className="w-5.5 h-5.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-gray-900">Flashcard & SRS</p>
                  <p className="text-[11px] text-gray-400 font-semibold leading-tight mt-0.5">Hafalkan kosa kata dengan metode Leitner Box</p>
                </div>
              </Link>

              <Link 
                href="/ai-buddy" 
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${
                  activePage === 'ai-buddy' 
                    ? 'bg-fuchsia-50/70 border-fuchsia-100' 
                    : 'hover:bg-gray-50 border-transparent'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center font-bold shrink-0">
                  <FaRobot className="w-5.5 h-5.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-gray-900">AI Buddy</p>
                  <p className="text-[11px] text-gray-400 font-semibold leading-tight mt-0.5">Latihan percakapan bahasa Korea secara langsung</p>
                </div>
              </Link>

              <Link 
                href="/quiz-games" 
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${
                  activePage === 'quiz-games' 
                    ? 'bg-pink-50/70 border-pink-100' 
                    : 'hover:bg-pink-50/30 border-transparent hover:scale-[1.01] transform duration-200'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-100 via-amber-50 to-sky-100 text-pink-600 flex items-center justify-center font-bold shrink-0 shadow-xs border border-pink-200/30">
                  <FaGamepad className="w-5.5 h-5.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-gray-900">Quiz & Games</p>
                  <p className="text-[11px] text-gray-400 font-semibold leading-tight mt-0.5">Tebak Hangul & latihan interaktif</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}

