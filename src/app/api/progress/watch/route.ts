import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lesson_id, watch_duration, mark_complete } = await request.json()

    if (!lesson_id || watch_duration === undefined) {
      return NextResponse.json({ error: 'lesson_id dan watch_duration diperlukan' }, { status: 400 })
    }

    // Check existing progress
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id, watch_duration, status')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson_id)
      .single()

    const updateData: Record<string, any> = {
      watch_duration: Math.max(watch_duration, existing?.watch_duration || 0), // Keep highest
      updated_at: new Date().toISOString(),
    }

    // Auto-complete if 80%+ watched
    if (mark_complete && existing?.status !== 'completed') {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
    }

    if (existing) {
      // Update existing record
      await supabase
        .from('user_progress')
        .update(updateData)
        .eq('id', existing.id)
    } else {
      // Insert new record
      await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          lesson_id,
          status: mark_complete ? 'completed' : 'in_progress',
          watch_duration: watch_duration,
          completed_at: mark_complete ? new Date().toISOString() : null,
        })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Watch progress API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
