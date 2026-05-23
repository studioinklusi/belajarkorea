import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HangulSurvivalClient from './HangulSurvivalClient';

export const metadata = {
  title: 'Hangul Survival - Tsuha.id',
  description: 'Tantang dirimu mengetik huruf dan kosakata Korea untuk melatih refleks bertahan hidup dari serangan objek!',
};

export default async function HangulSurvivalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/quiz-games/hangul-survival');
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

  const survivalScores = scores.filter(row => row.game_slug === 'hangul-survival');
  const initialMaxScore = survivalScores.length > 0 ? Math.max(...survivalScores.map(row => row.score)) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <HangulSurvivalClient 
        userId={user.id} 
        userName={profile?.full_name || 'Chingu'} 
        initialTotalXP={initialTotalXP}
        initialMaxScore={initialMaxScore}
        hasScoresInDb={hasScoresInDb}
      />
    </div>
  );
}
