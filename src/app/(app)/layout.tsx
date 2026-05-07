import Navbar from '@/components/Navbar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pb-20 md:pb-0 flex-1 flex flex-col">
      <Navbar isLandingPage={false} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
