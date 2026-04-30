import { createClient } from '@/lib/supabase/server'
import CoursesClient from './CoursesClient'

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  // Fetch semua kursus beserta lessons-nya
  const { data: courses } = await supabase
    .from('courses')
    .select('*, lessons(*)')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <CoursesClient courses={courses} />
    </div>
  )
}
