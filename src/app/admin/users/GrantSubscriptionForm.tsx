'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaXmark, FaSpinner, FaCircleCheck, FaCrown, FaGift } from 'react-icons/fa6'

type Package = {
  id: string
  name: string
  duration_days: number
  price: number
}

type TargetUser = {
  id: string
  full_name: string | null
  email: string
}

export default function GrantSubscriptionForm({
  user,
  packages,
  onClose,
}: {
  user: TargetUser
  packages: Package[]
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [selectedPkg, setSelectedPkg] = useState(packages[0]?.id || '')
  const [customDuration, setCustomDuration] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState<{ expires_at: string; extended: boolean } | null>(null)

  const selectedPackage = packages.find((p) => p.id === selectedPkg)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPkg) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          package_id: selectedPkg,
          duration_days: customDuration ? parseInt(customDuration) : undefined,
          note: note || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memberikan langganan')
      }

      setResult({ expires_at: data.expires_at, extended: data.extended })
      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 2500)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (success && result) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCircleCheck className="text-4xl" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
            {result.extended ? 'Langganan Diperpanjang!' : 'Langganan Berhasil Diberikan!'}
          </h3>
          <p className="text-gray-500 mb-4">
            Aktif hingga:{' '}
            <span className="font-bold text-gray-900">
              {new Date(result.expires_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </p>
          <p className="text-xs text-gray-400">Halaman akan dimuat ulang...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"
        >
          <FaXmark className="text-xl" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white">
            <FaGift className="text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Berikan Langganan</h2>
          </div>
        </div>

        {/* Target User */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 mt-4">
          <p className="text-xs font-bold text-gray-500 mb-1">Diberikan kepada:</p>
          <p className="font-bold text-gray-900">{user.full_name || 'Belum diisi'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Package Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Pilih Paket *</label>
            <div className="space-y-2">
              {packages.map((pkg) => (
                <label
                  key={pkg.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPkg === pkg.id
                      ? 'border-violet-500 bg-violet-50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={pkg.id}
                    checked={selectedPkg === pkg.id}
                    onChange={() => setSelectedPkg(pkg.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedPkg === pkg.id ? 'border-violet-500' : 'border-gray-300'
                    }`}
                  >
                    {selectedPkg === pkg.id && (
                      <div className="w-2.5 h-2.5 bg-violet-500 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{pkg.name}</p>
                    <p className="text-xs text-gray-500">
                      {pkg.duration_days} hari • Rp {pkg.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <FaCrown
                    className={`text-lg ${
                      selectedPkg === pkg.id ? 'text-violet-500' : 'text-gray-300'
                    }`}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Custom Duration (optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Durasi Kustom (opsional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                min="1"
                max="365"
                placeholder={selectedPackage ? `${selectedPackage.duration_days}` : '30'}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
              />
              <span className="text-sm font-bold text-gray-500 whitespace-nowrap">hari</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kosongkan untuk menggunakan durasi bawaan paket ({selectedPackage?.duration_days || 30} hari).
              Jika pengguna sudah memiliki langganan aktif, durasi akan <span className="font-bold">ditambahkan</span>.
            </p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Catatan (opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Pembayaran via Transfer BCA, Hadiah giveaway, dll."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedPkg}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <FaGift /> Berikan Langganan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
