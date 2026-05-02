'use client'

import { useState } from 'react'
import {
  FaReceipt, FaCircleCheck, FaCircleXmark, FaHourglass,
  FaClockRotateLeft, FaMagnifyingGlass, FaChevronDown,
  FaMoneyBillWave, FaArrowRotateRight, FaFileArrowDown,
  FaCreditCard, FaQrcode, FaBuildingColumns
} from 'react-icons/fa6'

// === Types ===
type Transaction = {
  id: string
  order_id: string
  user_id: string
  user_name: string
  user_email: string
  amount: number
  status: string
  payment_type: string | null
  package_name: string | null
  product_title: string | null
  created_at: string
  updated_at: string
  webhook_received_at: string | null
}

type Stats = {
  total: number
  success: number
  pending: number
  failed: number
  totalRevenue: number
}

// === Helpers ===
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  success: { label: 'Berhasil', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-100', icon: FaCircleCheck },
  pending: { label: 'Menunggu', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-100', icon: FaHourglass },
  failed: { label: 'Gagal', color: 'text-red-700', bgColor: 'bg-red-50 border-red-100', icon: FaCircleXmark },
  expired: { label: 'Kedaluwarsa', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-100', icon: FaClockRotateLeft },
  refunded: { label: 'Dikembalikan', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-100', icon: FaArrowRotateRight },
}

function getPaymentTypeInfo(type: string | null) {
  if (!type) return { label: '-', icon: FaCreditCard }
  const lower = type.toLowerCase()
  if (lower.includes('qris')) return { label: 'QRIS', icon: FaQrcode }
  if (lower.includes('bank_transfer') || lower.includes('echannel') || lower.includes('permata')) return { label: 'Transfer Bank', icon: FaBuildingColumns }
  if (lower.includes('credit') || lower.includes('card')) return { label: 'Kartu Kredit', icon: FaCreditCard }
  if (lower.includes('gopay') || lower.includes('shopeepay') || lower.includes('dana')) return { label: type.toUpperCase(), icon: FaMoneyBillWave }
  return { label: type, icon: FaCreditCard }
}

export default function TransactionsClient({ transactions, stats }: { transactions: Transaction[]; stats: Stats }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredTransactions = transactions.filter((tx) => {
    const matchSearch =
      tx.order_id.toLowerCase().includes(search.toLowerCase()) ||
      tx.user_name.toLowerCase().includes(search.toLowerCase()) ||
      tx.user_email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || tx.status === filterStatus
    return matchSearch && matchStatus
  })

  // Export CSV
  function handleExportCSV() {
    const headers = ['Order ID', 'Tanggal', 'User', 'Email', 'Paket/Produk', 'Jumlah', 'Status', 'Metode Bayar']
    const rows = filteredTransactions.map(tx => [
      tx.order_id,
      formatDateTime(tx.created_at),
      tx.user_name,
      tx.user_email,
      tx.package_name || tx.product_title || '-',
      tx.amount.toString(),
      statusConfig[tx.status]?.label || tx.status,
      tx.payment_type || '-',
    ])

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transaksi_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Transaksi</h1>
          <p className="mt-2 text-gray-500 text-base sm:text-lg">Pantau semua pembayaran masuk dan status transaksi.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <FaFileArrowDown className="text-sm" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
            <FaReceipt className="text-base" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</p>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <FaCircleCheck className="text-base" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Berhasil</p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700">{stats.success}</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <FaHourglass className="text-base" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending</p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-700">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 sm:p-5 rounded-2xl shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center shrink-0">
            <FaMoneyBillWave className="text-base" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Revenue</p>
            <p className="text-lg sm:text-xl font-extrabold text-white">{formatRupiah(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari order ID, nama, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white font-bold text-gray-700"
          >
            <option value="all">Semua Status</option>
            <option value="success">✅ Berhasil</option>
            <option value="pending">⏳ Menunggu</option>
            <option value="failed">❌ Gagal</option>
            <option value="expired">⌛ Kedaluwarsa</option>
            <option value="refunded">🔄 Dikembalikan</option>
          </select>
          <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3.5 px-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Order</th>
                  <th className="py-3.5 px-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Pengguna</th>
                  <th className="py-3.5 px-5 font-bold text-gray-600 text-xs uppercase tracking-wider hidden lg:table-cell">Paket/Produk</th>
                  <th className="py-3.5 px-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Jumlah</th>
                  <th className="py-3.5 px-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="py-3.5 px-5 font-bold text-gray-600 text-xs uppercase tracking-wider hidden md:table-cell">Metode</th>
                  <th className="py-3.5 px-5 font-bold text-gray-600 text-xs uppercase tracking-wider hidden sm:table-cell">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const config = statusConfig[tx.status] || statusConfig.pending
                  const StatusIcon = config.icon
                  const paymentInfo = getPaymentTypeInfo(tx.payment_type)
                  const PaymentIcon = paymentInfo.icon
                  const isExpanded = expandedId === tx.id

                  return (
                    <>
                      <tr
                        key={tx.id}
                        onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-5">
                          <p className="text-xs font-mono font-bold text-gray-700 truncate max-w-[140px]" title={tx.order_id}>
                            {tx.order_id.length > 20 ? `${tx.order_id.slice(0, 12)}...${tx.order_id.slice(-6)}` : tx.order_id}
                          </p>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{tx.user_name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{tx.user_email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 hidden lg:table-cell">
                          <span className="text-sm text-gray-700 font-medium">
                            {tx.package_name || tx.product_title || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-sm font-bold text-gray-900">{formatRupiah(tx.amount)}</span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.bgColor} ${config.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="hidden min-[480px]:inline">{config.label}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <PaymentIcon className="text-xs text-gray-400" />
                            <span className="font-medium">{paymentInfo.label}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 hidden sm:table-cell">
                          <span className="text-xs text-gray-500">{formatDate(tx.created_at)}</span>
                        </td>
                      </tr>

                      {/* Expandable Detail Row */}
                      {isExpanded && (
                        <tr key={`${tx.id}-detail`} className="bg-gray-50/70">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order ID Lengkap</p>
                                <p className="font-mono text-xs text-gray-700 break-all">{tx.order_id}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paket / Produk</p>
                                <p className="font-bold text-gray-700">{tx.package_name || tx.product_title || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Metode Pembayaran</p>
                                <div className="flex items-center gap-1.5">
                                  <PaymentIcon className="text-gray-400" />
                                  <span className="font-medium text-gray-700">{paymentInfo.label}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Waktu Dibuat</p>
                                <p className="text-gray-700">{formatDateTime(tx.created_at)}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Terakhir Diupdate</p>
                                <p className="text-gray-700">{formatDateTime(tx.updated_at)}</p>
                              </div>
                              {tx.webhook_received_at && (
                                <div>
                                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Webhook Diterima</p>
                                  <p className="text-gray-700">{formatDateTime(tx.webhook_received_at)}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                <p className="text-gray-700 truncate">{tx.user_email}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">User ID</p>
                                <p className="font-mono text-[11px] text-gray-500 break-all">{tx.user_id}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaReceipt className="text-2xl" />
            </div>
            <p className="text-gray-500 font-bold">
              {search || filterStatus !== 'all' ? 'Tidak ada transaksi yang cocok dengan filter.' : 'Belum ada transaksi.'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Transaksi akan muncul saat user melakukan pembayaran.</p>
          </div>
        )}
      </div>

      {/* Footer Count */}
      <div className="mt-4 text-right">
        <p className="text-xs text-gray-400">
          Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
        </p>
      </div>
    </>
  )
}
