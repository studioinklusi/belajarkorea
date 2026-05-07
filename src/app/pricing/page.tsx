import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Harga Berlangganan | BelajarKorea.id',
  description: 'Akses semua materi pembelajaran bahasa Korea dengan berlangganan. Tidak ada trial, langsung mulai belajar hari ini!',
}
import SubscribeButton from './SubscribeButton'

export default async function PricingPage() {
  const supabase = await createClient()

  // Ambil semua package yang aktif, urutkan dari harga terendah/sort_order
  const { data: packages, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching packages:', error)
  }

  // Cek apakah user sudah punya subscription aktif
  const { data: { user } } = await supabase.auth.getUser()
  let activePackageId = null

  if (user) {
    const { data: sub } = await supabase
      .from('v_active_subscriptions')
      .select('package_slug')
      .eq('user_id', user.id)
      .single()
    
    if (sub) {
      activePackageId = sub.package_slug
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:text-center">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Harga Berlangganan</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Pilih Paket Belajar Anda
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 sm:mx-auto">
            Akses semua materi pembelajaran bahasa Korea dengan berlangganan. Tidak ada trial, langsung mulai belajar hari ini!
          </p>
        </div>

        <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {packages?.map((pkg) => {
            const features = pkg.features as string[] || []
            const isActive = activePackageId === pkg.slug

            return (
              <div 
                key={pkg.id} 
                className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col ${
                  pkg.slug === 'pro' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
                }`}
              >
                {pkg.slug === 'pro' && (
                  <div className="absolute top-0 py-1.5 px-4 bg-indigo-500 rounded-full text-xs font-semibold uppercase tracking-wide text-white transform -translate-y-1/2 left-1/2 -translate-x-1/2">
                    Paling Populer
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{pkg.name}</h3>
                  <p className="absolute top-0 py-1.5 px-4 bg-indigo-50 rounded-full text-xs font-semibold text-indigo-600 transform -translate-y-1/2 mt-8 right-6">
                    {pkg.duration_days} Hari
                  </p>
                  <p className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-5xl font-extrabold tracking-tight">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pkg.price)}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-gray-500">{pkg.description}</p>
                  
                  <ul role="list" className="mt-6 space-y-6">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex">
                        <svg className="flex-shrink-0 w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-3 text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isActive ? (
                  <div className="mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium bg-green-100 text-green-800 cursor-default">
                    Paket Anda Saat Ini
                  </div>
                ) : (
                  <SubscribeButton packageId={pkg.id} price={pkg.price} />
                )}
              </div>
            )
          })}
        </div>
        
        {(!packages || packages.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            Belum ada paket yang dikonfigurasi oleh Admin.
          </div>
        )}
      </div>
    </div>
  )
}
