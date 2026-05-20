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
          router.push(`/login?redirectTo=/pricing`)
          return
        }
        throw new Error(data.error || 'Terjadi kesalahan')
      }

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

  const styles = variant === 'renew'
    ? `w-full py-3.5 px-6 border-2 border-indigo-500 rounded-xl text-center font-bold ${
        isLoading 
          ? 'bg-indigo-50 text-indigo-300 cursor-not-allowed' 
          : 'bg-white text-indigo-600 hover:bg-indigo-50'
      } transition-colors duration-200`
    : `block w-full py-3.5 px-6 border border-transparent rounded-xl text-center font-bold ${
        isLoading 
          ? 'bg-indigo-400 cursor-not-allowed' 
          : 'bg-indigo-600 hover:bg-indigo-700'
      } text-white transition-all duration-200 shadow-md hover:shadow-lg`

  const displayedPrice = voucherResult ? voucherResult.finalPrice : price
  const activeLabel = label || (voucherResult ? `Bayar ${formatPrice(displayedPrice)}` : `Berlangganan ${formatPrice(price)}/bulan`)

  return (
    <div className={`w-full ${variant === 'default' ? 'mt-6' : 'mt-4'}`}>
      {/* Promo Code Section — Always visible as a clear input */}
      {!voucherResult && (
        <div className="mb-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-indigo-400">
              <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Kode Promo
          </label>
          <div className="flex items-stretch gap-2">
            <input 
              type="text" 
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCheckVoucher() }}
              placeholder="Contoh: BELAJAR50"
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase transition-all"
            />
            <button 
              onClick={handleCheckVoucher}
              disabled={isCheckingVoucher || !voucherCode}
              className="bg-gray-800 text-white px-5 text-sm font-bold rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap"
            >
              {isCheckingVoucher ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cek
                </span>
              ) : 'Pakai'}
            </button>
          </div>
          {voucherError && (
            <p className="flex items-center gap-1 text-red-500 text-xs font-medium mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {voucherError}
            </p>
          )}
        </div>
      )}

      {/* Applied Voucher Badge */}
      {voucherResult && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <button 
            onClick={handleRemoveVoucher}
            className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Hapus Voucher"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
          <div className="flex items-center gap-2 font-bold text-emerald-800 mb-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-600">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Kode {voucherResult.code} diterapkan!
          </div>
          <div className="flex justify-between items-center text-emerald-700 pl-6">
            <span>Potongan harga:</span>
            <span className="font-bold text-emerald-800">-{formatPrice(voucherResult.discountAmount)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className={styles}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memproses...
          </span>
        ) : activeLabel}
      </button>
    </div>
  )
}

