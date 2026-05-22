'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaBars, FaXmark, FaBox, FaBook, FaUsers, FaChartLine, FaArrowLeft, FaRightFromBracket, FaGauge, FaCrown, FaBullhorn, FaTicket } from 'react-icons/fa6'

export default function AdminMobileNav({ signoutAction }: { signoutAction: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(path)
  }

  const getLinkClasses = (path: string) => {
    const baseClasses = "group flex items-center px-4 py-3 rounded-xl text-base font-bold transition-colors"
    if (isActive(path)) {
      return `${baseClasses} bg-violet-50 text-violet-700`
    }
    return `${baseClasses} text-gray-600 hover:bg-violet-50 hover:text-violet-700`
  }

  const getIconClasses = (path: string) => {
    const baseClasses = "w-5 h-5 mr-3"
    if (isActive(path)) {
      return `${baseClasses} text-violet-600`
    }
    return `${baseClasses} text-gray-400 group-hover:text-violet-500`
  }

  return (
    <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
            K
          </div>
          <span className="font-extrabold text-xl tracking-tight text-gray-900">
            Admin<span className="text-violet-600">Panel</span>
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 active:bg-violet-100 active:scale-95 rounded-xl transition-all"
        >
          {isOpen ? <FaXmark className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl flex flex-col z-50 animate-fade-in-up max-h-[calc(100vh-70px)] overflow-y-auto">
          <nav className="p-4 space-y-2">
            <Link href="/admin" onClick={() => setIsOpen(false)} className={getLinkClasses('/admin')}>
              <FaGauge className={getIconClasses('/admin')} />
              Dashboard Utama
            </Link>
            <Link href="/admin/courses" onClick={() => setIsOpen(false)} className={getLinkClasses('/admin/courses')}>
              <FaBook className={getIconClasses('/admin/courses')} />
              Kelola Kursus
            </Link>
            <Link href="/admin/products" onClick={() => setIsOpen(false)} className={getLinkClasses('/admin/products')}>
              <FaBox className={getIconClasses('/admin/products')} />
              Produk Digital
            </Link>
            <Link href="/admin/users" onClick={() => setIsOpen(false)} className={getLinkClasses('/admin/users')}>
              <FaUsers className={getIconClasses('/admin/users')} />
              Kelola Pengguna
            </Link>
            <Link href="/admin/packages" onClick={() => setIsOpen(false)} className={getLinkClasses('/admin/packages')}>
              <FaCrown className={getIconClasses('/admin/packages')} />
              Kelola Paket
            </Link>
            <Link href="/admin/promos" onClick={() => setIsOpen(false)} className={getLinkClasses('/admin/promos')}>
              <FaBullhorn className={getIconClasses('/admin/promos')} />
              Kelola Promo
            </Link>
            <Link href="/admin/vouchers" onClick={() => setIsOpen(false)} className={getLinkClasses('/admin/vouchers')}>
              <FaTicket className={getIconClasses('/admin/vouchers')} />
              Kode Voucher
            </Link>
            <Link href="/admin/transactions" onClick={() => setIsOpen(false)} className={getLinkClasses('/admin/transactions')}>
              <FaChartLine className={getIconClasses('/admin/transactions')} />
              Transaksi
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-100 space-y-2 bg-gray-50/50">
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-base font-bold text-gray-600 hover:text-violet-600 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white transition-colors">
              <FaArrowLeft className="w-5 h-5 text-gray-400" />
              Kembali ke App
            </Link>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="w-full text-left text-base font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors">
                <FaRightFromBracket className="w-5 h-5 text-rose-500" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
