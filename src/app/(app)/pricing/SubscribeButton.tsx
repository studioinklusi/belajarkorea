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
  price,
  label,
  variant = 'default'
}: { 
  packageId: string, 
  price: number,
  label?: string,
  variant?: 'default' | 'renew'
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showVoucher, setShowVoucher] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false)
  const [voucherResult, setVoucherResult] = useState<{ discountAmount: number, finalPrice: number, code: string } | null>(null)
  const [voucherError, setVoucherError] = useState('')
  const router = useRouter()

  const handleCheckVoucher = async () => {
    if (!voucherCode.trim()) return
    setIsCheckingVoucher(true)
    setVoucherError('')
    
    try {
      const response = await fetch('/api/payment/check-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode, packageId })
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Voucher tidak valid')
      }
      
      setVoucherResult({
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
        code: voucherCode
      })
    } catch (error: any) {
      setVoucherError(error.message)
      setVoucherResult(null)
    } finally {
      setIsCheckingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setVoucherResult(null)
    setVoucherCode('')
    setVoucherError('')
  }

  const handleSubscribe = async () => {
    try {
      setIsLoading(true)

      const payload: any = { packageId }
      if (voucherResult?.code) {
        payload.voucherCode = voucherResult.code
      }

      // 1. Request token ke backend
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

      // Jika harga menjadi 0 setelah diskon (gratis), kita anggap langsung sukses (tanpa midtrans)
      if (data.isFree) {
        router.push('/dashboard?payment=success')
        return
      }

      // 2. Tampilkan popup Midtrans Snap
      window.snap.pay(data.token, {
        onSuccess: function (result: Record<string, unknown>) {
          console.log('Payment success!', result)
          router.push('/dashboard?payment=success')
        },
        onPending: function (result: Record<string, unknown>) {
          console.log('Payment pending!', result)
          router.push('/dashboard?payment=pending')
        },
        onError: function (result: Record<string, unknown>) {
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

    } catch (error: unknown) {
      console.error(error)
      alert((error as Error).message)
      setIsLoading(false)
    }
  }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p)
  }

  const defaultLabel = label || `Berlangganan ${formatPrice(price)}/bulan`

  const styles = variant === 'renew'
    ? `w-full py-3 px-6 border-2 border-indigo-500 rounded-md text-center font-medium ${
        isLoading 
          ? 'bg-indigo-50 text-indigo-300 cursor-not-allowed' 
          : 'bg-white text-indigo-600 hover:bg-indigo-50'
      } transition-colors duration-200`
    : `mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${
        isLoading 
          ? 'bg-indigo-400 cursor-not-allowed' 
          : 'bg-indigo-600 hover:bg-indigo-700'
      } text-white transition-colors duration-200`

  const displayedPrice = voucherResult ? voucherResult.finalPrice : price
  const activeLabel = label || (voucherResult ? `Bayar ${formatPrice(displayedPrice)}` : `Berlangganan ${formatPrice(price)}/bulan`)

  return (
    <div className={`w-full ${variant === 'default' ? 'mt-8' : 'mt-4'}`}>
      {!showVoucher && !voucherResult && (
        <button 
          onClick={() => setShowVoucher(true)}
          className="text-indigo-600 text-sm font-medium hover:text-indigo-800 mb-3 block w-full text-center"
        >
          Punya Kode Promo?
        </button>
      )}

      {showVoucher && !voucherResult && (
        <div className="mb-4">
          <div className="flex items-stretch gap-2">
            <input 
              type="text" 
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
            />
            <button 
              onClick={handleCheckVoucher}
              disabled={isCheckingVoucher || !voucherCode}
              className="bg-gray-900 text-white px-4 text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {isCheckingVoucher ? 'Cek...' : 'Pakai'}
            </button>
          </div>
          {voucherError && <p className="text-red-500 text-xs font-medium mt-1.5">{voucherError}</p>}
        </div>
      )}

      {voucherResult && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm relative">
          <button 
            onClick={handleRemoveVoucher}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 font-bold"
            title="Hapus Voucher"
          >
            ✕
          </button>
          <div className="font-bold text-emerald-800 mb-1">✅ Promo {voucherResult.code} diterapkan!</div>
          <div className="flex justify-between items-center text-emerald-700">
            <span>Potongan Harga:</span>
            <span className="font-bold">-{formatPrice(voucherResult.discountAmount)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className={styles}
      >
        {isLoading ? 'Memproses...' : activeLabel}
      </button>
    </div>
  )
}
