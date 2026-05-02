import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '../(auth)/auth/actions'
import { FaBox, FaBook, FaUsers, FaChartLine, FaArrowLeft, FaRightFromBracket, FaGauge } from 'react-icons/fa6'
import AdminMobileNav from './AdminMobileNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || !['content_admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header & Nav */}
      <AdminMobileNav signoutAction={signout} />

      {/* Sidebar Admin (Desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shadow-sm sticky top-0 h-screen shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
              K
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              Admin<span className="text-violet-600">Panel</span>
            </span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <Link href="/admin" className="text-gray-600 hover:bg-violet-50 hover:text-violet-700 group flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-colors">
            <FaGauge className="w-5 h-5 mr-3 text-gray-400 group-hover:text-violet-500" />
            Dashboard Utama
          </Link>
          <Link href="/admin/courses" className="text-gray-600 hover:bg-violet-50 hover:text-violet-700 group flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-colors">
            <FaBook className="w-5 h-5 mr-3 text-gray-400 group-hover:text-violet-500" />
            Kelola Kursus
          </Link>
          <Link href="/admin/products" className="text-gray-600 hover:bg-violet-50 hover:text-violet-700 group flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-colors">
            <FaBox className="w-5 h-5 mr-3 text-gray-400 group-hover:text-violet-500" />
            Produk Digital
          </Link>
          <Link href="/admin/users" className="text-gray-600 hover:bg-violet-50 hover:text-violet-700 group flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-colors">
            <FaUsers className="w-5 h-5 mr-3 text-gray-400 group-hover:text-violet-500" />
            Kelola Pengguna
          </Link>
          <Link href="/admin/transactions" className="text-gray-600 hover:bg-violet-50 hover:text-violet-700 group flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-colors">
            <FaChartLine className="w-5 h-5 mr-3 text-gray-400 group-hover:text-violet-500" />
            Transaksi
          </Link>
        </nav>
        
        <div className="p-4 border-t border-gray-100 space-y-2 bg-gray-50/50">
          <Link href="/dashboard" className="text-sm font-bold text-gray-600 hover:text-violet-600 flex items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors">
            <FaArrowLeft className="w-4 h-4" />
            Kembali ke App
          </Link>
          <form action={signout}>
            <button type="submit" className="w-full text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 p-3 rounded-xl transition-colors">
              <FaRightFromBracket className="w-4 h-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Admin */}
      <main className="flex-1 overflow-y-auto h-screen bg-[#FAFAFA]">
        {children}
      </main>
    </div>
  )
}
