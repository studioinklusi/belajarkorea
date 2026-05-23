import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FaBookOpen, FaLock, FaCircleCheck, FaGraduationCap, FaLayerGroup, FaCircleInfo, FaHandPointer } from 'react-icons/fa6';

export const metadata = {
  title: 'Membaca Cerita - Tsuha.id',
  description: 'Latih membaca Hangul dengan cerita interaktif dan kembangkan kosakata Korea-mu.',
};

const LEVEL_WEIGHT: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function StoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const filterLevel = resolvedSearchParams.level as string | undefined;

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
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // 4. Fetch User's Reading Progress
  const { data: userProgress } = await supabase
    .from('user_stories_progress')
    .select('story_id, is_completed')
    .eq('user_id', user.id);

  const completedStoryIds = new Set(
    userProgress?.filter(p => p.is_completed).map(p => p.story_id) || []
  );

  // 5. Fetch Flashcard Count for the user
  const { count: flashcardCount } = await supabase
    .from('user_flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const totalFlashcards = flashcardCount ?? 0;

  // 6. Sort & Filter Stories
  let displayStories = stories ? [...stories] : [];
  
  // Sort: beginner -> intermediate -> advanced, then by created_at desc
  displayStories.sort((a, b) => {
    const weightA = LEVEL_WEIGHT[a.level] || 99;
    const weightB = LEVEL_WEIGHT[b.level] || 99;
    if (weightA !== weightB) {
      return weightA - weightB; // Ascending by level weight (Beginner=1, Adv=3)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Filter
  if (filterLevel && ['beginner', 'intermediate', 'advanced'].includes(filterLevel)) {
    displayStories = displayStories.filter(s => s.level === filterLevel);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <main className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <FaBookOpen className="text-violet-600 shrink-0" /> Cerita & Artikel
            </h1>
            <p className="mt-2 text-gray-500 font-medium">
              Ketuk kata untuk melihat terjemahan instan dan tambahkan ke koleksi flashcard pribadimu!
            </p>
          </div>
          {totalFlashcards > 0 ? (
            <Link
              href="/flashcards"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 relative"
            >
              <FaGraduationCap className="w-5 h-5" /> Review Flashcards
              <span className="ml-1 bg-white/25 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                {totalFlashcards}
              </span>
            </Link>
          ) : (
            <div className="w-full sm:w-auto bg-violet-50 border border-violet-200/60 rounded-2xl p-4 sm:max-w-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FaHandPointer className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-violet-800 leading-relaxed">
                    Ketuk kata Korea di cerita untuk menyimpannya sebagai flashcard.
                  </p>
                  <p className="text-[10px] text-violet-500 font-semibold mt-1">
                    Flashcard akan otomatis tersedia untuk di-review! ✨
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Level Filters */}
        <div className="mb-8 flex items-center">
          <span className="text-sm font-bold text-gray-500 mr-3 hidden sm:inline-block shrink-0">Filter Level:</span>
          <div className="flex overflow-x-auto gap-3 pb-2 -mb-2 w-full snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/stories"
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 snap-start ${
                !filterLevel 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Semua
            </Link>
            <Link
              href="/stories?level=beginner"
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 snap-start ${
                filterLevel === 'beginner'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              📘 Pemula
            </Link>
            <Link
              href="/stories?level=intermediate"
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 snap-start ${
                filterLevel === 'intermediate'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              📗 Menengah
            </Link>
            <Link
              href="/stories?level=advanced"
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 snap-start ${
                filterLevel === 'advanced'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              📕 Mahir
            </Link>
          </div>
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
        {displayStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayStories.map((story) => {
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
                        {story.level === 'beginner' ? 'Pemula' : story.level === 'intermediate' ? 'Menengah' : 'Mahir'}
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
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <FaBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Belum Ada Cerita</h3>
            <p className="text-gray-500 text-sm mt-1">
              {filterLevel ? 'Tidak ada cerita untuk level ini.' : 'Saat ini belum ada cerita atau artikel yang dirilis.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
