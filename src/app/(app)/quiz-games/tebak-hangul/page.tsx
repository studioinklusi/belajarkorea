import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TebakHangulClient from './TebakHangulClient';

export const metadata = {
  title: 'Tebak Hangul - Tsuha.id',
  description: 'Asah kemampuan membaca huruf Korea dengan kuis cepat dan menyenangkan.',
};

export default async function TebakHangulPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/quiz-games/tebak-hangul');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Retrieve user game scores from Supabase
  const { data: scoresData, error: scoresError } = await supabase
    .from('user_game_scores')
    .select('game_slug, game_mode, score, xp_earned')
    .eq('user_id', user.id);

  if (scoresError) {
    console.error('Error fetching game scores:', scoresError);
  }

  const scores = scoresData || [];
  const hasScoresInDb = scores.length > 0;

  // Calculate statistics from database rows
  const initialTotalXP = scores.reduce((acc, row) => acc + (row.xp_earned || 0), 0);

  // Group high scores by game_mode for 'tebak-hangul'
  const initialHighScores: Record<string, number> = {};
  scores.forEach(row => {
    if (row.game_slug === 'tebak-hangul') {
      const levelId = row.game_mode;
      if (initialHighScores[levelId] === undefined || row.score > initialHighScores[levelId]) {
        initialHighScores[levelId] = row.score;
      }
    }
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <TebakHangulClient 
        userId={user.id} 
        userName={profile?.full_name || 'Chingu'} 
        initialTotalXP={initialTotalXP}
        initialHighScores={initialHighScores}
        hasScoresInDb={hasScoresInDb}
      />
    </div>
  );
}
