import AiBuddyClient from './AiBuddyClient'

export const metadata = {
  title: 'AI Buddy - belajarkorea.id',
  description: 'Latihan ngobrol bahasa Korea dengan AI Tutor',
}

export default function AIBuddyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
            <AiBuddyClient />
    </div>
  )
}
