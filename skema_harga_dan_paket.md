# Aturan & Rekomendasi Paket Langganan BelajarKorea.id

Dokumen ini berisi standar operasional pembuatan paket berlangganan baru melalui Admin Panel, beserta rekomendasi harga strategis untuk meningkatkan retensi pengguna.

## 1. Aturan Penamaan Paket (Sangat Penting!)

Sistem menggunakan **Slug** untuk mengelompokkan paket-paket yang memiliki level yang sama agar fitur "Perpanjang Paket" (Renew) berjalan dengan sempurna. 

Ketika membuat paket baru di Admin Panel, patuhi aturan berikut:
- **Paket Bulanan (Base Package):** Gunakan nama sederhana. Contoh slug: `pro`, `premium`, `basic`.
- **Paket Durasi Panjang:** Harus diawali dengan slug paket dasar, diikuti tanda hubung `-` dan keterangan tambahan.
  - **Pro 3 Bulan:** slug harus `pro-3-month` atau `pro-90-days`
  - **Premium 1 Tahun:** slug harus `premium-1-year` atau `premium-365`

**Kenapa ini penting?**
Sistem antarmuka (UI) mendeteksi base slug sebelum tanda strip pertama (misalnya `pro` dari `pro-3-month`). Jika seorang pengguna saat ini memiliki paket `pro` (1 Bulan) aktif, maka tombol "Perpanjang Paket" (berwarna hijau) juga akan otomatis muncul pada penawaran Pro 3 Bulan, 6 Bulan, dst. Ini memudahkan pengguna untuk langsung meng-upgrade masa aktif mereka tanpa kebingungan.

---

## 2. Rekomendasi Strategi Harga Jangka Panjang

Memberikan opsi berlangganan jangka panjang dengan harga diskon progresif akan mendorong pengguna untuk berkomitmen lebih lama (mengurangi *churn rate*) dan meningkatkan modal tunai di awal.

Berikut adalah tabel rekomendasi harga:

### A. Paket PRO (Akses Semua Level)
*Fokus Utama Konversi*

| Durasi | Harga Normal/Akumulasi | Harga Diskon yang Disarankan | Persentase Diskon | Harga Efektif per Bulan |
|---|---|---|---|---|
| **1 Bulan (30 Hari)** | Rp 149.000 | **Rp 149.000** | 0% | Rp 149.000 |
| **3 Bulan (90 Hari)** | Rp 447.000 | **Rp 379.000** | ~15% | Rp 126.333 |
| **6 Bulan (180 Hari)**| Rp 894.000 | **Rp 669.000** | ~25% | Rp 111.500 |
| **1 Tahun (365 Hari)**| Rp 1.788.000| **Rp 1.149.000**| ~35% | Rp 95.750 |

*Saran Konfigurasi Admin untuk Pro 3 Bulan:*
- **Nama Paket:** Pro (3 Bulan)
- **Slug:** `pro-3-month`
- **Harga (Rp):** `379000`
- **Durasi (Hari):** `90`

### B. Paket PREMIUM (Akses Semua Level + Produk Digital)

| Durasi | Harga Normal/Akumulasi | Harga Diskon yang Disarankan | Persentase Diskon | Harga Efektif per Bulan |
|---|---|---|---|---|
| **1 Bulan (30 Hari)** | Rp 199.000 | **Rp 199.000** | 0% | Rp 199.000 |
| **3 Bulan (90 Hari)** | Rp 597.000 | **Rp 499.000** | ~15% | Rp 166.333 |
| **6 Bulan (180 Hari)**| Rp 1.194.000| **Rp 889.000** | ~25% | Rp 148.166 |
| **1 Tahun (365 Hari)**| Rp 2.388.000| **Rp 1.499.000**| ~35% | Rp 124.916 |

*Saran Konfigurasi Admin untuk Premium 6 Bulan:*
- **Nama Paket:** Premium (6 Bulan)
- **Slug:** `premium-6-month`
- **Harga (Rp):** `889000`
- **Durasi (Hari):** `180`

### C. Paket BASIC (Akses Level Beginner Saja)
*Saran: Untuk paket Basic, Anda tidak perlu memberikan opsi terlalu panjang (seperti 1 Tahun) agar pengguna yang punya komitmen tinggi lebih terdorong memilih paket PRO. Maksimal berikan opsi 3 bulan.*

- **1 Bulan (30 Hari):** Rp 99.000
- **3 Bulan (90 Hari):** Rp 249.000 (Setara Rp 83.000/bulan)
- Slug yang disarankan: `basic-3-month`

---

## 3. Cara UI & Sistem Bekerja Secara Otomatis
1. Jika Anda memasukkan paket dengan **Durasi (Hari)** yang berbeda (contoh: di database ada durasi 30, 90, 180), sistem di halaman depan `/pricing` akan **secara dinamis memunculkan tab *Toggle*** di atas daftar harga.
2. Nama tab yang akan muncul otomatis tergantung input durasi Anda:
   - Jika <= 31 Hari: Tombol bernama **1 Bulan**
   - Jika <= 92 Hari: Tombol bernama **3 Bulan** (dengan badge *Hemat 15%*)
   - Jika <= 184 Hari: Tombol bernama **6 Bulan** (dengan badge *Hemat 25%*)
   - Jika >= 360 Hari: Tombol bernama **1 Tahun** (dengan badge *Hemat 35%*)
3. Pengelompokan ini murni berdasarkan jumlah hari (`duration_days`), jadi pastikan Anda mengisi angka durasi hari dengan akurat (30, 90, 180, 365) agar sistem UI bekerja maksimal.
