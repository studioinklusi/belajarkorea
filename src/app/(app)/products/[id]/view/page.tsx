import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InteractiveViewer from './InteractiveViewer'

export default async function ProductViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirectTo=/products/${id}/view`)
  }

  // Check purchase
  const { data: purchase } = await supabase
    .from('product_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', id)
    .single()

  // Check admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile && ['content_admin', 'super_admin'].includes(profile.role)

  if (!purchase && !isAdmin) {
    redirect('/products')
  }

  // Get product details
  const { data: product } = await supabase
    .from('digital_products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) {
    redirect('/products')
  }

  return <InteractiveViewer product={product} />
}
