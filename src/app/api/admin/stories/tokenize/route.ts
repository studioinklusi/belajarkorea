import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'content_admin';
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content_ko } = body as { content_ko: string };
    if (!content_ko) {
      return NextResponse.json({ error: "Missing content_ko" }, { status: 400 });
    }

    const apiKey = process.env.ALIBABA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Alibaba API key not configured" }, { status: 500 });
    }

    const prompt = `You are a linguist and Korean language teacher.
Analyze the following Korean text and tokenize it into individual words, particles, spaces, and punctuation for language learners.
For each token:
1. If it is a word, provide:
   - "t": the exact word form as it appears in the text (with particles if attached, e.g., "지우는", "한국어를").
   - "l": the base/dictionary form of the word (the lemma, e.g. "지우" for "지우는", "한국어" for "한국어를", "가르치다" for "가르쳐").
2. If it is a space, punctuation, or paragraph break, provide only:
   - "t": the character/string (e.g. " ", ".", "\\n").

Return the result as a STRICT JSON array of token objects. Do not wrap in markdown code blocks. Do not write any conversational text.

Text to tokenize:
${content_ko}`;

    const res = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: 'You are a precise JSON generator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Alibaba API error:", res.status, errorText);
      return NextResponse.json({ error: "Failed to contact tokenizer service" }, { status: 500 });
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content || '[]';
    
    // Clean up possible markdown code block wrappers
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    const tokens = JSON.parse(cleanJson);
    return NextResponse.json({ tokens });
  } catch (error: any) {
    console.error("Tokenizer API error:", error);
    return NextResponse.json({ error: error.message || "Failed to tokenize text" }, { status: 500 });
  }
}
