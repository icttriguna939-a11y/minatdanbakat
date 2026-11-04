/**
 * Formulir Minat Calon Siswa — logika halaman
 * 5 langkah (bagian A–E PRD), validasi per langkah, draf tersimpan di perangkat,
 * kirim ke GAS dengan percobaan ulang.
 */
(function () {
  const cfg = window.APP_CONFIG;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const DRAFT_KEY = 'tsid_draft_v1';
  const TOTAL = 5;

  const STEPS = [
    { title: 'Kenalan dulu, yuk!', sub: 'Isi identitasmu. Hanya butuh 2 menit.', section: 'A. Identitas' },
    { title: 'Rencana sekolahmu', sub: 'Ceritakan rencanamu setelah lulus SMP.', section: 'B. Rencana Pendidikan' },
    { title: 'Apa yang bikin kamu tertarik?', sub: 'Tidak ada jawaban benar atau salah.', section: 'C. Minat & Ketertarikan' },
    { title: 'Info yang kamu butuhkan', sub: 'Kami siapkan info sesuai pilihanmu.', section: 'D. Informasi' },
    { title: 'Hampir selesai!', sub: 'Data kontak hanya untuk petugas SPMB.', section: 'E. Kontak & Persetujuan' }
  ];

  const MULTI = ['school_considerations', 'favorite_programs', 'needed_information'];
  const TEXT = ['full_name', 'origin_school', 'parent_name', 'parent_whatsapp'];

  let step = 1;
  let answers = emptyAnswers();
  let submissionId = newId();
  let sending = false;

  function emptyAnswers() {
    const a = {};
    TEXT.forEach((k) => (a[k] = ''));
    MULTI.forEach((k) => (a[k] = []));
    return a;
  }
  function newId() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // ---------- Penyimpanan draf (aman bila browser memblokir storage) ----------
  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, answers, submissionId })); } catch (e) {}
  }
  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (d && d.answers) { answers = Object.assign(emptyAnswers(), d.answers); step = d.step || 1; submissionId = d.submissionId || submissionId; return true; }
    } catch (e) {}
    return false;
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }

  // ---------- Render pilihan ----------
  function renderGroups() {
    $$('[data-group]').forEach((box) => {
      const key = box.dataset.group;
      const kind = box.dataset.kind;
      const style = box.dataset.style;
      const opts = cfg.OPTIONS[key] || [];
      box.innerHTML = '';
      box.setAttribute('role', kind === 'single' ? 'radiogroup' : 'group');
      const legend = box.closest('fieldset') && box.closest('fieldset').querySelector('legend');
      if (legend) { legend.id = legend.id || 'lg-' + key; box.setAttribute('aria-labelledby', legend.id); }

      opts.forEach((o) => {
        const value = typeof o === 'string' ? o : o.value;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'opt';
        b.dataset.value = value;
        if (kind === 'single') b.setAttribute('role', 'radio');

        if (style === 'radio') {
          b.innerHTML = '<span class="dot" aria-hidden="true"></span><span></span>';
          b.lastChild.textContent = value;
        } else if (style === 'level') {
          let meter = '<span class="meter" aria-hidden="true">';
          for (let i = 1; i <= 4; i++) meter += '<i class="' + (i <= o.bars ? 'on' : '') + '"></i>';
          meter += '</span>';
          b.innerHTML = meter + '<span class="lvl-text"><b></b><span></span></span>';
          b.querySelector('b').textContent = value;
          b.querySelector('.lvl-text span').textContent = o.sub;
        } else {
          b.textContent = value;
        }

        b.addEventListener('click', () => {
          if (kind === 'single') answers[key] = value;
          else {
            const list = answers[key];
            const i = list.indexOf(value);
            if (i >= 0) list.splice(i, 1); else list.push(value);
          }
          syncGroup(box);
          clearError(key);
          saveDraft();
        });
        box.appendChild(b);
      });
      syncGroup(box);
    });
  }

  function syncGroup(box) {
    const key = box.dataset.group;
    const kind = box.dataset.kind;
    $$('.opt', box).forEach((b) => {
      if (kind === 'single') {
        const on = answers[key] === b.dataset.value;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      } else {
        b.setAttribute('aria-pressed', answers[key].indexOf(b.dataset.value) >= 0 ? 'true' : 'false');
      }
    });
  }

  function fillInputs() {
    TEXT.forEach((k) => { const el = $('#' + k); if (el) el.value = answers[k] || ''; });
    $$('[data-group]').forEach(syncGroup);
  }

  // ---------- Validasi ----------
  function setError(key, msg) {
    const p = $('[data-error="' + key + '"]');
    if (p) p.textContent = msg;
    const field = (p && p.closest('.field'));
    if (field) field.classList.add('invalid');
  }
  function clearError(key) {
    const p = $('[data-error="' + key + '"]');
    if (p) p.textContent = '';
    const field = (p && p.closest('.field'));
    if (field) field.classList.remove('invalid');
  }
  function normalizePhone(v) {
    let p = String(v || '').replace(/[^\d]/g, '');
    if (p.indexOf('62') === 0) p = '0' + p.slice(2);
    return p;
  }

  function validate(s) {
    const errs = [];
    const need = (key, ok, msg) => { if (!ok) { setError(key, msg); errs.push(key); } else clearError(key); };
    if (s === 1) {
      need('full_name', answers.full_name.trim().length >= 3, 'Tulis nama lengkapmu (minimal 3 huruf).');
      need('origin_school', answers.origin_school.trim().length >= 3, 'Tulis nama SMP asalmu.');
      need('current_grade', !!answers.current_grade, 'Pilih kelasmu.');
    }
    if (s === 2) {
      need('education_plan', !!answers.education_plan, 'Pilih salah satu rencanamu.');
      need('target_school_status', !!answers.target_school_status, 'Pilih salah satu jawaban.');
      need('triguna_consideration', !!answers.triguna_consideration, 'Pilih salah satu jawaban.');
    }
    if (s === 3) {
      need('interest_level', !!answers.interest_level, 'Pilih tingkat ketertarikanmu.');
      need('school_considerations', answers.school_considerations.length > 0, 'Pilih minimal satu.');
      need('favorite_programs', answers.favorite_programs.length > 0, 'Pilih minimal satu.');
    }
    if (s === 4) {
      need('needed_information', answers.needed_information.length > 0, 'Pilih minimal satu.');
      need('introduction_interest', !!answers.introduction_interest, 'Pilih salah satu jawaban.');
    }
    if (s === 5) {
      const wa = answers.parent_whatsapp.trim();
      need('parent_whatsapp', !wa || /^(08|628)\d{7,12}$/.test(normalizePhone(wa)), 'Nomor WhatsApp belum benar. Contoh: 0812xxxxxxxx');
      need('consent', !!answers.consent, 'Pilih Ya atau Tidak.');
    }
    if (errs.length) {
      const first = $('[data-error="' + errs[0] + '"]');
      const field = first && first.closest('.field');
      if (field) {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = field.querySelector('input, .opt');
        if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 250);
      }
    }
    return errs.length === 0;
  }

  // ---------- Navigasi langkah ----------
  function showStep(n, focus) {
    step = n;
    $$('.step').forEach((sec) => (sec.hidden = Number(sec.dataset.step) !== n));
    const info = STEPS[n - 1];
    $('#stepCount').textContent = 'Langkah ' + n + ' dari ' + TOTAL;
    $('#stepSection').textContent = info.section;
    $('#stepTitle').textContent = info.title;
    $('#stepSub').textContent = info.sub;
    $$('.bars span').forEach((b, i) => {
      b.className = i + 1 < n ? 'done' : (i + 1 === n ? 'active' : '');
    });
    $('#btnBack').hidden = n === 1;
    $('#btnNext').textContent = n === TOTAL ? 'Kirim Formulir' : 'Lanjut';
    $('#sendError').hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (focus) setTimeout(() => $('#stepTitle').focus({ preventScroll: true }), 50);
    saveDraft();
  }

  async function onNext(e) {
    e.preventDefault();
    if (sending) return;
    if (!validate(step)) return;
    if (step < TOTAL) { showStep(step + 1, true); return; }
    await send();
  }

  // ---------- Kirim ----------
  function payload() {
    return {
      full_name: answers.full_name.trim(),
      origin_school: answers.origin_school.trim(),
      current_grade: answers.current_grade,
      education_plan: answers.education_plan,
      target_school_status: answers.target_school_status,
      triguna_consideration: answers.triguna_consideration,
      interest_level: answers.interest_level,
      school_considerations: answers.school_considerations.slice(),
      favorite_programs: answers.favorite_programs.slice(),
      needed_information: answers.needed_information.slice(),
      introduction_interest: answers.introduction_interest,
      parent_name: answers.parent_name.trim(),
      parent_whatsapp: answers.consent === 'Ya' ? answers.parent_whatsapp.trim() : '',
      consent: answers.consent,
      source: 'qr',
      submission_id: submissionId,
      website: ($('input[name=website]') || {}).value || ''
    };
  }

  function setSending(on, label) {
    sending = on;
    const btn = $('#btnNext');
    btn.disabled = on;
    $('#btnBack').disabled = on;
    btn.innerHTML = on ? '<span class="spinner" aria-hidden="true"></span><span></span>' : '';
    if (on) btn.lastChild.textContent = label || 'Mengirim…';
    else btn.textContent = 'Kirim Formulir';
  }

  async function send() {
    setSending(true, 'Mengirim…');
    $('#sendError').hidden = true;
    const res = await window.API.post('submitForm', payload(), (attempt) => {
      setSending(true, 'Mencoba lagi (' + attempt + ')…');
    });
    setSending(false);

    if (res && res.success) {
      clearDraft();
      showThanks();
      return;
    }
    const box = $('#sendError');
    box.hidden = false;
    if (res && res.closed) {
      box.textContent = res.message;
    } else if (res && res.network) {
      box.textContent = 'Belum terkirim karena koneksi terputus. Jawabanmu tetap tersimpan di HP ini — tekan "Kirim Formulir" lagi saat sinyal sudah bagus.';
    } else {
      box.textContent = (res && res.message) || 'Terjadi kesalahan. Coba kirim lagi.';
    }
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showThanks() {
    $('#form').hidden = true;
    $('#thanks').hidden = false;
    window.scrollTo({ top: 0 });
    setTimeout(() => $('#thanksTitle').focus({ preventScroll: true }), 50);
  }

  function restart() {
    answers = emptyAnswers();
    submissionId = newId();
    clearDraft();
    fillInputs();
    $$('.error').forEach((p) => (p.textContent = ''));
    $$('.invalid').forEach((f) => f.classList.remove('invalid'));
    $('#thanks').hidden = true;
    $('#form').hidden = false;
    showStep(1, true);
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ---------- Identitas sekolah ----------
  function applyBranding() {
    $('#schoolName').textContent = cfg.SCHOOL_NAME;
    $('#subtitle').textContent = cfg.SUBTITLE;
    if (cfg.LOGO_URL) {
      const img = new Image();
      img.alt = '';
      img.onerror = () => { const l = $('#logo'); l.classList.remove('has-img'); l.innerHTML = '<span>T56</span>'; };
      img.src = cfg.LOGO_URL;
      const logo = $('#logo');
      img.alt = 'Logo ' + cfg.SCHOOL_NAME;
      logo.innerHTML = '';
      logo.appendChild(img);
      logo.classList.add('has-img');
      const ic = document.createElement('link'); ic.rel = 'icon'; ic.href = cfg.LOGO_URL; document.head.appendChild(ic);
    }
    let social = false;
    if (cfg.INSTAGRAM) { const ig = $('#igLine'); ig.textContent = 'Instagram · ' + cfg.INSTAGRAM; ig.hidden = false; social = true; }
    if (cfg.WEBSITE) { const w = $('#webLine'); w.textContent = 'Website · ' + cfg.WEBSITE.replace(/^https?:\/\//, ''); w.href = cfg.WEBSITE; w.hidden = false; social = true; }
    $('#social').hidden = !social;
    if (window.API.isDemo()) $('#demoBanner').hidden = false;
  }

  async function checkFormOpen() {
    try {
      const res = await window.API.get('formConfig');
      if (res && res.success && res.data && res.data.formOpen === false) {
        $('#form').hidden = true;
        $('#closed').hidden = false;
        $('#closedMsg').textContent = res.data.closedMessage;
      }
    } catch (e) { /* abaikan: formulir tetap bisa diisi, server yang memutuskan saat kirim */ }
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    applyBranding();
    const restored = loadDraft();
    renderGroups();
    fillInputs();
    showStep(step, false);
    if (restored && (answers.full_name || answers.current_grade)) toast('Jawabanmu sebelumnya dipulihkan.');

    TEXT.forEach((k) => {
      const el = $('#' + k);
      if (!el) return;
      el.addEventListener('input', () => { answers[k] = el.value; clearError(k); saveDraft(); });
    });
    $('#form').addEventListener('submit', onNext);
    $('#btnBack').addEventListener('click', () => { if (step > 1 && !sending) showStep(step - 1, true); });
    $('#btnAgain').addEventListener('click', restart);
    checkFormOpen();
  });
})();
