'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaPlus, FaBook, FaListOl, FaTrash, FaSpinner, FaChevronDown, FaChevronUp, FaYoutube, FaEye, FaCircleQuestion, FaPen } from 'react-icons/fa6'
import AddCourseForm from './AddCourseForm'
import AddLessonForm from './AddLessonForm'
import AddQuizForm from './AddQuizForm'
import EditCourseForm from './EditCourseForm'
import EditLessonForm from './EditLessonForm'

type Lesson = {
  id: string
  title: string
  youtube_video_id: string
  duration_seconds: number | null
  sort_order: number
  is_published: boolean
  is_preview: boolean
}

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  level: string
  is_published: boolean
  sort_order: number
  lessons: Lesson[]
}

export default function CoursesClient({ courses }: { courses: Course[] | null }) {
  const router = useRouter()
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [addLessonFor, setAddLessonFor] = useState<{ id: string; title: string } | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)
  const [addQuizFor, setAddQuizFor] = useState<{ id: string; title: string } | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  async function handleDeleteCourse(courseId: string, title: string) {
    if (!confirm(`Yakin ingin menghapus kursus "${title}"? Semua materi di dalamnya juga akan terhapus.`)) return
    setDeletingId(courseId)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus')
        return
      }
      router.refresh()
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteLesson(lessonId: string, title: string) {
    if (!confirm(`Yakin ingin menghapus materi "${title}"?`)) return
    setDeletingLessonId(lessonId)
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus')
        return
      }
      router.refresh()
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setDeletingLessonId(null)
    }
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Kursus</h1>
          <p className="mt-2 text-gray-500 text-lg">Atur program belajar, video YouTube, dan materi.</p>
        </div>
        <button
          onClick={() => setShowCourseForm(true)}
          className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-violet-200"
        >
          <FaPlus /> Buat Kursus
        </button>
      </div>

      {courses && courses.length > 0 ? (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Course Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaBook className="text-lg sm:text-xl" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate text-sm sm:text-base">{course.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        {course.level}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                        <FaListOl /> {course.lessons?.length || 0} materi
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setAddLessonFor({ id: course.id, title: course.title })}
                    className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FaPlus className="text-[10px] sm:text-xs" /> <span className="hidden sm:inline">Tambah Materi</span><span className="sm:hidden">Materi</span>
                  </button>
                  <button
                    onClick={() => setEditingCourse(course)}
                    className="p-2 sm:p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit Kursus"
                  >
                    <FaPen className="text-xs sm:text-sm" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                    disabled={deletingId === course.id}
                    className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === course.id ? <FaSpinner className="animate-spin text-xs sm:text-sm" /> : <FaTrash className="text-xs sm:text-sm" />}
                  </button>
                  <button
                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                    className="p-2 sm:p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedCourse === course.id ? <FaChevronUp className="text-xs sm:text-sm" /> : <FaChevronDown className="text-xs sm:text-sm" />}
                  </button>
                </div>
              </div>

              {/* Expanded Lessons List */}
              {expandedCourse === course.id && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {course.lessons && course.lessons.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {course.lessons
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((lesson, index) => (
                        <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white transition-colors">
                          <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://img.youtube.com/vi/${lesson.youtube_video_id}/default.jpg`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{formatDuration(lesson.duration_seconds)}</span>
                              {lesson.is_preview && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <FaEye /> Gratis
                                </span>
                              )}
                              {!lesson.is_published && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Draft</span>
                              )}
                            </div>
                          </div>
                          <a
                            href={`https://www.youtube.com/watch?v=${lesson.youtube_video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Buka di YouTube"
                          >
                            <FaYoutube />
                          </a>
                          <button
                            onClick={() => setAddQuizFor({ id: lesson.id, title: lesson.title })}
                            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="Tambah Soal Quiz"
                          >
                            <FaCircleQuestion />
                          </button>
                          <button
                            onClick={() => setEditingLesson(lesson)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Materi"
                          >
                            <FaPen />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            disabled={deletingLessonId === lesson.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingLessonId === lesson.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <p className="text-sm font-medium mb-3">Belum ada materi di kursus ini.</p>
                      <button
                        onClick={() => setAddLessonFor({ id: course.id, title: course.title })}
                        className="text-sm font-bold text-violet-600 hover:text-violet-800"
                      >
                        + Tambah Materi Pertama
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 text-center py-16">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBook className="text-2xl" />
          </div>
          <p className="text-gray-500 font-medium mb-4">Belum ada kursus yang dibuat.</p>
          <button
            onClick={() => setShowCourseForm(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            <FaPlus className="inline mr-2" /> Buat Kursus Pertama
          </button>
        </div>
      )}

      {showCourseForm && <AddCourseForm onClose={() => setShowCourseForm(false)} />}
      {addLessonFor && <AddLessonForm courseId={addLessonFor.id} courseName={addLessonFor.title} onClose={() => setAddLessonFor(null)} />}
      {addQuizFor && <AddQuizForm lessonId={addQuizFor.id} lessonName={addQuizFor.title} onClose={() => setAddQuizFor(null)} />}
      {editingCourse && <EditCourseForm course={editingCourse} onClose={() => setEditingCourse(null)} />}
      {editingLesson && <EditLessonForm lesson={editingLesson} onClose={() => setEditingLesson(null)} />}
    </>
  )
}
