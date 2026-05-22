import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FaUserShield, FaEnvelope, FaIdCard, FaLock, FaCrown } from 'react-icons/fa6'
import { ProfileForm, ResetPasswordButton } from './ProfileForms'

export const metadata = {
  title: 'Pengaturan Profil | Tsuha.id',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil Profil User
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Ambil Langganan Aktif
  const { data: activeSubs } = await supabase
    .from('v_active_subscriptions')
    .select('package_slug')
    .eq('user_id', user.id)
    .eq('computed_status', 'active')

  const activeBaseSlugs = activeSubs?.map(s => s.package_slug.split('-')[0]) || []
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'content_admin'
  const isPremium = activeBaseSlugs.includes('pro') || activeBaseSlugs.includes('premium') || isAdmin

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-violet-200 selection:text-violet-900 pb-12">
      <main className="max-w-4xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Pengaturan Profil</h1>
          <p className="mt-2 text-gray-500 font-medium">Kelola informasi akun dan preferensi keamanan Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Bagian Kiri: Info Singkat */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-violet-200 mb-4">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{profile?.full_name || 'User Tsuha'}</h3>
              <p className="text-sm text-gray-500 mb-4">{user.email}</p>
              
              <div className="w-full pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-violet-700 bg-violet-50 py-2 rounded-xl">
                  <FaUserShield /> 
                  {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role === 'content_admin' ? 'Admin Konten' : 'Member'}
                </div>
              </div>
            </div>

            {!isPremium && (
              <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-600 rounded-3xl shadow-xl shadow-violet-200/40 p-6 text-white relative overflow-hidden group">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-fuchsia-500/20 rounded-full blur-lg"></div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-4 border border-white/10">
                    <FaCrown className="text-amber-300 w-3.5 h-3.5" /> Premium Plan
                  </div>
                  
                  <h4 className="text-lg font-black leading-tight mb-2">
                    Buka Semua Akses Belajar Bahasa Korea
                  </h4>
                  
                  <p className="text-xs text-violet-100 font-semibold mb-5 leading-relaxed">
                    Nikmati AI Buddy tanpa batas, ribuan kosakata, cerita interaktif lengkap, dan unduh sertifikat resmi.
                  </p>
                  
                  <Link 
                    href="/pricing"
                    className="block w-full text-center bg-white text-violet-700 hover:bg-violet-50 font-black text-sm py-3 px-4 rounded-2xl shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
                  >
                    Mulai Berlangganan
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Bagian Kanan: Form Pengaturan */}
          <div className="md:col-span-2 space-y-6">
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaIdCard className="text-violet-500" /> Informasi Pribadi
              </h2>
              <ProfileForm initialName={profile?.full_name || ''} />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaLock className="text-rose-500" /> Keamanan Akun
              </h2>
              <ResetPasswordButton email={user.email || ''} />
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
