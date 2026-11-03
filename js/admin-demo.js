/**
 * MODE DEMO panel petugas — backend tiruan di browser dengan data simulasi.
 * Aktif otomatis selama GAS_URL di js/config.js belum diisi.
 * Bentuk respons sama dengan Admin.gs, jadi tampilan yang dicoba di sini
 * sama dengan tampilan saat sudah tersambung ke Google Sheets.
 */
(function () {
  const cfg = window.APP_CONFIG;
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const some = (a) => { const o = a.filter(() => rnd() < 0.3); const p = pick(a); if (o.indexOf(p) === -1) o.push(p); return o; };
  const DAY = 86400000;
  const fmt = (d, long) => { const dt = new Date(d); const m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][dt.getMonth()];
    return dt.getDate() + ' ' + m + (long ? ' ' + dt.getFullYear() : ''); };
  const iso = (d) => { const dt = new Date(d); return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); };
  const ok = (data, message) => ({ success: true, data: data, message: message || '' });
  const fail = (m, x) => Object.assign({ success: false, message: m }, x || {});

  const STATUSES = ['Perlu dihubungi', 'Info terkirim', 'Sudah dihubungi', 'Diundang Open House', 'Hadir Open House', 'Mendaftar', 'Tidak merespons'];
  const BOARD = [
    { key: 'perlu', title: 'Perlu dihubungi', statuses: ['Perlu dihubungi'] },
    { key: 'info', title: 'Sudah dihubungi', statuses: ['Info terkirim', 'Sudah dihubungi', 'Tidak merespons'] },
    { key: 'oh', title: 'Diundang Open House', statuses: ['Diundang Open House'] },
    { key: 'daftar', title: 'Hadir / Mendaftar', statuses: ['Hadir Open House', 'Mendaftar'] }
  ];
  const CATMAP = { 'Sangat tertarik': 'A', 'Tertarik': 'B', 'Ingin tahu lebih banyak': 'C', 'Belum tertarik': 'D' };
  const O = cfg.OPTIONS;

  const users = [
    { email: 'admin@sekolah.sch.id', name: 'Super Admin', role: 'super_admin', active: true },
    { email: 'rina@sekolah.sch.id', name: 'Rina Andayani', role: 'koordinator', active: true },
    { email: 'dedi@sekolah.sch.id', name: 'Dedi Kurniawan', role: 'petugas', active: true },
    { email: 'sari@sekolah.sch.id', name: 'Sari Puspita', role: 'petugas', active: true },
    { email: 'kepsek@sekolah.sch.id', name: 'Kepala Sekolah', role: 'pimpinan', active: true }
  ];
  const schools = [
    { id: 'SMP-001', name: 'SMPN 12 Jakarta', district: 'Jakarta Selatan', city: 'Jakarta', aliases: [], visited: true, notes: '' },
    { id: 'SMP-002', name: 'SMPN 41 Jakarta', district: 'Jakarta Selatan', city: 'Jakarta', aliases: [], visited: true, notes: '' },
    { id: 'SMP-003', name: 'SMP Triguna Utama', district: 'Jakarta Selatan', city: 'Jakarta', aliases: [], visited: true, notes: '' },
    { id: 'SMP-004', name: 'SMPN 73 Jakarta', district: 'Jakarta Selatan', city: 'Jakarta', aliases: [], visited: false, notes: '' },
    { id: 'SMP-005', name: 'SMP Harapan Bangsa', district: 'Jakarta Timur', city: 'Jakarta', aliases: [], visited: false, notes: '' },
    { id: 'SMP-006', name: 'SMPN 21 Jakarta', district: 'Jakarta Timur', city: 'Jakarta', aliases: [], visited: false, notes: '' }
  ];
  const typed = [['SMPN 12 Jakarta', 'SMP-001'], ['smpn 12', ''], ['SMP 12 jkt', ''], ['SMPN 41 Jakarta', 'SMP-002'], ['smp negri 41', ''],
                 ['SMP Triguna Utama', 'SMP-003'], ['Triguna Utama', ''], ['SMPN 73 Jakarta', 'SMP-004'], ['SMP N 73 Jakarta Selatan', ''],
                 ['SMP Harapan Bangsa', 'SMP-005'], ['harapan bangsa', ''], ['smp5', ''], ['SMP Al-Ikhlas', '']];
  const first = ['Aulia', 'Bima', 'Citra', 'Dimas', 'Eka', 'Fajar', 'Gita', 'Hafiz', 'Intan', 'Joko', 'Kevin', 'Laras', 'Maya', 'Nadia', 'Rafi', 'Salsa', 'Tiara', 'Yoga', 'Zahra', 'Bagas'];
  const last = ['Rahmawati', 'Prasetyo', 'Lestari', 'Saputra', 'Putri', 'Nugroho', 'Maharani', 'Ramadhan', 'Permata', 'Wibowo', 'Ardian', 'Ayu'];

  const students = [];
  for (let i = 0; i < 140; i++) {
    const t = pick(typed), level = pick(O.interest_level.map((x) => x.value).concat(['Tertarik', 'Ingin tahu lebih banyak']));
    const consent = rnd() < 0.86 ? 'Ya' : 'Tidak';
    const peak = [3, 6, 10][i % 3];
    const day = rnd() < 0.55 ? peak : Math.floor(rnd() * 14);
    students.push({
      id: 'STU-DEMO-' + String(i + 1).padStart(3, '0'), created: new Date(Date.now() - day * DAY - rnd() * 6 * 3600e3),
      name: pick(first) + ' ' + pick(last), origin: t[0], grade: pick(['VII', 'VIII', 'VIII', 'IX', 'IX', 'IX', 'IX']),
      plan: pick(O.education_plan), target: pick(O.target_school_status), consider: pick(O.triguna_consideration), level: level,
      considerations: some(O.school_considerations), programs: some(O.favorite_programs), info: some(O.needed_information),
      intro: pick(O.introduction_interest), parent: consent === 'Ya' ? 'Orang Tua ' + (i + 1) : '', wa: consent === 'Ya' ? '0812' + String(10000000 + i * 7919).slice(0, 8) : '',
      consent: consent, cat: CATMAP[level], schoolId: t[1], source: rnd() < 0.1 ? 'kartu' : 'qr'
    });
  }
  const follow = [];
  students.filter((s) => s.consent === 'Ya' && s.cat !== 'D').slice(0, 46).forEach((s, i) => {
    const officer = i % 2 ? 'dedi@sekolah.sch.id' : 'sari@sekolah.sch.id';
    follow.push({ student_id: s.id, assigned: officer, status: 'Perlu dihubungi', date: '', notes: 'Ditugaskan', by: 'rina@sekolah.sch.id', at: new Date(Date.now() - 4 * DAY) });
    if (i % 3 === 0) follow.push({ student_id: s.id, assigned: officer, status: pick(['Info terkirim', 'Diundang Open House', 'Mendaftar', 'Hadir Open House', 'Sudah dihubungi']), date: iso(Date.now() + 3 * DAY), notes: 'Orang tua merespons baik', by: officer, at: new Date(Date.now() - DAY) });
  });
  const visits = [
    { id: 'VIS-1', date: iso(Date.now() - 3 * DAY), school_id: 'SMP-001', activity: 'Sosialisasi kelas IX', officer: 'Rina Andayani', notes: '' },
    { id: 'VIS-2', date: iso(Date.now() - 6 * DAY), school_id: 'SMP-002', activity: 'Pameran ekstrakurikuler', officer: 'Dedi Kurniawan', notes: '' },
    { id: 'VIS-3', date: iso(Date.now() - 10 * DAY), school_id: 'SMP-003', activity: 'Kunjungan balik + tur sekolah', officer: 'Sari Puspita', notes: '' }
  ];
  const activities = [{ id: 'ACT-1', name: 'Open House SMA Triguna', date: iso(Date.now() + 12 * DAY), location: 'Aula sekolah', description: 'Tur sekolah dan demo ekstrakurikuler' }];
  const ai = [];
  const settings = { FORM_OPEN: 'TRUE', FORM_CLOSED_MESSAGE: 'Pendataan sedang ditutup. Terima kasih atas minatmu!', PERIOD_LABEL: 'SPMB 2027/2028',
    FORM_URL: location.href.replace(/admin\.html.*$/, ''), GOOGLE_CLIENT_ID: '', ALLOWED_DOMAIN: '', AI_ENABLED: 'FALSE', AI_PROVIDER: 'anthropic',
    AI_MODEL: 'claude-sonnet-5-5', VISIT_TARGET_PER_SCHOOL: '1' };

  // ---------- Logika (cermin Admin.gs) ----------
  const latest = () => { const m = {}; follow.forEach((f) => { if (!m[f.student_id] || f.at >= m[f.student_id].at) m[f.student_id] = f; }); return m; };
  const statusOf = (s, L) => { const f = (L || latest())[s.id]; if (f) return f.status; if (s.consent !== 'Ya') return 'Tanpa izin kontak'; if (s.cat === 'D') return 'Tidak ada promosi'; return 'Perlu dihubungi'; };
  const assignedOf = (s, L) => { const f = (L || latest())[s.id]; return f ? f.assigned : ''; };
  const smap = () => { const m = {}; schools.forEach((x) => (m[x.id] = x)); return m; };
  const label = (s, m) => (s.schoolId && m[s.schoolId] ? m[s.schoolId].name : s.origin);
  const countBy = (list, fn) => { const o = {}; list.forEach((x) => [].concat(fn(x)).forEach((k) => { if (k) o[k] = (o[k] || 0) + 1; })); return o; };
  const sorted = (o, n) => Object.keys(o).map((k) => ({ label: k, n: o[k] })).sort((a, b) => b.n - a.n).slice(0, n || 50);
  const visible = (u) => u.role === 'petugas' ? students.filter((s) => assignedOf(s) === u.email) : students;

  function normSchool(v) {
    let s = String(v || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2');
    s = s.replace(/\bsmp\s+(negeri|negri|neg|n)\b/g, 'smpn').replace(/\bsmp\s+(?=\d)/g, 'smpn ');
    s = s.replace(/\b(jakarta|jkt|dki|jaksel|jakut|jakbar|jaktim|jakpus|selatan|utara|barat|timur|pusat|kota|kabupaten|kab)\b/g, ' ');
    s = s.replace(/\b(smp|sekolah|swasta)\b/g, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) { let p = []; for (let j = 0; j <= b.length; j++) p[j] = j;
    for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; }
  function sim(a, b) { if (!a || !b) return 0; if (a === b) return 100;
    const na = (a.match(/\d+/g) || []).join(','), nb = (b.match(/\d+/g) || []).join(',');
    const l = 1 - lev(a, b) / Math.max(a.length, b.length), ta = a.split(' '), tb = b.split(' ');
    const inter = ta.filter((t) => tb.indexOf(t) !== -1).length; let s = 100 * (0.5 * l + 0.5 * inter / (ta.length + tb.length - inter));
    if (na && nb && na !== nb) s *= 0.4; if ((na && !nb) || (!na && nb)) s *= 0.7; return Math.round(s); }
  function suggest(key) {
    return schools.map((sc) => ({ id: sc.id, name: sc.name, meta: [sc.district, sc.city].filter(String).join(' · '),
      score: [normSchool(sc.name)].concat(sc.aliases.map(normSchool)).reduce((m, k) => Math.max(m, sim(key, k)), 0) }))
      .sort((a, b) => b.score - a.score).slice(0, 3);
  }
  function groups() {
    const g = {};
    students.forEach((s) => { if (s.schoolId) return; const k = normSchool(s.origin);
      const x = g[k] || (g[k] = { key: k, count: 0, variants: {}, students: [] }); x.count++; x.variants[s.origin] = (x.variants[s.origin] || 0) + 1;
      if (x.students.length < 5) x.students.push({ name: s.name, grade: s.grade, date: fmt(s.created) }); });
    return Object.values(g).map((x) => { const v = Object.keys(x.variants).sort((a, b) => x.variants[b] - x.variants[a]);
      return { key: x.key, label: v[0], count: x.count, variants: v, students: x.students, suggestions: suggest(x.key) }; }).sort((a, b) => b.count - a.count);
  }
  function applyKeys(pairs) {
    let n = 0; const want = {}; pairs.forEach((p) => (want[p.key] = p.school_id)); const m = smap();
    students.forEach((s) => { if (s.schoolId) return; const k = normSchool(s.origin);
      if (want[k]) { s.schoolId = want[k]; n++; const sc = m[want[k]]; if (sc.aliases.indexOf(s.origin) === -1 && s.origin !== sc.name) sc.aliases.push(s.origin); } });
    return n;
  }
  function visitList() {
    const m = smap();
    return visits.map((v) => { const f = students.filter((s) => s.schoolId === v.school_id && iso(s.created) === v.date);
      const ab = f.filter((s) => s.cat === 'A' || s.cat === 'B').length;
      return Object.assign({}, v, { school: m[v.school_id] ? m[v.school_id].name : v.school_id, dateLabel: fmt(v.date, true),
        forms: f.length, abPct: f.length ? Math.round(100 * ab / f.length) : null }); }).sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  function report() {
    const m = smap(), L = latest(), per = {}, vl = visitList(), vc = countBy(vl, (v) => v.school_id);
    students.forEach((s) => { const k = s.schoolId || 'raw:' + normSchool(s.origin);
      const p = per[k] || (per[k] = { id: s.schoolId, name: label(s, m), matched: !!s.schoolId, A: 0, B: 0, C: 0, D: 0, total: 0, grades: { VII: 0, VIII: 0, IX: 0 }, programs: {} });
      p[s.cat]++; p.total++; p.grades[s.grade]++; s.programs.forEach((x) => (p.programs[x] = (p.programs[x] || 0) + 1)); });
    const perSchool = Object.values(per).map((p) => { const top = sorted(p.programs, 1)[0];
      return Object.assign(p, { topProgram: top ? top.label : '-', visits: p.id ? (vc[p.id] || 0) : 0, abPct: Math.round(100 * (p.A + p.B) / p.total) }); }).sort((a, b) => b.total - a.total);
    const raw = perSchool.filter((p) => p.matched).map((p) => { const b = p.B * 1.5 + p.C * 2 + p.A * 0.5 + p.grades.VIII * 0.5; return { p: p, b: b + (p.visits < 1 ? 0 : -b * 0.25) }; });
    const max = Math.max.apply(null, raw.map((r) => r.b).concat([1]));
    const priority = raw.map((r) => { const p = r.p, sc = Math.round(100 * r.b / max), why = [];
      if (p.C) why.push(p.C + ' siswa "ingin tahu lebih banyak" — undang Open House'); if (p.B) why.push(p.B + ' siswa tertarik — kirim info program');
      if (p.visits < 1) why.push('belum pernah dikunjungi');
      return { name: p.name, score: sc, level: sc >= 75 ? 'Tinggi' : sc >= 45 ? 'Sedang' : 'Rendah', reason: why.slice(0, 2).join('; '), topProgram: p.topProgram }; })
      .sort((a, b) => b.score - a.score).slice(0, 8);
    const sc = countBy(students, (s) => statusOf(s, L));
    return { generatedAt: fmt(new Date(), true), period: settings.PERIOD_LABEL, total: students.length,
      cats: Object.assign({ A: 0, B: 0, C: 0, D: 0 }, countBy(students, (s) => s.cat)), grades: countBy(students, (s) => s.grade),
      programs: sorted(countBy(students, (s) => s.programs)), considerations: sorted(countBy(students, (s) => s.considerations)),
      info: sorted(countBy(students, (s) => s.info)), plans: sorted(countBy(students, (s) => s.plan)), perSchool: perSchool, priority: priority,
      visits: vl, unmatchedStudents: students.filter((s) => !s.schoolId).length,
      funnel: STATUSES.concat(['Tanpa izin kontak', 'Tidak ada promosi']).map((x) => ({ label: x, n: sc[x] || 0 })) };
  }

  const H = {
    me: (d, u) => ok(u),
    logout: () => ok(true),
    dashboard(d, u) {
      const m = smap(), L = latest(), days = [];
      for (let i = 13; i >= 0; i--) { const dt = new Date(Date.now() - i * DAY); days.push({ key: iso(dt), label: fmt(dt), n: 0 }); }
      students.forEach((s) => { const x = days.find((y) => y.key === iso(s.created)); if (x) x.n++; });
      const pending = students.filter((s) => statusOf(s, L) === 'Perlu dihubungi'), c = countBy(students, (s) => s.cat), g = countBy(students, (s) => s.grade);
      const distinct = {}; students.forEach((s) => (distinct[s.schoolId || 'raw:' + normSchool(s.origin)] = 1));
      return ok({ total: students.length, newThisWeek: students.filter((s) => s.created > Date.now() - 7 * DAY).length, schools: Object.keys(distinct).length,
        visitedSchools: schools.filter((s) => s.visited).length, unmatched: students.filter((s) => !s.schoolId).length,
        cats: { A: c.A || 0, B: c.B || 0, C: c.C || 0, D: c.D || 0 }, grades: { VII: g.VII || 0, VIII: g.VIII || 0, IX: g.IX || 0 },
        programs: sorted(countBy(students, (s) => s.programs), 8), topSchools: sorted(countBy(students, (s) => label(s, m)), 5), trend: days,
        pending: pending.length, pendingA: pending.filter((s) => s.cat === 'A').length, mine: u.role === 'petugas' ? visible(u).length : null,
        noConsent: students.filter((s) => s.consent !== 'Ya').length });
    },
    listStudents(d, u) {
      const m = smap(), L = latest(), q = String(d.q || '').toLowerCase();
      let list = visible(u).filter((s) => (!d.grade || s.grade === d.grade) && (!d.status || statusOf(s, L) === d.status) &&
        (!q || (s.name + ' ' + s.origin + ' ' + label(s, m)).toLowerCase().indexOf(q) !== -1));
      const cc = countBy(list, (s) => s.cat); if (d.cat) list = list.filter((s) => s.cat === d.cat);
      list = list.slice().sort((a, b) => b.created - a.created);
      const page = Math.max(1, d.page || 1);
      return ok({ items: list.slice((page - 1) * 25, page * 25).map((s) => ({ id: s.id, name: s.name, school: label(s, m), matched: !!s.schoolId, grade: s.grade, cat: s.cat,
        consent: s.consent, status: statusOf(s, L), assigned: assignedOf(s, L), created: fmt(s.created, true), source: s.source, programs: s.programs.join(', ') })),
        total: list.length, page: page, pages: Math.max(1, Math.ceil(list.length / 25)), catCounts: { A: cc.A || 0, B: cc.B || 0, C: cc.C || 0, D: cc.D || 0 } });
    },
    getStudent(d, u) {
      const s = students.find((x) => x.id === d.id); if (!s) return fail('Data siswa tidak ditemukan.');
      const L = latest(); if (u.role === 'petugas' && assignedOf(s, L) !== u.email) return fail('Siswa ini tidak ditugaskan kepada Anda.');
      const can = (u.role === 'super_admin' || u.role === 'koordinator' || assignedOf(s, L) === u.email) && s.consent === 'Ya';
      return ok({ id: s.id, name: s.name, origin: s.origin, school: label(s, smap()), matched: !!s.schoolId, grade: s.grade, created: fmt(s.created, true) + ', 09.15', source: s.source,
        answers: [{ no: 4, q: 'Rencana setelah lulus SMP', a: s.plan }, { no: 5, q: 'Sudah punya sekolah tujuan', a: s.target }, { no: 6, q: 'Mempertimbangkan SMA Triguna', a: s.consider },
          { no: 7, q: 'Tingkat ketertarikan', a: s.level }, { no: 8, q: 'Pertimbangan memilih SMA', a: s.considerations.join(', ') }, { no: 9, q: 'Program yang menarik', a: s.programs.join(', ') },
          { no: 10, q: 'Informasi yang dibutuhkan', a: s.info.join(', ') }, { no: 11, q: 'Ikut kegiatan pengenalan', a: s.intro }, { no: 14, q: 'Bersedia menerima informasi', a: s.consent }],
        cat: s.cat, consent: s.consent, status: statusOf(s, L), assigned: assignedOf(s, L), contact: can ? { parent: s.parent, wa: s.wa } : null, contactHidden: !can && s.consent === 'Ya',
        history: follow.filter((f) => f.student_id === s.id).sort((a, b) => b.at - a.at).map((f) => ({ status: f.status, assigned: f.assigned, date: f.date, notes: f.notes, by: f.by, at: fmt(f.at, true) })) });
    },
    saveKartu(d) {
      if (!d.full_name || !d.origin_school || !d.interest_level || !d.consent) return fail('Lengkapi data wajib.');
      students.unshift({ id: 'STU-DEMO-K' + students.length, created: new Date(), name: d.full_name, origin: d.origin_school, grade: d.current_grade, plan: d.education_plan,
        target: d.target_school_status, consider: d.triguna_consideration, level: d.interest_level, considerations: d.school_considerations || [], programs: d.favorite_programs || [],
        info: d.needed_information || [], intro: d.introduction_interest, parent: d.parent_name || '', wa: d.parent_whatsapp || '', consent: d.consent, cat: CATMAP[d.interest_level], schoolId: '', source: 'kartu' });
      return ok({ student_id: students[0].id }, 'Data kartu cetak tersimpan.');
    },
    followBoard(d, u) {
      const m = smap(), L = latest(), today = iso(Date.now());
      let list = students.filter((s) => s.consent === 'Ya' && !(s.cat === 'D' && !L[s.id]));
      if (u.role === 'petugas') list = list.filter((s) => assignedOf(s, L) === u.email);
      if (d.officer) list = list.filter((s) => assignedOf(s, L) === d.officer);
      if (d.cat) list = list.filter((s) => s.cat === d.cat);
      return ok({ columns: BOARD.map((c) => { const it = list.filter((s) => c.statuses.indexOf(statusOf(s, L)) !== -1).sort((a, b) => a.cat.localeCompare(b.cat));
        return { key: c.key, title: c.title, count: it.length, items: it.slice(0, 60).map((s) => { const f = L[s.id] || {};
          return { id: s.id, name: s.name, school: label(s, m), grade: s.grade, cat: s.cat, status: statusOf(s, L), assigned: f.assigned || '', date: f.date || '', notes: f.notes || '', overdue: !!(f.date && f.date < today && c.key === 'perlu') }; }) }; }),
        noConsent: students.filter((s) => s.consent !== 'Ya').length, unassigned: list.filter((s) => !assignedOf(s, L) && statusOf(s, L) === 'Perlu dihubungi').length, statuses: STATUSES });
    },
    updateStatus(d, u) {
      const s = students.find((x) => x.id === d.student_id); if (!s) return fail('Siswa tidak ditemukan.');
      if (s.consent !== 'Ya') return fail('Siswa ini tidak bersedia dihubungi.');
      follow.push({ student_id: s.id, assigned: assignedOf(s) || (u.role === 'petugas' ? u.email : ''), status: d.status, date: d.followup_date || '', notes: d.notes || '', by: u.email, at: new Date() });
      return ok(true, 'Status tersimpan dan tercatat di riwayat.');
    },
    assign(d, u) {
      const o = users.find((x) => x.email === d.email); if (!o) return fail('Petugas tidak ditemukan.');
      let n = 0; (d.student_ids || []).forEach((id) => { const s = students.find((x) => x.id === id); if (s && s.consent === 'Ya') { n++;
        follow.push({ student_id: id, assigned: o.email, status: statusOf(s) === 'Tidak ada promosi' ? 'Perlu dihubungi' : statusOf(s), date: '', notes: 'Ditugaskan ke ' + o.name, by: u.email, at: new Date() }); } });
      return n ? ok(n, n + ' siswa ditugaskan ke ' + o.name + '.') : fail('Tidak ada siswa yang bisa ditugaskan.');
    },
    listOfficers: () => ok(users.filter((x) => x.active && x.role !== 'pimpinan').map((x) => ({ email: x.email, name: x.name, role: x.role }))),
    listSchools() {
      const c = countBy(students, (s) => s.schoolId), v = countBy(visits, (x) => x.school_id);
      return ok(schools.map((s) => ({ id: s.id, name: s.name, district: s.district, city: s.city, aliases: s.aliases.join(', '), visited: s.visited, notes: s.notes, students: c[s.id] || 0, visits: v[s.id] || 0 }))
        .sort((a, b) => a.name.localeCompare(b.name)));
    },
    saveSchool(d) {
      if (!d.name || d.name.length < 3) return fail('Nama SMP wajib diisi.');
      const dupe = schools.find((s) => normSchool(s.name) === normSchool(d.name) && s.id !== d.id); if (dupe) return fail('SMP dengan nama serupa sudah ada: ' + dupe.name);
      if (d.id) { const s = schools.find((x) => x.id === d.id); Object.assign(s, { name: d.name, district: d.district || '', city: d.city || '', aliases: String(d.aliases || '').split(',').map((x) => x.trim()).filter(String), visited: !!d.visited, notes: d.notes || '' }); return ok({ id: s.id }, 'Data SMP diperbarui.'); }
      const id = 'SMP-' + String(schools.length + 1).padStart(3, '0');
      schools.push({ id: id, name: d.name, district: d.district || '', city: d.city || '', aliases: [], visited: false, notes: d.notes || '' });
      return ok({ id: id }, 'SMP ditambahkan ke master.');
    },
    matchGroups: () => ok({ groups: groups(), total: students.length, matched: students.filter((s) => s.schoolId).length,
      pendingStudents: students.filter((s) => !s.schoolId).length, masterCount: schools.length }),
    applyMatch(d) {
      let id = d.school_id;
      if (!id && d.newSchool) { const r = H.saveSchool(d.newSchool); if (!r.success) return r; id = r.data.id; }
      if (!d.key || !id) return fail('Pilih sekolah di master SMP.');
      const n = applyKeys([{ key: d.key, school_id: id }]); return ok({ updated: n, school_id: id }, n + ' siswa dicocokkan.');
    },
    applyMatchBulk(d) {
      const min = Math.max(80, d.minScore || 90), pairs = groups().filter((g) => g.suggestions[0] && g.suggestions[0].score >= min).map((g) => ({ key: g.key, school_id: g.suggestions[0].id }));
      const n = applyKeys(pairs); return ok({ updated: n, groups: pairs.length }, pairs.length + ' ketikan (' + n + ' siswa) dicocokkan otomatis.');
    },
    undoMatch(d) { let n = 0; students.forEach((s) => { if (s.schoolId === d.school_id && (!d.key || normSchool(s.origin) === d.key)) { s.schoolId = ''; n++; } }); return ok({ updated: n }, 'Pencocokan dibatalkan untuk ' + n + ' siswa.'); },
    listVisits: () => ok(visitList()),
    saveVisit(d, u) { if (!d.date || !d.school_id) return fail('Tanggal dan SMP wajib diisi.');
      visits.push({ id: 'VIS-' + (visits.length + 1), date: d.date, school_id: d.school_id, activity: d.activity || '', officer: d.officer || u.name, notes: d.notes || '' });
      const s = schools.find((x) => x.id === d.school_id); if (s) s.visited = true; return ok(true, 'Kunjungan tersimpan.'); },
    listActivities: () => ok(activities.map((a) => Object.assign({ dateLabel: fmt(a.date, true) }, a))),
    saveActivity(d) { if (!d.name || !d.date) return fail('Nama dan tanggal kegiatan wajib diisi.'); activities.unshift({ id: 'ACT-' + (activities.length + 1), name: d.name, date: d.date, location: d.location || '', description: d.description || '' }); return ok(true, 'Kegiatan tersimpan.'); },
    report: () => ok(report()),
    exportData() {
      const m = smap(), L = latest();
      return ok({ period: settings.PERIOD_LABEL, rows: students.map((s) => ({ 'ID': s.id, 'Tanggal': fmt(s.created, true), 'Asal SMP (master)': s.schoolId ? label(s, m) : '(belum dicocokkan)',
        'Asal SMP (ketikan siswa)': s.origin, 'Nama Lengkap': s.name, 'Kelas': s.grade, '4. Rencana': s.plan, '5. Sekolah Tujuan': s.target, '6. Pertimbangkan Triguna': s.consider,
        '7. Ketertarikan': s.level, 'Kategori': s.cat, '8. Pertimbangan': s.considerations.join(', '), '9. Program': s.programs.join(', '), '10. Informasi': s.info.join(', '),
        '11. Kegiatan Pengenalan': s.intro, '12. Orang Tua/Wali': s.parent, '13. WhatsApp': s.wa, '14. Persetujuan': s.consent, 'Status Follow-up': statusOf(s, L), 'Petugas': assignedOf(s, L), 'Sumber': s.source })) });
    },
    printConfig: () => ok({ formUrl: settings.FORM_URL, period: settings.PERIOD_LABEL }),
    aiList: () => ok({ enabled: settings.AI_ENABLED === 'TRUE', keySet: true, provider: settings.AI_PROVIDER, model: settings.AI_MODEL,
      scopes: { lengkap: 'Ringkasan lengkap', pola_minat: 'Pola minat', materi_promosi: 'Materi promosi', program_pengenalan: 'Program pengenalan', prioritas: 'Prioritas tindak lanjut', evaluasi_kunjungan: 'Evaluasi kunjungan' }, items: ai }),
    aiGenerate(d, u) {
      if (settings.AI_ENABLED !== 'TRUE') return fail('Analisis AI belum diaktifkan (AI_ENABLED = FALSE di SETTINGS).');
      const r = report(), top = r.programs[0], p = r.priority[0];
      const text = '## Ringkasan (contoh mode demo)\n- Dari ' + r.total + ' siswa, ' + r.cats.A + ' sangat tertarik dan ' + r.cats.C + ' ingin tahu lebih banyak.\n- Program paling diminati: **' + top.label + '** (' + top.n + ' siswa).\n' +
        '## Rekomendasi\n- Prioritaskan kunjungan ke **' + p.name + '**: ' + p.reason + '.\n- Siapkan materi promosi tentang ' + r.considerations[0].label.toLowerCase() + ' dan ' + r.info[0].label.toLowerCase() + '.\n' +
        '- Undang siswa kategori C ke Open House dengan demo ' + top.label + '.\n\n_Teks ini dibuat oleh mode demo, bukan layanan AI sungguhan._';
      ai.unshift({ id: 'AI-' + ai.length, at: fmt(new Date(), true) + ', 10.00', scope: d.scope || 'lengkap', summary: text, model: 'demo' });
      return ok({ scope: d.scope, summary: text }, 'Analisis selesai dan tersimpan.');
    },
    listUsers: () => ok(users.map((x) => Object.assign({}, x))),
    saveUser(d) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '')) return fail('Email tidak valid.');
      const f = users.find((x) => x.email === d.email.toLowerCase());
      if (f && f.role === 'super_admin' && (d.role !== 'super_admin' || d.active === false) && users.filter((x) => x.role === 'super_admin' && x.active && x !== f).length === 0) return fail('Harus ada minimal satu Super Admin aktif.');
      if (f) Object.assign(f, { name: d.name, role: d.role, active: d.active !== false }); else users.push({ email: d.email.toLowerCase(), name: d.name, role: d.role, active: d.active !== false });
      return ok(true, f ? 'Akun diperbarui.' : 'Akun ditambahkan. Petugas bisa langsung masuk.');
    },
    getSettings: () => ok(Object.assign({ _aiKeySet: false }, settings)),
    saveSettings(d) { Object.keys(d.values || {}).forEach((k) => { if (k in settings) settings[k] = String(d.values[k]); }); return ok(true, 'Setelan tersimpan.'); }
  };

  const PERM = { listStudents: 'sa ko pe', getStudent: 'sa ko pe', saveKartu: 'sa ko pe', followBoard: 'sa ko pe', updateStatus: 'sa ko pe', assign: 'sa ko', listOfficers: 'sa ko',
    listSchools: 'sa ko', saveSchool: 'sa ko', matchGroups: 'sa ko', applyMatch: 'sa ko', applyMatchBulk: 'sa ko', undoMatch: 'sa ko', listVisits: 'sa ko', saveVisit: 'sa ko',
    listActivities: 'sa ko', saveActivity: 'sa ko', report: 'sa ko pi', exportData: 'sa ko', aiList: 'sa ko pi', aiGenerate: 'sa ko', listUsers: 'sa', saveUser: 'sa',
    getSettings: 'sa', saveSettings: 'sa', printConfig: 'sa ko pe' };
  const SHORT = { super_admin: 'sa', koordinator: 'ko', petugas: 'pe', pimpinan: 'pi' };

  window.DEMO = {
    userFor(role) {
      const u = users.find((x) => x.role === role) || users[0];
      return { email: u.email, name: u.name, role: u.role, picture: '' };
    },
    handle(action, data, user) {
      return new Promise((resolve) => setTimeout(() => {
        if (!H[action]) return resolve(fail('Action tidak dikenal: ' + action));
        if (PERM[action] && PERM[action].split(' ').indexOf(SHORT[user.role]) === -1) return resolve(fail('Anda tidak memiliki akses ke fitur ini.', { forbidden: true }));
        try { resolve(JSON.parse(JSON.stringify(H[action](data, user)))); } catch (e) { resolve(fail(e.message)); }
      }, 220));
    }
  };
})();
