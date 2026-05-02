Edited .env.local

Saya juga telah menambahkan `CRON_SECRET` ke file `.env.local` di komputer Anda, jadi jika Anda ingin menjalankannya di mode *development* lokal, cron-nya juga bisa ditest.

Semua sudah selesai dan siap untuk ditest! Berikut 2 cara untuk memastikan semuanya berjalan dengan benar:

### Test 1: Menutup Popup Midtrans (Instan)
1. Buka halaman web Anda (di Vercel atau localhost).
2. Pergi ke halaman harga/langganan atau produk digital.
3. Klik tombol **Beli Sekarang / Berlangganan** sampai popup Midtrans Snap muncul.
4. Jangan pilih metode pembayaran apa pun, langsung **klik tombol 'X' (Tutup)** di sudut popup.
5. Pergi ke Dashboard Admin -> Transaksi.
6. **Ekspektasi:** Transaksi baru tersebut akan langsung muncul dengan status **Kedaluwarsa** (warna abu-abu), bukan "Menunggu" (warna kuning).

### Test 2: Cron Job Otomatis
Anda tidak perlu menunggu 24 jam untuk mengetest ini, Vercel menyediakan tombol manual:
1. Masuk ke **Vercel Dashboard**.
2. Buka project Anda.
3. Buka tab **Settings** -> **Cron Jobs**.
4. Anda akan melihat `/api/cron/expire-transactions` terdaftar di sana.
5. Klik ikon **"Run"** di sebelah kanannya untuk menjalankannya secara manual.
6. **Ekspektasi:** Endpoint ini akan dipanggil, dan jika ada transaksi "Menunggu" yang sudah basi, sistem akan mengubahnya menjadi "Kedaluwarsa". (Karena batasannya 24 jam, ini mungkin tidak mengubah transaksi yang baru saja dibuat hari ini, namun jalurnya sudah pasti tertest).

Silakan lakukan test nomor 1, itu yang paling sering akan dihadapi oleh pengguna! Beritahu saya jika ada masalah.