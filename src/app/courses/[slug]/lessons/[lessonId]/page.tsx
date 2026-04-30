import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function LessonPage(props: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  // Ambil course untuk navigasi kembali
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('slug', params.slug)
    .single()

  if (!course) {
    notFound()
  }

  // Coba ambil lesson. 
  // Jika RLS memblokir (bukan preview & tidak ada subscription), ini akan me-return error/null
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', params.lessonId)
    .eq('course_id', course.id)
    .single()

  const isLocked = error || !lesson

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header / Navbar untuk Player */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <Link 
          href={`/courses/${course.slug}`}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke {course.title}
        </Link>
        
        {lesson && (
          <div className="text-sm font-medium text-gray-400">
            Materi {lesson.sort_order}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          {isLocked ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 p-8 text-center min-h-[50vh]">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Materi Terkunci</h2>
              <p className="text-gray-400 max-w-md mb-8">
                Materi ini hanya tersedia untuk pengguna yang memiliki paket berlangganan aktif.
              </p>
              <Link 
                href="/pricing"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Lihat Paket Langganan
              </Link>
            </div>
          ) : (
            <>
              {/* YouTube Player Wrapper */}
              <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${lesson.youtube_video_id}?rel=0&modestbranding=1`}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              {/* Lesson Info */}
              <div className="p-6 lg:p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
                    <p className="text-gray-400">{lesson.description}</p>
                  </div>
                  
                  {/* Mark as Complete Button Placeholder */}
                  <form className="ml-4 flex-shrink-0">
                    <button 
                      type="button" 
                      className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Tandai Selesai
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar (Daftar Materi / Quiz Placeholder) */}
        <div className="w-full lg:w-96 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quiz & Latihan</h3>
            <div className="bg-gray-700 rounded-xl p-5 border border-gray-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-white">Quiz Pemahaman</h4>
                  <p className="text-sm text-gray-400">5 Pertanyaan</p>
                </div>
              </div>
              <button 
                disabled={isLocked}
                className="w-full mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Mulai Quiz
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
