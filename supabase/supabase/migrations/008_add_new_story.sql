-- Migration: 008_add_new_story.sql
-- Description: Add a new beginner story "Kucingku yang Lucu"

INSERT INTO public.stories (
    title_ko,
    title_id,
    title_en,
    content_ko,
    content_id,
    content_en,
    level,
    category,
    cover_image_url,
    is_published,
    content_tokens
) VALUES (
    '내 귀여운 고양이',
    'Kucingku yang Lucu',
    'My Cute Cat',
    '나는 귀여운 고양이를 키웁니다. 고양이 이름은 나비입니다. 나비는 매일 아침 나를 깨우고, 같이 노는 것을 좋아합니다. 나는 나비를 아주 사랑합니다.',
    'Saya memelihara seekor kucing yang lucu. Nama kucing itu adalah Nabi. Nabi membangunkan saya setiap pagi, dan dia suka bermain bersama. Saya sangat mencintai Nabi.',
    'I raise a cute cat. The cat''s name is Nabi. Nabi wakes me up every morning, and likes playing together. I love Nabi very much.',
    'beginner',
    'daily_life',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400&auto=format&fit=crop',
    TRUE,
    '[{"t":"나는","l":"나"},{"t":" ","l":" "},{"t":"귀여운","l":"귀엽다"},{"t":" ","l":" "},{"t":"고양이를","l":"고양이"},{"t":" ","l":" "},{"t":"키웁니다","l":"키우다"},{"t":".","l":"."},{"t":"\n","l":"\n"},{"t":"고양이","l":"고양이"},{"t":" ","l":" "},{"t":"이름은","l":"이름"},{"t":" ","l":" "},{"t":"나비입니다","l":"나비이다"},{"t":".","l":"."},{"t":"\n","l":"\n"},{"t":"나비는","l":"나비"},{"t":" ","l":" "},{"t":"매일","l":"매일"},{"t":" ","l":" "},{"t":"아침","l":"아침"},{"t":" ","l":" "},{"t":"나를","l":"나"},{"t":" ","l":" "},{"t":"깨우고","l":"깨우다"},{"t":",","l":","},{"t":" ","l":" "},{"t":"같이","l":"같이"},{"t":" ","l":" "},{"t":"노는","l":"놀다"},{"t":" ","l":" "},{"t":"것을","l":"것"},{"t":" ","l":" "},{"t":"좋아합니다","l":"좋아하다"},{"t":".","l":"."},{"t":"\n","l":"\n"},{"t":"나는","l":"나"},{"t":" ","l":" "},{"t":"나비를","l":"나비"},{"t":" ","l":" "},{"t":"아주","l":"아주"},{"t":" ","l":" "},{"t":"사랑합니다","l":"사랑하다"},{"t":".","l":"."}]'::jsonb
);
