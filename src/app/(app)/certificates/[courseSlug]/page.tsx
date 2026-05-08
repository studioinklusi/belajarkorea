import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { FaChevronLeft, FaAward, FaCircleInfo } from 'react-icons/fa6'
import PrintButton from './PrintButton'
import CertificateQR from './CertificateQR'
import crypto from 'crypto'

export const metadata = {
  title: 'Sertifikat Kelulusan | Tsuha.id',
  description: 'Sertifikat penyelesaian kursus bahasa Korea.',
}

export default async function CertificatePage(props: {
  params: Promise<{ courseSlug: string }>
}) {
  const params = await props.params
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
              Admin: Ganti gambar "public/cert-bg.png" untuk custom desain.
            </div>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Konten Sertifikat */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto">
        {/* Certificate Container: A4 Landscape Aspect Ratio */}
        <div 
          id="certificate-container"
          className="bg-white relative w-full max-w-[1056px] aspect-[1.414/1] shadow-2xl overflow-hidden bg-[url('/cert-bg.png')] bg-cover bg-center border-[12px] border-double border-amber-200"
          style={{ minHeight: '600px' }}
        >
          {/* Watermark/Background Decoration */}
          <div className="absolute inset-0 border-[24px] border-violet-900/5 m-4 pointer-events-none"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12 sm:px-24">
            <div className="mb-6">
              <span className="text-sm font-black tracking-widest text-violet-600 uppercase border-b-2 border-violet-600 pb-1">
                Tsuha.id
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-serif text-gray-900 mb-8" style={{ fontFamily: 'Georgia, serif' }}>
              Certificate of Completion
            </h1>
            
            <p className="text-gray-500 mb-4 uppercase tracking-widest text-sm font-medium">
              Sertifikat ini diberikan kepada:
            </p>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-violet-800 mb-8 italic border-b border-gray-300 pb-4 px-12 inline-block">
              {studentName}
            </h2>
            
            <p className="text-gray-600 max-w-2xl text-lg sm:text-xl leading-relaxed mb-12">
              Telah berhasil menyelesaikan program kursus bahasa Korea dengan predikat sangat memuaskan pada program: <br/>
              <span className="font-bold text-gray-900 mt-2 block text-2xl">{course.title}</span>
            </p>
            
            <div className="flex items-end justify-between w-full max-w-4xl mt-auto pb-12 px-8">
              {/* QR Code Section */}
              <div className="flex flex-col items-center">
                <CertificateQR url={verificationUrl} certId={certId} />
              </div>
              
              <div className="flex flex-col items-center pb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white mb-2 relative">
                  <FaAward className="w-10 h-10 drop-shadow-md" />
                  <div className="absolute -bottom-2 -right-2 bg-white text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 shadow-sm uppercase tracking-widest">
                    {course.level}
                  </div>
                </div>
              </div>

              <div className="text-center pb-6">
                <div className="border-b border-gray-400 w-48 pb-2 mb-2 font-bold text-gray-900">
                  {dateStr}
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tanggal Diberikan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-container, #certificate-container * {
            visibility: visible;
          }
          #certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100vh;
            border: none !important;
            box-shadow: none !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}} />
    </div>
  )
}
