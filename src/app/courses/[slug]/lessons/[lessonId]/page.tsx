import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { FaChevronLeft, FaPlay, FaLock, FaCircleCheck, FaRegCircle, FaTrophy, FaListUl } from 'react-icons/fa6'
import { markLessonComplete } from '../../../actions'
import { SubmitButton } from '@/components/SubmitButton'

export default async function LessonPage(props: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Ambil course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('slug', params.slug)
    .single()

  if (!course) notFound()

  // 2. Ambil semua lessons untuk playlist sidebar
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order, is_preview, duration_seconds')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  // 3. Ambil progress user
  let progressMap: Record<string, string> = {}
  if (user) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('lesson_id, status')
      .eq('user_id', user.id)
    
    if (progress) {
      progressMap = progress.reduce((acc, p) => {
        acc[p.lesson_id] = p.status
        return acc
      }, {} as Record<string, string>)
    }
  }

  // 4. Ambil lesson saat ini (Akan error jika RLS block = terkunci)
  const { data: currentLesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', params.lessonId)
    .eq('course_id', course.id)
    .single()

  const isLocked = error || !currentLesson
  const isCompleted = progressMap[params.lessonId] === 'completed'

  // Hitung progress keseluruhan
  const totalLessons = allLessons?.length || 0
  const completedLessons = allLessons?.filter(l => progressMap[l.id] === 'completed').length || 0
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const handleMarkComplete = markLessonComplete.bind(null, params.lessonId, course.slug)

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans selection:bg-violet-500/30">
      {/* Top Navbar */}
      <header className="bg-[#1E293B] border-b border-gray-800 p-4 sticky top-0 z-50 shadow-md flex items-center justify-between">
        <Link 
          href={`/courses/${course.slug}`}
          className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-violet-600 transition-colors">
            <FaChevronLeft className="w-4 h-4" />
          </div>
          <span className="font-semibold truncate max-w-[200px] sm:max-w-md hidden sm:inline-block">
            {course.title}
          </span>
        </Link>
        
        {/* Course Progress */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-gray-400 font-medium mb-1">Progress Kelas</span>
            <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold rounded-lg text-sm">
            {progressPercent}%
          </div>
        </div>
      </header>

      {/* Main Classroom Area */}
      <main className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        
        {/* Left Column: Video & Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLocked ? (
            <div className="w-full aspect-video bg-[#0B1120] flex flex-col items-center justify-center border-b border-gray-800 p-6 text-center">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-gray-800">
                <FaLock className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Materi Premium Terkunci</h2>
              <p className="text-gray-400 max-w-md mb-8">
                Materi ini eksklusif untuk member aktif. Berlangganan sekarang untuk membuka semua video dan kuis.
              </p>
              <Link 
                href="/pricing"
                className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-full transition-all transform hover:-translate-y-1 shadow-lg shadow-violet-600/20"
              >
                Buka Akses Belajar
              </Link>
            </div>
          ) : (
            <div className="w-full">
              {/* Video Player */}
              <div className="relative w-full bg-black aspect-video shadow-2xl">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${currentLesson.youtube_video_id}?rel=0&modestbranding=1&autoplay=1`}
                  title={currentLesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              {/* Lesson Details & Actions */}
              <div className="p-6 md:p-10 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider rounded-full border border-violet-500/30">
                        Materi {currentLesson.sort_order}
                      </span>
                      {isCompleted && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                          <FaCircleCheck /> Selesai
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-3">{currentLesson.title}</h1>
                    <p className="text-gray-400 text-lg leading-relaxed">{currentLesson.description}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
                    {!isCompleted ? (
                      <form action={handleMarkComplete}>
                        <SubmitButton 
                          pendingText="Menyimpan..."
                          className="!w-full !rounded-full !py-3 !bg-emerald-600 hover:!bg-emerald-500 !shadow-emerald-600/20"
                        >
                          <span className="flex items-center gap-2"><FaCircleCheck /> Tandai Selesai</span>
                        </SubmitButton>
                      </form>
                    ) : (
                      <button disabled className="w-full py-3 px-6 rounded-full font-bold text-white bg-gray-700/50 cursor-not-allowed flex items-center justify-center gap-2 border border-gray-600">
                        <FaCircleCheck className="text-emerald-400" /> Sudah Selesai
                      </button>
                    )}
                  </div>
                </div>

                {/* Quiz Section (Next Feature) */}
                <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                      <FaTrophy />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl font-bold text-white mb-1">Kuis Pemahaman Materi</h3>
                      <p className="text-gray-400 text-sm mb-4 sm:mb-0">Uji seberapa paham Anda dengan materi ini sebelum lanjut ke pelajaran berikutnya.</p>
                    </div>
                    <button className="px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-full transition-colors flex items-center gap-2 flex-shrink-0">
                      Mulai Kuis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Playlist Sidebar */}
        <div className="w-full xl:w-[400px] bg-[#1E293B] border-t xl:border-t-0 xl:border-l border-gray-800 flex flex-col h-[500px] xl:h-[calc(100vh-73px)]">
          <div className="p-5 border-b border-gray-800 bg-[#1E293B]/80 backdrop-blur-md sticky top-0 z-10">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FaListUl className="text-violet-400" /> Daftar Materi
            </h3>
            <p className="text-xs text-gray-400 mt-1">{completedLessons} dari {totalLessons} materi diselesaikan</p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {allLessons?.map((lesson, idx) => {
              const isCurrent = lesson.id === params.lessonId
              const isDone = progressMap[lesson.id] === 'completed'
              // Default ke false jika tidak ada data sub untuk sementara, tapi logikanya kalau user bisa buka, dia bebas navigasi, yang terkunci nanti ketahuan pas di-klik.
              // Untuk UI list, kita buat semua clickable saja.
              
              const formatDuration = (seconds: number | null) => {
                if (!seconds) return '00:00'
                const m = Math.floor(seconds / 60)
                const s = seconds % 60
                return `${m}:${s.toString().padStart(2, '0')}`
              }

              return (
                <Link 
                  key={lesson.id}
                  href={`/courses/${course.slug}/lessons/${lesson.id}`}
                  className={`flex items-start gap-4 p-3 rounded-xl transition-all duration-200 border ${
                    isCurrent 
                      ? 'bg-violet-600/20 border-violet-500/30' 
                      : 'hover:bg-gray-800 border-transparent'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {isDone ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <FaCircleCheck className="w-4 h-4" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white">
                        <FaPlay className="w-3 h-3 ml-0.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-gray-600 text-gray-500 flex items-center justify-center">
                        <span className="text-xs font-medium">{idx + 1}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium line-clamp-2 ${isCurrent ? 'text-violet-300' : 'text-gray-300'}`}>
                      {lesson.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-500 font-medium">
                        {formatDuration(lesson.duration_seconds)}
                      </span>
                      {lesson.is_preview && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
      
      {/* Global Style for Custom Scrollbar to make it look premium */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
      `}} />
    </div>
  )
}

