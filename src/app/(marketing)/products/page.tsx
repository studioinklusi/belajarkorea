import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Produk Digital Bahasa Korea | BelajarKorea.id',
  description: 'Dapatkan berbagai produk digital seperti e-book, panduan, dan materi pembelajaran eksklusif untuk membantu Anda menguasai bahasa Korea.',
}
import BuyProductButton from './BuyProductButton'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import ProductDescription from './ProductDescription'

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('digital_products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
  }

  // Jika user login, kita bisa cek produk mana yang sudah mereka beli
  const { data: { user } } = await supabase.auth.getUser()
  const purchasedProductIds = new Set<string>()

  if (user) {
    const { data: purchases } = await supabase
      .from('product_purchases')
      .select('product_id')
      .eq('user_id', user.id)
    
    if (purchases) {
      purchases.forEach(p => purchasedProductIds.add(p.product_id))
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Produk Digital</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500 sm:mt-4">
            E-book, template, dan material tambahan untuk mendukung pembelajaran bahasa Korea Anda.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
          {products?.map((product) => {
            const isPurchased = purchasedProductIds.has(product.id)

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="h-48 bg-gray-200 relative">
                  {product.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold text-xl">
                      {product.product_type.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-800 uppercase">
                    {product.product_type}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{product.title}</h3>
                  <ProductDescription description={product.description || ''} />
                  
                  <div className="mt-auto">
                    {isPurchased ? (
                      <a 
                        href={`/api/products/download?id=${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Akses File
                      </a>
                    ) : (
                      <BuyProductButton productId={product.id} price={product.price} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
            Belum ada produk digital yang tersedia saat ini.
          </div>
        )}
      </div>
    </div>
  )
}
