import Link from 'next/link'
import { resetPassword } from '../auth/actions'
import { SubmitButton } from '@/components/SubmitButton'

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams?.error
  const message = searchParams?.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-b from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-t from-pink-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative z-10 backdrop-blur-sm bg-white/90">
        <div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Atur Password Baru
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masukkan password baru Anda di bawah ini.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{message}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" action={resetPassword}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password Baru
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <div>
            <SubmitButton pendingText="Menyimpan...">
              Simpan Password Baru
            </SubmitButton>
          </div>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            ← Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    </div>
  )
}
