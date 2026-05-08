'use client'

import { useState } from 'react'
import SubscribeButton from './SubscribeButton'

export default function PricingClient({ 
  packages, 
  activePackageId 
}: { 
  packages: any[], 
  activePackageId: string | null 
}) {
  // Temukan semua durasi unik yang tersedia dari database
  const availableDurations = Array.from(new Set(packages.map(p => p.duration_days))).sort((a, b) => a - b)
  
  // Default durasi aktif adalah durasi terkecil (biasanya 30 hari)
  const [activeDuration, setActiveDuration] = useState<number>(availableDurations[0] || 30)

  // Filter paket berdasarkan durasi yang dipilih
  const filteredPackages = packages.filter(p => p.duration_days === activeDuration)

  const getDurationLabel = (days: number) => {
    if (days <= 31) return '1 Bulan'
    if (days <= 92) return '3 Bulan'
    if (days <= 184) return '6 Bulan'
    return '1 Tahun'
  }

  const getDiscountLabel = (days: number) => {
    if (days <= 31) return null
    if (days <= 92) return 'Hemat 15%'
    if (days <= 184) return 'Hemat 25%'
    return 'Hemat 35%'
  }

  return (
    <>
      <div className="sm:text-center">
        <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Harga Berlangganan</h2>
        <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
          Pilih Paket Belajar Anda
        </p>
        <p className="mt-4 max-w-2xl text-xl text-gray-500 sm:mx-auto">
          Akses semua materi pembelajaran bahasa Korea dengan berlangganan. Tidak ada trial, langsung mulai belajar hari ini!
        </p>
      </div>

      {/* Toggle Durasi (Hanya muncul jika ada lebih dari 1 durasi) */}
      {availableDurations.length > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="relative flex p-1 bg-white border border-gray-200 rounded-full shadow-sm">
            {availableDurations.map((d) => {
              const isActive = activeDuration === d
              const discount = getDiscountLabel(d)
              
              return (
                <button
                  key={d}
                  onClick={() => setActiveDuration(d)}
                  className={`relative flex-1 py-2.5 px-6 rounded-full text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-violet-600 text-white shadow-md transform scale-105' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {getDurationLabel(d)}
                  
                  {discount && (
                    <span className={`absolute -top-3 -right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm ${
                      isActive ? 'bg-fuchsia-500 text-white' : 'bg-fuchsia-100 text-fuchsia-600'
                    }`}>
                      {discount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className={`mt-12 grid gap-8 ${filteredPackages.length === 1 ? 'max-w-md mx-auto' : filteredPackages.length === 2 ? 'max-w-4xl mx-auto lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {filteredPackages.map((pkg) => {
          const features = pkg.features as string[] || []
          
          // Cek apakah paket ini sedang aktif
          // (Menggunakan slug base, contoh: pro-3-month -> pro)
          // Ini agar tombol "Perpanjang" tetap muncul di paket 3 bulan jika user punya paket pro bulanan
          const baseSlug = pkg.slug.split('-')[0]
          const activeBaseSlug = activePackageId ? activePackageId.split('-')[0] : null
          const isActiveGroup = activeBaseSlug === baseSlug

          return (
            <div 
              key={pkg.id} 
              className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col transition-all hover:shadow-lg ${
                baseSlug === 'pro' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
              }`}
            >
              {baseSlug === 'pro' && (
                <div className="absolute top-0 py-1.5 px-4 bg-indigo-500 rounded-full text-xs font-semibold uppercase tracking-wide text-white transform -translate-y-1/2 left-1/2 -translate-x-1/2 shadow-sm">
                  Paling Populer
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{pkg.name}</h3>
                <p className="absolute top-0 py-1.5 px-4 bg-indigo-50 rounded-full text-xs font-semibold text-indigo-600 transform -translate-y-1/2 mt-8 right-6">
                  {pkg.duration_days} Hari
                </p>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pkg.price)}
                  </span>
                </p>
                <p className="mt-2 text-sm text-gray-500">{pkg.description}</p>
                
                <ul role="list" className="mt-6 space-y-4">
                  {features.map((feature, idx) => {
                    const isNegative = feature.toUpperCase().includes('TIDAK ADA') || feature.toUpperCase().includes('TANPA');
                    return (
                      <li key={idx} className={`flex ${isNegative ? 'opacity-60' : ''}`}>
                        {isNegative ? (
                          <svg className="flex-shrink-0 w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="flex-shrink-0 w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span className="ml-3 text-gray-500 text-sm">{feature}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {isActiveGroup ? (
                <div className="mt-8 space-y-3">
                  <div className="w-full py-2.5 px-4 rounded-lg text-center text-sm font-bold bg-green-50 text-green-700 border border-green-200 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    Paket Aktif Anda
                  </div>
                  <SubscribeButton packageId={pkg.id} price={pkg.price} label={`Perpanjang +${pkg.duration_days} Hari`} variant="renew" />
                </div>
              ) : (
                <SubscribeButton packageId={pkg.id} price={pkg.price} />
              )}
            </div>
          )
        })}
      </div>
      
      {(!packages || packages.length === 0) && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300 mt-12">
          Belum ada paket yang dikonfigurasi.
        </div>
      )}
    </>
  )
}
