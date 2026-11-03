/**
 * Panel Petugas — inti: sesi login, API, router, menu, dan helper UI.
 */
(function () {
  const cfg = window.APP_CONFIG;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const isDemo = !cfg.GAS_URL || cfg.GAS_URL.indexOf('/exec') === -1;
  const SKEY = 'tsid_admin_session';

  const ROLE_LABEL = { super_admin: 'Super Admin', koordinator: 'Koordinator SPMB', petugas: 'Petugas SPMB', pimpinan: 'Pimpinan' };
  const ICON = {
    dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
    siswa: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    followup: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    laporan: 'M3 3v18h18M7 15l4-4 3 3 5-6',
    smp: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6',
    cocok: 'M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3M8 12l3 3 5-6',
    kunjungan: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    cetak: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z',
    ai: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
    pengaturan: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'
  };
  const SA = 'super_admin', KO = 'koordinator', PE = 'petugas', PI = 'pimpinan';
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', roles: [SA, KO, PE, PI] },
    { id: 'siswa', label: 'Data Siswa', roles: [SA, KO, PE] },
    { id: 'followup', label: 'Follow-up', roles: [SA, KO, PE] },
    { id: 'laporan', label: 'Laporan & Analisis', roles: [SA, KO, PI] },
    { id: 'smp', label: 'Master SMP', roles: [SA, KO] },
    { id: 'cocok', label: 'Cocokkan SMP', roles: [SA, KO] },
    { id: 'kunjungan', label: 'Kunjungan & Kegiatan', roles: [SA, KO] },
    { id: 'cetak', label: 'Cetak Kartu & QR', roles: [SA, KO, PE] },
    { id: 'ai', label: 'Analisis AI', roles: [SA, KO, PI] },
    { id: 'pengaturan', label: 'Pengaturan & Akun', roles: [SA] }
  ];

  const state = { token: null, user: null, charts: [], navBadges: {} };

  // ---------- Helper ----------
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => Number(n || 0).toLocaleString('id-ID');
  const svg = (d, cls) => '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '><path d="' + d + '"/></svg>';
  const cat = (c, big) => c ? '<span class="cat ' + esc(c) + (big ? ' lg' : '') + '" title="Kategori ' + esc(c) + '">' + esc(c) + '</span>' : '';
  const STATUS_COLOR = {
    'Perlu dihubungi': 'red', 'Info terkirim': 'blue', 'Sudah dihubungi': 'blue', 'Tidak merespons': '',
    'Diundang Open House': 'purple', 'Hadir Open House': 'green', 'Mendaftar': 'green', 'Tanpa izin kontak': '', 'Tidak ada promosi': ''
  };
  const chip = (text, color) => '<span class="chip ' + (color == null ? (STATUS_COLOR[text] || '') : color) + '">' + esc(text) + '</span>';
  const initials = (name) => String(name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  function toast(msg, err) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(t._h);
    t._h = setTimeout(() => (t.className = 'toast'), 3400);
  }

  function openModal(title, html, onMount) {
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    const first = $('#modalBody input, #modalBody select, #modalBody textarea, #modalBody button');
    if (first) setTimeout(() => first.focus(), 30);
    if (onMount) onMount($('#modalBody'));
  }
  function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }

  function skeleton(n) { return '<div class="grid kpis">' + '<div class="skeleton"></div>'.repeat(n || 4) + '</div><div class="skeleton" style="min-height:300px"></div>'; }

  let lastBusy = null;
  function busy(btn, on, label) {
    // e.currentTarget menjadi null setelah await, jadi simpan tombol terakhir
    if (!btn) btn = lastBusy;
    if (!btn) return;
    if (on) lastBusy = btn;
    if (on) { btn._html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>' + esc(label || 'Memproses…'); }
    else { btn.disabled = false; if (btn._html) btn.innerHTML = btn._html; }
  }

  function destroyCharts() { state.charts.forEach((c) => { try { c.destroy(); } catch (e) {} }); state.charts = []; }
  function chart(canvas, config) {
    if (!window.Chart) { canvas.parentElement.innerHTML = '<p class="muted small">Grafik tidak dapat dimuat (periksa koneksi internet).</p>'; return null; }
    Chart.defaults.font.family = 'Poppins, sans-serif';
    Chart.defaults.color = '#4B5875';
    const c = new Chart(canvas, config);
    state.charts.push(c);
    return c;
  }

  /** Cetak dengan ukuran kertas tertentu (A5 untuk kartu, A4 untuk laporan). */
  function printHtml(html, size) {
    let st = $('#pageStyle');
    if (!st) { st = document.createElement('style'); st.id = 'pageStyle'; document.head.appendChild(st); }
    st.textContent = '@media print { @page { size: ' + (size || 'A4 portrait') + '; margin: ' + (size && size.indexOf('A5') === 0 ? '0' : '12mm') + '; } }';
    if (html != null) $('#printArea').innerHTML = html;
    setTimeout(() => window.print(), 350);
  }

  // ---------- API ----------
  async function api(action, data) {
    if (isDemo) return window.DEMO.handle(action, data || {}, state.user);
    try {
      const res = await fetch(cfg.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, token: state.token, data: data || {} })
      });
      const out = await res.json();
      if (out && out.auth === false) { logout(true); toast(out.message, true); }
      return out;
    } catch (e) {
      return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi internet.' };
    }
  }
  async function apiOrToast(action, data) {
    const r = await api(action, data);
    if (!r.success) toast(r.message || 'Terjadi kesalahan.', true);
    return r;
  }

  // ---------- Sesi ----------
  function saveSession() { try { sessionStorage.setItem(SKEY, JSON.stringify({ token: state.token, user: state.user })); } catch (e) {} }
  function loadSession() {
    try { const s = JSON.parse(sessionStorage.getItem(SKEY) || 'null'); if (s && s.user) { state.token = s.token; state.user = s.user; return true; } } catch (e) {}
    return false;
  }

  async function startLogin() {
    $('#appView').hidden = true;
    $('#loginView').hidden = false;
    if (isDemo) { $('#demoLogin').hidden = false; $('#loginPeriod').textContent = 'mode demo'; return; }
    let clientId = cfg.GOOGLE_CLIENT_ID;
    try {
      const r = await fetch(cfg.GAS_URL + '?action=publicConfig').then((x) => x.json());
      if (r.success) { clientId = clientId || r.data.googleClientId; $('#loginPeriod').textContent = r.data.periodLabel || ''; }
    } catch (e) { $('#loginMsg').textContent = 'Server tidak dapat dihubungi.'; }
    if (!clientId) { $('#loginMsg').textContent = 'GOOGLE_CLIENT_ID belum diisi (js/config.js atau sheet SETTINGS).'; return; }
    const init = () => {
      if (!window.google || !google.accounts) return setTimeout(init, 200);
      google.accounts.id.initialize({ client_id: clientId, callback: onGoogleCredential, auto_select: false, ux_mode: 'popup' });
      google.accounts.id.renderButton($('#googleBtn'), { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'signin_with', locale: 'id' });
    };
    init();
  }

  async function onGoogleCredential(resp) {
    $('#loginMsg').textContent = 'Memeriksa akun…';
    try {
      const r = await fetch(cfg.GAS_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', data: { credential: resp.credential } })
      }).then((x) => x.json());
      if (!r.success) { $('#loginMsg').textContent = r.message; return; }
      state.token = r.data.token; state.user = r.data.user;
      saveSession();
      $('#loginMsg').textContent = '';
      enterApp();
    } catch (e) { $('#loginMsg').textContent = 'Gagal menghubungi server.'; }
  }

  function demoLogin(role) {
    state.user = window.DEMO.userFor(role);
    state.token = 'demo-token-' + role + '-xxxxxxxxxxxxxxxx';
    saveSession();
    enterApp();
  }

  async function logout(silent) {
    if (!silent && !isDemo && state.token) api('logout');
    state.token = null; state.user = null;
    try { sessionStorage.removeItem(SKEY); } catch (e) {}
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    location.hash = '';
    startLogin();
  }

  // ---------- Menu & router ----------
  function allowed(id) { const n = NAV.find((x) => x.id === id); return n && n.roles.indexOf(state.user.role) !== -1; }

  function renderNav() {
    const route = currentRoute();
    $('#nav').innerHTML = NAV.filter((n) => n.roles.indexOf(state.user.role) !== -1).map((n) => {
      let tag = '';
      if (n.id === 'ai' && state.navBadges.aiOff) tag = '<span class="tag soon">Segera</span>';
      if (n.id === 'cocok' && state.navBadges.unmatched) tag = '<span class="tag">' + num(state.navBadges.unmatched) + '</span>';
      return '<a href="#/' + n.id + '" class="' + (n.id === route ? 'active' : '') + '"' + (n.id === route ? ' aria-current="page"' : '') + '>' +
        svg(ICON[n.id]) + '<span class="label">' + esc(n.label) + '</span>' + tag + '</a>';
    }).join('');
  }

  function currentRoute() {
    const r = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return r || 'dashboard';
  }

  async function route() {
    if (!state.user) return;
    let id = currentRoute();
    if (!allowed(id) || !window.PAGES[id]) {
      if (id !== 'dashboard') toast('Menu itu tidak tersedia untuk peran Anda.', true);
      if (location.hash !== '#/dashboard') { location.hash = '#/dashboard'; return; }
      id = 'dashboard';
    }
    renderNav();
    $('.sidebar').classList.remove('open');
    destroyCharts();
    const main = $('#main');
    const page = window.PAGES[id];
    main.innerHTML = skeleton();
    window.scrollTo(0, 0);
    try { await page(main, state.user); }
    catch (e) { console.error(e); main.innerHTML = '<div class="alert err">Halaman gagal dimuat: ' + esc(e.message) + '</div>'; }
    main.focus({ preventScroll: true });
  }

  async function enterApp() {
    $('#loginView').hidden = true;
    $('#appView').hidden = false;
    const u = state.user;
    $('#userName').textContent = u.name;
    $('#userRole').textContent = ROLE_LABEL[u.role] || u.role;
    $('#userAvatar').innerHTML = u.picture ? '<img alt="" src="' + esc(u.picture) + '">' : esc(initials(u.name));
    if (!isDemo) {
      const me = await api('me');
      if (!me.success) return;
    }
    if (!location.hash) location.hash = '#/dashboard'; else route();
    refreshBadges();
  }

  async function refreshBadges() {
    const r = await api('dashboard');
    if (r.success) state.navBadges.unmatched = r.data.unmatched;
    if (['super_admin', 'koordinator', 'pimpinan'].indexOf(state.user.role) !== -1) {
      const a = await api('aiList');
      if (a.success) state.navBadges.aiOff = !a.data.enabled;
    }
    renderNav();
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    $$('[data-demo-role]').forEach((b) => b.addEventListener('click', () => demoLogin(b.dataset.demoRole)));
    $('#logoutBtn').addEventListener('click', () => logout(false));
    $('#menuToggle').addEventListener('click', () => {
      const sb = $('.sidebar'); sb.classList.toggle('open');
      $('#menuToggle').setAttribute('aria-expanded', sb.classList.contains('open'));
    });
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
    window.addEventListener('hashchange', route);
    window.addEventListener('afterprint', () => { $('#printArea').innerHTML = ''; });
    if (loadSession()) enterApp(); else startLogin();
  });

  window.ADMIN = { state, api, apiOrToast, esc, num, svg, cat, chip, toast, openModal, closeModal, busy, chart, printHtml,
                   initials, ROLE_LABEL, STATUS_COLOR, isDemo, refreshBadges, route, $, $$ };
})();
