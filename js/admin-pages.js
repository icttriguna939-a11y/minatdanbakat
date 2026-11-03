/**
 * Panel Petugas — halaman-halaman (Tahap 4–8).
 */
(function () {
  const A = window.ADMIN;
  const { api, apiOrToast, esc, num, svg, cat, chip, toast, openModal, closeModal, busy, chart, printHtml, $, $$ } = A;
  const O = window.APP_CONFIG.OPTIONS;
  const can = (roles) => roles.split(' ').indexOf({ super_admin: 'sa', koordinator: 'ko', petugas: 'pe', pimpinan: 'pi' }[A.state.user.role]) !== -1;
  const I = {
    download: 'M12 3v12M7 10l5 5 5-5M5 21h14', plus: 'M12 5v14M5 12h14', check: 'M5 12.5l4.5 4.5L19 7.5', print: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v.01M11 12h1v5h1', lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
    spark: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
  };
  const CAT_TXT = { A: 'Sangat tertarik', B: 'Tertarik', C: 'Ingin tahu lebih banyak', D: 'Belum tertarik' };
  const CAT_ACT = { A: 'Follow-up personal', B: 'Kirim informasi program', C: 'Undangan Open House', D: 'Tidak ada promosi langsung' };
  const CAT_COLOR = { A: '#F0C419', B: '#2B5FAD', C: '#9B6FD1', D: '#C5CCD8' };
  const head = (title, sub, actions, eyebrow) =>
    '<header class="page-head"><div>' + (eyebrow ? '<span class="eyebrow">' + esc(eyebrow) + '</span>' : '') + '<h1>' + esc(title) + '</h1>' +
    (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="actions-row">' + (actions || '') + '</div></header>';
  const alertBox = (html, kind) => '<div class="alert ' + (kind || '') + '" role="note">' + svg(I.info) + '<div>' + html + '</div></div>';
  const errorView = (main, r) => { main.innerHTML = alertBox(esc(r.message || 'Gagal memuat data.'), 'err'); };
  const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);

  // =====================================================================
  // TAHAP 4 — DASHBOARD
  // =====================================================================
  async function dashboard(main, u) {
    const r = await api('dashboard');
    if (!r.success) return errorView(main, r);
    const d = r.data;
    const first = (u.name || '').split(' ')[0];
    const acts = (can('sa ko pe') ? '<a class="btn btn-outline" href="#/cetak">' + svg(I.print) + 'Kartu & QR</a>' : '') +
      (can('sa ko pi') ? '<a class="btn btn-primary" href="#/laporan">' + svg(I.download) + 'Laporan & Ekspor</a>' : '');
    const sub = u.role === 'petugas' ? 'Ada <b>' + num(d.mine) + '</b> calon siswa yang ditugaskan kepada Anda.'
      : 'Ada <b>' + num(d.pending) + '</b> calon siswa menunggu tindak lanjut.';
    main.innerHTML = head('Halo, ' + first + '!', sub, acts, (window.APP_CONFIG.PERIOD_LABEL || 'SPMB') + (A.isDemo ? ' · data demo' : '')) +
      (d.unmatched && can('sa ko') ? alertBox('<b>' + num(d.unmatched) + ' siswa</b> belum dicocokkan ke master SMP, jadi belum masuk laporan per sekolah dengan rapi. <a href="#/cocok">Cocokkan sekarang</a>.', 'warn') : '') +
      '<section class="grid kpis">' +
        '<div class="kpi gold"><span class="k-label">Total siswa terdata</span><span class="k-value">' + num(d.total) + '</span><span class="k-note">+' + num(d.newThisWeek) + ' dalam 7 hari terakhir</span></div>' +
        '<div class="kpi"><span class="k-label">Asal SMP</span><span class="k-value">' + num(d.schools) + '</span><span class="k-note">' + num(d.visitedSchools) + ' sekolah sudah dikunjungi</span></div>' +
        '<div class="kpi navy"><span class="k-label">Kategori A · Sangat tertarik</span><span class="k-value">' + num(d.cats.A) + '</span><span class="k-note">' + pct(d.cats.A, d.total) + '% dari total · follow-up personal</span></div>' +
        '<div class="kpi"><span class="k-label">Menunggu follow-up</span><span class="k-value red">' + num(d.pending) + '</span><span class="k-note">' + num(d.pendingA) + ' di antaranya kategori A</span></div>' +
      '</section>' +
      '<section class="grid cols-2">' +
        '<div class="card"><h2>Tren pengisian formulir</h2><p class="sub">14 hari terakhir · puncak biasanya saat hari kunjungan</p><div class="chart-box"><canvas id="cTrend" role="img" aria-label="Grafik jumlah pengisian per tanggal"></canvas></div></div>' +
        '<div class="card"><h2>Tingkat ketertarikan</h2><p class="sub">Dari jawaban pertanyaan no. 7</p>' + interestBlock(d.cats, d.total) + '</div>' +
      '</section>' +
      '<section class="grid cols-3">' +
        '<div class="card"><h2>Per kelas</h2><p class="sub">Kelas VII · VIII · IX</p><div class="chart-box"><canvas id="cGrade" role="img" aria-label="Grafik siswa per kelas"></canvas></div></div>' +
        '<div class="card"><h2>Program paling diminati</h2><p class="sub">Pertanyaan no. 9</p>' + hbars(d.programs.slice(0, 6)) + '</div>' +
        '<div class="card"><h2>Asal SMP teratas</h2><p class="sub">Jumlah calon siswa</p>' + rankList(d.topSchools) + '</div>' +
      '</section>';
    const max = Math.max.apply(null, d.trend.map((x) => x.n).concat([1]));
    chart($('#cTrend'), { type: 'line', data: { labels: d.trend.map((x) => x.label), datasets: [{ data: d.trend.map((x) => x.n), borderColor: '#2B5FAD', borderWidth: 3, tension: .35, fill: true,
      backgroundColor: (c) => { const g = c.chart.ctx.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, 'rgba(43,95,173,.28)'); g.addColorStop(1, 'rgba(43,95,173,0)'); return g; },
      pointRadius: d.trend.map((x) => (x.n === max ? 5 : 0)), pointBackgroundColor: '#F0C419' }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(18,33,61,.06)' } }, x: { grid: { display: false } } } } });
    chart($('#cGrade'), { type: 'bar', data: { labels: ['Kelas VII', 'Kelas VIII', 'Kelas IX'], datasets: [{ data: [d.grades.VII, d.grades.VIII, d.grades.IX],
      backgroundColor: ['#BFE6FB', '#2B5FAD', '#F0C419'], borderRadius: 14, borderSkipped: false }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(18,33,61,.06)' } }, x: { grid: { display: false } } } } });
  }

  function interestBlock(cats, total) {
    const t = total || 1;
    return '<div class="stack" style="margin-bottom:12px" aria-hidden="true">' + ['A', 'B', 'C', 'D'].map((k) => cats[k] ? '<i class="' + k + '" style="width:' + (100 * cats[k] / t) + '%"></i>' : '').join('') + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' + ['A', 'B', 'C', 'D'].map((k) =>
        '<div class="prio" style="padding:10px 12px">' + cat(k, true) + '<div class="txt"><b>' + CAT_TXT[k] + '</b>' + CAT_ACT[k] + '</div><b>' + num(cats[k]) + ' · ' + pct(cats[k], total) + '%</b></div>').join('') + '</div>';
  }
  function hbars(list) {
    if (!list.length) return '<p class="empty">Belum ada data.</p>';
    const max = list[0].n || 1;
    return '<div class="hbar">' + list.map((p, i) => '<div class="row"><div class="top"><b>' + esc(p.label) + '</b><span>' + num(p.n) + '</span></div><div class="track"><i class="' + (i ? '' : 'gold') + '" style="width:' + (100 * p.n / max) + '%"></i></div></div>').join('') + '</div>';
  }
  function rankList(list) {
    if (!list.length) return '<p class="empty">Belum ada data.</p>';
    return '<div style="display:flex;flex-direction:column">' + list.map((s, i) => '<div class="row-flex" style="padding:9px 0;border-bottom:1px solid rgba(18,33,61,.06)"><span class="chip blue">' + (i + 1) + '</span><span class="grow">' + esc(s.label) + '</span><b>' + num(s.n) + '</b></div>').join('') + '</div>';
  }

  // =====================================================================
  // TAHAP 4 — DATA SISWA
  // =====================================================================
  const sv = { q: '', grade: '', cat: '', status: '', page: 1, sel: null, picked: {} };

  async function siswa(main) {
    const acts = '<button class="btn btn-outline" id="btnKartu">' + svg(I.plus) + 'Input dari kartu cetak</button>' +
      (can('sa ko') ? '<button class="btn btn-primary" id="btnXls">' + svg(I.download) + 'Ekspor Excel</button>' : '');
    main.innerHTML = head('Data Calon Siswa', 'Jawaban asli siswa tidak bisa diubah. Kategori, status, dan pencocokan SMP disimpan terpisah.', acts) +
      '<div class="filterbar"><div class="search">' + svg(I.search) + '<input class="input" id="fQ" type="search" placeholder="Cari nama atau asal SMP" aria-label="Cari nama atau asal SMP" value="' + esc(sv.q) + '"></div>' +
      '<div class="seg" id="fGrade" role="group" aria-label="Filter kelas">' + ['', 'VII', 'VIII', 'IX'].map((g) => '<button data-v="' + g + '" aria-pressed="' + (sv.grade === g) + '">' + (g || 'Semua kelas') + '</button>').join('') + '</div>' +
      '<select class="input" id="fStatus" style="width:auto" aria-label="Filter status"><option value="">Semua status</option>' +
      ['Perlu dihubungi', 'Info terkirim', 'Sudah dihubungi', 'Diundang Open House', 'Hadir Open House', 'Mendaftar', 'Tidak merespons', 'Tanpa izin kontak', 'Tidak ada promosi']
        .map((s) => '<option' + (sv.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' +
      '<div class="row-flex" id="fCat" role="group" aria-label="Filter kategori"></div></div>' +
      '<div class="split"><section class="card table-card" id="tbl"></section><aside id="detail"></aside></div>';

    $('#btnKartu').onclick = () => kartuForm(() => loadList());
    if ($('#btnXls')) $('#btnXls').onclick = (e) => exportExcel(e.currentTarget);
    let t;
    $('#fQ').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { sv.q = e.target.value; sv.page = 1; loadList(); }, 300); };
    $$('#fGrade button').forEach((b) => (b.onclick = () => { sv.grade = b.dataset.v; sv.page = 1; $$('#fGrade button').forEach((x) => x.setAttribute('aria-pressed', x === b)); loadList(); }));
    $('#fStatus').onchange = (e) => { sv.status = e.target.value; sv.page = 1; loadList(); };
    await loadList();
    if (sv.sel) showDetail(sv.sel); else $('#detail').innerHTML = '<div class="card empty">Pilih nama siswa untuk melihat 14 jawabannya.</div>';
  }

  async function loadList() {
    const box = $('#tbl');
    if (!box) return;
    box.innerHTML = '<div class="skeleton" style="min-height:360px;border-radius:0"></div>';
    const r = await api('listStudents', { q: sv.q, grade: sv.grade, cat: sv.cat, status: sv.status, page: sv.page });
    if (!r.success) { box.innerHTML = alertBox(esc(r.message), 'err'); return; }
    const d = r.data, assign = can('sa ko');
    const totalAll = d.catCounts.A + d.catCounts.B + d.catCounts.C + d.catCounts.D;
    $('#fCat').innerHTML = [['', 'Semua minat', totalAll], ['A', 'A', d.catCounts.A], ['B', 'B', d.catCounts.B], ['C', 'C', d.catCounts.C], ['D', 'D', d.catCounts.D]]
      .map((c) => '<button class="fchip" data-v="' + c[0] + '" aria-pressed="' + (sv.cat === c[0]) + '">' + c[1] + ' <small>' + num(c[2]) + '</small></button>').join('');
    $$('#fCat button').forEach((b) => (b.onclick = () => { sv.cat = b.dataset.v; sv.page = 1; loadList(); }));

    const picked = Object.keys(sv.picked).length;
    box.innerHTML = (assign ? '<div class="row-flex" style="padding:12px 16px;border-bottom:1px solid rgba(18,33,61,.07)"><span class="small muted grow">' +
        (picked ? '<b>' + picked + '</b> siswa dipilih' : 'Centang siswa untuk menugaskan petugas') + '</span>' +
        '<button class="btn btn-sm btn-secondary" id="btnAssign"' + (picked ? '' : ' disabled') + '>' + svg(I.users) + 'Tugaskan petugas</button></div>' : '') +
      (d.items.length ? '<div class="table-wrap"><table class="tbl"><thead><tr>' + (assign ? '<th><span class="small">Pilih</span></th>' : '') +
        '<th>Nama</th><th>Asal SMP</th><th>Kelas</th><th>Minat</th><th>Izin</th><th>Status</th><th>Petugas</th></tr></thead><tbody>' +
        d.items.map((s) => '<tr class="' + (sv.sel === s.id ? 'sel' : '') + '">' +
          (assign ? '<td><input type="checkbox" aria-label="Pilih ' + esc(s.name) + '" data-pick="' + esc(s.id) + '"' + (sv.picked[s.id] ? ' checked' : '') + (s.consent !== 'Ya' ? ' disabled title="Tidak bersedia dihubungi"' : '') + '></td>' : '') +
          '<td><button class="linkbtn" data-open="' + esc(s.id) + '">' + esc(s.name) + '</button><div class="muted">' + esc(s.created) + (s.source === 'kartu' ? ' · kartu' : '') + '</div></td>' +
          '<td>' + esc(s.school) + (s.matched ? '' : ' <span class="chip yellow" title="Belum dicocokkan ke master SMP">ketikan</span>') + '</td>' +
          '<td><b>' + esc(s.grade) + '</b></td><td>' + cat(s.cat) + '</td>' +
          '<td style="font-weight:700;color:' + (s.consent === 'Ya' ? '#1D6B40' : '#9C1F4D') + '">' + esc(s.consent) + '</td>' +
          '<td>' + chip(s.status) + '</td><td class="muted">' + esc((s.assigned || '').split('@')[0]) + '</td></tr>').join('') +
        '</tbody></table></div>' : '<div class="empty">Tidak ada siswa yang cocok dengan filter ini.</div>') +
      '<div class="pager"><span>Menampilkan ' + num(d.items.length) + ' dari ' + num(d.total) + '</span><div class="row-flex">' +
        '<button class="btn btn-sm btn-outline" id="pPrev"' + (d.page <= 1 ? ' disabled' : '') + '>‹ Sebelumnya</button><span>Hal. ' + d.page + ' / ' + d.pages + '</span>' +
        '<button class="btn btn-sm btn-outline" id="pNext"' + (d.page >= d.pages ? ' disabled' : '') + '>Berikutnya ›</button></div></div>';
    $$('[data-open]', box).forEach((b) => (b.onclick = () => { sv.sel = b.dataset.open; $$('tr', box).forEach((tr) => tr.classList.remove('sel')); b.closest('tr').classList.add('sel'); showDetail(sv.sel); }));
    $$('[data-pick]', box).forEach((c) => (c.onchange = () => { if (c.checked) sv.picked[c.dataset.pick] = 1; else delete sv.picked[c.dataset.pick]; loadList(); }));
    if ($('#pPrev')) $('#pPrev').onclick = () => { sv.page--; loadList(); };
    if ($('#pNext')) $('#pNext').onclick = () => { sv.page++; loadList(); };
    if ($('#btnAssign')) $('#btnAssign').onclick = () => assignModal(Object.keys(sv.picked), () => { sv.picked = {}; loadList(); });
  }

  async function showDetail(id) {
    const box = $('#detail');
    if (!box) return;
    box.innerHTML = '<div class="skeleton" style="min-height:420px"></div>';
    const r = await api('getStudent', { id: id });
    if (!r.success) { box.innerHTML = alertBox(esc(r.message), 'err'); return; }
    box.innerHTML = studentPanel(r.data);
    const b = $('#btnFU', box);
    if (b) b.onclick = () => statusModal(r.data, () => { showDetail(id); loadList(); });
  }

  function studentPanel(s) {
    const groups = [['B. Rencana pendidikan', [4, 5, 6]], ['C. Minat & ketertarikan', [7, 8, 9]], ['D. Informasi', [10, 11]], ['E. Persetujuan', [14]]];
    return '<div class="panel"><div class="panel-head"><div class="avatar" style="background:#BFE6FB;width:52px;height:52px;font-size:18px">' + esc(A.initials(s.name)) + '</div>' +
      '<div class="grow"><h3>' + esc(s.name) + '</h3><div class="muted">' + esc(s.school) + ' · Kelas ' + esc(s.grade) + '</div>' +
      (s.matched ? '' : '<div class="muted">Ketikan siswa: “' + esc(s.origin) + '”</div>') + '</div>' +
      '<span class="sticker" style="background:' + (s.cat === 'A' ? 'var(--grad-gold)' : s.cat === 'B' ? '#2B5FAD;color:#fff' : s.cat === 'C' ? '#E7DCF6;color:#4E2F86' : '#E6E9EF') + '">Kategori ' + esc(s.cat) + '</span></div>' +
      '<div class="panel-body"><div class="row-flex">' + chip(s.status) + (s.assigned ? '<span class="chip">Petugas: ' + esc(s.assigned.split('@')[0]) + '</span>' : '') + '<span class="muted small">' + esc(s.created) + ' · ' + (s.source === 'kartu' ? 'kartu cetak' : 'QR') + '</span></div>' +
      groups.map((g) => '<div><div class="small" style="font-weight:700;color:#2B5FAD;letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px">' + g[0] + '</div>' +
        s.answers.filter((a) => g[1].indexOf(a.no) !== -1).map((a) => '<div class="qa"><span>' + a.no + '</span><span>' + esc(a.q) + '</span><b>' + esc(a.a) + '</b></div>').join('') + '</div>').join('') +
      (s.contact ? '<div class="lock">' + svg(I.lock) + '<div><b>' + esc(s.contact.parent || '(nama orang tua tidak diisi)') + '</b> · ' + esc(s.contact.wa || '—') +
        (s.contact.wa ? ' · <a target="_blank" rel="noopener" href="https://wa.me/62' + esc(String(s.contact.wa).replace(/^0/, '')) + '">buka WhatsApp</a>' : '') +
        '<br><span class="muted small">Terlihat hanya oleh petugas berwenang.</span></div></div>'
        : s.consent !== 'Ya' ? alertBox('Siswa tidak bersedia menerima informasi (no. 14 = Tidak). Tidak masuk daftar komunikasi.') : s.contactHidden ? alertBox('Kontak orang tua hanya terlihat oleh petugas yang ditugaskan.') : '') +
      (s.history.length ? '<div><div class="small" style="font-weight:700;margin-bottom:6px">Riwayat tindak lanjut</div><div class="timeline">' +
        s.history.map((h) => '<div><b>' + esc(h.status) + (h.notes ? ' — ' + esc(h.notes) : '') + '</b><span>' + esc(h.by.split('@')[0]) + ' · ' + esc(h.at) + (h.date ? ' · jadwal ' + esc(h.date) : '') + '</span></div>').join('') + '</div></div>' : '') +
      (s.consent === 'Ya' ? '<button class="btn btn-primary" id="btnFU">Catat follow-up</button>' : '') +
      '</div></div>';
  }

  function statusModal(s, done) {
    const statuses = ['Perlu dihubungi', 'Info terkirim', 'Sudah dihubungi', 'Diundang Open House', 'Hadir Open House', 'Mendaftar', 'Tidak merespons'];
    openModal('Catat tindak lanjut · ' + s.name,
      '<p class="muted" style="margin:0">' + cat(s.cat) + ' ' + esc(CAT_TXT[s.cat]) + ' — saran: <b>' + esc(CAT_ACT[s.cat]) + '</b></p>' +
      '<div class="form-grid"><div class="field"><label for="mStatus">Status komunikasi</label><select class="input" id="mStatus">' +
      statuses.map((x) => '<option' + (x === s.status ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="mDate">Tanggal tindak lanjut</label><input class="input" type="date" id="mDate"></div></div>' +
      '<div class="field"><label for="mNotes">Catatan hasil</label><textarea class="input" id="mNotes" maxlength="500" placeholder="Contoh: Orang tua minta brosur biaya, akan hadir Open House."></textarea></div>' +
      '<button class="btn btn-primary" id="mSave">Simpan & catat riwayat</button>', (m) => {
        $('#mSave', m).onclick = async (e) => {
          busy(e.currentTarget, true, 'Menyimpan…');
          const r = await apiOrToast('updateStatus', { student_id: s.id, status: $('#mStatus', m).value, followup_date: $('#mDate', m).value, notes: $('#mNotes', m).value });
          busy(e.currentTarget, false);
          if (r.success) { toast(r.message); closeModal(); done && done(); }
        };
      });
  }

  async function assignModal(ids, done) {
    const r = await apiOrToast('listOfficers');
    if (!r.success) return;
    openModal('Tugaskan ' + ids.length + ' siswa',
      '<div class="field"><label for="mOff">Petugas penanggung jawab</label><select class="input" id="mOff">' +
      r.data.map((o) => '<option value="' + esc(o.email) + '">' + esc(o.name) + ' — ' + esc(A.ROLE_LABEL[o.role]) + '</option>').join('') + '</select></div>' +
      '<p class="muted small" style="margin:0">Penugasan dicatat di riwayat follow-up. Siswa yang tidak bersedia dihubungi otomatis dilewati.</p>' +
      '<button class="btn btn-primary" id="mGo">Tugaskan</button>', (m) => {
        $('#mGo', m).onclick = async (e) => {
          busy(e.currentTarget, true);
          const x = await apiOrToast('assign', { student_ids: ids, email: $('#mOff', m).value });
          busy(e.currentTarget, false);
          if (x.success) { toast(x.message); closeModal(); done && done(); }
        };
      });
  }

  /** Input kartu cetak oleh petugas (sumber = kartu, tercatat siapa yang menginput). */
  function kartuForm(done) {
    const radio = (k, opts) => '<div class="opts">' + opts.map((o) => { const v = typeof o === 'string' ? o : o.value;
      return '<label><input type="radio" name="' + k + '" value="' + esc(v) + '">' + esc(v) + '</label>'; }).join('') + '</div>';
    const check = (k) => '<div class="opts">' + O[k].map((v) => '<label><input type="checkbox" name="' + k + '" value="' + esc(v) + '">' + esc(v) + '</label>').join('') + '</div>';
    const f = (lbl, html) => '<div class="field"><span class="lbl">' + lbl + '</span>' + html + '</div>';
    openModal('Input dari kartu cetak',
      '<div class="form-grid"><div class="field"><label for="kName">1. Nama lengkap *</label><input class="input" id="kName" maxlength="120"></div>' +
      '<div class="field"><label for="kSchool">2. Asal SMP *</label><input class="input" id="kSchool" maxlength="150" placeholder="Tulis persis seperti di kartu"></div></div>' +
      f('3. Kelas *', radio('current_grade', O.current_grade)) + f('4. Rencana setelah SMP *', radio('education_plan', O.education_plan)) +
      f('5. Sudah punya sekolah tujuan? *', radio('target_school_status', O.target_school_status)) + f('6. SMA Triguna dipertimbangkan? *', radio('triguna_consideration', O.triguna_consideration)) +
      f('7. Tingkat ketertarikan *', radio('interest_level', O.interest_level)) + f('8. Pertimbangan memilih SMA *', check('school_considerations')) +
      f('9. Program yang menarik *', check('favorite_programs')) + f('10. Informasi yang dibutuhkan *', check('needed_information')) +
      f('11. Ikut kegiatan pengenalan? *', radio('introduction_interest', O.introduction_interest)) +
      '<div class="form-grid"><div class="field"><label for="kParent">12. Nama orang tua/wali</label><input class="input" id="kParent" maxlength="120"></div>' +
      '<div class="field"><label for="kWa">13. WhatsApp orang tua/wali</label><input class="input" id="kWa" inputmode="tel" maxlength="18"></div></div>' +
      f('14. Bersedia menerima informasi? *', radio('consent', O.consent)) +
      '<p class="muted small" id="kErr" role="alert" style="margin:0;color:#9C1F4D;font-weight:600"></p><button class="btn btn-primary" id="kSave">Simpan kartu</button>', (m) => {
        $('#kSave', m).onclick = async (e) => {
          const val = (k) => { const x = $('input[name="' + k + '"]:checked', m); return x ? x.value : ''; };
          const vals = (k) => $$('input[name="' + k + '"]:checked', m).map((x) => x.value);
          const data = { full_name: $('#kName', m).value, origin_school: $('#kSchool', m).value, current_grade: val('current_grade'), education_plan: val('education_plan'),
            target_school_status: val('target_school_status'), triguna_consideration: val('triguna_consideration'), interest_level: val('interest_level'),
            school_considerations: vals('school_considerations'), favorite_programs: vals('favorite_programs'), needed_information: vals('needed_information'),
            introduction_interest: val('introduction_interest'), parent_name: $('#kParent', m).value, parent_whatsapp: val('consent') === 'Ya' ? $('#kWa', m).value : '',
            consent: val('consent'), submission_id: 'kartu-' + Date.now() };
          busy(e.currentTarget, true, 'Menyimpan…');
          const r = await api('saveKartu', data);
          busy(e.currentTarget, false);
          if (!r.success) { $('#kErr', m).textContent = r.message; return; }
          toast(r.message); closeModal(); done && done();
        };
      });
  }

  // =====================================================================
  // TAHAP 5 — FOLLOW-UP
  // =====================================================================
  const fv = { officer: '', cat: '' };
  async function followup(main) {
    main.innerHTML = head('Follow-up SPMB', 'Tugaskan petugas, catat komunikasi, dan pantau perkembangan tiap calon siswa.',
      can('sa ko') ? '<a class="btn btn-secondary" href="#/siswa">' + svg(I.users) + 'Tugaskan dari Data Siswa</a>' : '') +
      '<div id="fuAlert"></div><div class="filterbar"><span class="small" style="font-weight:700">Filter:</span><div id="fuOff" class="row-flex"></div>' +
      '<div class="row-flex" id="fuCat" role="group" aria-label="Filter kategori">' + ['', 'A', 'B', 'C'].map((c) => '<button class="fchip" data-v="' + c + '" aria-pressed="' + (fv.cat === c) + '">' + (c ? 'Kategori ' + c : 'Semua kategori') + '</button>').join('') + '</div></div>' +
      '<section class="kanban" id="board"></section>';
    $$('#fuCat button').forEach((b) => (b.onclick = () => { fv.cat = b.dataset.v; $$('#fuCat button').forEach((x) => x.setAttribute('aria-pressed', x === b)); loadBoard(); }));
    if (can('sa ko')) {
      const o = await api('listOfficers');
      if (o.success) {
        $('#fuOff').innerHTML = '<select class="input" style="width:auto" id="fuOffSel" aria-label="Filter petugas"><option value="">Semua petugas</option>' +
          o.data.map((x) => '<option value="' + esc(x.email) + '"' + (fv.officer === x.email ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select>';
        $('#fuOffSel').onchange = (e) => { fv.officer = e.target.value; loadBoard(); };
      }
    }
    await loadBoard();
  }

  async function loadBoard() {
    const box = $('#board');
    box.innerHTML = '<div class="skeleton" style="grid-column:1/-1;min-height:300px"></div>';
    const r = await api('followBoard', fv);
    if (!r.success) { box.innerHTML = alertBox(esc(r.message), 'err'); return; }
    const d = r.data;
    $('#fuAlert').innerHTML = alertBox('<b>' + num(d.noConsent) + ' siswa</b> memilih “Tidak” pada pertanyaan 14, sehingga otomatis tidak masuk daftar komunikasi apa pun kategorinya.' +
      (d.unassigned && can('sa ko') ? ' <b>' + num(d.unassigned) + '</b> siswa yang perlu dihubungi belum punya petugas.' : ''));
    const dot = { perlu: '#B4235A', info: '#2B5FAD', oh: '#9B6FD1', daftar: '#1D6B40' };
    box.innerHTML = d.columns.map((c) => '<div class="col"><div class="col-head"><span><span style="color:' + dot[c.key] + '">●</span> ' + esc(c.title) + '</span><span class="count">' + num(c.count) + '</span></div>' +
      (c.items.length ? c.items.map((k) => '<button class="kcard" data-id="' + esc(k.id) + '"><span class="top"><span>' + esc(k.name) + '</span>' + cat(k.cat) + '</span>' +
        '<span class="meta">' + esc(k.school) + ' · Kelas ' + esc(k.grade) + '</span>' + (k.status !== c.title ? '<span>' + chip(k.status) + '</span>' : '') +
        (k.notes ? '<span class="meta" style="color:#12213D">' + esc(k.notes) + '</span>' : '') +
        '<span class="foot"><span>' + esc(k.assigned ? k.assigned.split('@')[0] : 'belum ditugaskan') + '</span><span class="' + (k.overdue ? 'late' : '') + '">' + esc(k.date || '') + '</span></span></button>').join('')
        : '<p class="empty" style="padding:16px 8px">Kosong</p>') + (c.count > c.items.length ? '<p class="muted small" style="text-align:center">+' + num(c.count - c.items.length) + ' lainnya — gunakan filter</p>' : '') + '</div>').join('');
    $$('.kcard', box).forEach((b) => (b.onclick = async () => {
      $$('.kcard', box).forEach((x) => x.classList.remove('sel')); b.classList.add('sel');
      const s = await apiOrToast('getStudent', { id: b.dataset.id });
      if (s.success) statusModal(s.data, loadBoard);
    }));
  }

  // =====================================================================
  // TAHAP 5 — MASTER SMP
  // =====================================================================
  async function smp(main) {
    main.innerHTML = head('Master SMP', 'Daftar resmi asal SMP. Ketikan siswa dicocokkan ke daftar ini agar laporan per sekolah akurat.',
      '<button class="btn btn-primary" id="addSmp">' + svg(I.plus) + 'Tambah SMP</button>') + '<section class="card table-card" id="smpTbl"></section>';
    $('#addSmp').onclick = () => schoolModal({}, () => smp(main));
    const r = await api('listSchools');
    if (!r.success) return errorView($('#smpTbl'), r);
    $('#smpTbl').innerHTML = r.data.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Kode</th><th>Nama SMP</th><th>Wilayah</th><th class="num">Siswa</th><th class="num">Kunjungan</th><th>Ketikan yang dikenali</th><th></th></tr></thead><tbody>' +
      r.data.map((s) => '<tr><td class="muted">' + esc(s.id) + '</td><td><b>' + esc(s.name) + '</b></td><td>' + esc([s.district, s.city].filter(Boolean).join(', ')) + '</td>' +
        '<td class="num">' + num(s.students) + '</td><td class="num">' + num(s.visits) + (s.visited ? ' ' + chip('dikunjungi', 'green') : '') + '</td>' +
        '<td class="muted" style="max-width:260px">' + esc(s.aliases || '—') + '</td><td><button class="btn btn-sm btn-outline" data-edit="' + esc(s.id) + '">Ubah</button></td></tr>').join('') +
      '</tbody></table></div>' : '<div class="empty">Belum ada SMP. Tambahkan SMP yang sering dikunjungi, lalu buka menu Cocokkan SMP.</div>';
    $$('[data-edit]').forEach((b) => (b.onclick = () => schoolModal(r.data.find((x) => x.id === b.dataset.edit), () => smp(main))));
  }

  function schoolModal(s, done) {
    openModal(s.id ? 'Ubah SMP' : 'Tambah SMP',
      '<div class="field"><label for="sName">Nama SMP *</label><input class="input" id="sName" value="' + esc(s.name || '') + '" placeholder="Contoh: SMPN 12 Jakarta"></div>' +
      '<div class="form-grid"><div class="field"><label for="sDist">Kecamatan / wilayah</label><input class="input" id="sDist" value="' + esc(s.district || '') + '"></div>' +
      '<div class="field"><label for="sCity">Kota</label><input class="input" id="sCity" value="' + esc(s.city || 'Jakarta') + '"></div></div>' +
      (s.id ? '<div class="field"><label for="sAlias">Ketikan yang dikenali (pisahkan koma)</label><input class="input" id="sAlias" value="' + esc(s.aliases || '') + '"></div>' +
        '<label class="row-flex small"><input type="checkbox" id="sVisited"' + (s.visited ? ' checked' : '') + '> Sudah dikunjungi</label>' : '') +
      '<div class="field"><label for="sNotes">Catatan</label><input class="input" id="sNotes" value="' + esc(s.notes || '') + '"></div>' +
      '<button class="btn btn-primary" id="sSave">Simpan</button>', (m) => {
        $('#sSave', m).onclick = async (e) => {
          busy(e.currentTarget, true);
          const r = await apiOrToast('saveSchool', { id: s.id, name: $('#sName', m).value.trim(), district: $('#sDist', m).value, city: $('#sCity', m).value,
            aliases: $('#sAlias', m) ? $('#sAlias', m).value : '', visited: $('#sVisited', m) ? $('#sVisited', m).checked : s.visited, notes: $('#sNotes', m).value });
          busy(e.currentTarget, false);
          if (r.success) { toast(r.message); closeModal(); done && done(r.data); }
        };
      });
  }

  // =====================================================================
  // TAHAP 5 — COCOKKAN ASAL SMP
  // =====================================================================
  const mv = { sel: 0, choice: {} };
  async function cocok(main) {
    main.innerHTML = head('Cocokkan Asal SMP', 'Siswa mengetik asal SMP secara bebas. Hubungkan setiap ketikan ke daftar master SMP agar laporan per sekolah akurat.',
      '<button class="btn btn-primary" id="bulk">' + svg(I.check) + 'Terima semua saran ≥ 90%</button>') + '<div id="mBody">' + '<div class="skeleton" style="min-height:400px"></div></div>';
    $('#bulk').onclick = async (e) => {
      busy(e.currentTarget, true, 'Mencocokkan…');
      const r = await apiOrToast('applyMatchBulk', { minScore: 90 });
      busy(e.currentTarget, false);
      if (r.success) { toast(r.message); mv.sel = 0; loadMatch(); A.refreshBadges(); }
    };
    await loadMatch();
  }

  async function loadMatch() {
    const r = await api('matchGroups');
    if (!r.success) return errorView($('#mBody'), r);
    const d = r.data, g = d.groups;
    if (mv.sel >= g.length) mv.sel = 0;
    const done = pct(d.matched, d.total);
    const scoreChip = (s) => chip(s + '%', s >= 90 ? 'green' : s >= 70 ? 'yellow' : 'red');
    $('#mBody').innerHTML =
      '<section class="grid kpis" style="margin-bottom:20px">' +
        '<div class="kpi navy"><span class="k-label">Sudah tercocokkan</span><span class="k-value">' + done + '%</span><div class="track" style="background:rgba(255,255,255,.15)"><i class="gold" style="width:' + done + '%"></i></div><span class="k-note">' + num(d.matched) + ' dari ' + num(d.total) + ' siswa</span></div>' +
        '<div class="kpi"><span class="k-label">Ketikan menunggu</span><span class="k-value red">' + num(g.length) + '</span><span class="k-note">' + num(d.pendingStudents) + ' siswa belum masuk laporan per SMP</span></div>' +
        '<div class="kpi"><span class="k-label">Master SMP</span><span class="k-value">' + num(d.masterCount) + '</span><span class="k-note"><a href="#/smp">Kelola daftar SMP</a></span></div>' +
        alertBox('Ketikan asli siswa tidak pernah diubah. Hasil pencocokan disimpan di kolom <b>school_id</b> dan bisa dibatalkan dari menu Master SMP.') +
      '</section>' +
      (g.length ? '<div class="split"><section class="card table-card"><div class="table-wrap"><table class="tbl"><thead><tr><th>Ketikan siswa</th><th class="num">Siswa</th><th>Saran master SMP</th><th>Status</th></tr></thead><tbody>' +
        g.map((x, i) => { const s = x.suggestions[0]; const weak = !s || s.score < 50;
          return '<tr class="' + (i === mv.sel ? 'sel' : '') + '"><td><button class="linkbtn" data-g="' + i + '">“' + esc(x.label) + '”</button>' + (x.variants.length > 1 ? '<div class="muted">+' + (x.variants.length - 1) + ' variasi</div>' : '') + '</td>' +
            '<td class="num"><b>' + num(x.count) + '</b></td><td>' + (weak ? '<i class="muted">Tidak ada yang mirip</i>' : esc(s.name) + ' ' + scoreChip(s.score)) + '</td>' +
            '<td>' + (weak ? chip('Perlu SMP baru?', 'red') : chip('Menunggu', 'yellow')) + '</td></tr>'; }).join('') +
        '</tbody></table></div></section><aside id="mPanel"></aside></div>'
        : '<div class="card empty"><b>Semua asal SMP sudah dicocokkan.</b> Laporan per sekolah sudah akurat.</div>');
    $$('[data-g]').forEach((b) => (b.onclick = () => { mv.sel = Number(b.dataset.g); loadMatchPanel(g); $$('#mBody tr').forEach((tr) => tr.classList.remove('sel')); b.closest('tr').classList.add('sel'); }));
    if (g.length) loadMatchPanel(g);
  }

  async function loadMatchPanel(groups) {
    const x = groups[mv.sel];
    const schools = (await api('listSchools')).data || [];
    const chosen = mv.choice[x.key] || (x.suggestions[0] && x.suggestions[0].score >= 50 ? x.suggestions[0].id : '');
    const opt = (s) => '<label class="prio" style="cursor:pointer;background:' + (s.id === chosen ? 'rgba(43,95,173,.08);outline:2px solid #2B5FAD' : '#F5FAFE') + '">' +
      '<input type="radio" name="mSch" value="' + esc(s.id) + '"' + (s.id === chosen ? ' checked' : '') + ' style="accent-color:#2B5FAD;width:18px;height:18px">' +
      '<span class="txt"><b>' + esc(s.name) + '</b>' + esc(s.meta || '') + '</span>' + (s.score != null ? chip(s.score + '%', s.score >= 90 ? 'green' : s.score >= 70 ? 'yellow' : 'red') : '') + '</label>';
    $('#mPanel').innerHTML = '<div class="panel"><div class="panel-head" style="flex-direction:column;align-items:flex-start;gap:4px"><span class="muted" style="font-weight:700;letter-spacing:.04em">KETIKAN SISWA</span>' +
      '<h3 style="font-size:24px">“' + esc(x.label) + '”</h3><span class="muted">' + num(x.count) + ' siswa · variasi: ' + esc(x.variants.join(', ')) + '</span></div>' +
      '<div class="panel-body"><b>Pilih sekolah di master SMP</b><div class="search" style="flex:none">' + svg(I.search) + '<input class="input" id="mFind" type="search" placeholder="Cari di master SMP…" aria-label="Cari di master SMP"></div>' +
      '<div id="mOpts" style="display:flex;flex-direction:column;gap:8px">' + x.suggestions.map(opt).join('') + '</div>' +
      '<div><b class="small">Siswa dengan ketikan ini</b><div class="small muted" style="line-height:1.7;margin-top:4px">' + x.students.map((s) => esc(s.name) + ' · Kelas ' + esc(s.grade) + ' · ' + esc(s.date)).join('<br>') +
      (x.count > x.students.length ? '<br>+ ' + num(x.count - x.students.length) + ' siswa lainnya' : '') + '</div></div>' +
      '<div class="row-flex"><button class="btn btn-primary grow" id="mApply">Cocokkan ' + num(x.count) + ' siswa</button><button class="btn btn-outline" id="mNew">+ SMP baru</button></div></div></div>';
    const bindOpts = () => $$('input[name=mSch]').forEach((r) => (r.onchange = () => { mv.choice[x.key] = r.value; loadMatchPanel(groups); }));
    bindOpts();
    $('#mFind').oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const list = q ? schools.filter((s) => s.name.toLowerCase().indexOf(q) !== -1).slice(0, 6).map((s) => ({ id: s.id, name: s.name, meta: [s.district, s.city].filter(Boolean).join(' · ') })) : x.suggestions;
      $('#mOpts').innerHTML = list.length ? list.map(opt).join('') : '<p class="muted small">Tidak ditemukan. Gunakan “+ SMP baru”.</p>';
      bindOpts();
    };
    $('#mApply').onclick = async (e) => {
      const pickEl = $('input[name=mSch]:checked');
      if (!pickEl) return toast('Pilih sekolah dulu.', true);
      busy(e.currentTarget, true, 'Mencocokkan…');
      const r = await apiOrToast('applyMatch', { key: x.key, school_id: pickEl.value });
      busy(e.currentTarget, false);
      if (r.success) { toast(r.message); loadMatch(); A.refreshBadges(); }
    };
    $('#mNew').onclick = () => schoolModal({ name: x.label }, async (res) => {
      const r = await apiOrToast('applyMatch', { key: x.key, school_id: res.id });
      if (r.success) { toast('SMP baru dibuat dan ' + r.message); loadMatch(); A.refreshBadges(); }
    });
  }

  // =====================================================================
  // TAHAP 5 — KUNJUNGAN & KEGIATAN
  // =====================================================================
  async function kunjungan(main) {
    main.innerHTML = head('Kunjungan & Kegiatan', 'Jadwal dan riwayat kunjungan ke SMP serta kegiatan pengenalan sekolah.',
      '<button class="btn btn-outline" id="addAct">' + svg(I.plus) + 'Kegiatan</button><button class="btn btn-primary" id="addVis">' + svg(I.plus) + 'Catat kunjungan</button>') +
      '<section class="grid cols-2"><div class="card table-card" id="visTbl"></div><div class="card" id="actList"></div></section>';
    const [v, a, s] = await Promise.all([api('listVisits'), api('listActivities'), api('listSchools')]);
    $('#addVis').onclick = () => visitModal(s.data || [], () => kunjungan(main));
    $('#addAct').onclick = () => activityModal(() => kunjungan(main));
    $('#visTbl').innerHTML = '<div style="padding:20px 20px 8px"><h2>Riwayat kunjungan</h2><p class="sub">Jumlah formulir dihitung otomatis dari siswa SMP tersebut yang mengisi di tanggal kunjungan.</p></div>' +
      (v.success && v.data.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Tanggal</th><th>SMP</th><th>Kegiatan</th><th>Petugas</th><th class="num">Formulir</th><th class="num">A + B</th></tr></thead><tbody>' +
        v.data.map((x) => '<tr><td>' + esc(x.dateLabel) + '</td><td><b>' + esc(x.school) + '</b></td><td>' + esc(x.activity) + '</td><td class="muted">' + esc(x.officer) + '</td><td class="num">' + num(x.forms) + '</td><td class="num">' + (x.abPct == null ? '—' : chip(x.abPct + '%', 'yellow')) + '</td></tr>').join('') +
        '</tbody></table></div>' : '<div class="empty">Belum ada kunjungan tercatat.</div>');
    $('#actList').innerHTML = '<h2>Kegiatan pengenalan</h2><p class="sub">Open House, tur sekolah, demo ekstrakurikuler</p>' +
      (a.success && a.data.length ? a.data.map((x) => '<div class="prio" style="margin-bottom:8px"><span class="score" style="font-size:12px;line-height:1.1;text-align:center">' + esc(x.dateLabel.split(' ').slice(0, 2).join(' ')) + '</span><div class="txt"><b>' + esc(x.name) + '</b>' + esc(x.location) + (x.description ? ' · ' + esc(x.description) : '') + '</div></div>').join('')
        : '<p class="empty">Belum ada kegiatan.</p>');
  }

  function visitModal(schools, done) {
    if (!schools.length) return toast('Tambahkan SMP di Master SMP terlebih dahulu.', true);
    openModal('Catat kunjungan',
      '<div class="form-grid"><div class="field"><label for="vDate">Tanggal *</label><input class="input" type="date" id="vDate" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
      '<div class="field"><label for="vSch">SMP *</label><select class="input" id="vSch">' + schools.map((s) => '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>').join('') + '</select></div></div>' +
      '<div class="form-grid"><div class="field"><label for="vAct">Kegiatan</label><input class="input" id="vAct" placeholder="Sosialisasi kelas IX"></div>' +
      '<div class="field"><label for="vOff">Petugas</label><input class="input" id="vOff" value="' + esc(A.state.user.name) + '"></div></div>' +
      '<div class="field"><label for="vNotes">Catatan</label><textarea class="input" id="vNotes"></textarea></div><button class="btn btn-primary" id="vSave">Simpan kunjungan</button>', (m) => {
        $('#vSave', m).onclick = async (e) => {
          busy(e.currentTarget, true);
          const r = await apiOrToast('saveVisit', { date: $('#vDate', m).value, school_id: $('#vSch', m).value, activity: $('#vAct', m).value, officer: $('#vOff', m).value, notes: $('#vNotes', m).value });
          busy(e.currentTarget, false);
          if (r.success) { toast(r.message); closeModal(); done(); }
        };
      });
  }
  function activityModal(done) {
    openModal('Tambah kegiatan pengenalan',
      '<div class="form-grid"><div class="field"><label for="aName">Nama kegiatan *</label><input class="input" id="aName" placeholder="Open House"></div>' +
      '<div class="field"><label for="aDate">Tanggal *</label><input class="input" type="date" id="aDate"></div></div>' +
      '<div class="field"><label for="aLoc">Lokasi</label><input class="input" id="aLoc"></div><div class="field"><label for="aDesc">Deskripsi</label><textarea class="input" id="aDesc"></textarea></div>' +
      '<button class="btn btn-primary" id="aSave">Simpan kegiatan</button>', (m) => {
        $('#aSave', m).onclick = async (e) => {
          busy(e.currentTarget, true);
          const r = await apiOrToast('saveActivity', { name: $('#aName', m).value, date: $('#aDate', m).value, location: $('#aLoc', m).value, description: $('#aDesc', m).value });
          busy(e.currentTarget, false);
          if (r.success) { toast(r.message); closeModal(); done(); }
        };
      });
  }

  // =====================================================================
  // TAHAP 6 — LAPORAN, GRAFIK, EKSPOR
  // =====================================================================
  let lastReport = null, repTab = 'smp';
  async function laporan(main, u) {
    const r = await api('report');
    if (!r.success) return errorView(main, r);
    const d = lastReport = r.data;
    main.innerHTML = head('Laporan & Analisis SMP', 'Bandingkan minat antar sekolah dan tentukan prioritas kunjungan berikutnya. Data per ' + esc(d.generatedAt) + '.',
      '<button class="btn btn-secondary" id="pdf">' + svg(I.print) + 'Ekspor PDF + grafik</button><button class="btn btn-primary" id="xls">' + svg(I.download) + (can('sa ko') ? 'Ekspor Excel per SMP' : 'Ekspor Excel ringkasan') + '</button>') +
      '<div class="row-flex" style="justify-content:space-between"><div class="seg gold" role="tablist" aria-label="Jenis laporan">' +
        [['smp', 'Per SMP'], ['program', 'Program & minat'], ['kunjungan', 'Kunjungan'], ['tindak', 'Tindak lanjut']].map((t) => '<button role="tab" data-t="' + t[0] + '" aria-pressed="' + (repTab === t[0]) + '" aria-selected="' + (repTab === t[0]) + '">' + t[1] + '</button>').join('') + '</div>' +
        (u.role === 'pimpinan' ? '<span class="chip yellow">Akun Pimpinan melihat data agregat, tanpa nama siswa</span>' : '') + '</div>' +
      (d.unmatchedStudents ? alertBox('<b>' + num(d.unmatchedStudents) + ' siswa</b> belum dicocokkan ke master SMP dan ditampilkan menurut ketikan aslinya.' + (can('sa ko') ? ' <a href="#/cocok">Cocokkan sekarang</a>.' : ''), 'warn') : '') +
      '<div id="repBody"></div>';
    $$('[data-t]').forEach((b) => (b.onclick = () => { repTab = b.dataset.t; $$('[data-t]').forEach((x) => { x.setAttribute('aria-pressed', x === b); x.setAttribute('aria-selected', x === b); }); renderReportTab(); }));
    $('#xls').onclick = (e) => exportExcel(e.currentTarget);
    $('#pdf').onclick = () => exportPdf();
    renderReportTab();
  }

  function renderReportTab() {
    const d = lastReport, box = $('#repBody');
    A.state.charts.forEach((c) => c.destroy()); A.state.charts.length = 0;
    const legend = '<div class="legend">' + ['A', 'B', 'C', 'D'].map((k) => '<span><i style="background:' + CAT_COLOR[k] + '"></i>' + k + ' ' + CAT_TXT[k] + '</span>').join('') + '</div>';
    if (repTab === 'smp') {
      const list = d.perSchool.slice(0, 15), max = Math.max.apply(null, list.map((p) => p.total).concat([1]));
      box.innerHTML = '<section class="grid cols-2"><div class="card"><h2>Perbandingan minat antar SMP</h2><p class="sub">Jumlah calon siswa per kategori A–D</p>' + legend +
        '<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">' + list.map((p) => '<div class="stack-row"><b>' + esc(p.name) + (p.matched ? '' : ' <span class="chip yellow">ketikan</span>') + '</b>' +
          '<div class="stack" style="width:' + (100 * p.total / max) + '%" role="img" aria-label="' + esc(p.name) + ': A ' + p.A + ', B ' + p.B + ', C ' + p.C + ', D ' + p.D + '">' + ['A', 'B', 'C', 'D'].map((k) => p[k] ? '<i class="' + k + '" style="flex:' + p[k] + '">' + (p[k] / p.total > .12 ? p[k] : '') + '</i>' : '').join('') + '</div>' +
          '<b class="num" style="text-align:right">' + num(p.total) + '</b></div>').join('') + '</div></div>' +
        '<div class="card"><h2>Prioritas kunjungan berikutnya</h2><p class="sub">Banyak siswa B & C, banyak kelas VIII, dan belum sering dikunjungi</p><div style="display:flex;flex-direction:column;gap:8px">' +
        (d.priority.length ? d.priority.map((p, i) => '<div class="prio ' + (i ? '' : 'top') + '"><span class="score">' + p.score + '</span><div class="txt"><b>' + esc(p.name) + ' · ' + esc(p.level) + '</b>' + esc(p.reason) + '</div></div>').join('')
          : '<p class="muted small">Cocokkan asal SMP terlebih dahulu agar prioritas bisa dihitung.</p>') + '</div></div></section>' +
        '<section class="card table-card"><div style="padding:20px 20px 8px"><h2>Rekap per SMP</h2></div><div class="table-wrap"><table class="tbl"><thead><tr><th>SMP</th><th class="num">Total</th><th class="num">A</th><th class="num">B</th><th class="num">C</th><th class="num">D</th><th class="num">A+B</th><th class="num">VII/VIII/IX</th><th>Program teratas</th><th class="num">Kunjungan</th></tr></thead><tbody>' +
        d.perSchool.map((p) => '<tr><td><b>' + esc(p.name) + '</b></td><td class="num"><b>' + p.total + '</b></td><td class="num">' + p.A + '</td><td class="num">' + p.B + '</td><td class="num">' + p.C + '</td><td class="num">' + p.D + '</td><td class="num">' + p.abPct + '%</td><td class="num">' + (p.grades.VII || 0) + '/' + (p.grades.VIII || 0) + '/' + (p.grades.IX || 0) + '</td><td>' + esc(p.topProgram) + '</td><td class="num">' + p.visits + '</td></tr>').join('') +
        '</tbody></table></div></section>';
    } else if (repTab === 'program') {
      box.innerHTML = '<section class="grid cols-3"><div class="card"><h2>Program yang diminati</h2><p class="sub">No. 9 · boleh lebih dari satu</p><div class="chart-box tall"><canvas id="rProg" role="img" aria-label="Grafik program diminati"></canvas></div></div>' +
        '<div class="card"><h2>Pertimbangan memilih SMA</h2><p class="sub">No. 8</p>' + hbars(d.considerations.slice(0, 8)) + '</div>' +
        '<div class="card"><h2>Informasi yang dicari</h2><p class="sub">No. 10 — bahan materi promosi</p>' + hbars(d.info.slice(0, 8)) + '</div>' +
        '<div class="card"><h2>Tingkat ketertarikan</h2><p class="sub">No. 7</p><div class="chart-box"><canvas id="rCat" role="img" aria-label="Grafik kategori minat"></canvas></div></div>' +
        '<div class="card"><h2>Rencana setelah SMP</h2><p class="sub">No. 4</p>' + hbars(d.plans) + '</div>' +
        '<div class="card"><h2>Per kelas</h2><p class="sub">No. 3</p><div class="chart-box"><canvas id="rGrade" role="img" aria-label="Grafik per kelas"></canvas></div></div></section>';
      chart($('#rProg'), { type: 'bar', data: { labels: d.programs.map((p) => p.label), datasets: [{ data: d.programs.map((p) => p.n), backgroundColor: d.programs.map((p, i) => (i ? '#2B5FAD' : '#F0C419')), borderRadius: 8 }] },
        options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { grid: { display: false } } } } });
      chart($('#rCat'), { type: 'doughnut', data: { labels: ['A ' + CAT_TXT.A, 'B ' + CAT_TXT.B, 'C ' + CAT_TXT.C, 'D ' + CAT_TXT.D], datasets: [{ data: ['A', 'B', 'C', 'D'].map((k) => d.cats[k] || 0), backgroundColor: ['#F0C419', '#2B5FAD', '#9B6FD1', '#C5CCD8'], borderWidth: 2 }] },
        options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } } });
      chart($('#rGrade'), { type: 'bar', data: { labels: ['VII', 'VIII', 'IX'], datasets: [{ data: [d.grades.VII || 0, d.grades.VIII || 0, d.grades.IX || 0], backgroundColor: ['#BFE6FB', '#2B5FAD', '#F0C419'], borderRadius: 12 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } } });
    } else if (repTab === 'kunjungan') {
      box.innerHTML = '<section class="card table-card"><div style="padding:20px 20px 8px"><h2>Hasil kegiatan kunjungan</h2><p class="sub">Formulir dihitung dari siswa SMP tersebut yang mengisi pada tanggal kunjungan</p></div>' +
        (d.visits.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Tanggal</th><th>SMP</th><th>Kegiatan</th><th class="num">Formulir</th><th class="num">A + B</th></tr></thead><tbody>' +
          d.visits.map((v) => '<tr><td>' + esc(v.dateLabel) + '</td><td><b>' + esc(v.school) + '</b></td><td>' + esc(v.activity) + '</td><td class="num">' + num(v.forms) + '</td><td class="num">' + (v.abPct == null ? '—' : v.abPct + '%') + '</td></tr>').join('') +
          '</tbody></table></div>' : '<div class="empty">Belum ada kunjungan tercatat.</div>') + '</section>' +
        '<section class="card"><h2>Formulir per kunjungan</h2><div class="chart-box"><canvas id="rVis" role="img" aria-label="Grafik formulir per kunjungan"></canvas></div></section>';
      chart($('#rVis'), { type: 'bar', data: { labels: d.visits.map((v) => v.school + ' (' + v.dateLabel + ')').reverse(), datasets: [{ label: 'Formulir', data: d.visits.map((v) => v.forms).reverse(), backgroundColor: '#2B5FAD', borderRadius: 8 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
    } else {
      box.innerHTML = '<section class="grid cols-2"><div class="card"><h2>Status tindak lanjut</h2><p class="sub">Seluruh calon siswa</p><div class="chart-box tall"><canvas id="rFun" role="img" aria-label="Grafik status tindak lanjut"></canvas></div></div>' +
        '<div class="card"><h2>Ringkasan</h2>' + hbars(d.funnel.filter((f) => f.n).sort((a, b) => b.n - a.n)) + '</div></section>';
      chart($('#rFun'), { type: 'bar', data: { labels: d.funnel.map((f) => f.label), datasets: [{ data: d.funnel.map((f) => f.n), backgroundColor: d.funnel.map((f) => (/Mendaftar|Hadir/.test(f.label) ? '#1D6B40' : /Perlu/.test(f.label) ? '#B4235A' : /Tanpa|Tidak ada/.test(f.label) ? '#C5CCD8' : '#2B5FAD')), borderRadius: 8 }] },
        options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } } });
    }
  }

  function safeSheet(name, used) {
    let n = String(name || 'Sheet').replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 28).trim() || 'Sheet';
    let k = n, i = 2;
    while (used[k.toLowerCase()]) k = n.slice(0, 25) + ' ' + i++;
    used[k.toLowerCase()] = 1;
    return k;
  }

  /** Excel: ringkasan per SMP + seluruh isian formulir dikelompokkan per sekolah asal (PRD bag. 7). */
  async function exportExcel(btn) {
    if (!window.XLSX) return toast('Pustaka Excel gagal dimuat. Periksa koneksi internet.', true);
    busy(btn, true, 'Menyiapkan Excel…');
    try {
      const rep = lastReport || (await api('report')).data;
      const wb = XLSX.utils.book_new(), used = {};
      const summary = rep.perSchool.map((p) => ({ 'Asal SMP': p.name, 'Status nama': p.matched ? 'Master SMP' : 'Ketikan (belum dicocokkan)', 'Total': p.total,
        'A Sangat tertarik': p.A, 'B Tertarik': p.B, 'C Ingin tahu': p.C, 'D Belum tertarik': p.D, '% A+B': p.abPct,
        'Kelas VII': p.grades.VII || 0, 'Kelas VIII': p.grades.VIII || 0, 'Kelas IX': p.grades.IX || 0, 'Program teratas': p.topProgram, 'Kunjungan': p.visits }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), safeSheet('Ringkasan per SMP', used));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rep.programs.map((p) => ({ 'Program': p.label, 'Jumlah siswa': p.n }))), safeSheet('Program diminati', used));
      if (can('sa ko')) {
        const r = await api('exportData');
        if (!r.success) throw new Error(r.message);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.data.rows), safeSheet('Semua isian', used));
        const by = {};
        r.data.rows.forEach((row) => { const k = row['Asal SMP (master)'] === '(belum dicocokkan)' ? row['Asal SMP (ketikan siswa)'] : row['Asal SMP (master)']; (by[k] = by[k] || []).push(row); });
        Object.keys(by).sort((a, b) => by[b].length - by[a].length).forEach((k) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(by[k]), safeSheet(k, used)));
      }
      XLSX.writeFile(wb, 'Laporan SPMB Minat Siswa ' + new Date().toISOString().slice(0, 10) + '.xlsx');
      toast('File Excel diunduh.');
    } catch (e) { toast('Gagal membuat Excel: ' + e.message, true); }
    busy(btn, false);
  }

  /** PDF: halaman laporan siap cetak (pilih "Simpan sebagai PDF" di dialog cetak). */
  async function exportPdf() {
    const d = lastReport;
    const prevTab = repTab, imgs = {};
    for (const t of ['program', 'tindak']) { repTab = t; renderReportTab(); await new Promise((r) => setTimeout(r, 450)); $$('#repBody canvas').forEach((c) => (imgs[c.id] = c.toDataURL('image/png'))); }
    repTab = prevTab; renderReportTab();
    const img = (id, w) => imgs[id] ? '<img src="' + imgs[id] + '" style="width:' + (w || 100) + '%">' : '';
    const tbl = (rows, cols) => '<table><thead><tr>' + cols.map((c) => '<th>' + c[0] + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + cols.map((c) => '<td>' + esc(c[1](r)) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    printHtml('<div class="report-print"><h1>Laporan Minat Calon Siswa — SMA Triguna 1956</h1><p>' + esc(d.period) + ' · dibuat ' + esc(d.generatedAt) + ' · total ' + num(d.total) + ' siswa · A ' + d.cats.A + ' · B ' + d.cats.B + ' · C ' + d.cats.C + ' · D ' + d.cats.D + '</p>' +
      '<h2>Tingkat ketertarikan & program diminati</h2><div style="display:flex;gap:6mm;align-items:center"><div style="width:40%">' + img('rCat') + '</div><div style="width:60%">' + img('rProg') + '</div></div>' +
      '<h2>Rekap per SMP</h2>' + tbl(d.perSchool, [['SMP', (p) => p.name], ['Total', (p) => p.total], ['A', (p) => p.A], ['B', (p) => p.B], ['C', (p) => p.C], ['D', (p) => p.D], ['% A+B', (p) => p.abPct + '%'], ['Program teratas', (p) => p.topProgram], ['Kunjungan', (p) => p.visits]]) +
      '<h2>Prioritas kunjungan berikutnya</h2>' + tbl(d.priority, [['SMP', (p) => p.name], ['Skor', (p) => p.score], ['Prioritas', (p) => p.level], ['Alasan', (p) => p.reason]]) +
      '<h2>Hasil kunjungan</h2>' + (d.visits.length ? tbl(d.visits, [['Tanggal', (v) => v.dateLabel], ['SMP', (v) => v.school], ['Kegiatan', (v) => v.activity], ['Formulir', (v) => v.forms], ['A+B', (v) => (v.abPct == null ? '—' : v.abPct + '%')]]) : '<p>Belum ada kunjungan.</p>') +
      '<h2>Status tindak lanjut</h2><div style="width:80%">' + img('rFun') + '</div></div>', 'A4 portrait');
    toast('Pilih “Simpan sebagai PDF” pada dialog cetak.');
  }

  // =====================================================================
  // TAHAP 7 — CETAK KARTU A5 & QR
  // =====================================================================
  async function cetak(main) {
    const r = await api('printConfig');
    const formUrl = (r.success && r.data.formUrl) || location.href.replace(/admin\.html.*$/, '');
    main.innerHTML = head('Cetak Kartu & QR', 'QR Code berisi tautan langsung ke formulir. Satu QR yang sama dipakai untuk semua kunjungan.',
      '<button class="btn btn-outline" id="dlQr">' + svg(I.download) + 'Unduh QR (PNG)</button><button class="btn btn-secondary" id="prPoster">' + svg(I.print) + 'Cetak poster QR</button>' +
      '<button class="btn btn-primary" id="prCard">' + svg(I.print) + 'Cetak kartu A5</button>') +
      (r.success && !r.data.formUrl ? alertBox('Alamat formulir belum diisi di Pengaturan (FORM_URL). Sementara memakai alamat halaman ini: <b>' + esc(formUrl) + '</b>', 'warn') : '') +
      '<div class="filterbar"><label for="copies" class="small" style="font-weight:700">Jumlah kartu dicetak</label><input class="input" id="copies" type="number" min="1" max="200" value="30" style="width:100px">' +
      '<span class="small muted grow">Kartu untuk siswa yang tidak membawa HP. Isian tangan dimasukkan petugas lewat Data Siswa → Input dari kartu cetak.</span></div>' +
      '<div class="print-preview"><div id="cardPrev">' + a5Card() + '</div><div class="qr-poster" id="poster"><div class="logo big"><span>T56</span></div><h3>Kenalan dengan SMA Triguna 1956</h3>' +
      '<p class="muted small" style="margin:0">Scan untuk mengisi Kartu Minat · 2 menit · tidak mengikat</p><div class="qr-box" id="qrBig"></div><p class="small" style="word-break:break-all;margin:0">' + esc(formUrl) + '</p></div></div>';
    makeQr($('#qrBig'), formUrl, 440);
    makeQr($('#cardPrev .a5-qr'), formUrl, 160);
    $('#dlQr').onclick = () => {
      const c = $('#qrBig canvas'), im = $('#qrBig img');
      const a = document.createElement('a'); a.download = 'QR Formulir Minat SMA Triguna.png';
      a.href = c ? c.toDataURL('image/png') : im.src; a.click();
    };
    $('#prCard').onclick = () => {
      const n = Math.min(200, Math.max(1, Number($('#copies').value) || 1));
      const html = Array.from({ length: n }, () => a5Card()).join('');
      $('#printArea').innerHTML = html;
      $$('#printArea .a5-qr').forEach((el) => makeQr(el, formUrl, 160));
      setTimeout(() => printHtml(null, 'A5 portrait'), 400);
    };
    $('#prPoster').onclick = () => {
      const src = ($('#qrBig canvas') && $('#qrBig canvas').toDataURL()) || ($('#qrBig img') && $('#qrBig img').src);
      printHtml('<div style="text-align:center;padding:30mm 15mm;font-family:Poppins,sans-serif;color:#12213D"><h1 style="font-family:\'Baloo 2\',sans-serif;font-size:40pt;line-height:1;margin:0">Kenalan dengan<br>SMA Triguna 1956</h1>' +
        '<p style="font-size:16pt;margin:8mm 0">Scan untuk mengisi Kartu Minat — 2 menit, tidak mengikat</p><img src="' + src + '" style="width:110mm;height:110mm"><p style="font-size:11pt;margin-top:8mm">' + esc(formUrl) + '</p></div>', 'A4 portrait');
    };
  }

  function makeQr(el, text, size) {
    if (!el) return;
    el.innerHTML = '';
    if (!window.QRCode) { el.innerHTML = '<span class="small">[QR]</span>'; return; }
    new QRCode(el, { text: text, width: size, height: size, colorDark: '#12213D', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M });
  }

  function a5Card() {
    const q = (title, opts, multi) => '<div class="q' + (multi ? ' multi' : '') + '"><b>' + title + '</b>' + opts.map((o) => '<span>' + esc(typeof o === 'string' ? o : o.value) + '</span>').join('') + '</div>';
    return '<div class="a5"><div class="a5-head"><div class="logo"><span>T56</span></div><div><h3>KARTU MINAT CALON SISWA</h3><p>SMA Triguna 1956 Jakarta · tidak mengikat untuk mendaftar</p></div><div class="a5-qr"></div></div>' +
      '<div class="a5-id"><div class="line">1. Nama lengkap <i></i></div><div class="line">2. Asal SMP <i></i> 3. Kelas&nbsp; ○ VII&nbsp; ○ VIII&nbsp; ○ IX</div></div>' +
      '<div class="a5-cols"><div><span class="sec">B. RENCANA PENDIDIKAN</span>' + q('4. Rencana setelah lulus SMP', O.education_plan) + q('5. Sudah punya sekolah tujuan?', O.target_school_status) +
      q('6. SMA Triguna termasuk yang dipertimbangkan?', O.triguna_consideration) + '<span class="sec">C. MINAT & KETERTARIKAN</span>' + q('7. Seberapa tertarik mengenal SMA Triguna?', O.interest_level) +
      q('8. Yang dipertimbangkan memilih SMA (boleh >1)', O.school_considerations, true) + '</div><div>' + q('9. Program yang menarik (boleh >1)', O.favorite_programs, true) +
      '<span class="sec">D. INFORMASI</span>' + q('10. Info yang ingin diketahui (boleh >1)', O.needed_information, true) + q('11. Ikut kegiatan pengenalan sekolah?', O.introduction_interest) +
      '<span class="sec">E. KONTAK & PERSETUJUAN</span><div class="a5-id" style="padding:0"><div class="line">12. Ortu/wali <i></i></div><div class="line">13. WA ortu/wali <i></i></div></div>' +
      q('14. Bersedia menerima info kegiatan & SPMB?', O.consent) + '</div></div>' +
      '<div class="a5-foot"><span>Diisi petugas · Nama: ______________</span><span>Tgl: ____/____/______</span></div></div>';
  }

  // =====================================================================
  // TAHAP 8 — ANALISIS AI
  // =====================================================================
  function md(text) {
    const lines = esc(text).split('\n'); let out = '', inList = false;
    lines.forEach((l) => {
      const t = l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<i>$2</i>');
      if (/^\s*[-*•]\s+/.test(l)) { if (!inList) { out += '<ul>'; inList = true; } out += '<li>' + t.replace(/^\s*[-*•]\s+/, '') + '</li>'; return; }
      if (inList) { out += '</ul>'; inList = false; }
      if (/^#{1,4}\s/.test(l)) out += '<h3>' + t.replace(/^#{1,4}\s/, '') + '</h3>';
      else if (l.trim()) out += '<p style="margin:6px 0">' + t + '</p>';
    });
    return out + (inList ? '</ul>' : '');
  }

  async function ai(main) {
    const r = await api('aiList');
    if (!r.success) return errorView(main, r);
    const d = r.data;
    if (A.state.navBadges.aiOff === d.enabled) A.refreshBadges();
    main.innerHTML = head('Analisis AI', 'Rekomendasi untuk tim SPMB dari data agregat. AI tidak mengubah jawaban siswa dan tidak menentukan penerimaan.') +
      '<section class="grid cols-2"><div class="card ai-card"><span class="sticker" style="background:#F4A8C0;color:#12213D">' + (d.enabled ? 'Aktif · ' + esc(d.provider) + ' / ' + esc(d.model) : 'Belum aktif') + '</span>' +
        '<h2 style="margin-top:10px">Insight AI untuk tim SPMB</h2><p class="sub">Hanya data agregat yang dikirim (jumlah per kategori, sekolah, program, kunjungan) — tanpa nama siswa dan tanpa kontak.</p>' +
        (d.enabled && can('sa ko') ? '<div class="field"><label for="aiScope" style="color:#fff">Jenis analisis</label><select class="input" id="aiScope">' + Object.keys(d.scopes).map((k) => '<option value="' + k + '">' + esc(d.scopes[k].charAt(0).toUpperCase() + d.scopes[k].slice(1)) + '</option>').join('') + '</select></div>' +
          '<button class="btn btn-primary" id="aiGo" style="margin-top:12px">' + svg(I.spark) + 'Buat analisis</button>'
          : !d.enabled ? '<p style="color:#DCE3F0;font-size:14px;line-height:1.6">Untuk mengaktifkan: Super Admin mengisi kunci API di <b>Script Properties</b> (AI_API_KEY) di editor Apps Script, lalu mengubah <b>AI_ENABLED</b> menjadi TRUE di menu Pengaturan.' + (d.keySet ? '' : ' Kunci API belum diisi.') + '</p>' : '') +
        '</div><div class="card" id="aiOut"><h2>Hasil terbaru</h2>' + (d.items[0] ? '<p class="sub">' + esc(d.items[0].at) + ' · ' + esc(d.items[0].scope) + '</p><div class="ai-out">' + md(d.items[0].summary) + '</div>' : '<p class="empty">Belum ada analisis.</p>') + '</div></section>' +
      (d.items.length > 1 ? '<section class="card"><h2>Riwayat analisis</h2><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">' + d.items.slice(1).map((x, i) => '<details><summary style="cursor:pointer;font-weight:600">' + esc(x.at) + ' · ' + esc(x.scope) + ' · ' + esc(x.model) + '</summary><div class="ai-out">' + md(x.summary) + '</div></details>').join('') + '</div></section>' : '');
    if ($('#aiGo')) $('#aiGo').onclick = async (e) => {
      busy(e.currentTarget, true, 'Menganalisis… (±30 detik)');
      const x = await apiOrToast('aiGenerate', { scope: $('#aiScope').value });
      busy(e.currentTarget, false);
      if (x.success) { toast(x.message); ai(main); }
    };
  }

  // =====================================================================
  // PENGATURAN & AKUN (Super Admin)
  // =====================================================================
  async function pengaturan(main) {
    const [us, st] = await Promise.all([api('listUsers'), api('getSettings')]);
    if (!us.success) return errorView(main, us);
    const s = st.data || {};
    const fld = (k, label, hint, type) => '<div class="field"><label for="s_' + k + '">' + label + '</label>' + (type === 'bool'
      ? '<select class="input" id="s_' + k + '"><option value="TRUE"' + (String(s[k]).toUpperCase() === 'TRUE' ? ' selected' : '') + '>TRUE — aktif</option><option value="FALSE"' + (String(s[k]).toUpperCase() !== 'TRUE' ? ' selected' : '') + '>FALSE — nonaktif</option></select>'
      : type === 'provider' ? '<select class="input" id="s_' + k + '"><option' + (s[k] === 'anthropic' ? ' selected' : '') + '>anthropic</option><option' + (s[k] === 'gemini' ? ' selected' : '') + '>gemini</option></select>'
      : '<input class="input" id="s_' + k + '" value="' + esc(s[k] || '') + '">') + (hint ? '<span class="small muted">' + hint + '</span>' : '') + '</div>';
    main.innerHTML = head('Pengaturan & Akun', 'Kelola akun petugas dan setelan aplikasi. Perubahan langsung tersimpan di sheet USERS dan SETTINGS.',
      '<button class="btn btn-primary" id="addUser">' + svg(I.plus) + 'Tambah akun</button>') +
      '<section class="card table-card"><div style="padding:20px 20px 8px"><h2>Akun & hak akses</h2><p class="sub">Petugas masuk dengan akun Google yang terdaftar di sini.</p></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Email</th><th>Nama</th><th>Peran</th><th>Status</th><th></th></tr></thead><tbody>' +
      us.data.map((x) => '<tr><td>' + esc(x.email) + '</td><td><b>' + esc(x.name) + '</b></td><td>' + chip(A.ROLE_LABEL[x.role] || x.role, x.role === 'super_admin' ? 'yellow' : 'blue') + '</td><td>' + (x.active ? chip('Aktif', 'green') : chip('Nonaktif', '')) + '</td><td><button class="btn btn-sm btn-outline" data-u="' + esc(x.email) + '">Ubah</button></td></tr>').join('') +
      '</tbody></table></div></section>' +
      '<section class="card"><h2>Setelan aplikasi</h2><p class="sub">Disimpan di sheet SETTINGS</p><div class="form-grid">' +
        fld('FORM_OPEN', 'Formulir siswa', 'FALSE di luar masa SPMB', 'bool') + fld('PERIOD_LABEL', 'Label periode') + fld('FORM_URL', 'Alamat formulir (untuk QR)', 'Contoh: https://username.github.io/minat-calon-siswa/') +
        fld('FORM_CLOSED_MESSAGE', 'Pesan saat formulir ditutup') + fld('GOOGLE_CLIENT_ID', 'Google OAuth Client ID') + fld('ALLOWED_DOMAIN', 'Domain Google Workspace sekolah', 'Kosongkan bila belum memakai Workspace') +
        fld('AI_ENABLED', 'Analisis AI', s._aiKeySet ? 'Kunci API sudah diisi' : 'Kunci API (AI_API_KEY) belum diisi di Script Properties', 'bool') + fld('AI_PROVIDER', 'Penyedia AI', '', 'provider') +
        fld('AI_MODEL', 'Model AI', 'Contoh: claude-sonnet-5-5 atau gemini-2.5-flash') + fld('VISIT_TARGET_PER_SCHOOL', 'Target kunjungan per SMP') +
      '</div><button class="btn btn-primary" id="saveSet" style="margin-top:16px">Simpan setelan</button></section>';
    $('#addUser').onclick = () => userModal({ active: true, role: 'petugas' }, () => pengaturan(main));
    $$('[data-u]').forEach((b) => (b.onclick = () => userModal(us.data.find((x) => x.email === b.dataset.u), () => pengaturan(main))));
    $('#saveSet').onclick = async (e) => {
      const values = {};
      ['FORM_OPEN', 'PERIOD_LABEL', 'FORM_URL', 'FORM_CLOSED_MESSAGE', 'GOOGLE_CLIENT_ID', 'ALLOWED_DOMAIN', 'AI_ENABLED', 'AI_PROVIDER', 'AI_MODEL', 'VISIT_TARGET_PER_SCHOOL'].forEach((k) => (values[k] = $('#s_' + k).value.trim()));
      busy(e.currentTarget, true);
      const r = await apiOrToast('saveSettings', { values: values });
      busy(e.currentTarget, false);
      if (r.success) { toast(r.message); A.refreshBadges(); }
    };
  }

  function userModal(u, done) {
    openModal(u.email ? 'Ubah akun' : 'Tambah akun',
      '<div class="field"><label for="uEmail">Email Google *</label><input class="input" id="uEmail" type="email" value="' + esc(u.email || '') + '"' + (u.email ? ' readonly' : '') + '></div>' +
      '<div class="field"><label for="uName">Nama</label><input class="input" id="uName" value="' + esc(u.name || '') + '"></div>' +
      '<div class="form-grid"><div class="field"><label for="uRole">Peran</label><select class="input" id="uRole">' + Object.keys(A.ROLE_LABEL).map((k) => '<option value="' + k + '"' + (u.role === k ? ' selected' : '') + '>' + A.ROLE_LABEL[k] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="uAct">Status</label><select class="input" id="uAct"><option value="1"' + (u.active ? ' selected' : '') + '>Aktif</option><option value="0"' + (!u.active ? ' selected' : '') + '>Nonaktif</option></select></div></div>' +
      '<p class="small muted" style="margin:0"><b>Super Admin</b>: semua menu · <b>Koordinator</b>: seluruh data, follow-up, SMP, laporan · <b>Petugas</b>: siswa yang ditugaskan · <b>Pimpinan</b>: dashboard & laporan agregat tanpa nama siswa.</p>' +
      '<button class="btn btn-primary" id="uSave">Simpan akun</button>', (m) => {
        $('#uSave', m).onclick = async (e) => {
          busy(e.currentTarget, true);
          const r = await apiOrToast('saveUser', { email: $('#uEmail', m).value.trim(), name: $('#uName', m).value.trim(), role: $('#uRole', m).value, active: $('#uAct', m).value === '1' });
          busy(e.currentTarget, false);
          if (r.success) { toast(r.message); closeModal(); done(); }
        };
      });
  }

  window.PAGES = { dashboard, siswa, followup, laporan, smp, cocok, kunjungan, cetak, ai, pengaturan };
})();
