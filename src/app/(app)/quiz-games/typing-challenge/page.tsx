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
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'content_admin';

  // Check subscription
  const { data: activeSubs } = await supabase
    .from('v_active_subscriptions')
    .select('package_slug')
    .eq('user_id', user.id)
    .eq('computed_status', 'active');

  const isSubscribed = (activeSubs && activeSubs.length > 0) || isAdmin;

  if (!isSubscribed) {
    redirect('/quiz-games');
  }

  // Retrieve user game scores from Supabase
  const { data: scoresData, error: scoresError } = await supabase
    .from('user_game_scores')
    .select('game_slug, score, xp_earned')
    .eq('user_id', user.id);

  if (scoresError) {
    console.error('Error fetching game scores:', scoresError);
  }

  const scores = scoresData || [];
  const hasScoresInDb = scores.length > 0;

  // Calculate statistics from database rows
  const initialTotalXP = scores.reduce((acc, row) => acc + (row.xp_earned || 0), 0);

  const typingScores = scores.filter(row => row.game_slug === 'typing-challenge');
  const initialMaxWpm = typingScores.length > 0 ? Math.max(...typingScores.map(row => row.score)) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <TypingChallengeClient 
        userId={user.id} 
        userName={profile?.full_name || 'Chingu'} 
        initialTotalXP={initialTotalXP}
        initialMaxWpm={initialMaxWpm}
        hasScoresInDb={hasScoresInDb}
      />
    </div>
  );
}
