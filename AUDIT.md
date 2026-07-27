# Audit Repository dan Pemetaan Fungsi

## Kondisi awal

Repository awal berisi tiga file:

- `index.html` — 785 baris; seluruh HTML, CSS, UI, dan logika aplikasi berada dalam satu file.
- `favicon-rapikanbukpot.png` — favicon 48 × 48 px.
- `functions/_middleware.js` — redirect domain lama Cloudflare Pages.

Aplikasi lama tidak memiliki framework, build step, backend upload, localStorage, sessionStorage, modal, preview hasil, pencarian, filter, manifest, sitemap, robots, halaman 404, security headers, README, atau changelog.

## Fungsi lama yang ditemukan dan dipertahankan

### Workspace file

- Pilih banyak file melalui input file.
- Drag and drop.
- Menambah file secara bertahap.
- Deteksi duplikat berdasarkan nama dan ukuran.
- Menghapus file individual.
- Mengganti mode pemrosesan.

### Bukti Potong

- Membersihkan delimiter ganda dan titik koma di akhir baris.
- Membaca CSV ber-header.
- Membentuk field ID, nomor/tanggal bukti potong, masa pajak, status, NPWP/TIN, nama lawan transaksi, kode objek pajak, DPP bruto, PPh, dokumen dasar, nomor dokumen, dan keterangan tambahan.
- Menjaga NPWP dan ID sebagai teks.
- Mengurutkan berdasarkan tanggal bukti potong.

### Mile App

- Membaca CSV delimiter titik koma.
- Menjaga kolom resi, nomor telepon, rekening, VA, NIK, dan ID pelanggan sebagai teks.
- Mengubah kolom nilai menjadi numerik.
- Menormalisasi kolom teks menjadi huruf kapital.
- Mengurutkan berdasarkan tanggal kirim.

### PRANPP

- Membaca CSV, XLS/XLSX, dan HTML/XLS hasil ekspor web.
- Mencari baris header secara dinamis.
- Smart finder nama kolom yang toleran terhadap spasi, kapitalisasi, tanda `+`, dan kata “dan”.
- Membersihkan variasi format Rupiah.
- Mempertahankan seluruh field hasil lama.
- Mengurutkan berdasarkan tanggal transaksi.

### PID

- Membaca XLS/XLSX dan HTML/XLS hasil ekspor web.
- Mencari header Nomor Resi/Kantor Asal.
- Mengonversi nilai biaya dan berat.
- Menjaga nomor resi, telepon, kode pos, VA, dan nopend sebagai teks.
- Menormalisasi nama/alamat/kota.
- Mengurutkan berdasarkan tanggal kirim.

### Excel

- Menggabungkan hasil seluruh file.
- Menentukan lebar kolom otomatis.
- Memberi style header dan border.
- Mengatur alignment teks/angka.
- Menjaga kolom identifier sebagai teks.
- Memformat nilai numerik dan tanggal.
- Mempertahankan nama file dan sheet output lama untuk keempat mode.

### Cloudflare

- Redirect 301 dari `rapikanbukpot.pages.dev` ke `clean.posnew.com` tetap dipertahankan.

## Masalah versi awal

- Seluruh aplikasi monolitik sehingga sulit dirawat.
- Feedback normal memakai `alert()` dan error mentah.
- Tidak ada status per file atau ringkasan berhasil/gagal.
- Tombol dapat ditekan berulang saat alur tidak jelas.
- File yang salah mode dapat berakhir dengan status sukses 0 baris.
- Nama file disisipkan melalui `innerHTML` tanpa escaping.
- File XLSX dibaca sebagai teks penuh sebelum dibaca ulang sebagai ArrayBuffer.
- Tidak ada preview hasil sebelum download.
- Tidak ada search, progress keseluruhan, retry, cancel, atau clear workspace.
- Tidak ada metadata SEO lengkap, halaman 404, manifest, sitemap, robots, security headers, atau dokumentasi deploy.
- UI desktop dan mobile belum memiliki hierarchy aplikasi administrasi yang kuat.

Detail perbaikan tersedia di `CHANGELOG.md`; hasil pengujian tersedia di `TESTING.md`.
