import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuizGamesClient from './QuizGamesClient';

export const metadata = {
  title: 'Quiz & Games Bahasa Korea - Tsuha.id',
  description: 'Kumpulan kuis dan game interaktif untuk belajar bahasa Korea dengan seru.',
};

export default async function QuizGamesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/quiz-games');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <QuizGamesClient userId={user.id} userName={profile?.full_name || 'Chingu'} />
    </div>
  );
}
