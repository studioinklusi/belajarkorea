import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FaBookOpen, FaLock, FaCircleCheck, FaGraduationCap, FaLayerGroup } from 'react-icons/fa6';

export const metadata = {
  title: 'Membaca Cerita - Tsuha.id',
  description: 'Latih membaca Hangul dengan cerita interaktif dan kembangkan kosakata Korea-mu.',
};

export default async function StoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/stories');
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'content_admin';

  // 2. Fetch Active Subscriptions
  const { data: activeSubs } = await supabase
    .from('v_active_subscriptions')
    .select('package_slug')
    .eq('user_id', user.id)
    .eq('computed_status', 'active');

  const activeBaseSlugs = activeSubs?.map(s => s.package_slug.split('-')[0]) || [];
  const hasActiveSub = activeBaseSlugs.length > 0;
  const isProOrPremium = activeBaseSlugs.includes('pro') || activeBaseSlugs.includes('premium') || isAdmin;
  const isBasic = activeBaseSlugs.includes('basic') && !isProOrPremium;

  // 3. Fetch Stories
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .eq('is_published', true)
    .order('level', { ascending: true })
    .order('created_at', { ascending: false });

  // 4. Fetch User's Reading Progress
  const { data: userProgress } = await supabase
    .from('user_stories_progress')
    .select('story_id, is_completed')
    .eq('user_id', user.id);

  const completedStoryIds = new Set(
    userProgress?.filter(p => p.is_completed).map(p => p.story_id) || []
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <main className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <FaBookOpen className="text-violet-600 shrink-0" /> Cerita & Artikel
            </h1>
            <p className="mt-2 text-gray-500 font-medium">
              Ketuk kata untuk melihat terjemahan instan dan tambahkan ke koleksi flashcard pribadimu!
            </p>
          </div>
          <Link
            href="/flashcards"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <FaGraduationCap className="w-5 h-5" /> Review Flashcards
          </Link>
        </div>

        {/* Subscription Status Banner */}
        {!hasActiveSub && (
          <div className="mb-10 bg-yellow-50 border border-yellow-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-yellow-800">Paket Langganan Dibutuhkan</h3>
              <p className="text-yellow-700 text-sm mt-1">Anda perlu mengaktifkan paket belajar terlebih dahulu untuk membaca cerita.</p>
            </div>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-yellow-600 text-white font-bold rounded-full text-sm shadow-md hover:bg-yellow-700 transition-all text-center whitespace-nowrap"
            >
              Pilih Paket Sekarang
            </Link>
          </div>
        )}

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories && stories.length > 0 ? (
            stories.map((story) => {
              // Determine if story is locked for this user
              let isLocked = false;
              if (isAdmin) {
                isLocked = false;
              } else if (!hasActiveSub) {
                isLocked = true;
              } else if (story.level !== 'beginner' && isBasic) {
                isLocked = true;
              }

              const isCompleted = completedStoryIds.has(story.id);

              return (
                <div
                  key={story.id}
                  className={`bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 flex flex-col h-full group ${
                    isLocked ? 'opacity-85' : 'hover:shadow-lg hover:border-violet-200 hover:-translate-y-1'
                  }`}
                >
                  {/* Thumbnail / Cover */}
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={story.cover_image_url || 'https://images.unsplash.com/photo-1542044896530-05d85be9b11a?q=80&w=400'}
                      alt={story.title_id}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        !isLocked && 'group-hover:scale-105'
                      }`}
                    />
                    {/* Level Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm text-white ${
                          story.level === 'beginner'
                            ? 'bg-emerald-500'
                            : story.level === 'intermediate'
                            ? 'bg-amber-500'
                            : 'bg-purple-600'
                        }`}
                      >
                        {story.level}
                      </span>
                    </div>

                    {/* Progress Indicator */}
                    {isCompleted && (
                      <div className="absolute top-4 right-4 z-10 bg-green-500 text-white p-1.5 rounded-full shadow-sm">
                        <FaCircleCheck className="w-4 h-4" />
                      </div>
                    )}

                    {/* Lock Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center">
                        <div className="bg-white/95 rounded-full p-4 shadow-lg text-gray-800 flex items-center justify-center">
                          <FaLock className="w-6 h-6 text-violet-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
                        <FaLayerGroup /> {story.category.toUpperCase().replace('_', ' ')}
                      </div>
                      <h3 className="text-xl font-extrabold text-gray-900 mb-1 leading-snug">
                        {story.title_ko}
                      </h3>
                      <p className="text-gray-500 text-sm font-semibold mb-4 leading-normal">
                        {story.title_id}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-50 mt-auto">
                      {isLocked ? (
                        <Link
                          href="/pricing"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-black text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                        >
                          <FaLock /> Upgrade untuk Akses
                        </Link>
                      ) : (
                        <Link
                          href={`/stories/${story.id}`}
                          className="w-full inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-black text-white bg-gray-900 hover:bg-gray-800 transition-all text-center"
                        >
                          {isCompleted ? 'Baca Lagi' : 'Mulai Membaca'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <FaBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Belum Ada Cerita</h3>
              <p className="text-gray-500 text-sm mt-1">Saat ini belum ada cerita atau artikel yang dirilis.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
