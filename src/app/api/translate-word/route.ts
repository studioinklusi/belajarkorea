import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = rateLimit(`translate-${ip}`, 40, 60 * 1000); // 40 requests per minute
    if (!limit.success) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan terjemahan. Silakan tunggu sebentar." },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Anda harus login untuk menggunakan fitur ini." }, { status: 401 });
    }

    const body = await request.json();
    const { word, context } = body as { word: string; context: string };

    if (!word || !context) {
      return NextResponse.json({ error: "Missing word or context" }, { status: 400 });
    }

    const apiKey = process.env.ALIBABA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    const prompt = `You are a professional Korean-Indonesian translator and language tutor.
Analyze the given Korean word within its context sentence.
Return a raw JSON object containing the exact fields:
{
  "word_ko": "the selected word in Korean (as is)",
  "word_base_ko": "base/dictionary form of the word (lemma/infinitive, e.g., '가다' for '가고')",
  "romanization": "romanization of the selected word",
  "part_of_speech": "part of speech in Indonesian (e.g. Kata Kerja, Kata Benda, dll.)",
  "translation_id": "accurate translation of the word in this context in Indonesian",
  "context_sentence_ko": "the original context sentence",
  "context_sentence_id": "accurate translation of the context sentence in Indonesian",
  "explanation": "brief grammatical explanation of the word's form in this sentence in Indonesian"
}

Selected Word: "${word}"
Context Sentence: "${context}"

Return ONLY the raw JSON string, do not include markdown blocks or any additional text.`;

    const res = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: 'You are a precise JSON translator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Alibaba API error:", res.status, errorText);
      return NextResponse.json({ error: "Gagal menerjemahkan kata." }, { status: 500 });
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content || '{}';
    
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

    const translation = JSON.parse(cleanJson);
    return NextResponse.json(translation);
  } catch (error: any) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: error.message || "Failed to translate word" }, { status: 500 });
  }
}
