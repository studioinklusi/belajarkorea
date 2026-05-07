import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center relative">
        <h1 className="text-9xl font-extrabold text-gray-200 tracking-widest">404</h1>
        <div className="bg-violet-600 text-white px-3 py-1 text-sm font-bold rounded rotate-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          Halaman Tidak Ditemukan
        </div>
        <div className="mt-8 mb-14">
          <p className="text-gray-500 font-medium text-lg">
            Maaf, kami tidak bisa menemukan halaman yang Anda cari.
          </p>
        </div>
        <Link
          href="/"
          className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl inline-block"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
