import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FlashcardClient from './FlashcardClient';

export const metadata = {
  title: 'Flashcard Saya - Tsuha.id',
  description: 'Gunakan sistem spaced repetition (SRS) untuk menghafal kosakata Korea secara efektif.',
};

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/flashcards');
  }

  // Fetch all flashcards for this user
  const { data: flashcards, error } = await supabase
    .from('user_flashcards')
    .select('*')
    .eq('user_id', user.id)
    .order('next_review_at', { ascending: true });

  if (error) {
    console.error("Error fetching flashcards:", error);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <FlashcardClient initialFlashcards={flashcards || []} userId={user.id} />
    </div>
  );
}
