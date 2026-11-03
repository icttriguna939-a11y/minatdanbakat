# Panduan Instalasi — Triguna Student Interest Database (Tahap 1–8)

Aplikasi ini terdiri dari tiga bagian:

| Bagian | File | Tempat |
|---|---|---|
| Backend | `Kode.gs` + `Admin.gs` | Google Apps Script (tidak ada di dalam ZIP) |
| Formulir siswa (QR) | `index.html` | GitHub Pages, misalnya `https://USERNAME.github.io/minat-calon-siswa/` |
| Panel petugas | `admin.html` | GitHub Pages, misalnya `https://USERNAME.github.io/minat-calon-siswa/admin.html` |

Panel petugas bisa dicoba **sebelum backend terpasang**. Buka `admin.html`, lalu pilih peran di **mode demo**. Data di mode demo adalah data tiruan.

---

## BAGIAN 1 — Backend (Google Apps Script)

Gunakan **akun Google sekolah**. Akun inilah yang otomatis menjadi Super Admin pertama.

1. Buka https://script.google.com, lalu buat proyek baru bernama `Triguna Student Interest Database`.
   Kalau proyek dari Tahap 1–3 sudah ada, pakai proyek itu.
2. **File `Kode.gs`:** ganti seluruh isinya dengan `Kode.gs` versi baru.
3. **File `Admin.gs`:** klik **+ → Skrip**, beri nama `Admin`, lalu tempel seluruh isi `Admin.gs`. Simpan dengan Ctrl+S.
4. **Setelan proyek** (ikon roda gigi): pilih Zona waktu **(GMT+07:00) Jakarta**.
5. Jalankan **satu** dari dua fungsi berikut, sesuai kondisi Anda:
   - **Instalasi baru:** jalankan `setupAppEnvironment`. Fungsi ini membuat folder Drive, spreadsheet berisi 8 sheet, dan menjadikan akun Anda Super Admin.
   - **Sudah memasang Tahap 1–3:** jalankan `upgradeKeTahap4sampai8`. Fungsi ini menambah setelan baru dan menjadikan akun Anda Super Admin. Data lama tidak disentuh.
   - Saat diminta, klik **Tinjau izin**, lalu **Izinkan**. Izin "terhubung ke layanan eksternal" dipakai untuk memverifikasi login Google dan untuk fitur AI.
6. Uji:
   - `ujiKoneksiDatabase`: semua sheet harus bertanda ✅.
   - `isiDataSimulasi`: menambah 60 siswa simulasi untuk mencoba dashboard, laporan, dan fitur cocokkan SMP.
7. **Deploy:** klik **Terapkan**, lalu **Kelola deployment**, ikon pensil, **Versi: Baru**, lalu **Terapkan**. Kalau ini deploy pertama, pilih **Deployment baru → Aplikasi web**, isi *Jalankan sebagai: Saya* dan *Akses: Siapa saja*.
   Salin URL `/exec`.

> Setiap kali `Kode.gs` atau `Admin.gs` diubah, deploy ulang dengan **Versi: Baru**. Dengan cara ini URL `/exec` tetap sama.

---

## BAGIAN 2 — Membuat Google Client ID (untuk login petugas)

Tombol "Masuk dengan Google" membutuhkan **OAuth Client ID**. Ini cukup dibuat sekali dan gratis.

1. Buka https://console.cloud.google.com dengan akun sekolah, lalu buat project baru, misalnya `Triguna SID`.
2. Buka **APIs & Services → OAuth consent screen**:
   - Kalau sekolah memakai Google Workspace, pilih **Internal**. Hanya akun sekolah yang bisa masuk.
   - Kalau tidak memakai Workspace, pilih **External** dan tambahkan email petugas di **Test users**.
   - Isi nama aplikasi `Triguna SID` dan email dukungan, lalu simpan.
3. Buka **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `https://USERNAME.github.io`. Hanya domain, **tanpa** nama repository dan tanpa garis miring di akhir.
   - Klik **Create**, lalu salin **Client ID** (berakhiran `.apps.googleusercontent.com`).
4. Buka spreadsheet database, sheet **SETTINGS**:
   - `GOOGLE_CLIENT_ID`: tempel Client ID.
   - `ALLOWED_DOMAIN`: domain Workspace sekolah, misalnya `smatriguna1956.sch.id`. Kosongkan kalau belum memakai Workspace. Dalam kondisi itu, yang bisa masuk hanya email yang terdaftar di sheet USERS.
   - `FORM_URL`: alamat formulir di GitHub Pages. Alamat ini dipakai untuk QR Code.

**Keamanan login:** server memeriksa token Google langsung ke Google, mencocokkan Client ID dan domain, lalu memastikan email terdaftar dan aktif di sheet **USERS**. Email yang hanya dikirim dari browser tidak pernah dipercaya, sesuai PRD.

---

## BAGIAN 3 — Pengaturan frontend

Edit `js/config.js`:

```js
GAS_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
GOOGLE_CLIENT_ID: '',   // boleh kosong bila sudah diisi di sheet SETTINGS
```

Selama `GAS_URL` masih kosong, formulir dan panel petugas berjalan dalam **mode demo**.

---

## BAGIAN 4 — Upload ke GitHub Pages

Folder yang di-upload adalah **folder hasil ekstrak ZIP**, yaitu folder yang langsung berisi `index.html`, `admin.html`, `css`, dan `js`.

**Upload pertama kali:**

```powershell
cd "C:\Users\ASUS\Documents\Triguna SID\triguna-sid"
dir
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/minat-calon-siswa.git
git push -u origin main
```

Setelah `dir`, pastikan `index.html` ada di daftar sebelum melanjutkan ke `git init`. Kemudian buka repository di GitHub, masuk ke **Settings → Pages**, pilih **Deploy from a branch → main / (root)**, lalu klik **Save**.

**Update dari versi Tahap 1–3:** salin file baru ke folder repository lama dengan menimpa file lama. File `js/config.js` lama yang sudah berisi `GAS_URL` jangan ditimpa, atau isi ulang `GAS_URL` setelah menyalin. Kemudian jalankan:

```powershell
git add .
git commit -m "Tahap 4-8: panel petugas"
git push
```

---

## BAGIAN 5 — Akun petugas & hak akses

Super Admin membuka **admin.html → Pengaturan & Akun → Tambah akun**.

| Peran | Bisa melihat dan melakukan |
|---|---|
| Super Admin | Semua menu, termasuk akun dan setelan |
| Koordinator SPMB | Dashboard, seluruh data siswa, follow-up dan penugasan, Master SMP, Cocokkan SMP, kunjungan, laporan dan ekspor, AI |
| Petugas SPMB | Dashboard, siswa **yang ditugaskan kepadanya** (termasuk kontak orang tua), follow-up, input kartu cetak, cetak kartu |
| Pimpinan | Dashboard, laporan agregat **tanpa nama siswa**, hasil AI |

Matriks ini adalah asumsi saya berdasarkan PRD (bagian 3, pertanyaan terbuka nomor 1). Kalau kebijakan sekolah berbeda, ubah `PERMS` di bagian atas `Admin.gs`, lalu daftar menu `NAV` di `js/admin-core.js`.

---

## BAGIAN 6 — Menggunakan fitur

- **Tahap 4 — Dashboard & Data Siswa:** grafik dan angka ringkasan. Daftar siswa bisa dicari dan difilter. Klik nama siswa untuk melihat 14 jawabannya.
- **Tahap 5 — Follow-up:** centang siswa di Data Siswa, lalu klik **Tugaskan petugas**. Petugas mencatat status di menu Follow-up. Setiap perubahan tercatat di sheet FOLLOW_UP: siapa, kapan, dan apa.
- **Tahap 5 — Master SMP & Cocokkan SMP:** tambahkan SMP resmi di Master SMP. Lalu di Cocokkan SMP, klik **Terima semua saran ≥ 90%**, dan cocokkan sisanya satu per satu. Ketikan asli siswa tidak pernah diubah.
- **Tahap 5 — Kunjungan & Kegiatan:** catat setiap kunjungan ke SMP dan kegiatan Open House.
- **Tahap 6 — Laporan:**
  - **Ekspor Excel** menghasilkan sheet ringkasan per SMP, sheet program, sheet berisi semua isian, dan **satu sheet per sekolah asal**. Akun Pimpinan hanya mendapat ringkasan.
  - **Ekspor PDF** membuka dialog cetak. Pilih **Simpan sebagai PDF**, dan grafik ikut tercetak.
- **Tahap 7 — Cetak Kartu & QR:** cetak kartu A5 (pilih kertas **A5** di dialog cetak), unduh QR dalam format PNG, atau cetak poster QR ukuran A4. Kartu yang diisi tangan dimasukkan lewat **Data Siswa → Input dari kartu cetak**.
- **Tahap 8 — Analisis AI** (opsional):
  1. Buat kunci API, misalnya di console.anthropic.com untuk Claude, atau aistudio.google.com untuk Gemini.
  2. Di editor Apps Script, buka **Setelan proyek → Properti skrip → Tambahkan properti skrip**, lalu isi nama `AI_API_KEY` dengan kunci API Anda. Kunci tidak pernah dikirim ke browser.
  3. Di **Pengaturan**, isi `AI_PROVIDER` (`anthropic` atau `gemini`) dan `AI_MODEL`, lalu ubah **Analisis AI** menjadi TRUE.
  4. Yang dikirim ke AI hanya angka agregat, tanpa nama siswa dan tanpa kontak. Hasilnya tersimpan di sheet AI_INSIGHTS. Penggunaan API AI berbayar sesuai tarif penyedia.

---

## BAGIAN 7 — Uji sebelum dipakai sungguhan

1. Masuk ke `admin.html` dengan akun Super Admin. Tambahkan satu akun Petugas dan satu akun Pimpinan, lalu coba masuk dengan masing-masing akun. Menu yang tampil harus sesuai tabel di Bagian 5.
2. Isi formulir dari HP. Data harus muncul di Dashboard dalam waktu 2 menit.
3. Tugaskan siswa ke Petugas. Petugas hanya boleh melihat siswa tersebut.
4. Jalankan Cocokkan SMP, lalu buka Laporan. Nama sekolah harus rapi dan tidak terpecah.
5. Uji Ekspor Excel, Ekspor PDF, dan cetak kartu A5 ke printer.
6. Lakukan uji beban dengan banyak HP, karena PRD meminta 300 pengisian bersamaan.
7. Setelah semua uji selesai, jalankan `hapusDataSimulasi` di Apps Script.

## Catatan teknis

- **Sesi login** berlaku 6 jam. Setelah itu petugas diminta masuk lagi.
- **Dashboard** di-cache 2 menit supaya cepat. Angka baru muncul paling lambat 2 menit setelah ada data masuk.
- **Library grafik, Excel, dan QR** dimuat dari CDN (jsDelivr dan cdnjs). Panel petugas butuh internet.
- **Daftar status follow-up** dan **rumus prioritas kunjungan** adalah usulan saya. Ubah di `Admin.gs` (`STATUSES`, `BOARD`, `buildReport`) kalau perlu.
