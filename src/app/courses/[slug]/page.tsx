import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { FaChevronLeft } from 'react-icons/fa6'

export default async function CourseDetailPage(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  // 1. Ambil data course
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!course) {
    notFound()
  }

  // 2. Ambil daftar lessons untuk course ini
  // RLS akan membatasi: hanya admin, subscriber, atau lesson preview yang akan muncul/memiliki youtube_video_id
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, description, duration_seconds, sort_order, is_preview')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  // 3. (Opsional) Ambil progress jika user login
  const { data: { user } } = await supabase.auth.getUser()
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      <Navbar activePage="courses" />
      
      {/* Course Header */}
      <div className="bg-indigo-700 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-indigo-200 hover:text-white mb-6 transition-colors font-medium text-sm"
          >
            <FaChevronLeft className="w-3 h-3" /> Kembali ke Dashboard
          </Link>
          <div className="inline-block px-3 py-1 bg-indigo-600 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 border border-indigo-500">
            Level: {course.level}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            {course.title}
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl">
            {course.description}
          </p>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Daftar Materi ({lessons?.length || 0})
            </h3>
          </div>
          
          <ul className="divide-y divide-gray-200">
            {lessons?.map((lesson, index) => {
              const status = progressMap[lesson.id] || 'not_started'
              const formatDuration = (seconds: number | null) => {
                if (!seconds) return '00:00'
                const m = Math.floor(seconds / 60)
                const s = seconds % 60
                return `${m}:${s.toString().padStart(2, '0')}`
              }

              return (
                <li key={lesson.id} className="hover:bg-gray-50 transition-colors">
                  <Link href={`/courses/${course.slug}/lessons/${lesson.id}`} className="block px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        {/* Status Icon */}
                        <div className="flex-shrink-0 mr-4">
                          {status === 'completed' ? (
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-500 font-medium text-sm">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate flex items-center gap-2">
                            {lesson.title}
                            {lesson.is_preview && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Free Preview
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                            {lesson.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                        <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDuration(lesson.duration_seconds)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}

            {(!lessons || lessons.length === 0) && (
              <li className="px-6 py-8 text-center text-gray-500">
                Materi kursus sedang dipersiapkan.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
