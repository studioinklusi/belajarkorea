# Supabase Schema Setup Guide
## Korean Learning Platform v2.0

---

## Langkah 1 — Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi nama project, pilih region terdekat (**Southeast Asia**)
3. Simpan **Database Password** di tempat aman
4. Tunggu project selesai dibuat (~2 menit)

---

## Langkah 2 — Jalankan Migration

Buka **SQL Editor** di Supabase dashboard, lalu jalankan file berikut **secara berurutan**:

### File 1: `001_initial_schema.sql`
> Berisi semua tabel, RLS policies, indexes, triggers, views, dan storage buckets.

```
Supabase Dashboard → SQL Editor → New Query
→ Paste isi file 001_initial_schema.sql
→ Klik Run (▶)
```

### File 2 (opsional, dev only): `002_seed_data.sql`
> Berisi sample courses, lessons, quiz, dan digital products untuk testing.
> ⚠️ JANGAN dijalankan di production.

```
→ Paste isi file 002_seed_data.sql
→ Klik Run (▶)
```

---

## Langkah 3 — Konfigurasi Auth

Di **Supabase Dashboard → Authentication → Settings**:

| Setting | Value |
|---|---|
| Site URL | `https://yourdomain.com` |
| Redirect URLs | `https://yourdomain.com/auth/callback` |
| Email Confirm | Enable |
| Minimum Password Length | 8 |

---

## Langkah 4 — Ambil Environment Variables

Di **Supabase Dashboard → Settings → API**:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # RAHASIA — hanya di server/edge function
```

---

## Langkah 5 — Verifikasi Schema

Jalankan query berikut untuk memastikan semua tabel terbuat:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Hasil yang diharapkan:
```
courses
digital_products
lessons
packages
product_purchases
profiles
quiz_attempts
quiz_questions
subscriptions
transactions
user_progress
```

Verifikasi RLS aktif:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Semua tabel harus `rowsecurity = true`.

---

## Langkah 6 — Buat Admin User Pertama

Setelah register via aplikasi, jalankan SQL berikut untuk jadikan akun pertama sebagai `super_admin`:

```sql
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'admin@youremail.com'
);
```

---

## Referensi Tabel

| Tabel | Keterangan |
|---|---|
| `profiles` | Data user (extend auth.users) |
| `packages` | Paket subscription (Basic/Pro/Premium) |
| `subscriptions` | Status langganan per user |
| `transactions` | Riwayat pembayaran Midtrans |
| `courses` | Daftar course per level |
| `lessons` | Video lesson per course (youtube_video_id) |
| `user_progress` | Progress tonton video per user per lesson |
| `quiz_questions` | Soal quiz per lesson (5 soal) |
| `quiz_attempts` | Riwayat jawaban quiz per user |
| `digital_products` | PDF & template yang dijual |
| `product_purchases` | Pembelian produk digital per user |

## Views Tersedia

| View | Kegunaan |
|---|---|
| `v_active_subscriptions` | Status subscription aktif + sisa hari |
| `v_course_progress` | % completion per course per user |
| `v_best_quiz_scores` | Best score quiz per user per lesson |

---

## Catatan Keamanan

> **KRITIS:** Kolom `youtube_video_id` di tabel `lessons` diproteksi RLS.
> User yang tidak login atau tidak punya subscription aktif **tidak akan menerima** video ID ini.
> Pastikan frontend tidak pernah mengekspos video ID ke state yang bisa di-inspect publik.
