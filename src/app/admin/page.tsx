import { createClient } from '@/lib/supabase/server'
import { FaUsers, FaCrown, FaBook, FaWrench } from 'react-icons/fa6'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Statistik Cepat
  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: subsCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['active', 'grace_period'])
  const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ringkasan Sistem</h1>
        <p className="mt-2 text-gray-500 text-lg">Pantau performa dan konten platform belajarkorea.id Anda.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <FaUsers className="text-xl" />
            </div>
            <p className="text-sm font-bold text-gray-500 mb-1">Total Pengguna</p>
            <h3 className="text-4xl font-extrabold text-gray-900">{usersCount || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4">
              <FaCrown className="text-xl" />
            </div>
            <p className="text-sm font-bold text-gray-500 mb-1">Langganan Aktif</p>
            <h3 className="text-4xl font-extrabold text-gray-900">{subsCount || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-violet-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-4">
              <FaBook className="text-xl" />
            </div>
            <p className="text-sm font-bold text-gray-500 mb-1">Total Kursus</p>
            <h3 className="text-4xl font-extrabold text-gray-900">{coursesCount || 0}</h3>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl shadow-lg border border-violet-500 p-10 text-center min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full mix-blend-overlay blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full mix-blend-overlay blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner">
            <FaWrench className="text-3xl" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">Selamat Datang di Admin Panel</h2>
          <p className="text-violet-100 max-w-lg mx-auto text-lg leading-relaxed">
            Pilih menu di sebelah kiri untuk mulai mengelola kursus, produk digital, atau memantau transaksi pengguna.
          </p>
        </div>
      </div>
    </div>
  )
}
