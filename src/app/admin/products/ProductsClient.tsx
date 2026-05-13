'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaPlus, FaBoxOpen, FaDownload, FaPen, FaTrash, FaSpinner } from 'react-icons/fa6'
import AddProductForm from './AddProductForm'
import EditProductForm from './EditProductForm'

type Product = {
  id: string
  title: string
  description: string | null
  price: number
  file_path: string
  product_type: string
  is_active: boolean
  download_limit: number
  thumbnail_url: string | null
  created_at: string
}

export default function ProductsClient({ products }: { products: Product[] | null }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(productId: string, title: string) {
    if (!confirm(`Yakin ingin menghapus "${title}"? File juga akan ikut terhapus.`)) return

    setDeletingId(productId)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Gagal menghapus')
        return
      }

      if (data.soft_deleted) {
        alert('ℹ️ Produk ini sudah pernah dibeli, jadi dinonaktifkan saja (bukan dihapus) agar data pembelian tetap aman.')
      }

      router.refresh()
    } catch {
      alert('Terjadi kesalahan saat menghapus')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Produk Digital</h1>
          <p className="mt-2 text-gray-500 text-lg">Kelola E-Book, Template, dan berkas lainnya.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-violet-200"
        >
          <FaPlus /> Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {products && products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm">Produk</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm">Harga</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm">Status</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-sm text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FaBoxOpen className="text-xl" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{product.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                            <FaDownload /> {product.product_type.toUpperCase()} • Max {product.download_limit}x download
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">
                      Rp {product.price.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.is_active ? 'Aktif' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit produk"
                        >
                          <FaPen />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.title)}
                          disabled={deletingId === product.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === product.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBoxOpen className="text-2xl" />
            </div>
            <p className="text-gray-500 font-medium mb-4">Belum ada produk digital.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              <FaPlus className="inline mr-2" /> Tambah Produk Pertama
            </button>
          </div>
        )}
      </div>

      {showForm && <AddProductForm onClose={() => setShowForm(false)} />}
      {editingProduct && <EditProductForm product={editingProduct} onClose={() => setEditingProduct(null)} />}
    </>
  )
}
