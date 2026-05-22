import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TypingChallengeClient from './TypingChallengeClient';

export const metadata = {
  title: 'Typing Challenge Hangul - Tsuha.id',
  description: 'Latih kecepatan membaca dan mengetik huruf Korea dengan Typing Challenge Hangul.',
};

export default async function TypingChallengePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/quiz-games/typing-challenge');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <TypingChallengeClient userId={user.id} userName={profile?.full_name || 'Chingu'} />
    </div>
  );
}
