import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon, CheckCircleIcon, PlayCircleIcon } from '@heroicons/react/24/solid'
import Navbar from '@/components/Navbar'

export default async function LandingPage() {

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-violet-200 selection:text-violet-900 overflow-x-hidden">
      {/* Navigation */}
      <Navbar isLandingPage={true} />

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-800 font-bold text-sm mb-8 animate-fade-in-up">
            <SparklesIcon className="w-5 h-5 text-yellow-500" />
            <span>안녕하세요! Mari kuasai Bahasa Korea!</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-8 animate-fade-in-up animation-delay-100">
            Belajar Bahasa Korea <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">
              Jadi Super Seru & Gampang
            </span>
          </h1>
          
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 mb-10 animate-fade-in-up animation-delay-200 leading-relaxed">
            Dari nol sampai bisa ngobrol tanpa *subtitle*! Kurikulum terstruktur, video pembelajaran interaktif, dan ribuan kosakata untuk persiapan TOPIK Anda.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up animation-delay-300">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Mulai Belajar Sekarang <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link 
              href="/courses" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-full font-bold text-lg hover:border-violet-500 hover:text-violet-600 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
            >
              <PlayCircleIcon className="w-6 h-6 text-violet-500" /> Lihat Kurikulum
            </Link>
          </div>

          <div className="mt-12 flex justify-center items-center gap-8 text-gray-500 text-sm font-semibold animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /> Kurikulum Terstruktur</div>
            <div className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /> Video Microlearning</div>
            <div className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /> Kuis Interaktif</div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Kenapa Belajar di <span className="text-violet-600">belajarkorea.id</span>?</h2>
            <p className="text-lg text-gray-600">Kami merancang metode belajar yang tidak membosankan, seperti Anda sedang didampingi oleh kakak kelas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-violet-50 border border-violet-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Kurikulum Terstruktur</h3>
              <p className="text-gray-600 leading-relaxed">Materi disusun dari level pemula (Hangul) hingga mahir. Tidak perlu bingung harus mulai dari mana.</p>
            </div>
            <div className="p-8 rounded-3xl bg-pink-50 border border-pink-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <span className="text-3xl">📺</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Video Kualitas Tinggi</h3>
              <p className="text-gray-600 leading-relaxed">Penjelasan super jernih dan santai. Bisa ditonton kapan saja dan di mana saja tanpa batas.</p>
            </div>
            <div className="p-8 rounded-3xl bg-yellow-50 border border-yellow-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Kuis & Latihan Aktif</h3>
              <p className="text-gray-600 leading-relaxed">Uji pemahamanmu langsung dengan kuis interaktif di setiap akhir materi. Auto-paham!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
              K
            </div>
            <span className="font-extrabold text-xl text-white">
              belajarkorea<span className="text-violet-400">.id</span>
            </span>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} belajarkorea.id. All rights reserved.
          </div>
          <div className="flex gap-6 font-medium">
            <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-white transition-colors">TikTok</Link>
            <Link href="#" className="hover:text-white transition-colors">YouTube</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
