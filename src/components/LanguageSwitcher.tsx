'use client'

import { useTranslation } from '@/lib/i18n'
import { FaGlobe } from 'react-icons/fa6'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <button
      onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-violet-50 text-gray-600 hover:text-violet-700 text-sm font-bold transition-all border border-gray-200 hover:border-violet-200 shadow-sm"
      title={locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      aria-label={locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <FaGlobe className="w-4 h-4 text-violet-500" />
      <span className="text-xs uppercase tracking-wider">{locale === 'id' ? 'ID' : 'EN'}</span>
    </button>
  )
}
