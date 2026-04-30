# PRODUCT REQUIREMENTS DOCUMENT v2
## Platform E-Learning Bahasa Korea (Korean Learning Platform)

> **Versi:** 2.0  
> **Tanggal:** 2026-04-30  
> **Status:** Draft — Review Required  
> **Perubahan dari v1:** Schema database, business rules subscription & quiz, keamanan video, webhook flow, RBAC, digital product flow, error handling.

---

## 1. Product Overview

Platform e-learning bahasa Korea berbasis web dengan model subscription. Pengguna mengakses materi video microlearning (3–5 menit), quiz evaluasi, dan produk digital tambahan selama masa langganan aktif.

**Value Proposition:**
- Belajar bahasa Korea secara praktis dan cepat via microlearning
- Kurikulum terstruktur berbasis level (Beginner → Advanced)
- Sistem belajar fleksibel berbasis subscription bulanan
- Progress tracking yang konsisten

---

## 2. Target Users

| Segment | Deskripsi |
|---|---|
| Primary — Pemula | Belum pernah belajar bahasa Korea sama sekali |
| Primary — K-pop/K-drama fans | Ingin memahami konten Korea secara langsung |
| Secondary — Content Creator | Butuh konten afiliasi / referral |
| Secondary — Profesional | Skill tambahan untuk karir |

---

## 3. Problem Statement

| Masalah | Dampak |
|---|---|
| Konten tersebar tidak terstruktur | User bingung mulai dari mana |
| Video terlalu panjang | Bosan, tidak konsisten belajar |
| Tidak ada progress tracking | Tidak tahu sudah sampai mana |
| Tidak ada evaluasi/quiz | Tidak bisa mengukur kemampuan |

---

## 4. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React / Next.js |
| Backend / DB / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Video Hosting | YouTube (Unlisted) dengan server-side gating |
| Payment | Midtrans Snap |
| File Storage | Supabase Storage (private bucket) |
| Edge Functions | Supabase Edge Functions (webhook handler) |
| Email Service | Resend (transaksional & notifikasi) |
| Bahasa UI | Bilingual — Bahasa Indonesia & English |

> **Keputusan Video Hosting:** YouTube Unlisted digunakan karena gratis dan mudah di-manage. Risiko URL bocor dimitigasi dengan **server-side gating** — `video_id` tidak pernah dikembalikan langsung ke client yang tidak terautentikasi atau tidak memiliki subscription aktif. Semua akses video melewati endpoint yang memverifikasi sesi user terlebih dahulu.

---

## 5. Database Schema (Lengkap)

### 5.1 `profiles` (extend Supabase auth.users)

```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'content_admin', 'super_admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 `packages`

```sql
CREATE TABLE public.packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  price           INTEGER NOT NULL,          -- Rupiah
  duration_days   INTEGER NOT NULL DEFAULT 30,
  description     TEXT,
  features        JSONB,                     -- array of feature strings
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 `subscriptions`

```sql
CREATE TABLE public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  package_id      UUID NOT NULL REFERENCES public.packages(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('active','grace_period','expired','cancelled')),
  started_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  grace_until     TIMESTAMPTZ,               -- expires_at + 3 hari
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 `transactions`

```sql
CREATE TABLE public.transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id),
  package_id          UUID REFERENCES public.packages(id),
  product_id          UUID REFERENCES public.digital_products(id),
  order_id            TEXT UNIQUE NOT NULL,  -- TXN-{timestamp}-{uid}
  amount              INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','success','failed','expired','refunded')),
  payment_type        TEXT,
  midtrans_order_id   TEXT UNIQUE,
  snap_token          TEXT,
  webhook_received_at TIMESTAMPTZ,
  idempotency_key     TEXT UNIQUE,
  metadata            JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5 `courses`

```sql
CREATE TABLE public.courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  level           TEXT NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  thumbnail_url   TEXT,
  is_published    BOOLEAN DEFAULT FALSE,
  sort_order      INTEGER DEFAULT 0,
  required_package TEXT[] DEFAULT '{pro,premium}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.6 `lessons`

```sql
CREATE TABLE public.lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  youtube_video_id TEXT NOT NULL,            -- YouTube video ID (bukan full URL)
                                             -- Contoh: 'dQw4w9WgXcQ' dari youtu.be/dQw4w9WgXcQ
  duration_seconds INTEGER,
  sort_order       INTEGER DEFAULT 0,
  is_published     BOOLEAN DEFAULT FALSE,
  is_preview       BOOLEAN DEFAULT FALSE,    -- bisa ditonton tanpa subscription
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.7 `user_progress`

```sql
CREATE TABLE public.user_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  lesson_id       UUID NOT NULL REFERENCES public.lessons(id),
  status          TEXT NOT NULL DEFAULT 'not_started'
                  CHECK (status IN ('not_started','in_progress','completed')),
  watch_duration  INTEGER DEFAULT 0,         -- detik ditonton
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
```

### 5.8 `quiz_questions`

```sql
CREATE TABLE public.quiz_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  options         JSONB NOT NULL,            -- [{key:'a', text:'...'}, ...]
  correct_answer  TEXT NOT NULL,
  explanation     TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.9 `quiz_attempts`

```sql
CREATE TABLE public.quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  lesson_id       UUID NOT NULL REFERENCES public.lessons(id),
  answers         JSONB NOT NULL,            -- {question_id: answer_key}
  score           INTEGER NOT NULL,          -- 0–100
  passed          BOOLEAN NOT NULL,
  attempt_number  INTEGER NOT NULL DEFAULT 1,
  completed_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.10 `digital_products`

```sql
CREATE TABLE public.digital_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  price           INTEGER NOT NULL,
  file_path       TEXT NOT NULL,             -- Supabase Storage private path
  thumbnail_url   TEXT,
  product_type    TEXT NOT NULL DEFAULT 'pdf'
                  CHECK (product_type IN ('pdf', 'template', 'other')),
  is_active       BOOLEAN DEFAULT TRUE,
  download_limit  INTEGER DEFAULT 5,         -- max download per pembelian (untuk file PDF)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

> **Catatan:** `digital_products` hanya untuk file statis (PDF, template). Video pembelajaran selalu **di-stream** via YouTube embed — tidak ada fitur download video.

### 5.11 `product_purchases`

```sql
CREATE TABLE public.product_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  product_id      UUID NOT NULL REFERENCES public.digital_products(id),
  transaction_id  UUID NOT NULL REFERENCES public.transactions(id),
  download_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

---

## 6. Business Rules

### 6.1 Subscription Rules

| Rule | Detail |
|---|---|
| Durasi | 30 hari kalender per paket |
| Grace Period | 3 hari setelah `expires_at` — akses tetap, muncul banner peringatan |
| Trial | **Tidak ada** — user harus langsung berlangganan |
| Renewal | Manual — tidak ada auto-charge |
| Stacking | Renewal sebelum expired: sisa hari + 30 hari baru |
| Expired | Setelah grace period → konten terkunci, progress tetap tersimpan |
| Cancellation | Tidak ada refund — akses berlanjut sampai `expires_at` |

### 6.2 Akses Konten per Package

| Package | Akses Course | Produk Digital (PDF) | Harga |
|---|---|---|---|
| Basic | Beginner saja | Tidak | TBD |
| Pro | Semua level | Tidak | TBD |
| Premium | Semua level | Ya | TBD |

> **Catatan:** Video selalu dalam bentuk **streaming** (bukan download). Produk digital berupa file PDF/template yang bisa didownload oleh subscriber Premium.

### 6.3 Quiz Rules

| Rule | Detail |
|---|---|
| Jumlah soal | **5 soal** per lesson |
| Format | Multiple choice (4 pilihan) |
| Passing Score | 80% minimum (4 dari 5 benar) |
| Gating | Quiz tidak wajib untuk lanjut lesson (opsional) |
| Retry | Unlimited, cooldown 1 jam antar attempt |
| Hasil | Semua attempt tersimpan, tampilkan best score |
| Completion | Lesson "completed" = video ditonton ≥80% + quiz passed (jika ada) |

---

## 7. Video Security Architecture

### Keputusan: YouTube Unlisted
YouTube Unlisted dipilih karena gratis, mudah di-manage, dan tidak memerlukan biaya CDN tambahan.

### Risiko yang Diketahui
| Risiko | Level | Status |
|---|---|---|
| URL bocor via devtools | Medium | Dimitigasi dengan server-side gating |
| User share URL ke orang lain | Medium | Accepted — mitigasi tidak sempurna |
| Video terindeks search engine | Low | Unlisted tidak terindeks Google Search |

### Strategi Mitigasi: Server-Side Gating

```
[Client] → Request halaman lesson
    ↓
[Supabase RLS] → Cek apakah user login?
    ↓ (jika ya)
[Backend API] → Verifikasi subscription aktif
    ↓ (jika aktif)
[Backend] → Return { youtube_video_id: 'xxx' }
    ↓
[Frontend] → Construct embed URL: https://youtube.com/embed/{id}
    ↓
[Client] → Render YouTube iframe player
```

**Aturan Implementasi Kritis:**
1. **`youtube_video_id` TIDAK boleh ada di response API** untuk user yang belum login atau subscription tidak aktif
2. **Supabase RLS** pada tabel `lessons` — kolom `youtube_video_id` hanya bisa di-query oleh user dengan subscription `active` atau `grace_period`
3. **Lesson preview** (`is_preview = true`) boleh mengembalikan `youtube_video_id` tanpa cek subscription
4. **Frontend tidak boleh** menyimpan `youtube_video_id` di localStorage atau state global yang bisa di-inspect
5. **YouTube embed parameters** wajib menggunakan:
   - `rel=0` — tidak tampilkan video rekomendasi
   - `modestbranding=1` — minimasi branding YouTube
   - `controls=1` — player controls standar

### Supabase RLS Policy untuk Lessons

```sql
-- User hanya bisa baca youtube_video_id jika subscription aktif
CREATE POLICY "lesson_video_access" ON public.lessons
  FOR SELECT USING (
    is_preview = TRUE  -- preview bebas diakses
    OR
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = auth.uid()
      AND s.status IN ('active', 'grace_period')
      AND s.expires_at > NOW()
    )
  );
```

### Catatan Upgrade di Masa Depan
Jika bisnis berkembang dan keamanan video menjadi prioritas tinggi, pertimbangkan migrasi ke **Bunny.net Stream** atau **Vimeo Pro** yang mendukung domain restriction dan signed URL.

---

## 8. Payment & Webhook Flow

### 8.1 Subscription Payment Flow

```
1. User pilih package → POST /api/payment/create-subscription
2. Backend validasi user & package
3. Buat record transactions (status: pending)
4. Request Snap Token ke Midtrans
5. Return snap_token ke frontend
6. Frontend tampilkan Midtrans Snap popup
7. User bayar
8. Midtrans kirim webhook → POST /api/payment/webhook
9. Backend proses webhook (lihat 8.2)
10. Frontend polling status tiap 3 detik (max 10x)
11. Success → redirect dashboard
```

### 8.2 Webhook Handler

```typescript
async function handleWebhook(req: Request) {
  const body = await req.json();
  const { order_id, transaction_status, fraud_status,
          signature_key, gross_amount, status_code } = body;

  // 1. Validasi signature
  const expected = SHA512(order_id + status_code + gross_amount + SERVER_KEY);
  if (signature_key !== expected) return new Response('Unauthorized', { status: 401 });

  // 2. Idempotency check
  const tx = await db.transactions.findBy({ order_id });
  if (tx.status === 'success') return new Response('OK', { status: 200 });

  // 3. Update status
  const isSuccess = transaction_status === 'settlement' ||
    (transaction_status === 'capture' && fraud_status === 'accept');

  if (isSuccess) {
    await db.transactions.update({ order_id }, { status: 'success' });
    await activateSubscription(tx.user_id, tx.package_id);
  } else if (['cancel','deny','expire'].includes(transaction_status)) {
    await db.transactions.update({ order_id }, { status: 'failed' });
  }

  return new Response('OK', { status: 200 });
}
```

### 8.3 Transaction Status Transitions

```
pending → success   (webhook settlement/capture+accept)
pending → failed    (webhook cancel/deny/expire)
pending → expired   (cron job: 24 jam tanpa pembayaran)
success → refunded  (manual oleh super_admin)
```

---

## 9. Digital Product Flow

### 9.1 Purchase Flow
1. User lihat halaman produk digital
2. Klik "Beli" → POST `/api/payment/create-product-purchase`
3. Backend buat transaksi terpisah (bukan subscription)
4. Midtrans Snap flow sama
5. Webhook success → buat record `product_purchases`
6. User download dari halaman "Produk Saya"

### 9.2 Download Flow (Aman)
```
1. User klik download → GET /api/products/{id}/download
2. Verifikasi product_purchases (user punya akses?)
3. Cek download_count < download_limit
4. Generate signed URL Supabase Storage (TTL: 10 menit)
5. Increment download_count
6. Return signed URL → browser auto-download
```

> File PDF di **private bucket** — tidak ada URL publik permanen.

---

## 10. RBAC (Role-Based Access Control)

### 10.1 Role Definitions

| Role | Deskripsi |
|---|---|
| `student` | User biasa, akses konten sesuai subscription |
| `content_admin` | Kelola course, lesson, quiz, digital product |
| `super_admin` | Full akses + user, transaksi, packages |

### 10.2 Permission Matrix

| Aksi | student | content_admin | super_admin |
|---|---|---|---|
| Lihat & tonton konten | ✅ | ✅ | ✅ |
| Kerjakan quiz | ✅ | ✅ | ✅ |
| CRUD course & lesson | ❌ | ✅ | ✅ |
| CRUD quiz | ❌ | ✅ | ✅ |
| Upload digital product | ❌ | ✅ | ✅ |
| Lihat semua transaksi | ❌ | ❌ | ✅ |
| Kelola user & role | ❌ | ❌ | ✅ |
| Kelola packages & harga | ❌ | ❌ | ✅ |
| Manual refund | ❌ | ❌ | ✅ |
| Manual subscription grant | ❌ | ❌ | ✅ |

> **Penting:** Validasi role di Supabase RLS (Row Level Security) — bukan hanya frontend guard.

---

## 11. Error Handling & Edge Cases

### 11.1 Payment Edge Cases

| Skenario | Handling |
|---|---|
| Register tapi tidak bayar | Pending data dihapus setelah 7 hari (cron job) |
| Webhook terlambat | Frontend polling 3 detik × 10x → tampilkan "Cek email" |
| Webhook duplikat | Idempotency via `order_id` — return 200, no reprocess |
| Payment timeout 24 jam | Cron job update → `expired` |
| User klik bayar 2x | Cek existing pending tx, reuse `snap_token` yang sama |

### 11.2 Subscription Edge Cases

| Skenario | Handling |
|---|---|
| Renewal saat aktif | Sisa hari + 30 hari baru |
| Akses saat grace period | Konten bisa diakses + banner peringatan |
| Akses setelah expired | Redirect ke upgrade page, progress tetap |
| Trial lebih dari 1x | Block via email check — 1 email = 1x trial |

### 11.3 Video Edge Cases

| Skenario | Handling |
|---|---|
| Subscription expired saat nonton | Video tetap bisa selesai (tidak di-cut), blokir saat load lesson baru |
| User share youtube_video_id | Accepted risk — video tetap unlisted di YouTube |
| Video dihapus dari YouTube | Backend cek `youtube_video_id` valid, tampilkan pesan "Video tidak tersedia" |
| Video gagal load / region block | Pesan error + tombol "Laporkan masalah" |
| User inspect network untuk dapat ID | Accepted risk — mitigasi via RLS, bukan enkripsi |

### 11.4 Quiz Edge Cases

| Skenario | Handling |
|---|---|
| Submit quiz cepat berulang | Rate limit: 1 submit per 5 detik |
| Cooldown belum habis | Tampilkan countdown timer |
| Koneksi putus saat submit | Cache jawaban di localStorage, retry saat online |

---

## 12. API Contracts (Kritis)

### POST `/api/payment/create-subscription`
```json
Request:  { "package_id": "uuid" }
Response 200: { "snap_token": "...", "order_id": "TXN-..." }
Response 400: { "error": "active_subscription_exists" }
```

### POST `/api/payment/webhook`
```json
Body: {
  "order_id": "TXN-...",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "gross_amount": "99000.00",
  "signature_key": "..."
}
```

### GET `/api/lessons/{id}/video-id`
```json
Response 200: { "youtube_video_id": "dQw4w9WgXcQ" }
Response 401: { "error": "unauthenticated" }
Response 403: { "error": "subscription_required" }
Response 403: { "error": "subscription_expired" }
```

> Endpoint ini diproteksi Supabase RLS. `youtube_video_id` hanya dikembalikan jika subscription aktif.

### POST `/api/quiz/{lesson_id}/submit`
```json
Request:  { "answers": { "q_id_1": "a", "q_id_2": "c" } }
Response 200: { "score": 80, "passed": true, "attempt_number": 1 }
Response 429: { "error": "cooldown_active", "retry_after_seconds": 3600 }
```

### GET `/api/products/{id}/download`
```json
Response 200: { "download_url": "https://...", "expires_in_seconds": 600 }
Response 403: { "error": "not_purchased" }
Response 429: { "error": "download_limit_exceeded", "limit": 5 }
```

---

## 13. Dashboard Specifications

### 13.1 User Dashboard

| Tab | Konten |
|---|---|
| My Courses | Daftar course sesuai package, progress bar, CTA "Lanjutkan" |
| Progress | Streak kalender, total lesson selesai, best quiz score |
| Subscription | Status, countdown expired, tombol Perpanjang, riwayat bayar |
| Produk Saya | Daftar produk dibeli, tombol download + sisa kuota |

### 13.2 Admin Dashboard

**Content Admin:**
- CRUD Course (title, level, thumbnail, publish)
- CRUD Lesson (video upload ke Bunny.net, sort order)
- CRUD Quiz (soal per lesson)
- CRUD Digital Products (upload file, harga, download limit)

**Super Admin (tambahan):**
- User Management (lihat semua user, ubah role, subscription status)
- Transaction Monitor (filter status, export CSV)
- Package Management (harga & fitur)
- Manual Subscription Grant (untuk promo/influencer)

---

## 14. Success Metrics

| Metric | Target MVP | Cara Ukur |
|---|---|---|
| Conversion visitor → trial | >15% | Analytics |
| Conversion trial → paid | >30% | DB query |
| Retention bulan ke-2 | >40% | Cohort analysis |
| Course completion rate | >50% | user_progress |
| Payment success rate | >90% | Transactions |
| MRR Growth | +20%/bulan | Revenue dashboard |

---

## 15. Risks & Mitigation (Updated)

| Risk | Severity | Mitigation |
|---|---|---|
| YouTube video ID bocor via devtools | Medium | Accepted — server-side gating via RLS mencegah akses tanpa login |
| User share video ke non-subscriber | Medium | Accepted — risiko inheren YouTube Unlisted |
| Video dihapus dari YouTube | Low | Validasi video ID di admin dashboard |
| Webhook gagal | High | Retry + polling frontend + manual check |
| Duplicate webhook | Medium | Idempotency key per order_id |
| User churn | Medium | Trial 7 hari + progress tracking |
| File PDF di-share | Medium | Signed URL TTL 10 menit + download limit |
| Data leak / SQL injection | High | Supabase RLS + parameterized query |
| Admin route tidak aman | High | RLS di DB level, bukan hanya frontend |

---

## 16. MVP Scope (v1 Release)

### ✅ Included
- Auth (register, login, session)
- **Tanpa trial** — subscription berbayar langsung
- 1–3 package (Basic / Pro / Premium, harga TBD)
- 1–2 course, 20–30 lesson
- Video player YouTube embed (streaming, server-side gated via RLS)
- Quiz 5 soal per lesson (multiple choice, passing 80%)
- Progress tracking
- Subscription system (manual renewal + grace period 3 hari)
- Payment Midtrans (QRIS + VA)
- Webhook handler dengan idempotency
- Email notifikasi via Resend (welcome, payment success, reminder expired)
- Bilingual UI (ID/EN)
- User dashboard
- Admin dashboard basic (CRUD course & lesson)

### ❌ Excluded (Future)
- Multiple packages
- Digital product sales
- Community/forum
- Gamification
- AI pronunciation checker
- PWA / Mobile app
- Auto-renewal
- Subtitle interaktif

---

## 17. Future Roadmap

| Quarter | Fitur |
|---|---|
| Q2 2026 | Multiple packages + Digital product penjualan |
| Q3 2026 | PWA + Mobile optimization |
| Q3 2026 | Gamification (streak, badge, leaderboard) |
| Q4 2026 | AI pronunciation checker |
| Q4 2026 | Community/forum |
| 2027 | Native mobile app |

---

## 18. Open Questions — Status Keputusan

| # | Pertanyaan | Keputusan | Status |
|---|---|---|---|
| 1 | **Harga paket** — Berapa Rp untuk Basic/Pro/Premium? | Belum ditentukan | ⏳ Pending |
| 2 | **Jumlah soal quiz** | 5 soal per lesson | ✅ Diputuskan |
| 3 | **Video hosting** | YouTube Unlisted + streaming | ✅ Diputuskan |
| 4 | **Trial** | Tidak ada trial | ✅ Diputuskan |
| 5 | **Video download** | Video hanya streaming, tidak bisa didownload | ✅ Diputuskan |
| 6 | **Email notifikasi** | Ya, menggunakan Resend | ✅ Diputuskan |
| 7 | **Bahasa UI** | Bilingual (ID/EN) | ✅ Diputuskan |

> **Satu-satunya yang belum:** Harga paket Basic / Pro / Premium (dapat ditentukan saat go-to-market).
