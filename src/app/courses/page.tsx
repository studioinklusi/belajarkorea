import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import Navbar from '@/components/Navbar'

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Ambil semua course yang sudah di-publish
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching courses:', error)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-12">
      <Navbar activePage="courses" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Program Belajar</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500 sm:mt-4">
            Pilih kursus yang sesuai dengan level bahasa Korea Anda.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => (
            <div key={course.id} className="flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
              <div className="flex-shrink-0 h-48 bg-indigo-100 relative">
                {course.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-full w-full object-cover" src={course.thumbnail_url} alt={course.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl font-bold">
                    {course.title.charAt(0)}
                  </div>
                )}
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-indigo-800 uppercase tracking-wide">
                  {course.level}
                </div>
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <Link href={`/courses/${course.slug}`} className="block mt-2">
                    <p className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{course.title}</p>
                    <p className="mt-3 text-base text-gray-500 line-clamp-3">{course.description}</p>
                  </Link>
                </div>
                <div className="mt-6 flex items-center">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {(!courses || courses.length === 0) && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Belum ada kursus yang tersedia saat ini.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
