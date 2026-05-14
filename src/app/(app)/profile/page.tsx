import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FaUserShield, FaEnvelope, FaIdCard, FaLock } from 'react-icons/fa6'
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
