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

  const hangulScores = scores.filter(row => row.game_slug === 'tebak-hangul');
  const maxHangulScore = hangulScores.length > 0 ? Math.max(...hangulScores.map(row => row.score)) : 0;
  const initialMaxHighScore = maxHangulScore * 10;

  const typingScores = scores.filter(row => row.game_slug === 'typing-challenge');
  const initialMaxWpm = typingScores.length > 0 ? Math.max(...typingScores.map(row => row.score)) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <QuizGamesClient 
        userId={user.id} 
        userName={profile?.full_name || 'Chingu'} 
        initialTotalXP={initialTotalXP}
        initialMaxHighScore={initialMaxHighScore}
        initialMaxWpm={initialMaxWpm}
        hasScoresInDb={hasScoresInDb}
      />
    </div>
  );
}
