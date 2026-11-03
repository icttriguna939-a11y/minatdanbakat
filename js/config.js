/**
 * KONFIGURASI FRONTEND — Triguna Student Interest Database
 * Ini satu-satunya file yang perlu diedit sebelum online.
 */
window.APP_CONFIG = {
  // 1. Tempel URL /exec dari Apps Script di sini.
  //    Selama masih kosong, aplikasi berjalan dalam MODE DEMO (data tidak dikirim ke mana pun).
  GAS_URL: 'https://script.google.com/macros/s/AKfycbx44NZuMISwXNrNgg6hnXzE97u-oxdvTcTMsxtEM4T1J6voPJVMSzW6bH_U-PnamNTr/exec',

  // 1b. Panel petugas (admin.html): OAuth Client ID dari Google Cloud Console.
  //     Boleh dikosongkan bila sudah diisi di sheet SETTINGS (GOOGLE_CLIENT_ID).
  GOOGLE_CLIENT_ID: '',

  // 2. Identitas sekolah
  SCHOOL_NAME: 'SMA Triguna 1956',
  SUBTITLE: 'Kartu Minat Calon Siswa',
  LOGO_URL: '',            // contoh: 'img/logo.png' (kosong = lingkaran "T56")
  INSTAGRAM: '',           // contoh: '@smatriguna1956'
  WEBSITE: '',             // contoh: 'https://smatriguna1956.sch.id'

  // 3. Pilihan jawaban.
  //    Nomor 4–7, 11, dan 14 JANGAN diubah tanpa mengubah Kode.gs (bagian VALID).
  //    Nomor 8–10 boleh disesuaikan dengan program sekolah yang sebenarnya.
  OPTIONS: {
    current_grade: ['VII', 'VIII', 'IX'],
    education_plan: ['SMA', 'SMK', 'MA', 'Masih mempertimbangkan', 'Lainnya'],
    target_school_status: ['Sudah', 'Belum', 'Ragu-ragu'],
    triguna_consideration: ['Ya', 'Mungkin', 'Tidak'],
    interest_level: [
      { value: 'Sangat tertarik', sub: 'Aku ingin tahu semuanya', bars: 4 },
      { value: 'Tertarik', sub: 'Cukup menarik buatku', bars: 3 },
      { value: 'Ingin tahu lebih banyak', sub: 'Masih mau cari info dulu', bars: 2 },
      { value: 'Belum tertarik', sub: 'Untuk saat ini belum', bars: 1 }
    ],
    school_considerations: ['Akreditasi', 'Biaya', 'Jarak & lokasi', 'Fasilitas', 'Ekstrakurikuler', 'Prestasi sekolah', 'Saran orang tua/teman'],
    favorite_programs: ['Kelas Unggulan', 'Robotik & IT', 'Olahraga', 'Seni & Budaya', 'Bahasa Asing', 'Keagamaan'],
    needed_information: ['Biaya pendidikan', 'Jadwal SPMB', 'Beasiswa', 'Program unggulan', 'Fasilitas', 'Kegiatan siswa'],
    introduction_interest: ['Ya', 'Mungkin', 'Tidak'],
    consent: ['Ya', 'Tidak']
  }
};
