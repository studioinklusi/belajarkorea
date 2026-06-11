import { Metadata } from 'next'
import Link from 'next/link'
import { 
  FaGraduationCap, FaGamepad, FaChartLine, FaRobot, 
  FaCheckDouble, FaFileCircleCheck, FaHandSparkles, FaLightbulb, 
  FaBullseye, FaCircleCheck 
} from 'react-icons/fa6'

export const metadata: Metadata = {
  title: 'Tentang Kami | Tsuha.id',
  description: 'Mengenal Tsuha.id lebih dekat - platform pembelajaran Bahasa Korea interaktif berbasis metode mnemonik dan video microlearning pertama di Indonesia.',
}

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 min-h-screen font-sans overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-10 w-80 h-80 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse delay-1000 pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-black uppercase tracking-wider rounded-full shadow-xs">
            <FaHandSparkles className="w-3.5 h-3.5 animate-bounce" /> Platform Belajar Masa Kini
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.12]">
            Belajar Bahasa Korea Jadi <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600">
              Lebih Seru &amp; Praktis!
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Tsuha.id mendemokrasikan pembelajaran bahasa Korea melalui video microlearning terstruktur, kuis adaptif, dan modul mnemonik interaktif yang revolusioner.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { value: '15.000+', label: 'Siswa Aktif Belajar' },
            { value: '18+', label: 'Chapter Mnemonik' },
            { value: '100+', label: 'Video Microlearning' },
            { value: '98%', label: 'Tingkat Kelulusan Kuis' }
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm text-center transform hover:scale-105 transition-all duration-300"
            >
              <p className="text-3xl sm:text-4xl font-black text-violet-600 tracking-tight">{stat.value}</p>
              <p className="mt-2 text-xs sm:text-sm font-bold text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story / Kisah Kami Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-gray-100/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-fuchsia-50 border border-fuchsia-100 text-fuchsia-700 text-xs font-black uppercase tracking-wider rounded-full shadow-xs">
              <FaLightbulb className="w-3.5 h-3.5" /> Kisah Di Balik Tsuha.id
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Mengapa Kami Membangun Tsuha.id?
            </h2>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
              Menghafal ribuan karakter Hangul baru serta memahami tata bahasa Korea (S-O-V) yang terbalik seringkali menjadi penghalang terbesar bagi pemula. Metode belajar tradisional dengan buku tebal atau video berdurasi 1 jam sering kali membuat lelah dan tidak konsisten.
            </p>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
              Kami hadir untuk mengubah cara belajar Anda. Dengan memecah materi menjadi <strong className="font-bold text-gray-900">video microlearning (3-5 menit)</strong> dan memadukannya dengan <strong className="font-bold text-gray-900">gamifikasi interaktif</strong>, kami ingin membantu Anda menikmati proses belajar layaknya bermain game petualangan, kapan saja dan di mana saja.
            </p>
          </div>

          <div className="lg:col-span-7 relative">
            {/* Visual Decorative Card representing Mnemonic method */}
            <div className="bg-gradient-to-tr from-violet-600 to-indigo-700 p-8 sm:p-12 rounded-[32px] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              
              <h3 className="text-xl sm:text-2xl font-black mb-6 flex items-center gap-2.5">
                <span className="p-2 bg-white/20 rounded-xl">💡</span> Rahasia Kami: Metode Mnemonik Visual
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { hangul: 'ㄱ', bunyi: 'g / k', mnemonic: 'Bentuk Senjata Api (🔫 Gun)' },
                  { hangul: 'ㄴ', bunyi: 'n', mnemonic: 'Bentuk Cermin Huruf N (🪞 N-Mirror)' },
                  { hangul: 'ㄷ', bunyi: 'd / t', mnemonic: 'Kusen Pintu Samping (🚪 Door Frame)' },
                  { hangul: 'ㄹ', bunyi: 'r / l', mnemonic: 'Ular yang Berkelok (🐍 Snake/uLar)' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/20 transition-colors">
                    <div className="w-12 h-12 bg-white text-violet-700 rounded-xl flex items-center justify-center text-xl font-black shadow-md shrink-0">
                      {item.hangul}
                    </div>
                    <div>
                      <p className="text-xs font-black opacity-80 uppercase tracking-wider">Bunyi: {item.bunyi}</p>
                      <p className="text-sm font-extrabold mt-0.5">{item.mnemonic}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-xs sm:text-sm font-semibold opacity-90 leading-relaxed text-center italic">
                "Asosiasi visual yang cepat menancapkan hafalan ke dalam long-term memory dalam hitungan detik!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visi & Misi Section */}
      <section className="py-16 bg-gray-50/50 border-y border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-full shadow-xs">
              <FaBullseye className="w-3.5 h-3.5" /> Arah &amp; Komitmen
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Visi &amp; Misi Tsuha.id</h2>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Komitmen kami untuk terus menghadirkan inovasi edukasi bahasa Korea terbaik di Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Visi Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-xl font-bold shrink-0">
                ⭐
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Visi Kami</h3>
              <p className="text-gray-500 text-sm sm:text-base leading-relaxed flex-grow">
                Menjadi platform e-learning bahasa Korea nomor satu di Indonesia yang paling interaktif, menyenangkan, dan terjangkau, sehingga dapat melahirkan ribuan talenta Indonesia yang fasih berbahasa Korea untuk menunjang karir maupun pendidikan mereka.
              </p>
            </div>

            {/* Misi Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center text-xl font-bold shrink-0">
                🚀
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Misi Kami</h3>
              <ul className="space-y-3 text-gray-500 text-xs sm:text-sm leading-relaxed flex-grow">
                <li className="flex items-start gap-2.5">
                  <FaCircleCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Mengembangkan kurikulum visual berbasis level secara bertahap dan teruji.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCircleCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Menyediakan kuis evaluasi komprehensif untuk validasi pemahaman siswa.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCircleCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Membangun komunitas belajar bahasa Korea yang saling mendukung dan aktif.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCircleCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Menyediakan produk digital pendukung (PDF/Template) berkualitas tinggi secara praktis.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ekosistem Belajar Lengkap</h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Semua yang Anda butuhkan untuk menguasai bahasa Korea dikemas secara interaktif dalam satu platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <FaGraduationCap className="w-6 h-6" />,
              bg: 'bg-violet-100 text-violet-600',
              title: 'Video Microlearning',
              desc: 'Pelajaran singkat berdurasi 3-5 menit yang membahas poin penting tata bahasa, kosakata, dan frasa praktis tanpa membuang waktu.'
            },
            {
              icon: <FaGamepad className="w-6 h-6" />,
              bg: 'bg-orange-100 text-orange-600',
              title: 'Modul Mnemonik Interaktif',
              desc: 'Game interaktif seperti Drag & Drop, Typing Challenge, dan Tebak Hangul agar menghafal huruf dan kosakata menjadi cepat dan seru.'
            },
            {
              icon: <FaCheckDouble className="w-6 h-6" />,
              bg: 'bg-emerald-100 text-emerald-600',
              title: 'Kuis Evaluasi',
              desc: 'Kuis berisi 5 pertanyaan di setiap materi dengan kelulusan minimal 80% untuk memastikan Anda benar-benar mengerti topik pelajaran.'
            },
            {
              icon: <FaChartLine className="w-6 h-6" />,
              bg: 'bg-blue-100 text-blue-600',
              title: 'Progress & Streak Tracker',
              desc: 'Tracker harian untuk melacak streak belajar Anda, memotivasi Anda agar tetap disiplin membuka materi baru setiap harinya.'
            },
            {
              icon: <FaFileCircleCheck className="w-6 h-6" />,
              bg: 'bg-pink-100 text-pink-600',
              title: 'Sertifikat Kelulusan Resmi',
              desc: 'Dapatkan sertifikat resmi digital dari Tsuha.id yang dapat diverifikasi secara online setelah menyelesaikan ujian akhir level.'
            },
            {
              icon: <FaRobot className="w-6 h-6 animate-pulse" />,
              bg: 'bg-fuchsia-100 text-fuchsia-600',
              title: 'AI Buddy Chat Simulator',
              desc: 'Roadmap masa depan untuk berlatih bercakap-cakap bahasa Korea secara langsung dengan AI pintar interaktif kami.'
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md hover:border-gray-200 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center mb-5 shrink-0`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-16">
        <div className="bg-gradient-to-tr from-violet-600 to-indigo-800 text-white rounded-[40px] p-8 sm:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Siap Memulai Petualangan Belajarmu?
            </h2>
            <p className="text-white/80 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Ribuan Chingu (teman) telah bergabung dan belajar bahasa Korea secara praktis di Tsuha.id. Jadilah bagian dari kami hari ini!
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/register" 
                className="w-full sm:w-auto bg-white text-violet-700 px-8 py-3.5 rounded-full font-black text-sm hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
              >
                Daftar Gratis Sekarang
              </Link>
              <Link 
                href="/pricing" 
                className="w-full sm:w-auto border-2 border-white/30 text-white px-8 py-3.5 rounded-full font-black text-sm hover:border-white/60 hover:bg-white/5 transition-all text-center"
              >
                Lihat Paket Langganan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
