# 🇰🇷 Kurikulum Mnemonik Interaktif — BelajarKorea.id

> Kurikulum ini 100% terpisah dari materi video (Kursus).  
> Setiap materi adalah file HTML mandiri yang dijual sebagai **Produk Digital (tipe: Interactive)** dan diakses langsung di dalam aplikasi.

---

## Pemetaan ke Sistem Aplikasi

| Komponen | Mapping |
|---|---|
| **1 Chapter** | 1 Produk Digital (`digital_products`, `product_type = 'interactive'`) |
| **Akses** | Siswa beli → klik "🎮 Buka Materi" → terbuka di dalam app via iframe |
| **Konten** | File HTML mandiri (self-contained) berisi 5-8 aktivitas interaktif per chapter |
| **Hosting** | File HTML di-host di `/public/interactive/` atau link eksternal |

### Alur Siswa

```
Menu Produk → Lihat Chapter → Beli (Midtrans) → 🎮 Buka Materi → Iframe Viewer
```

---

## Struktur Kurikulum

### 📘 LEVEL 1: PEMULA (Chapter 1–6)

| Chapter | Judul Produk | Harga | Aktivitas Interaktif |
|---|---|---|---|
| **1** | Huruf Vokal Dasar Korea (ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ) | Rp 29.000 | Mnemonic Flashcard, Drag & Drop Vokal, Audio Quiz, Tulis di Layar |
| **2** | Huruf Konsonan Dasar Korea (ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ) | Rp 29.000 | Mnemonic Flashcard, Cocokkan Gambar, Syllable Builder, Audio Quiz |
| **3** | Vokal Gabungan & Konsonan Ganda | Rp 35.000 | Merge Animation, Aspirasi vs Tegang, Batchim Builder, Baca Namamu dalam Hangeul |
| **4** | Salam & Perkenalan (인사 & 자기소개) | Rp 35.000 | Dialog Simulator, Pola Kalimat Builder, Angka Flash Game, Roleplay Kafe |
| **5** | Kosakata Sehari-hari (일상생활) | Rp 35.000 | Scene Interaktif (Rumah, Restoran), Memory Card Game, Pohon Keluarga, Color Picker |
| **6** | Tata Bahasa Dasar (기초 문법) | Rp 39.000 | Sentence Builder (S-O-V), Partikel Drag & Drop, Mesin Konjugasi, Fill the Blank |

---

### 📗 LEVEL 2: MENENGAH (Chapter 7–12)

| Chapter | Judul Produk | Harga | Aktivitas Interaktif |
|---|---|---|---|
| **7** | Percakapan di Tempat Umum (공공장소) | Rp 39.000 | Menu Restoran Sim, Peta Subway, Body Map Klinik, Branching Dialogue |
| **8** | Tata Bahasa Menengah 1 | Rp 39.000 | Timeline Tense, Lego Connector, Piramida Kesopanan, Cerita Isi Bagian Kosong |
| **9** | Bahasa Korea dari K-Drama & K-Pop (한류) | Rp 39.000 | Subtitle Interaktif, Karaoke Mode, Chat Bubble Slang, Emoji Matcher |
| **10** | Membaca & Menulis Korea (읽기 & 쓰기) | Rp 45.000 | Tebak Tanda Jalan, Scan Menu, Template Diary, Berita Anak Interaktif |
| **11** | Tata Bahasa Menengah 2 | Rp 45.000 | IF Button Conditional, Wishlist Builder, Skill Tree RPG, Error Detection |
| **12** | Proyek Akhir Level 2 | Rp 49.000 | Self-Intro Builder, Presentasi Guided, Multi-turn Dialogue, Ujian 20 Soal |

---

### 📕 LEVEL 3: MAHIR (Chapter 13–18)

| Chapter | Judul Produk | Harga | Aktivitas Interaktif |
|---|---|---|---|
| **13** | Kosakata Profesional & Akademik (전문 어휘) | Rp 49.000 | Sino-Korean Root Explorer, Word Family Tree, Context Matcher |
| **14** | Tata Bahasa Lanjut (고급 문법) | Rp 49.000 | Grammar Transformer Machine, Passive/Causative Builder, Reported Speech |
| **15** | Budaya & Etika Korea (한국 문화) | Rp 49.000 | Cultural Scenario Simulator, Respons Picker, Etika Bisnis Roleplay |
| **16** | Persiapan TOPIK I (한국어능력시험) | Rp 59.000 | Listening Sim, Reading Comprehension, Timer Practice Test |
| **17** | Persiapan TOPIK II (중고급) | Rp 59.000 | Essay Writing Prompt, Advanced Listening, Long Reading |
| **18** | Proyek Akhir & Sertifikasi | Rp 69.000 | Portfolio Builder, Rekam Suara, Comprehensive Test, Certificate Generator |

---

## Detail Aktivitas Per Chapter (Contoh: Chapter 1)

### Chapter 1: Huruf Vokal Dasar Korea

**File:** `/public/interactive/ch01-vokal-dasar.html`

| # | Aktivitas | Deskripsi | Teknik Mnemonik |
|---|---|---|---|
| 1 | **Pengantar Cerita** | Animasi singkat: Kisah Raja Sejong menciptakan Hangeul | Storytelling + animasi |
| 2 | **Mnemonic Flashcard: ㅏ & ㅓ** | Kartu bolak-balik dengan gambar asosiasi + audio pelafalan | ㅏ = "tongkat tangan kanan → **A**rah kanan". ㅓ = "kiri → **E**rror" |
| 3 | **Mnemonic Flashcard: ㅗ & ㅜ** | Kartu bolak-balik | ㅗ = "garis atas → **O**rang berdiri". ㅜ = "garis bawah → d**U**duk" |
| 4 | **Mnemonic Flashcard: ㅡ & ㅣ** | Kartu bolak-balik | ㅡ = "mulut datar = 'eu'". ㅣ = "pohon tegak = **I**tu pohon" |
| 5 | **Drag & Drop: Cocokkan Vokal** | Seret huruf Korea ke gambar mnemonik yang sesuai | Reinforcement asosiasi visual |
| 6 | **Audio Quiz** | Dengar pelafalan → pilih huruf yang benar (4 pilihan) | Penguatan listening |
| 7 | **Tulis di Layar (Canvas)** | Tulis huruf vokal dengan jari/mouse, sistem periksa bentuknya | Motor memory |
| 8 | **Kuis Akhir** | 10 soal campuran → skor & bintang ⭐ | Evaluasi pemahaman |

### Struktur Internal HTML

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chapter 1: Vokal Dasar Korea</title>
  <style>/* Self-contained CSS */</style>
</head>
<body>
  <!-- Navigation antar aktivitas -->
  <div id="activity-nav">
    <button data-step="1" class="active">1. Cerita</button>
    <button data-step="2">2. ㅏ ㅓ</button>
    <button data-step="3">3. ㅗ ㅜ</button>
    <!-- ... -->
  </div>

  <!-- Container aktivitas (ditampilkan satu per satu) -->
  <div id="step-1" class="step active"><!-- Pengantar Cerita --></div>
  <div id="step-2" class="step"><!-- Flashcard ㅏ ㅓ --></div>
  <div id="step-3" class="step"><!-- Flashcard ㅗ ㅜ --></div>
  <div id="step-4" class="step"><!-- Flashcard ㅡ ㅣ --></div>
  <div id="step-5" class="step"><!-- Drag & Drop --></div>
  <div id="step-6" class="step"><!-- Audio Quiz --></div>
  <div id="step-7" class="step"><!-- Writing Canvas --></div>
  <div id="step-8" class="step"><!-- Kuis Akhir --></div>

  <script>/* Self-contained JS */</script>
</body>
</html>
```

---

## Teknik Mnemonik Per Huruf (Referensi Lengkap)

### Vokal Dasar

| Huruf | Bunyi | Mnemonik Visual | Asosiasi |
|---|---|---|---|
| ㅏ | a | Tongkat + garis ke kanan → | "**A**rah kanan" |
| ㅓ | eo | Tongkat + garis ke kiri ← | "arah **E**rror (salah)" |
| ㅗ | o | Garis horizontal + garis ke atas ↑ | "**O**rang berdiri" |
| ㅜ | u | Garis horizontal + garis ke bawah ↓ | "d**U**duk" |
| ㅡ | eu | Garis horizontal datar — | "mulut datar saat bilang 'eu'" |
| ㅣ | i | Garis vertikal tegak | | "**I**tu pohon!" |

### Konsonan Dasar

| Huruf | Bunyi | Mnemonik Visual | Asosiasi |
|---|---|---|---|
| ㄱ | g/k | Bentuk pistol 🔫 | "**G**un" |
| ㄴ | n | Huruf N terbalik | "**N** mirror" |
| ㄷ | d/t | Kusen pintu □ atas | "**D**oor frame" |
| ㄹ | r/l | Ular berliku-liku 🐍 | "u**L**ar" |
| ㅁ | m | Kotak/peta 🗺️ | "**M**ap" |
| ㅂ | b/p | Ember 🪣 | "**B**ucket" |
| ㅅ | s | Topi Santa 🎅 | "**S**anta hat" |
| ㅇ | ng/silent | Lingkaran ⭕ | "**O**-ring / nol" |
| ㅈ | j | Ubur-ubur 🪼 | "**J**ellyfish" |

### Konsonan Aspirasi

| Huruf | Bunyi | Mnemonik | Asosiasi |
|---|---|---|---|
| ㅋ | k (kuat) | ㄱ + hembusan 💨 | "**K**ick dengan tenaga!" |
| ㅌ | t (kuat) | ㄷ + hembusan 💨 | "**T**iger roar!" |
| ㅍ | p (kuat) | ㅂ + hembusan 💨 | "**P**unch!" |
| ㅎ | h | Orang memakai topi 🎩 | "**H**at man" |

### Konsonan Tegang (Ganda)

| Huruf | Bunyi | Mnemonik | Asosiasi |
|---|---|---|---|
| ㄲ | kk | Double Gun 🔫🔫 | "Double power!" |
| ㄸ | tt | Double Door 🚪🚪 | "Ketuk keras!" |
| ㅃ | pp | Double Bucket 🪣🪣 | "Tekan kuat!" |
| ㅆ | ss | Double Santa 🎅🎅 | "Ssssst keras!" |
| ㅉ | jj | Double Jelly 🪼🪼 | "Jjjjj tegang!" |

---

## Cara Mendaftarkan ke Sistem

Setelah file HTML selesai dibuat, admin tinggal:

1. **Upload/Host file HTML** → dapatkan URL-nya
2. **Buka Panel Admin** → Produk → Tambah Produk
3. **Isi form:**
   - Nama: `Chapter 1: Huruf Vokal Dasar Korea`
   - Tipe: `Interaktif (HTML)` ← opsi baru!
   - Harga: `29000`
   - Link Eksternal: URL file HTML
   - Thumbnail: cover chapter
4. **Simpan** → Produk langsung muncul di halaman Produk dengan badge 🎮

---

## Prioritas Implementasi

### 🏃 Phase 1 — Fondasi (Minggu 1-2)
- [x] Tambah tipe produk `interactive` ke database
- [x] Buat halaman viewer embed di dalam aplikasi
- [x] Update UI produk dengan badge & tombol khusus
- [ ] Buat Chapter 1: Vokal Dasar (HTML interaktif pertama)
- [x] Jalankan migration SQL di Supabase Dashboard

### 🚶 Phase 2 — Konten Inti (Minggu 3-6)
- [ ] Chapter 2: Konsonan Dasar
- [ ] Chapter 3: Vokal Gabungan & Konsonan Ganda
- [ ] Chapter 4: Salam & Perkenalan
- [ ] Chapter 5: Kosakata Sehari-hari
- [ ] Chapter 6: Tata Bahasa Dasar

### 🏁 Phase 3 — Ekspansi (Minggu 7-14)
- [ ] Chapter 7-12: Level Menengah
- [ ] Chapter 13-18: Level Mahir + TOPIK Prep
- [ ] Bundle/paket diskon untuk pembelian per-level

---

> [!IMPORTANT]
> **Langkah Segera yang Perlu Dilakukan:**
> 1. Jalankan file SQL migration `003_add_interactive_product_type.sql` di **Supabase Dashboard → SQL Editor**
> 2. Setelah itu, opsi "Interaktif (HTML)" akan tersedia di panel admin Produk
> 3. Kita bisa mulai membuat file HTML Chapter 1 dan mendaftarkannya sebagai produk
