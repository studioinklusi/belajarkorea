'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface GameScoreData {
  gameSlug: string;
  gameMode: string;
  score: number;
  accuracy: number;
  xpEarned: number;
}

interface LegacySyncData {
  xp: number;
  highscores: Record<string, number>;
  typingWpm: number;
}

/**
 * Save a new game score session to Supabase database.
 */
export async function saveGameScore(data: GameScoreData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('user_game_scores')
    .insert({
      user_id: user.id,
      game_slug: data.gameSlug,
      game_mode: data.gameMode,
      score: data.score,
      accuracy: data.accuracy,
      xp_earned: data.xpEarned,
    });

  if (error) {
    console.error('Error saving game score:', error);
    return { error: 'Gagal menyimpan skor ke database.' };
  }

  revalidatePath('/quiz-games');
  revalidatePath('/quiz-games/tebak-hangul');
  revalidatePath('/quiz-games/typing-challenge');
  revalidatePath('/quiz-games/hangul-survival');

  return { success: true };
}

/**
 * Sync legacy scores from localStorage to Supabase database.
 * Only runs if the user has 0 records in user_game_scores to avoid duplicates.
 */
export async function syncLegacyScores(legacyData: LegacySyncData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Check if scores already exist for this user in DB
  const { count, error: countError } = await supabase
    .from('user_game_scores')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    console.error('Error checking existing scores count:', countError);
    return { error: 'Gagal memverifikasi status sinkronisasi.' };
  }

  if (count !== null && count > 0) {
    return { success: true, synced: false, message: 'Sudah tersinkronisasi sebelumnya.' };
  }

  const recordsToInsert = [];
  let calculatedXp = 0;

  // 1. Process Tebak Hangul Highscores
  if (legacyData.highscores && typeof legacyData.highscores === 'object') {
    for (const [levelId, score] of Object.entries(legacyData.highscores)) {
      if (typeof score !== 'number' || isNaN(score)) continue;
      
      const bonus = score === 10 ? 50 : 0;
      const xpEarned = (score * 10) + bonus;
      calculatedXp += xpEarned;

      recordsToInsert.push({
        user_id: user.id,
        game_slug: 'tebak-hangul',
        game_mode: levelId,
        score: score,
        accuracy: score * 10,
        xp_earned: xpEarned,
      });
    }
  }

  // 2. Process Typing Challenge Highscore (WPM)
  if (typeof legacyData.typingWpm === 'number' && legacyData.typingWpm > 0) {
    recordsToInsert.push({
      user_id: user.id,
      game_slug: 'typing-challenge',
      game_mode: 'legacy-sync',
      score: legacyData.typingWpm,
      accuracy: 100,
      xp_earned: 0,
    });
  }

  // 3. Process XP Difference (if total legacy XP is greater than the sum of calculated kuis XP)
  const diffXp = legacyData.xp - calculatedXp;
  if (diffXp > 0) {
    recordsToInsert.push({
      user_id: user.id,
      game_slug: 'legacy-sync',
      game_mode: 'legacy-sync',
      score: 0,
      accuracy: 100,
      xp_earned: diffXp,
    });
  }

  if (recordsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('user_game_scores')
      .insert(recordsToInsert);

    if (insertError) {
      console.error('Error inserting legacy synced scores:', insertError);
      return { error: 'Gagal mengunggah data progres lama.' };
    }
  }

  revalidatePath('/quiz-games');
  revalidatePath('/quiz-games/tebak-hangul');
  revalidatePath('/quiz-games/typing-challenge');
  revalidatePath('/quiz-games/hangul-survival');

  return { success: true, synced: true };
}
