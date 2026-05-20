import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rating } = body as { rating: 'again' | 'hard' | 'good' | 'easy' };
    if (!rating) {
      return NextResponse.json({ error: "Missing rating" }, { status: 400 });
    }

    // Fetch the flashcard
    const { data: flashcard, error: fetchError } = await supabase
      .from('user_flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !flashcard) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    // Map user rating to quality (0-5 scale in SM-2)
    // 1: "Again" (Forgot)
    // 3: "Hard" (Remembered with effort)
    // 4: "Good" (Remembered nicely)
    // 5: "Easy" (Perfect response)
    let q = 4;
    if (rating === 'again') q = 1;
    else if (rating === 'hard') q = 3;
    else if (rating === 'good') q = 4;
    else if (rating === 'easy') q = 5;

    let repetitions = flashcard.repetitions;
    let intervalDays = flashcard.interval_days;
    let easeFactor = Number(flashcard.ease_factor);

    // SM-2 Algorithm logic
    if (q < 3) {
      // Forgot the word
      repetitions = 0;
      intervalDays = 1;
    } else {
      // Remembered the word
      if (repetitions === 0) {
        intervalDays = 1;
      } else if (repetitions === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.ceil(intervalDays * easeFactor);
      }
      repetitions++;
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    // Calculate next review date
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

    // Map box level (just for simple visual grouping, Box 1-5)
    let boxLevel = flashcard.box_level;
    if (q < 3) {
      boxLevel = 1;
    } else {
      boxLevel = Math.min(5, boxLevel + 1);
    }

    const { data: updatedCard, error: updateError } = await supabase
      .from('user_flashcards')
      .update({
        repetitions,
        interval_days: intervalDays,
        ease_factor: easeFactor,
        box_level: boxLevel,
        next_review_at: nextReviewAt.toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: "Failed to update flashcard" }, { status: 500 });
    }

    return NextResponse.json(updatedCard);
  } catch (error: any) {
    console.error("SRS update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
