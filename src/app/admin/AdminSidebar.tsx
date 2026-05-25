'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaBox, FaBook, FaUsers, FaChartLine, FaArrowLeft, FaRightFromBracket, FaGauge, FaCrown, FaBullhorn, FaTicket, FaSpinner } from 'react-icons/fa6'

export default function AdminSidebar({ signoutAction }: { signoutAction: () => void }) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(path)
  }

  const getLinkClasses = (path: string) => {
    const baseClasses = "group flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
    if (isActive(path)) {
      return `${baseClasses} bg-violet-50 text-violet-700 active:bg-violet-100/70`
    }
    return `${baseClasses} text-gray-600 hover:bg-violet-50 hover:text-violet-700 active:bg-violet-100/50`
  }

  const getIconClasses = (path: string) => {
    const baseClasses = "w-5 h-5 mr-3"
    if (isActive(path)) {
      return `${baseClasses} text-violet-600`
    }
    return `${baseClasses} text-gray-400 group-hover:text-violet-500`
  }

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shadow-sm sticky top-0 h-screen shrink-0">
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <div className="flex-shrink-0 flex items-center gap-2">
          <img src="/logo.png" alt="Tsuha.id" className="w-8 h-8 rounded-lg shadow-md shadow-violet-500/20 object-cover" />
          <span className="font-extrabold text-xl tracking-tight text-gray-900">
            Admin<span className="text-violet-600">Panel</span>
          </span>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <Link href="/admin" className={getLinkClasses('/admin')}>
          <FaGauge className={getIconClasses('/admin')} />
          Dashboard Utama
        </Link>
        <Link href="/admin/courses" className={getLinkClasses('/admin/courses')}>
          <FaBook className={getIconClasses('/admin/courses')} />
          Kelola Kursus
        </Link>
        <Link href="/admin/products" className={getLinkClasses('/admin/products')}>
          <FaBox className={getIconClasses('/admin/products')} />
          Produk Digital
        </Link>
        <Link href="/admin/users" className={getLinkClasses('/admin/users')}>
          <FaUsers className={getIconClasses('/admin/users')} />
          Kelola Pengguna
        </Link>
        <Link href="/admin/packages" className={getLinkClasses('/admin/packages')}>
          <FaCrown className={getIconClasses('/admin/packages')} />
          Kelola Paket
        </Link>
        <Link href="/admin/promos" className={getLinkClasses('/admin/promos')}>
          <FaBullhorn className={getIconClasses('/admin/promos')} />
          Kelola Promo
        </Link>
        <Link href="/admin/vouchers" className={getLinkClasses('/admin/vouchers')}>
          <FaTicket className={getIconClasses('/admin/vouchers')} />
          Kode Voucher
        </Link>
        <Link href="/admin/transactions" className={getLinkClasses('/admin/transactions')}>
          <FaChartLine className={getIconClasses('/admin/transactions')} />
          Transaksi
        </Link>
      </nav>
      
      <div className="p-4 border-t border-gray-100 space-y-2 bg-gray-50/50">
        <Link href="/dashboard" className="text-sm font-bold text-gray-600 hover:text-violet-600 flex items-center gap-2 p-3 rounded-xl hover:bg-white active:scale-[0.98] active:bg-violet-50 transition-all">
          <FaArrowLeft className="w-4 h-4" />
          Kembali ke App
        </Link>
        <form 
          action="/auth/signout" 
          method="POST"
          onSubmit={() => setIsLoggingOut(true)}
        >
          <button 
            type="submit" 
            disabled={isLoggingOut}
            className="w-full text-left text-sm font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100/50 active:scale-[0.98] flex items-center gap-2 p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <FaSpinner className="w-4 h-4 text-rose-500 animate-spin" />
                Keluar...
              </>
            ) : (
              <>
                <FaRightFromBracket className="w-4 h-4 text-rose-500" />
                Keluar
              </>
            )}
          </button>
        </form>
      </div>
    </aside>
  )
}
