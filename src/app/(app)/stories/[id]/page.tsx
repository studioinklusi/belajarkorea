import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReaderClient from './ReaderClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StoryReaderPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=/stories/${id}`);
  }

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'content_admin';

  // 3. Fetch Subscription to check gating
  const { data: activeSubs } = await supabase
    .from('v_active_subscriptions')
    .select('package_slug')
    .eq('user_id', user.id)
    .eq('computed_status', 'active');

  const activeBaseSlugs = activeSubs?.map(s => s.package_slug.split('-')[0]) || [];
  const hasActiveSub = activeBaseSlugs.length > 0;
  const isProOrPremium = activeBaseSlugs.includes('pro') || activeBaseSlugs.includes('premium') || isAdmin;
  const isBasic = activeBaseSlugs.includes('basic') && !isProOrPremium;

  // 4. Fetch Story
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (storyError || !story) {
    redirect('/stories');
  }

  // 5. Enforce Gating
  let isLocked = false;
  if (isAdmin) {
    isLocked = false;
  } else if (!hasActiveSub) {
    isLocked = true;
  } else if (story.level !== 'beginner' && isBasic) {
    isLocked = true;
  }

  if (isLocked) {
    redirect('/stories');
  }

  // 6. Fetch initial progress
  const { data: progress } = await supabase
    .from('user_stories_progress')
    .select('is_completed')
    .eq('user_id', user.id)
    .eq('story_id', id)
    .single();

  const initialCompleted = progress?.is_completed || false;

  return (
    <ReaderClient
      story={story}
      userId={user.id}
      initialCompleted={initialCompleted}
    />
  );
}
