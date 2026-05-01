import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/(auth)/auth/actions'
import { FaHandSparkles, FaRobot } from 'react-icons/fa6'
import MobileMenu from './MobileMenu'

export default async function Navbar({ activePage, isLandingPage }: { activePage?: 'dashboard' | 'courses' | 'products' | 'pricing', isLandingPage?: boolean }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  const linkClass = (page: string) => 
    activePage === page 
      ? "bg-violet-50 text-violet-700 px-4 py-2.5 rounded-full text-sm font-bold shadow-sm" 
      : "text-gray-500 hover:text-violet-600 px-4 py-2.5 rounded-full text-sm font-bold transition-colors"

  return (
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
                  <Link href="/courses" className="text-gray-600 hover:text-violet-600 px-4 py-2.5 font-bold transition-colors">Program Belajar</Link>
                  <Link href="/products" className="text-gray-600 hover:text-violet-600 px-4 py-2.5 font-bold transition-colors">Produk Digital</Link>
                  <Link href="/pricing" className="text-gray-600 hover:text-violet-600 px-4 py-2.5 font-bold transition-colors">Harga</Link>
                </>
              ) : (
                <>
                  {user && (
                    <Link href="/dashboard" className={linkClass('dashboard')}>Dashboard</Link>
                  )}
                  {user && (
                    <Link 
                      href="/ai-buddy" 
                      className="flex items-center gap-1.5 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 rounded-full text-sm font-bold hover:bg-violet-50 transition-colors"
                    >
                      <FaRobot className="text-violet-500 w-4 h-4" /> AI Buddy
                    </Link>
                  )}
                  <Link href="/courses" className={linkClass('courses')}>Program Belajar</Link>
                  <Link href="/products" className={linkClass('products')}>Produk Digital</Link>
                  <Link href="/pricing" className={linkClass('pricing')}>Harga</Link>
                  {isAdmin && (
                    <Link href="/admin" className="text-gray-500 hover:text-rose-600 px-4 py-2.5 rounded-full text-sm font-bold transition-colors">Panel Admin</Link>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              isLandingPage ? (
                <Link 
                  href="/dashboard" 
                  className="hidden md:block bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Dashboard Saya
                </Link>
              ) : (
                <>
                  <span className="text-sm font-bold text-gray-700 hidden sm:flex items-center gap-2">
                    안녕, {profile?.full_name?.split(' ')[0] || 'Chingu'}! <FaHandSparkles className="text-yellow-500" />
                  </span>
                  <form action={signout} className="hidden md:block">
                    <button
                      type="submit"
                      className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 px-5 py-2.5 rounded-full text-sm font-bold transition-colors"
                    >
                      Keluar
                    </button>
                  </form>
                </>
              )
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="text-gray-600 font-bold hover:text-gray-900 px-4 py-2">Masuk</Link>
                <Link 
                  href="/register" 
                  className="bg-violet-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-violet-700 transition-all shadow-md shadow-violet-200 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Mulai Belajar
                </Link>
              </div>
            )}
            <MobileMenu isLoggedIn={!!user} isAdmin={isAdmin} activePage={activePage} signoutAction={signout} />
          </div>
        </div>
      </div>
    </nav>
  )
}
