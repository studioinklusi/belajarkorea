import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '../(auth)/auth/actions'
import { PlayCircleIcon } from '@heroicons/react/24/solid'
import { FaTicket, FaLock, FaBullseye, FaBookOpen, FaCircleQuestion, FaHandSparkles, FaRobot, FaAward, FaWhatsapp } from 'react-icons/fa6'
export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Ambil Profil User
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Ambil Data Langganan Aktif
  const { data: subscription } = await supabase
    .from('v_active_subscriptions')
    .select('*')
    .eq('user_id', user.id).neq('computed_status', 'expired')
    .single()

  // 3. Ambil Progress Belajar (Dihitung manual agar lebih akurat dibanding View)
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, level, slug')
    .eq('is_published', true)

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, course_id')
    .eq('is_published', true)

  const { data: userProgresses } = await supabase
    .from('user_progress')
    .select('lesson_id, status')
    .eq('user_id', user.id)

  let accurateProgresses: any[] = []
  let courseSlugs: Record<string, string> = {}

  if (courses && lessons) {
    const progressMap = new Map(userProgresses?.map(up => [up.lesson_id, up.status]) || [])

    courses.forEach(course => {
      courseSlugs[course.id] = course.slug
      const courseLessons = lessons.filter(l => l.course_id === course.id)
      const total_lessons = courseLessons.length
      
      if (total_lessons > 0) {
        let hasStarted = false
        let completed_lessons = 0
        
        courseLessons.forEach(l => {
          if (progressMap.has(l.id)) {
            hasStarted = true
            if (progressMap.get(l.id) === 'completed') {
              completed_lessons++
            }
          }
        })

        if (hasStarted) {
          accurateProgresses.push({
            course_id: course.id,
            course_title: course.title,
            course_level: course.level,
            total_lessons,
            completed_lessons,
            completion_percentage: Math.round((completed_lessons / total_lessons) * 100)
          })
        }
      }
    })
  }

  const progresses = accurateProgresses

  // 4. Hitung Target Harian
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  // Cek apakah ada video yang diselesaikan hari ini
  const { data: todayProgress } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('completed_at', todayStr)
    .limit(1)

  const hasWatchedVideoToday = todayProgress && todayProgress.length > 0

  // Cek apakah ada kuis yang lulus hari ini
  const { data: todayQuiz } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', user.id)
    .eq('passed', true)
    .gte('completed_at', todayStr)
    .limit(1)

  const hasPassedQuizToday = todayQuiz && todayQuiz.length > 0

  // 5. Fetch Active Promo
  const { data: activePromo } = await supabase
    .from('promos')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const isSubscribed = !!subscription
  const isAdmin = profile?.role === 'content_admin' || profile?.role === 'super_admin'

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-violet-200 selection:text-violet-900 pb-12">
            <main className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard Saya</h1>
          <p className="mt-2 text-gray-500 font-medium">Lanjutkan perjalanan belajar bahasa Korea-mu hari ini! 🚀</p>
        </div>

        {activePromo && (
          <div className="mb-8 rounded-3xl overflow-hidden relative shadow-lg group">
            <div className={`absolute inset-0 z-0 ${activePromo.image_url ? 'bg-gray-900' : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600'}`}>
              {activePromo.image_url && (
                <img src={activePromo.image_url} alt="Promo" className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
              )}
            </div>
            <div className="relative z-10 p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-white text-center sm:text-left">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-3 shadow-sm border border-white/10">✨ Info Spesial</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">{activePromo.title}</h2>
                {activePromo.description && <p className="text-white/90 text-sm sm:text-base max-w-2xl">{activePromo.description}</p>}
              </div>
              {activePromo.link_url && (
                <Link href={activePromo.link_url} className="shrink-0 w-full sm:w-auto px-8 py-3.5 bg-white text-violet-700 font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-center">
                  Lihat Promo
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Status Langganan & Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Subscription Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-4 relative z-10 flex items-center gap-2">
                <FaTicket className="text-violet-500" /> Akses Belajar
              </h3>
              
              {isSubscribed ? (
                <div className="relative z-10">
                  <div className={`rounded-2xl p-5 text-white shadow-lg ${subscription.computed_status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-green-500/20' : 'bg-gradient-to-r from-rose-500 to-red-500 shadow-red-500/20'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black bg-white/20 text-white uppercase tracking-wider shrink-0">
                        {subscription.computed_status === 'active' ? 'AKTIF' : 'GRACE PERIOD'}
                      </span>
                      <span className="text-sm font-black uppercase tracking-widest opacity-80">
                        {subscription.package_name}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 mt-4 font-medium">{subscription.computed_status === 'active' ? 'Sisa Waktu Akses' : 'Akses Ditangguhkan'}</p>
                    {subscription.computed_status === 'active' ? (
                      <>
                        <p className="text-4xl font-black mt-1 mb-2">
                          {subscription.days_remaining} <span className="text-lg font-bold opacity-80">Hari</span>
                        </p>
                        <p className="text-xs text-white/90 font-medium opacity-90">
                          Berlaku s/d {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl sm:text-3xl font-black mt-1 mb-2">
                          KADALUARSA
                        </p>
                        <p className="text-xs text-white/90 font-medium opacity-90">
                          Harap perpanjang paket untuk lanjut belajar.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 relative z-10">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl text-gray-400">
                    <FaLock />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-5">Anda belum memiliki paket belajar yang aktif.</p>
                  <Link 
                    href="/pricing"
                    className="block w-full py-3 px-4 rounded-full shadow-md shadow-violet-200 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    Buka Akses Belajar
                  </Link>
                </div>
              )}
            </div>

            {/* Daily Target */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaBullseye className="text-rose-500 shrink-0" /> Target Harian
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-2xl transition-colors group border border-transparent">
                  <div className={`relative flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors ${hasWatchedVideoToday ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                    {hasWatchedVideoToday && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-sm font-medium ${hasWatchedVideoToday ? 'text-green-700 line-through opacity-80' : 'text-gray-700'}`}>Tonton 1 materi video</span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-2xl transition-colors group border border-transparent">
                  <div className={`relative flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors ${hasPassedQuizToday ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                    {hasPassedQuizToday && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-sm font-medium ${hasPassedQuizToday ? 'text-green-700 line-through opacity-80' : 'text-gray-700'}`}>Kerjakan kuis dengan skor 80+</span>
                </div>
              </div>
            </div>

            {/* AI Buddy CTA */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 rounded-3xl shadow-lg shadow-violet-200/50 p-6 text-white">
              <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-bl-full -mr-6 -mt-6"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full -ml-4 -mb-4"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <FaRobot className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-extrabold mb-2">AI Korean Buddy</h3>
                <p className="text-sm text-white/80 mb-5 leading-relaxed">Latihan ngobrol langsung dengan AI tutor! Tersedia level pemula hingga mahir.</p>
                <Link
                  href="/ai-buddy"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 rounded-full text-sm font-bold hover:bg-white/90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaRobot className="w-4 h-4" /> Mulai Ngobrol
                </Link>
              </div>
            </div>

            {/* WhatsApp Admin CTA */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10 flex items-center gap-2">
                <FaWhatsapp className="text-green-500 text-xl" /> Butuh Bantuan?
              </h3>
              <p className="text-sm text-gray-500 mb-5 relative z-10">Admin siap membantu jika ada kendala berlangganan atau pertanyaan lainnya.</p>
              <a 
                href="https://wa.me/62881010890925?text=Halo%20Admin%20Tsuha.id,%20saya%20butuh%20bantuan%20..."
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 flex w-full items-center justify-center gap-2 px-5 py-3.5 bg-[#25D366] text-white rounded-full text-sm font-bold hover:bg-[#1DA851] transition-all shadow-md shadow-green-200 hover:-translate-y-0.5"
              >
                <FaWhatsapp className="w-5 h-5" /> Chat Admin WA
              </a>
            </div>
            
          </div>

          {/* Kolom Kanan: Progress Belajar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 h-full">
              <div className="flex justify-between items-start sm:items-center mb-8 gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaBookOpen className="text-violet-600 shrink-0" /> Lanjutkan Belajar
                </h3>
                <Link href="/courses" className="text-xs sm:text-sm text-violet-600 hover:text-violet-800 font-bold bg-violet-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors shrink-0">
                  Lihat Semua
                </Link>
              </div>
              
              {progresses && progresses.length > 0 ? (
                <div className="space-y-5">
                  {progresses.map((prog, idx) => (
                    <div key={idx} className="group border border-gray-100 rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:border-violet-200 transition-all duration-300 bg-white">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <div>
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 mb-2 uppercase tracking-wide">
                            Level: {prog.course_level}
                          </span>
                          <h4 className="text-lg font-extrabold text-gray-900 group-hover:text-violet-700 transition-colors">{prog.course_title}</h4>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {prog.completion_percentage >= 100 && (
                            <Link 
                              href={`/certificates/${courseSlugs[prog.course_id] || prog.course_id}`} 
                              className="px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-sm font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap"
                            >
                              <FaAward className="w-4 h-4" /> Sertifikat
                            </Link>
                          )}
                          <Link 
                            href={`/courses/${courseSlugs[prog.course_id] || prog.course_id}`} 
                            className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none"
                          >
                            Lanjut <PlayCircleIcon className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                      
                      <div className="mt-5 bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between text-sm mb-2 font-bold">
                          <span className="text-gray-600">Progress</span>
                          <span className="text-violet-600">{prog.completion_percentage}% ({prog.completed_lessons}/{prog.total_lessons})</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${prog.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm text-4xl text-gray-400">
                    <FaCircleQuestion />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Progress</h4>
                  <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">Anda belum memulai materi apapun. Yuk tonton video pertama Anda hari ini!</p>
                  <Link 
                    href="/courses" 
                    className="flex w-full sm:w-auto sm:inline-flex justify-center items-center gap-2 px-8 py-3.5 rounded-full shadow-md shadow-violet-200 text-white bg-violet-600 hover:bg-violet-700 hover:shadow-lg font-bold transition-all transform hover:-translate-y-0.5"
                  >
                    <PlayCircleIcon className="w-5 h-5" /> Mulai Belajar Sekarang
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
