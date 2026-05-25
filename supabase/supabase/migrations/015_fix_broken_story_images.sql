-- Migration: 015_fix_broken_story_images.sql
-- Description: Update cover_image_url for stories with broken images

UPDATE public.stories
SET cover_image_url = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400&auto=format&fit=crop'
WHERE title_ko = '한국의 인공지능 산업의 미래';

UPDATE public.stories
SET cover_image_url = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=400&auto=format&fit=crop'
WHERE title_ko = '서울의 한강 공원';
