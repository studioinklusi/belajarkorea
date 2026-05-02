'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BuyProductButton({ 
  productId, 
  price 
}: { 
  productId: string, 
  price: number 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleBuy = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/payment/create-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/login?redirectTo=/products`)
          return
        }
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      window.snap.pay(data.token, {
        onSuccess: function (result: any) {
          router.push('/dashboard?payment=success')
        },
        onPending: function (result: any) {
          router.push('/dashboard?payment=pending')
        },
        onError: function (result: any) {
          alert('Pembayaran gagal.')
          setIsLoading(false)
        },
        onClose: function () {
          // User menutup popup tanpa bayar — tandai transaksi sebagai expired
          fetch('/api/payment/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderId })
          }).catch(console.error)
          setIsLoading(false)
        }
      })

    } catch (error: any) {
      alert(error.message)
      setIsLoading(false)
    }
  }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p)
  }

  return (
    <button
      onClick={handleBuy}
      disabled={isLoading}
      className={`w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white ${
        isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
      } transition-colors`}
    >
      {isLoading ? 'Memproses...' : `Beli Sekarang (${formatPrice(price)})`}
    </button>
  )
}
