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

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <TebakHangulClient userId={user.id} userName={profile?.full_name || 'Chingu'} />
    </div>
  );
}
