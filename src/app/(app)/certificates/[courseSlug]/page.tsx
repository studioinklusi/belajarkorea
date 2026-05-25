import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { FaChevronLeft, FaAward, FaCircleInfo } from 'react-icons/fa6'
import PrintButton from './PrintButton'
import CertificateScaler from './CertificateScaler'
import CertificateQR from './CertificateQR'
import crypto from 'crypto'
import { SubmitButton } from '@/components/SubmitButton'
import { updateCertificateName } from '../actions'

export const metadata = {
  title: 'Sertifikat Kelulusan | Tsuha.id',
  description: 'Sertifikat penyelesaian kursus bahasa Korea.',
}

export default async function CertificatePage(props: {
  params: Promise<{ courseSlug: string }>
  searchParams: Promise<{ confirmed?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const isConfirmed = searchParams?.confirmed === 'true'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Dapatkan Role User
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'content_admin'

  // 2. Cek Langganan Pro / Premium
  let hasCertificateAccess = false
  if (!isAdmin) {
    const { data: activeSubs } = await supabase
      .from('v_active_subscriptions')
      .select('package_slug')
      .eq('user_id', user.id).eq('computed_status', 'active')

    const activeBaseSlugs = activeSubs?.map(s => s.package_slug.split('-')[0]) || []
    hasCertificateAccess = activeBaseSlugs.includes('pro') || activeBaseSlugs.includes('premium')
  } else {
    hasCertificateAccess = true
  }

  if (!hasCertificateAccess) {
    redirect('/pricing?reason=certificate')
  }

  // 3. Ambil Course & Progress
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, level')
    .eq('slug', params.courseSlug)
    .single()

  if (!course) notFound()

  // Pastikan user sudah lulus 100% (Hitung manual akurat)
  const { data: courseLessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', course.id)
    .eq('is_published', true)

  const { data: userCompletedLessons } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const totalLessons = courseLessons?.length || 0
  const completedLessonIds = new Set(userCompletedLessons?.map(up => up.lesson_id) || [])
  const completedCount = courseLessons?.filter(l => completedLessonIds.has(l.id)).length || 0
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  if (!isAdmin && completionPercentage < 100) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <FaAward className="mx-auto h-16 w-16 text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Belum Memenuhi Syarat</h2>
          <p className="text-gray-500 mb-8">
            Anda harus menyelesaikan seluruh materi ({course.title}) hingga 100% untuk mendapatkan sertifikat.
          </p>
          <Link 
            href={`/dashboard`}
            className="inline-flex justify-center w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-500"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-violet-600 p-6 text-center">
            <FaAward className="w-12 h-12 text-white/90 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white">Konfirmasi Nama Sertifikat</h2>
            <p className="text-violet-100 mt-2 text-sm">Sertifikat kelulusan Anda sudah siap dicetak!</p>
          </div>
          
          <div className="p-8">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaCircleInfo className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Pastikan nama di bawah ini sudah benar (tambahkan gelar jika ada). <strong>Nama ini akan tercetak permanen di sertifikat Anda</strong>.
                  </p>
                </div>
              </div>
            </div>

            <form action={updateCertificateName} className="space-y-6">
              <input type="hidden" name="courseSlug" value={params.courseSlug} />
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap (Untuk Sertifikat)
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  defaultValue={profile?.full_name || ''}
                  required
                  minLength={3}
                  maxLength={50}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all font-medium text-gray-900"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Link 
                  href="/dashboard"
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-center font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Nanti Saja
                </Link>
                <SubmitButton 
                  pendingText="Menyimpan..."
                  className="flex-1 !rounded-xl !py-3 !bg-gradient-to-r !from-violet-600 !to-fuchsia-600 hover:!from-violet-500 hover:!to-fuchsia-500 !shadow-lg !shadow-violet-600/20"
                >
                  Konfirmasi & Lihat
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const studentName = profile?.full_name || 'Pelajar Hebat'
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  
  // Generate Deterministic Unique ID based on User + Course
  const hash = crypto.createHash('sha256').update(`${user.id}-${course.id}`).digest('hex')
  const certId = `BK-${hash.substring(0, 10).toUpperCase()}`
  const verificationUrl = `https://Tsuha.id/verify/${certId}`

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header (Sembunyi saat print) */}
      <div className="print:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium">
          <FaChevronLeft className="w-4 h-4" /> Kembali
        </Link>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <FaCircleInfo /> 
              Admin: Ganti gambar "public/cert-bg.svg" untuk custom desain.
            </div>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Konten Sertifikat */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto">
        {/* Scaling wrapper: maintains aspect ratio so the fixed-size certificate scales to fit */}
        <CertificateScaler>
          {/* Certificate Container: Always renders at fixed desktop size (1056x747) */}
          <div 
            id="certificate-container"
            className="bg-white relative shadow-2xl overflow-hidden"
            style={{ width: '1056px', height: '747px' }}
          >
            {/* Background image as img tag for html2canvas compatibility */}
            <img 
              src="/cert-bg.svg" 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              crossOrigin="anonymous"
            />
            <div className="absolute left-0 top-0 bottom-0 w-[64%] flex flex-col items-start text-left pt-[22%] pb-[10%] pl-[72px] pr-8">
              
              <p className="text-gray-500 mb-2 uppercase tracking-widest text-xs font-semibold">
                Sertifikat ini diberikan kepada:
              </p>
              
              <h2 className="text-4xl font-bold text-violet-900 mb-4 italic border-b border-gray-300 pb-2 pr-6" style={{ display: 'inline-block', fontFamily: 'Georgia, serif' }}>
                {studentName}
              </h2>
              
              <p className="text-gray-600 max-w-lg text-sm leading-relaxed mb-3">
                Telah menyelesaikan seluruh rangkaian kurikulum pembelajaran bahasa Korea secara intensif serta memenuhi semua kriteria kelulusan akademik yang ditentukan dengan predikat sangat memuaskan pada program:
              </p>
              <span className="font-bold text-gray-950 text-2xl mb-6">{course.title}</span>
              
              <div className="flex items-end justify-between w-full max-w-[500px] mt-auto px-2">
                {/* QR Code Section */}
                <div className="flex flex-col items-center">
                  <CertificateQR url={verificationUrl} certId={certId} />
                </div>
                
                <div className="flex flex-col items-center pb-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white mb-1.5">
                    <FaAward className="w-7 h-7 drop-shadow-md" />
                  </div>
                  <div className="bg-white text-amber-600 text-[8px] font-black px-2.5 py-0.5 rounded-full border border-amber-200 shadow-sm uppercase tracking-widest">
                    {course.level}
                  </div>
                </div>

                <div className="text-center pb-2">
                  <div className="border-b border-gray-400 w-32 pb-1.5 mb-1.5 font-bold text-gray-900 text-xs">
                    {dateStr}
                  </div>
                  <p className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">Tanggal Diberikan</p>
                </div>
              </div>
            </div>
          </div>
        </CertificateScaler>
      </div>
    </div>
  )
}
