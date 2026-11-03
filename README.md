# Triguna Student Interest Database

Aplikasi pendataan minat calon siswa SMA Triguna 1956 (PRD Tahap 1–8).
Backend: Google Apps Script (`Kode.gs` + `Admin.gs`, terpisah dari repository ini).

- `index.html`: formulir siswa 14 pertanyaan (dibuka lewat QR, tanpa login)
- `admin.html`: panel petugas (login Google): dashboard, data siswa, follow-up, Master SMP, Cocokkan SMP, kunjungan, laporan + ekspor Excel/PDF, cetak kartu A5 & QR, analisis AI, pengaturan
- `js/config.js`: **URL Apps Script, Client ID, dan pilihan jawaban (satu-satunya file yang perlu diedit)**
- `css/`: tampilan sesuai desain Figcraft

Selama `GAS_URL` kosong, kedua halaman berjalan dalam mode demo.
Langkah lengkap ada di `PANDUAN-INSTALASI.md`.
