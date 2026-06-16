import Link from 'next/link'
import LoginForm from './LoginForm'
import Navbar from '@/components/Navbar'

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; message?: string; redirectTo?: string }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams?.error
  const message = searchParams?.message
  const redirectTo = searchParams?.redirectTo

  return (
    <div className="bg-brand-background text-brand-on-surface min-h-screen flex flex-col font-sans">
      {/* Header / TopAppBar */}
      <Navbar isAuthPage={true} />

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-16 lg:items-start items-center">
          
          {/* Left Column: Branding / Visual */}
          <div className="hidden lg:flex flex-col space-y-6 xl:space-y-8 animate-fade-in-up">
            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-brand-on-surface">
                Masuk ke Akun <br />
                &amp; Lanjutkan <span className="text-brand-primary">Belajarmu!</span>
              </h1>
              <p className="text-sm lg:text-base text-brand-on-surface-variant max-w-md leading-relaxed">
                Lanjutkan progres belajar bahasa Korea Anda melalui video microlearning terstruktur dan modul interaktif yang menyenangkan.
              </p>
              <ul className="space-y-2.5 pt-1 text-xs lg:text-sm font-semibold text-brand-on-surface/90">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 font-bold text-lg">check_circle</span>
                  Video Microlearning &amp; Kuis Evaluasi
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 font-bold text-lg">check_circle</span>
                  Modul Mnemonik Interaktif (Drag &amp; Drop, Flashcards)
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 font-bold text-lg">check_circle</span>
                  Progress Tracker &amp; Sertifikat Kelulusan
                </li>
              </ul>
            </div>
            
            <div className="relative w-full aspect-square max-w-[300px] xl:max-w-[340px] lg:ml-0 animate-float">
              {/* Background Glow Blobs */}
              <div className="absolute top-0 -left-4 w-60 h-60 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-60 h-60 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-60 h-60 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
              
              {/* Core Image Asset */}
              <img
                src="/hero-image-placeholder.png"
                alt="Belajar Bahasa Korea Interaktif"
                className="relative rounded-[32px] shadow-xl border-4 border-white/50 backdrop-blur-sm transform rotate-2 hover:rotate-0 transition-all duration-500 w-full h-full object-cover"
              />
              
              {/* Floating Bubble: 안녕하세요! */}
              <div className="absolute -right-4 top-10 bg-white px-5 py-3 rounded-2xl shadow-lg border border-brand-surface-variant/30 animate-bounce delay-700 hidden md:block">
                <span className="text-lg font-bold text-brand-on-surface">안녕하세요!</span>
              </div>
              
              {/* Floating Card: Korean Flag */}
              <div className="absolute -left-4 bottom-20 bg-white p-3 rounded-2xl shadow-lg border border-brand-surface-variant/30 animate-bounce delay-1000 hidden md:block">
                <img src="/korea.png" alt="Bendera Korea" className="w-8 h-8 rounded-full object-cover shadow-md" />
              </div>
            </div>
          </div>

          {/* Right Column: Login Card Form */}
          <div className="flex justify-center lg:justify-end">
            <LoginForm error={error} message={message} redirectTo={redirectTo} />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto border-t border-brand-surface-variant/50">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-brand-outline">© 2026 Tsuha.id. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs font-semibold text-brand-outline hover:text-brand-primary transition-colors">
              Syarat &amp; Ketentuan
            </Link>
            <Link href="/privacy" className="text-xs font-semibold text-brand-outline hover:text-brand-primary transition-colors">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
