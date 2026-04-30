import { createClient } from '@/lib/supabase/server'
import ProductsClient from './ProductsClient'

export default async function AdminProductsPage() {
  const supabase = await createClient()

  // Fetch all digital products (admin melihat semua, termasuk draft)
  const { data: products } = await supabase
    .from('digital_products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <ProductsClient products={products} />
    </div>
  )
}
