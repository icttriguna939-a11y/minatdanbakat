/**
 * API — komunikasi dengan Google Apps Script (fetch, tanpa iframe).
 * POST wajib memakai Content-Type text/plain agar tidak terkena CORS preflight.
 */
(function () {
  const cfg = window.APP_CONFIG;
  const isDemo = () => !cfg.GAS_URL || cfg.GAS_URL.indexOf('/exec') === -1;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function get(action) {
    if (isDemo()) return { success: true, data: { formOpen: true, demo: true } };
    const res = await fetch(cfg.GAS_URL + '?action=' + encodeURIComponent(action));
    return res.json();
  }

  async function postOnce(action, data) {
    const res = await fetch(cfg.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, data: data })
    });
    return res.json();
  }

  /**
   * Kirim dengan percobaan ulang. Saat ratusan siswa mengisi bersamaan,
   * Apps Script bisa sesekali sibuk — data tidak boleh hilang.
   * submission_id yang sama membuat server mengabaikan kiriman ganda.
   */
  async function post(action, data, onRetry) {
    if (isDemo()) {
      await sleep(900);
      console.info('[MODE DEMO] Data tidak dikirim. Isi GAS_URL di js/config.js.', data);
      return { success: true, demo: true, data: { student_id: 'DEMO-' + Date.now().toString(36).toUpperCase() } };
    }
    const delays = [0, 1500, 3500, 7000, 12000];
    let last = { success: false, message: 'Tidak dapat terhubung ke server.' };
    for (let i = 0; i < delays.length; i++) {
      if (delays[i]) { if (onRetry) onRetry(i); await sleep(delays[i] + Math.random() * 800); }
      try {
        const out = await postOnce(action, data);
        if (out.success || !out.retry) return out; // sukses, atau ditolak karena validasi
        last = out;
      } catch (err) {
        last = { success: false, network: true, message: 'Koneksi terputus. Periksa sinyal internetmu.' };
      }
    }
    return last;
  }

  window.API = { get: get, post: post, isDemo: isDemo };
})();
