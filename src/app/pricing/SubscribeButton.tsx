'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Declare window.snap for TypeScript
declare global {
  interface Window {
    snap: any
  }
}

export default function SubscribeButton({ 
  packageId, 
  price 
}: { 
  packageId: string, 
  price: number 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    try {
      setIsLoading(true)

      // 1. Request token ke backend
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // Belum login
          router.push(`/login?redirectTo=/pricing`)
          return
        }
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      // 2. Tampilkan popup Midtrans Snap
      window.snap.pay(data.token, {
        onSuccess: function (result: any) {
          console.log('Payment success!', result)
          router.push('/dashboard?payment=success')
        },
        onPending: function (result: any) {
          console.log('Payment pending!', result)
          router.push('/dashboard?payment=pending')
        },
        onError: function (result: any) {
          console.error('Payment error!', result)
          alert('Pembayaran gagal. Silakan coba lagi.')
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
      console.error(error)
      alert(error.message)
      setIsLoading(false)
    }
  }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p)
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${
        isLoading 
          ? 'bg-indigo-400 cursor-not-allowed' 
          : 'bg-indigo-600 hover:bg-indigo-700'
      } text-white transition-colors duration-200`}
    >
      {isLoading ? 'Memproses...' : `Berlangganan ${formatPrice(price)}/bulan`}
    </button>
  )
}
