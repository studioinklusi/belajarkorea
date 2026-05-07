import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-gray-200 tracking-widest">404</h1>
        <div className="bg-indigo-600 text-white px-2 text-sm rounded rotate-12 absolute">
          Halaman Tidak Ditemukan
        </div>
        <div className="mt-8 mb-14">
          <p className="text-gray-500 font-medium text-lg">
            Maaf, kami tidak bisa menemukan halaman yang Anda cari.
          </p>
        </div>
        <Link
          href="/"
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl inline-block"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
