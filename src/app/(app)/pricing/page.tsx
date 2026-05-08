import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Harga Berlangganan | Tsuha.id',
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
  let activePackageId = null

  if (user) {
    const { data: sub } = await supabase
      .from('v_active_subscriptions')
      .select('package_slug, computed_status, days_remaining')
      .eq('user_id', user.id).eq('computed_status', 'active')
      .single()
    
    // Only consider it "active" (blocking repurchase) if it's truly active
    // If it's grace_period or expired, allow them to repurchase
    if (sub && sub.computed_status === 'active') {
      activePackageId = sub.package_slug
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-12 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingClient packages={packages || []} activePackageId={activePackageId} />
        </div>
      </div>
    </div>
  )
}
