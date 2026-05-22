import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Berlangganan | Tsuha.id',
  description: 'Akses semua materi pembelajaran bahasa Korea dengan berlangganan. Tidak ada trial, langsung mulai belajar hari ini!',
}
import SubscribeButton from './SubscribeButton'
import PricingClient from './PricingClient'
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
  let activePackageId: string | null = null
  let activePackageSlug: string | null = null

  if (user) {
    // Ambil subscription aktif beserta package_id (UUID) untuk matching yang akurat
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('package_id, status, expires_at, packages!inner(slug)')
      .eq('user_id', user.id)
      .in('status', ['active', 'grace_period'])
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single()
    
    if (sub) {
      activePackageId = sub.package_id
      activePackageSlug = (sub.packages as any)?.slug || null
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-12 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingClient packages={packages || []} activePackageId={activePackageId} activePackageSlug={activePackageSlug} />
        </div>
      </div>
    </div>
  )
}
