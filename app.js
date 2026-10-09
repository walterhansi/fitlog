/* AO fitlog – App-Logik
   Daten liegen lokal im Browser (localStorage, Schlüssel "aofl_…").
   Aufbau: 1 Grundlagen · 2 Speicher · 3 Auswertung · 4 Oberfläche · 5 Ansichten
           6 Dialoge · 7 Aktionen · 8 Sicherung/Import · 9 CSV-Import · 10 Start */
'use strict';

/* ================= 1 Grundlagen ================= */
const APP_VERSION = '1.0.2';
const KEY = 'aofl_data';
const IMG = 'aofl_img_';
const TYPE_LABEL = { weight: 'Gewicht', bodyweight: 'Körpergewicht', time: 'Zeit' };
const DEFAULT_STEP = { weight: 0.5, bodyweight: 1, time: 5 };
const WEIGHT_BUTTON_STEP = 0.5;
const BACKUP_REMIND_AFTER = 3;
const EFFORT = { leicht: 'leicht', passt: 'passt', schwer: 'schwer' };

const ICONS = {
  dumbbell: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  history: 'M3 12a9 9 0 1 0 2.6-6.4L3 8M3 3v5h5M12 7v5l3 2',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  sync: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v6h14v-6',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  upload: 'M12 15V3M7 8l5-5 5 5M5 21h14',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17.5h.01',
  down: 'M6 9l6 6 6-6',
  up: 'M6 15l6-6 6 6',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
  eq: 'M5 9h14M5 15h14',
  x: 'M6 6l12 12M18 6L6 18',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  skip: 'M5 5l10 7-10 7zM19 5v14',
  play: 'M7 4l13 8-13 8z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  image: 'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  restore: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5'
};
const STAR = '<svg class="ic ic-fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>';
function ic(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
}

const $ = (s, r = document) => r.querySelector(s);
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
function num(v) { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; }
function r2(n) { return Math.round(n * 100) / 100; }
function fmt(n) { return r2(+n || 0).toLocaleString('de-DE', { maximumFractionDigits: 2 }); }
function fmt1(n) { return (Math.round(n * 10) / 10).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
function fmtDate(ts) { return new Date(ts).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }); }
function fmtShort(ts) { return new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }); }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
function pad(n) { return String(n).padStart(2, '0'); }
function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function isoTime(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function dayKey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
function textBlock(s) {
  // Leerzeilen trennen Absätze; einfache Zeilenumbrüche (z. B. aus PDFs kopiert) werden zusammengezogen.
  return String(s || '').trim().split(/\n\s*\n/).filter(Boolean)
    .map((p) => `<p>${esc(p.replace(/\s*\n\s*/g, ' '))}</p>`).join('');
}
function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : ''; }
function byName(a, b) { return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }); }
function norm(s) {
  return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
}

/* ================= 2 Speicher ================= */
function freshDb() {
  return { schema: 1, device: '', exercises: [], plans: [], workouts: [], active: null, deleted: {}, meta: { lastExport: null, sinceExport: 0 } };
}
function loadDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshDb();
    const d = JSON.parse(raw);
    const f = freshDb();
    return Object.assign(f, d, { meta: Object.assign(f.meta, d.meta || {}), deleted: d.deleted || {} });
  } catch (e) {
    return freshDb();
  }
}
let db = loadDb();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  } catch (e) {
    toast('Speichern fehlgeschlagen: Gerätespeicher voll. Bitte Daten sichern und große Bilder entfernen.', { error: true, timeout: 10000 });
    return false;
  }
}
function getImg(id) { try { return localStorage.getItem(IMG + id); } catch (e) { return null; } }
function setImg(id, data) {
  try { localStorage.setItem(IMG + id, data); return true; } catch (e) {
    toast('Bild konnte nicht gespeichert werden: Speicher voll.', { error: true, timeout: 8000 });
    return false;
  }
}
function delImg(id) { try { localStorage.removeItem(IMG + id); } catch (e) { /* egal */ } }
function storageUsedKB() {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      // Chrome begrenzt den Speicher nach Zeichenzahl (ca. 5 Mio. Zeichen je Website)
      if (k && k.startsWith('aofl_')) n += k.length + (localStorage.getItem(k) || '').length;
    }
  } catch (e) { /* egal */ }
  return Math.round(n / 1024);
}

// Bilder verkleinern (längste Seite max. 900 px, JPEG), damit der Speicher reicht.
function downscale(blob, max = 900) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild nicht lesbar')); };
    img.src = url;
  });
}

/* ================= 3 Auswertung ================= */
const exById = (id) => db.exercises.find((e) => e.id === id);
const planById = (id) => db.plans.find((p) => p.id === id);
function exUsed(id) {
  return db.workouts.some((w) => w.entries.some((e) => e.exId === id)) ||
    !!(db.active && db.active.entries.some((e) => e.exId === id));
}
function planUsed(id) { return db.workouts.some((w) => w.planId === id) || !!(db.active && db.active.planId === id); }
function sortedWorkouts() { return [...db.workouts].sort((a, b) => a.start - b.start); }
function isScored(exId) { const ex = exById(exId); return ex ? ex.scored !== false : true; }

// Wert eines Satzes: Gewicht → Belastungswert kg × (1 + Wdh/30); sonst Wdh bzw. Sekunden.
function setVal(type, s) {
  const w = +s.w || 0, r = +s.r || 0;
  return type === 'weight' ? w * (1 + r / 30) : r;
}
// Leistung einer Übung: Summe der erledigten Sätze / Anzahl geplanter Sätze.
function entryPerf(e) {
  if (!e || e.skipped || !e.sets || !e.sets.length) return null;
  const done = e.sets.filter((s) => s.done);
  if (!done.length) return null;
  const p = done.reduce((a, s) => a + setVal(e.type, s), 0) / e.sets.length;
  return p > 0 ? p : null;
}
// Je Übung: chronologische Liste der Leistungen.
function buildSeries() {
  const m = {};
  for (const w of sortedWorkouts()) {
    for (const e of w.entries) {
      const p = entryPerf(e);
      if (p == null) continue;
      (m[e.exId] || (m[e.exId] = [])).push({ wid: w.id, start: w.start, perf: p });
    }
  }
  return m;
}
function workoutStats(w, series) {
  series = series || buildSeries();
  const rows = [];
  let iSum = 0, iN = 0, tSum = 0, tN = 0, records = 0;
  for (const e of w.entries) {
    const perf = entryPerf(e);
    const list = series[e.exId] || [];
    const pos = list.findIndex((x) => x.wid === w.id);
    const base = list.length ? list[0].perf : null;
    const prev = pos > 0 ? list[pos - 1].perf : null;
    const scored = isScored(e.exId);
    let idx = null, delta = null, record = false;
    if (perf != null && base) idx = 100 * perf / base;
    if (perf != null && prev) {
      delta = (perf / prev - 1) * 100;
      const best = Math.max(...list.slice(0, pos).map((x) => x.perf));
      record = perf > best + 1e-9;
    }
    if (scored && idx != null) { iSum += idx; iN++; }
    if (scored && delta != null) { tSum += delta; tN++; }
    if (record && scored) records++;
    rows.push({ e, perf, idx, delta, record: record && scored, scored, first: perf != null && pos === 0 });
  }
  return { rows, index: iN ? iSum / iN : null, trend: tN ? tSum / tN : null, records };
}
// Letztes Training einer Übung (egal in welchem Plan), das gewertet werden kann.
function lastEntry(exId) {
  const ws = sortedWorkouts();
  for (let i = ws.length - 1; i >= 0; i--) {
    const e = ws[i].entries.find((x) => x.exId === exId && entryPerf(x) != null);
    if (e) return { entry: e, workout: ws[i] };
  }
  return null;
}
function lastNote(exId) {
  const ws = sortedWorkouts();
  for (let i = ws.length - 1; i >= 0; i--) {
    const e = ws[i].entries.find((x) => x.exId === exId);
    if (e) return e.note ? { text: e.note, date: ws[i].start } : null;
  }
  return null;
}
function setsText(type, sets, onlyDone = true) {
  const ss = onlyDone ? sets.filter((s) => s.done) : sets;
  if (!ss.length) return '–';
  if (type === 'weight') {
    const ws = [...new Set(ss.map((s) => +s.w))];
    if (ws.length === 1) return `${fmt(ws[0])} kg × ${ss.map((s) => fmt(s.r)).join(' · ')}`;
    return ss.map((s) => `${fmt(s.w)}×${fmt(s.r)}`).join(' · ');
  }
  return ss.map((s) => fmt(s.r)).join(' · ') + (type === 'time' ? ' s' : ' Wdh');
}
function minIdx(arr) { let m = 0; arr.forEach((v, i) => { if (v < arr[m]) m = i; }); return m; }

// Steigerungsvorschlag: höchstens ein kleiner Schritt in genau einem Satz.
function suggest(ex, prev, cur) {
  if (prev.sets.some((s) => !s.done)) return { hold: true, text: 'Letztes Mal nicht alle Sätze geschafft – Werte halten.' };
  if (prev.effort === 'schwer') return { hold: true, text: 'Letztes Mal als „schwer“ markiert – Werte halten.' };
  const step = +ex.step > 0 ? +ex.step : DEFAULT_STEP[ex.type];
  const next = cur.map((s) => ({ w: s.w, r: s.r }));
  if (ex.type === 'weight') {
    const max = +ex.repMax || 12, min = +ex.repMin || 8;
    if (next.every((s) => s.r >= max)) {
      const nw = r2(Math.max(...next.map((s) => s.w)) + step);
      next.forEach((s) => { s.w = nw; s.r = min; });
      return { sets: next, text: `Alle Sätze bei ${max} Wdh: Gewicht auf ${fmt(nw)} kg, Wdh zurück auf ${min}.` };
    }
    const i = minIdx(next.map((s) => s.r));
    next[i].r += 1;
    return { sets: next, text: `Satz ${i + 1}: ${fmt(next[i].r)} Wdh (+1).` };
  }
  const i = minIdx(next.map((s) => s.r));
  next[i].r = r2(next[i].r + step);
  const u = ex.type === 'time' ? 's' : 'Wdh';
  return { sets: next, text: `Satz ${i + 1}: ${fmt(next[i].r)} ${u} (+${fmt(step)}).` };
}

// Eintrag für ein neues Workout: Werte vom letzten Training, sonst Planwerte.
function buildEntry(ex, item) {
  const last = lastEntry(ex.id);
  const n = item ? Math.max(1, item.sets | 0) : (last ? last.entry.sets.length : 3);
  const sets = [];
  for (let i = 0; i < n; i++) {
    let src = null;
    if (last) src = last.entry.sets[i] || last.entry.sets[last.entry.sets.length - 1];
    const w = src ? src.w : (item ? item.w : 0);
    const r = src ? src.r : (item ? item.r : (ex.type === 'time' ? 30 : 10));
    sets.push({ w: ex.type === 'weight' ? (+w || 0) : 0, r: +r || 0, done: false });
  }
  const e = {
    exId: ex.id, name: ex.name, type: ex.type, perSide: !!ex.perSide,
    sets, last: last ? last.entry.sets.map((s) => ({ w: s.w, r: s.r })) : null,
    lastDate: last ? last.workout.start : null, lastNote: lastNote(ex.id),
    skipped: false, effort: null, note: '', suggestion: null
  };
  if (ex.scored !== false && last) e.suggestion = suggest(ex, last.entry, sets);
  return e;
}
function isComplete(e) { return !e.skipped && e.sets.length > 0 && e.sets.every((s) => s.done); }
// Fokus-Modus: Standardmäßig ist nur die erste offene Übung aufgeklappt.
function focusIndex() { return db.active ? db.active.entries.findIndex((e) => !e.skipped && !isComplete(e)) : -1; }
function isOpen(i) { return ui.open[i] ?? (i === focusIndex()); }
function progress(a) {
  let total = 0, done = 0;
  for (const e of a.entries) { if (e.skipped) continue; total += e.sets.length; done += e.sets.filter((s) => s.done).length; }
  return { total, done };
}
function needsBackup() { return (db.meta.sinceExport || 0) >= BACKUP_REMIND_AFTER; }
function nameTaken(list, name, exceptId) {
  const n = name.trim().toLowerCase();
  return list.some((x) => x.id !== exceptId && x.name.trim().toLowerCase() === n);
}
function nextVersionName(name) {
  let base = name.trim(), v = 2;
  const m = base.match(/^(.*?)[\s_-]*V(\d+)$/i);
  if (m) { base = m[1].trim(); v = +m[2] + 1; }
  let out = `${base} V${v}`;
  while (nameTaken(db.plans, out)) { v++; out = `${base} V${v}`; }
  return out;
}

/* ================= 4 Oberfläche ================= */
const TABS = [
  { id: 'workout', label: 'Training', icon: 'dumbbell' },
  { id: 'plans', label: 'Pläne', icon: 'list' },
  { id: 'history', label: 'Verlauf', icon: 'history' },
  { id: 'exercises', label: 'Übungen', icon: 'book' },
  { id: 'data', label: 'Daten', icon: 'sync' }
];
const ui = { tab: 'workout', open: {}, calMonth: null, exQuery: '', showArchive: false, draft: null, csv: null, modal: null };

function renderNav() {
  $('#nav').innerHTML = TABS.map((t) =>
    `<button class="nav-btn ${ui.tab === t.id ? 'active' : ''} ${t.id === 'data' && needsBackup() ? 'nav-dot' : ''}" data-a="tab" data-tab="${t.id}" aria-label="${t.label}">${ic(t.icon)}<span>${t.label}</span></button>`
  ).join('');
}
function render() {
  renderNav();
  $('#view').innerHTML = VIEWS[ui.tab]();
  updateWake();
}

let toastState = null;
function toast(msg, o = {}) {
  const root = $('#toast-root');
  if (toastState) {
    clearTimeout(toastState.t);
    const prev = toastState; toastState = null;
    if (prev.onExpire) prev.onExpire();
  }
  root.innerHTML = `<div class="toast ${o.error ? 'error' : ''}" role="status"><span>${esc(msg)}</span>${o.action ? `<button data-a="toast-act">${esc(o.action)}</button>` : ''}</div>`;
  const st = { onAction: o.onAction, onExpire: o.onExpire };
  st.t = setTimeout(() => {
    if (toastState === st) { toastState = null; root.innerHTML = ''; if (st.onExpire) st.onExpire(); }
  }, o.timeout || 3500);
  toastState = st;
}
// Löschen mit „Rückgängig“ statt Rückfrage.
function withUndo(msg, change, onCommit) {
  const snap = JSON.stringify(db);
  change();
  save();
  render();
  toast(msg, {
    action: 'Rückgängig', timeout: 7000,
    onAction: () => { db = JSON.parse(snap); save(); render(); toast('Wiederhergestellt.'); },
    onExpire: onCommit
  });
}

function openModal(html, o = {}) {
  ui.modal = o;
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-a="backdrop"><div class="modal ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
}
function refreshModal(html) {
  const m = $('#modal-root .modal');
  if (!m) return openModal(html, ui.modal || {});
  const st = m.scrollTop;
  m.innerHTML = html;
  m.scrollTop = st;
}
function closeModal() { $('#modal-root').innerHTML = ''; ui.draft = null; ui.csv = null; ui.modal = null; }
function modalHead(title) {
  return `<div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-a="modal-close" aria-label="Schließen">${ic('x')}</button></div>`;
}
function lightbox(src) {
  if (!src) return;
  const d = document.createElement('div');
  d.className = 'lightbox';
  d.innerHTML = `<img src="${src}" alt="">`;
  d.addEventListener('click', () => d.remove());
  document.body.appendChild(d);
}

let wakeLock = null;
async function updateWake() {
  const want = ui.tab === 'workout' && !!db.active && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (e) { /* nicht unterstützt oder abgelehnt */ }
}

function deltaHtml(d) {
  if (d == null) return '';
  if (Math.abs(d) < 0.05) return `<span class="delta eq">${ic('eq')}± 0 %</span>`;
  return d > 0
    ? `<span class="delta up">${ic('arrowUp')}+${fmt1(d)} %</span>`
    : `<span class="delta down">${ic('arrowDown')}${fmt1(d)} %</span>`;
}
function thumb(ex, size = '') {
  const src = ex.hasImg ? getImg(ex.id) : null;
  return src ? `<img class="thumb ${size}" src="${src}" alt="">` : `<div class="thumb ${size}">${ic('dumbbell')}</div>`;
}

/* ================= 5 Ansichten ================= */
const VIEWS = {
  workout: () => (db.active ? viewActive() : viewWorkoutHome()),
  plans: viewPlans,
  history: viewHistory,
  exercises: viewExercises,
  data: viewData
};

function viewWorkoutHome() {
  const plans = db.plans.filter((p) => !p.archived).sort(byName);
  const series = buildSeries();
  let h = '<div class="view-inner narrow"><div class="page-head"><h1>Training</h1></div>';
  if (needsBackup()) {
    h += `<div class="callout note" style="margin:0 0 14px"><div class="row"><span>${db.meta.sinceExport} Workouts seit der letzten Sicherung.</span><button class="btn sm" data-a="backup">Jetzt sichern</button></div></div>`;
  }
  if (!db.exercises.length) {
    h += `<div class="card"><h3>Willkommen bei AO fitlog</h3><p class="muted small" style="margin-top:6px">Noch keine Übungen vorhanden. Importiere die Startdaten oder eine Sicherung, oder lege Übungen selbst an.</p>
      <div class="card-actions"><button class="btn" data-a="tab" data-tab="data">${ic('upload')}Daten importieren</button><button class="btn ghost" data-a="tab" data-tab="exercises">Übungen anlegen</button></div></div>`;
  }
  h += '<div class="section-title">Plan starten</div>';
  if (!plans.length) {
    h += `<div class="empty">Noch kein Plan vorhanden.<div style="margin-top:10px"><button class="btn sm ghost" data-a="tab" data-tab="plans">Zu den Plänen</button></div></div>`;
  }
  for (const p of plans) {
    const last = db.workouts.filter((w) => w.planId === p.id).sort((a, b) => b.start - a.start)[0];
    const st = last ? workoutStats(last, series) : null;
    h += `<div class="card"><div class="card-row"><div class="grow"><div class="card-title">${esc(p.name)}</div>
      <div class="card-sub">${p.items.length} Übungen · ${last ? 'zuletzt ' + fmtDate(last.start) : 'noch nicht trainiert'}${st && st.index != null ? ' · Ø-Index ' + fmt1(st.index) : ''}</div></div></div>
      <div class="card-actions"><button class="btn" data-a="start-plan" data-id="${p.id}">${ic('play')}Starten</button><button class="btn ghost" data-a="retro-plan" data-id="${p.id}">Nacherfassen</button></div></div>`;
  }
  h += `<div class="section-title">Ohne Plan</div><div class="btn-row"><button class="btn ghost" data-a="free-new">Freies Training</button><button class="btn ghost" data-a="free-retro">Frei nacherfassen</button></div></div>`;
  return h;
}

function viewActive() {
  const a = db.active;
  const { done, total } = progress(a);
  const pct = total ? Math.round(done / total * 100) : 0;
  let h = '<div class="view-inner narrow">';
  h += `<div class="wo-head"><div class="title-row"><div><div class="xsmall muted">${a.retro ? 'Nacherfassen' : 'Läuft seit ' + fmtTime(a.start) + ' Uhr'}</div><h2>${esc(a.title)}</h2></div>
    <div class="btn-row" style="flex-wrap:nowrap"><button class="btn sm ghost" data-a="wo-cancel">Abbrechen</button><button class="btn sm lime" data-a="wo-finish">${a.retro ? 'Speichern' : 'Abschließen'}</button></div></div>
    ${total ? `<div class="progress"><div style="width:${pct}%"></div></div><div class="progress-label"><span>${done} von ${total} Sätzen</span><span>${pct} %</span></div>` : ''}</div>`;
  if (a.retro) {
    h += `<div class="card"><div class="field"><label class="label" for="rd">Datum</label><input type="date" id="rd" value="${esc(a.retroDate)}" data-c="retro" data-f="retroDate"></div><div class="row2">
      <div><label class="label" for="rt">Beginn</label><input type="time" id="rt" value="${esc(a.retroTime)}" data-c="retro" data-f="retroTime"></div>
      <div><label class="label" for="rm">Dauer (Min.)</label><input type="text" inputmode="numeric" id="rm" value="${esc(a.retroDur)}" data-c="retro" data-f="retroDur"></div></div>
      ${a.entries.length ? `<div class="card-actions"><button class="btn sm ghost" data-a="check-all">${ic('check')}Alle Sätze abhaken</button></div>` : ''}</div>`;
  }
  const notes = `<textarea data-in="wo-notes" placeholder="Was hast du gemacht? Wie lief es?">${esc(a.notes || '')}</textarea>`;
  if (!a.planId) h += `<div class="card"><label class="label">Notizen zum Training</label>${notes}</div>`;
  h += a.entries.map((e, i) => viewEntry(e, i)).join('');
  h += `<button class="btn ghost block" data-a="wo-add-ex" style="margin-top:4px">${ic('plus')}Übung hinzufügen</button>`;
  if (a.planId) h += `<details class="more"><summary>${ic('edit')}Notiz zum Workout</summary><div class="more-body">${notes}</div></details>`;
  return h + '</div>';
}

function viewEntry(e, i) {
  const ex = exById(e.exId) || {};
  const complete = isComplete(e);
  const open = isOpen(i);
  const doneCount = e.sets.filter((s) => s.done).length;
  const status = e.skipped ? 'Übersprungen'
    : complete ? esc(setsText(e.type, e.sets)) + (e.perSide ? ' je Seite' : '')
    : `${doneCount}/${e.sets.length} Sätze · ${TYPE_LABEL[e.type]}${e.perSide ? ' · je Seite' : ''}`;
  const mark = complete ? `<span class="done-mark">${ic('check')}</span>` : '';
  let h = `<section class="entry ${complete ? 'complete' : ''} ${e.skipped ? 'skipped' : ''}" id="entry-${i}">
    <button class="entry-head" data-a="toggle-entry" data-i="${i}" aria-expanded="${open}">${mark}<div class="grow"><div class="entry-name">${esc(e.name)}</div><div class="entry-status">${status}</div></div>${ic(open ? 'up' : 'down')}</button>`;
  if (!open) return h + '</section>';

  h += '<div class="entry-body">';
  if (e.lastNote) h += `<div class="callout note"><b>Notiz vom ${fmtShort(e.lastNote.date)}:</b> ${esc(e.lastNote.text)}</div>`;
  if (ex.comment) h += `<div class="callout info">${esc(ex.comment)}</div>`;
  if (e.suggestion && !e.skipped) {
    if (e.suggestion.hold) h += `<div class="callout info">${esc(e.suggestion.text)}</div>`;
    else if (!e.suggestion.applied) h += `<div class="callout tip"><div class="row"><span><b>Vorschlag:</b> ${esc(e.suggestion.text)}</span><button class="btn sm lime" data-a="apply-sug" data-i="${i}">Übernehmen</button></div></div>`;
    else h += `<div class="callout tip small">Vorschlag übernommen.</div>`;
  }
  const src = ex.hasImg ? getImg(ex.id) : null;
  if (src || ex.desc || safeUrl(ex.url)) {
    h += `<details class="more"><summary>${ic('image')}Technik &amp; Bild</summary><div class="more-body prose">
      ${src ? `<img class="ex-img" src="${src}" alt="" data-a="zoom" data-id="${ex.id}">` : ''}${textBlock(ex.desc)}
      ${safeUrl(ex.url) ? `<p><a href="${esc(safeUrl(ex.url))}" target="_blank" rel="noopener">${ic('link', 'inline')} Quelle öffnen</a></p>` : ''}</div></details>`;
  }
  if (!e.skipped) {
    const isW = e.type === 'weight';
    const unit = e.type === 'time' ? 'Sek' : 'Wdh';
    h += `<div class="sets"><div class="sets-head ${isW ? '' : 'one'}"><span>#</span>${isW ? '<span>kg</span>' : ''}<span>${unit}${e.perSide ? ' je Seite' : ''}</span><span>OK</span></div>`;
    e.sets.forEach((s, k) => {
      const last = e.last ? (e.last[k] || null) : null;
      let lastLine = '';
      if (last) {
        const lastTxt = isW ? `${fmt(last.w)} × ${fmt(last.r)}` : `${fmt(last.r)}${e.type === 'time' ? ' s' : ''}`;
        let cmp = '';
        if (s.done) {
          const d = setVal(e.type, s) - setVal(e.type, last);
          cmp = d > 1e-9 ? '<span class="beat">▲ mehr</span>' : d < -1e-9 ? '<span class="less">▼ weniger</span>' : '<span>= gleich</span>';
        }
        lastLine = `<div class="set-last"><span>zuletzt ${lastTxt}</span>${cmp}</div>`;
      }
      h += `<div class="set ${s.done ? 'done' : ''}" id="set-${i}-${k}"><div class="set-row ${isW ? '' : 'one'}"><span class="set-num">${k + 1}</span>
        ${isW ? stepper(i, k, 'w', s.w) : ''}${stepper(i, k, 'r', s.r)}
        <button class="check-btn" data-a="check" data-i="${i}" data-k="${k}" aria-label="Satz ${k + 1} erledigt">${ic('check')}</button></div>${lastLine}</div>`;
    });
    h += '</div>';
    h += `<div class="set-tools"><button class="link-btn" data-a="set-add" data-i="${i}">${ic('plus')}Satz</button>${e.sets.length > 1 ? `<button class="link-btn" data-a="set-del" data-i="${i}">${ic('minus')}Satz</button>` : ''}</div>`;
    h += `<div class="label" style="margin-top:12px">Wie war's?</div><div class="chips">${Object.keys(EFFORT).map((k) =>
      `<button class="chip ${e.effort === k ? 'on' : ''} ${k === 'schwer' ? 'hard' : ''}" data-a="effort" data-i="${i}" data-v="${k}">${EFFORT[k]}</button>`).join('')}</div>`;
  }
  h += `<div style="margin-top:12px"><textarea data-in="entry-note" data-i="${i}" rows="2" placeholder="Notiz fürs nächste Mal (z. B. Gerät belegt, Knie zwickt)">${esc(e.note)}</textarea></div>`;
  h += `<div class="entry-tools"><button class="btn sm ghost" data-a="skip" data-i="${i}">${ic('skip')}${e.skipped ? 'Doch machen' : 'Überspringen'}</button>
    ${e.added ? `<button class="btn sm danger" data-a="entry-del" data-i="${i}">${ic('trash')}Entfernen</button>` : ''}</div>`;
  return h + '</div></section>';
}
function stepper(i, k, f, val) {
  const lbl = f === 'w' ? 'Gewicht' : 'Wert';
  return `<div class="stepper"><button data-a="step" data-i="${i}" data-k="${k}" data-f="${f}" data-d="-1" aria-label="${lbl} verringern">${ic('minus')}</button>
    <input type="text" inputmode="decimal" id="v-${i}-${k}-${f}" value="${fmt(val)}" data-c="setval" data-i="${i}" data-k="${k}" data-f="${f}" aria-label="${lbl} Satz ${k + 1}">
    <button data-a="step" data-i="${i}" data-k="${k}" data-f="${f}" data-d="1" aria-label="${lbl} erhöhen">${ic('plus')}</button></div>`;
}

function viewPlans() {
  const active = db.plans.filter((p) => !p.archived).sort(byName);
  const archived = db.plans.filter((p) => p.archived).sort(byName);
  let h = `<div class="view-inner"><div class="page-head"><h1>Pläne</h1><button class="btn" data-a="plan-new">${ic('plus')}Neuer Plan</button></div>`;
  if (!active.length) h += '<div class="empty">Noch keine aktiven Pläne. Lege einen neuen Plan an.</div>';
  h += `<div class="grid cols">${active.map((p) => planCard(p)).join('')}</div>`;
  if (archived.length) {
    h += `<button class="section-title link-btn" data-a="toggle-archive" style="padding:0">${ic(ui.showArchive ? 'up' : 'down')}Archiv (${archived.length})</button>`;
    if (ui.showArchive) h += `<div class="grid cols">${archived.map((p) => planCard(p, true)).join('')}</div>`;
  }
  return h + '</div>';
}
function planCard(p, isArchived) {
  const used = planUsed(p.id);
  const sets = p.items.reduce((a, it) => a + (+it.sets || 0), 0);
  const last = db.workouts.filter((w) => w.planId === p.id).sort((a, b) => b.start - a.start)[0];
  const names = p.items.map((it) => (exById(it.exId) || {}).name).filter(Boolean);
  return `<div class="card"><div class="card-title">${esc(p.name)}</div>
    <div class="card-sub">${p.items.length} Übungen · ${sets} Sätze${last ? ' · zuletzt ' + fmtDate(last.start) : ''}</div>
    <div class="badges">${used ? `<span class="badge">${ic('lock')}Struktur gesperrt</span>` : ''}${isArchived ? '<span class="badge">archiviert</span>' : ''}</div>
    <div class="small faint" style="margin-top:8px">${esc(names.slice(0, 4).join(' · '))}${names.length > 4 ? ' …' : ''}</div>
    <div class="card-actions">
      <button class="btn sm ghost" data-a="plan-edit" data-id="${p.id}">${ic('edit')}Bearbeiten</button>
      <button class="btn sm ghost" data-a="plan-copy" data-id="${p.id}">${ic('copy')}Kopieren</button>
      ${isArchived ? `<button class="btn sm ghost" data-a="plan-unarchive" data-id="${p.id}">${ic('restore')}Wiederherstellen</button>`
        : used ? `<button class="btn sm ghost" data-a="plan-archive" data-id="${p.id}">${ic('archive')}Archivieren</button>`
          : `<button class="btn sm danger" data-a="plan-del" data-id="${p.id}">${ic('trash')}Löschen</button>`}
    </div></div>`;
}

function viewHistory() {
  const now = new Date();
  const m = ui.calMonth || new Date(now.getFullYear(), now.getMonth(), 1);
  const y = m.getFullYear(), mo = m.getMonth();
  const hits = new Set(db.workouts.map((w) => dayKey(w.start)));
  const first = (new Date(y, mo, 1).getDay() + 6) % 7;
  const days = new Date(y, mo + 1, 0).getDate();
  let cal = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < first; i++) cal += '<div class="day out"></div>';
  for (let d = 1; d <= days; d++) {
    const k = y + '-' + mo + '-' + d;
    const today = k === dayKey(now);
    cal += `<div class="day ${hits.has(k) ? 'hit' : ''} ${today ? 'today' : ''}">${d}</div>`;
  }
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const week = db.workouts.filter((w) => w.start >= monday.getTime()).length;
  const month = db.workouts.filter((w) => { const d = new Date(w.start); return d.getFullYear() === y && d.getMonth() === mo; }).length;
  const monthName = m.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  let h = `<div class="view-inner narrow"><div class="page-head"><h1>Verlauf</h1></div>
    <div class="card"><div class="cal-head"><button class="icon-btn" data-a="cal" data-d="-1" aria-label="Voriger Monat">${ic('left')}</button><b>${monthName}</b><button class="icon-btn" data-a="cal" data-d="1" aria-label="Nächster Monat">${ic('right')}</button></div>
    <div class="cal">${cal}</div>
    <div class="stats"><div class="stat"><b>${week}</b><span>diese Woche</span></div><div class="stat"><b>${month}</b><span>im ${m.toLocaleDateString('de-DE', { month: 'long' })}</span></div><div class="stat"><b>${db.workouts.length}</b><span>gesamt</span></div></div></div>`;
  const list = [...db.workouts].sort((a, b) => b.start - a.start);
  if (!list.length) return h + '<div class="empty">Noch keine Workouts gespeichert.</div></div>';
  const series = buildSeries();
  h += '<div class="section-title">Workouts</div>';
  for (const w of list) {
    const st = workoutStats(w, series);
    h += `<button class="card" style="display:block;width:100%;text-align:left" data-a="wo-open" data-id="${w.id}"><div class="card-row"><div class="grow">
      <div class="card-title">${esc(w.title)}</div><div class="card-sub">${fmtDate(w.start)} · ${fmtTime(w.start)} Uhr · ${w.durationMin} Min.${w.retro ? ' · nacherfasst' : ''}</div></div>
      <div style="text-align:right">${st.index != null ? `<div class="small"><b>${fmt1(st.index)}</b> <span class="faint">Index</span></div>` : ''}${deltaHtml(st.trend)}${st.records ? `<div class="star small">${STAR}${st.records}</div>` : ''}</div></div></button>`;
  }
  return h + '</div>';
}

function viewExercises() {
  return `<div class="view-inner"><div class="page-head"><h1>Übungen</h1><div class="btn-row">
    <button class="btn ghost" data-a="csv-open">${ic('upload')}Import</button><button class="btn" data-a="ex-new">${ic('plus')}Neue Übung</button></div></div>
    <div class="search">${ic('search')}<input type="search" placeholder="Übung suchen" value="${esc(ui.exQuery)}" data-in="ex-q" aria-label="Übung suchen"></div>
    <div id="ex-list">${exerciseList()}</div></div>`;
}
function exerciseList() {
  const q = ui.exQuery.trim().toLowerCase();
  const list = db.exercises.filter((e) => !q || e.name.toLowerCase().includes(q)).sort(byName);
  if (!db.exercises.length) return '<div class="empty">Noch keine Übungen. Lege eine an oder importiere eine Liste.</div>';
  if (!list.length) return '<div class="empty">Keine Übung gefunden.</div>';
  return `<div class="grid cols">${list.map((ex) => {
    const last = lastEntry(ex.id);
    return `<button class="card" style="display:block;width:100%;text-align:left" data-a="ex-edit" data-id="${ex.id}"><div class="card-row">${thumb(ex)}<div class="grow">
      <div class="card-title">${esc(ex.name)}</div>
      <div class="badges"><span class="badge">${TYPE_LABEL[ex.type]}</span>${ex.perSide ? '<span class="badge">je Seite</span>' : ''}${ex.scored === false ? '<span class="badge">ohne Wertung</span>' : ''}${exUsed(ex.id) ? `<span class="badge">${ic('lock')}Typ fest</span>` : ''}</div>
      <div class="card-sub">${last ? 'zuletzt ' + esc(setsText(ex.type, last.entry.sets)) : 'noch nicht trainiert'}</div></div></div></button>`;
  }).join('')}</div>`;
}

function canShareFiles() {
  try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.txt', { type: 'text/plain' })] })); } catch (e) { return false; }
}
function viewData() {
  const last = db.meta.lastExport ? `${fmtDate(db.meta.lastExport)}, ${fmtTime(db.meta.lastExport)} Uhr` : 'noch nie';
  const share = canShareFiles();
  return `<div class="view-inner narrow"><div class="page-head"><h1>Daten</h1></div>
    <div class="card"><h3>Dieses Gerät</h3><div class="field" style="margin-top:10px;margin-bottom:0"><label for="dev">Gerätename (erscheint im Dateinamen)</label>
      <input type="text" id="dev" value="${esc(db.device)}" placeholder="z. B. Handy oder PC" data-c="device"></div></div>
    <div class="card"><h3>Sichern &amp; übertragen</h3>
      <p class="small muted" style="margin-top:6px">Letzte Sicherung: <b>${last}</b>${db.meta.sinceExport ? ` · seitdem ${db.meta.sinceExport} Workout(s)` : ''}</p>
      <div class="card-actions">${share ? `<button class="btn" data-a="export-share">${ic('share')}Teilen …</button>` : ''}<button class="btn ${share ? 'ghost' : ''}" data-a="export-file">${ic('download')}Als Datei speichern</button></div>
      <p class="hint">Die Datei enthält alle Übungen (mit Bildern), Pläne und Workouts.</p></div>
    <div class="card"><h3>Importieren</h3>
      <p class="small muted" style="margin-top:6px">Sicherung vom anderen Gerät oder Startdaten einlesen. Die Daten werden zusammengeführt – nichts wird blind überschrieben. Vor dem Übernehmen siehst du eine Vorschau.</p>
      <div style="margin-top:10px"><input class="file-input" type="file" accept=".json,.txt,application/json,text/plain" data-c="import-file" aria-label="Sicherungsdatei wählen"></div></div>
    <div class="card"><h3>Speicher</h3><p class="small muted" style="margin-top:6px">Belegt: ca. ${storageUsedKB()} KB von etwa 5.000 KB (${Math.round(storageUsedKB() / 50)} %).</p></div>
    <div class="card"><h3>Hilfe</h3><p class="small muted" style="margin-top:6px">AO fitlog Version ${APP_VERSION}</p>
      <div class="card-actions"><a class="btn ghost" href="anleitung.html" target="_blank" rel="noopener">${ic('help')}Anleitung öffnen</a></div></div></div>`;
}

/* ================= 6 Dialoge ================= */
function showWorkout(id, justFinished) {
  const w = db.workouts.find((x) => x.id === id);
  if (!w) return;
  const st = workoutStats(w);
  const rows = st.rows.map((r) => `<div class="res-row"><div class="grow">
      <div class="res-name">${esc(r.e.name)} ${r.record ? `<span class="star" title="Neue Bestleistung">${STAR}</span>` : ''}</div>
      <div class="res-sets">${r.e.skipped ? 'übersprungen' : esc(setsText(r.e.type, r.e.sets))}${r.e.perSide && !r.e.skipped ? ' je Seite' : ''}</div>
      ${r.e.effort ? `<div class="xsmall faint">Gefühl: ${EFFORT[r.e.effort]}</div>` : ''}
      ${r.e.note ? `<div class="xsmall orange">Notiz: ${esc(r.e.note)}</div>` : ''}
      ${!r.scored ? '<div class="xsmall faint">ohne Wertung</div>' : ''}</div>
      <div>${!r.scored ? '' : r.delta != null ? deltaHtml(r.delta) : r.first ? '<span class="badge">Basis</span>' : ''}</div></div>`).join('');
  const html = `${modalHead(justFinished ? 'Workout gespeichert' : w.title)}
    <div class="small muted">${justFinished ? esc(w.title) + ' · ' : ''}${fmtDate(w.start)} · ${fmtTime(w.start)} Uhr · ${w.durationMin} Min.</div>
    <div class="kpis"><div class="kpi"><b>${st.index != null ? fmt1(st.index) : '–'}</b><span>Ø-Index</span></div>
      <div class="kpi"><b>${st.trend != null ? deltaHtml(st.trend) : '–'}</b><span>Trend</span></div>
      <div class="kpi"><b>${st.records}</b><span>Bestleistungen</span></div></div>
    <p class="hint" style="margin-top:-6px;margin-bottom:10px">Index 100 = dein erstes Training der Übung. Trend = Veränderung zum letzten Training der jeweiligen Übung.</p>
    ${w.notes ? `<div class="callout info" style="margin-bottom:10px">${esc(w.notes)}</div>` : ''}
    <div>${rows || '<p class="muted small">Keine Übungen erfasst.</p>'}</div>
    <div class="modal-foot">${justFinished && needsBackup() ? `<button class="btn" data-a="backup">${ic('share')}Jetzt sichern</button>` : ''}
      ${!justFinished ? `<button class="btn danger" data-a="wo-del" data-id="${w.id}">${ic('trash')}Löschen</button>` : ''}
      <button class="btn ghost" data-a="modal-close">Schließen</button></div>`;
  openModal(html, { dismiss: true });
}

function planEditorHtml() {
  const d = ui.draft;
  const exs = [...db.exercises].sort(byName);
  let h = modalHead(d.id ? 'Plan bearbeiten' : 'Neuer Plan');
  if (d.locked) {
    h += `<div class="callout info" style="margin:0 0 14px">${ic('lock')} Mit diesem Plan wurde bereits trainiert. Name, Reihenfolge und Zielwerte kannst du ändern. Für andere Übungen oder Satzzahlen lege eine neue Version an.
      <div style="margin-top:10px"><button class="btn sm lime" data-a="plan-version">${ic('copy')}Als neue Version anlegen</button></div></div>`;
  }
  h += `<div class="field"><label for="pn">Name</label><input type="text" id="pn" value="${esc(d.name)}" data-in="pd-name" placeholder="z. B. Ganzkörper A"></div>`;
  h += '<div class="label">Übungen</div>';
  if (!d.items.length) h += '<div class="empty" style="padding:16px">Noch keine Übungen im Plan.</div>';
  h += d.items.map((it, idx) => {
    const ex = exById(it.exId);
    const type = ex ? ex.type : 'bodyweight';
    return `<div class="pe-item" data-pe="${idx}">
      <div class="pe-top"><span class="grip" data-grip="${idx}" title="Ziehen zum Verschieben">${ic('grip')}</span>
        <div class="grow">${esc(ex ? ex.name : '(Übung gelöscht)')} <span class="badge">${TYPE_LABEL[type]}</span></div>
        <button class="icon-btn" data-a="pe-move" data-i="${idx}" data-d="-1" aria-label="Nach oben" ${idx === 0 ? 'disabled' : ''}>${ic('up')}</button>
        <button class="icon-btn" data-a="pe-move" data-i="${idx}" data-d="1" aria-label="Nach unten" ${idx === d.items.length - 1 ? 'disabled' : ''}>${ic('down')}</button>
        ${d.locked ? '' : `<button class="icon-btn" data-a="pe-del" data-i="${idx}" aria-label="Entfernen">${ic('trash')}</button>`}</div>
      <div class="pe-fields">
        <div><label>Sätze</label><input type="text" inputmode="numeric" value="${it.sets}" data-c="pe-field" data-i="${idx}" data-f="sets" ${d.locked ? 'disabled' : ''}></div>
        <div><label>${type === 'time' ? 'Sekunden' : 'Wdh'}</label><input type="text" inputmode="decimal" value="${fmt(it.r)}" data-c="pe-field" data-i="${idx}" data-f="r"></div>
        ${type === 'weight' ? `<div><label>kg</label><input type="text" inputmode="decimal" value="${fmt(it.w)}" data-c="pe-field" data-i="${idx}" data-f="w"></div>` : '<div></div>'}
      </div></div>`;
  }).join('');
  if (!d.locked) {
    h += `<div class="field" style="margin-top:10px"><select data-c="pe-add" aria-label="Übung hinzufügen"><option value="">+ Übung hinzufügen …</option>${exs.map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select>
      <p class="hint">Zielwerte gelten nur beim allerersten Training einer Übung. Danach übernimmt die App die Werte vom letzten Mal.</p></div>`;
  }
  h += `<div class="modal-foot"><button class="btn ghost" data-a="modal-close">Abbrechen</button><button class="btn" data-a="plan-save">Speichern</button></div>`;
  return h;
}
function openPlanEditor(plan) {
  ui.draft = plan
    ? { kind: 'plan', id: plan.id, name: plan.name, items: plan.items.map((x) => ({ ...x })), locked: planUsed(plan.id), archived: !!plan.archived }
    : { kind: 'plan', id: null, name: '', items: [], locked: false, archived: false };
  openModal(planEditorHtml(), { wide: true });
  bindPlanDnD();
}
function refreshPlanEditor() { refreshModal(planEditorHtml()); bindPlanDnD(); }
function bindPlanDnD() {
  let from = null;
  document.querySelectorAll('.pe-item').forEach((el) => {
    const grip = el.querySelector('[data-grip]');
    if (grip) grip.addEventListener('mousedown', () => { el.draggable = true; });
    el.addEventListener('dragstart', (ev) => { from = +el.dataset.pe; el.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(from)); });
    el.addEventListener('dragend', () => { el.draggable = false; el.classList.remove('dragging'); });
    el.addEventListener('dragover', (ev) => { ev.preventDefault(); el.classList.add('drop-target'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', (ev) => {
      ev.preventDefault();
      el.classList.remove('drop-target');
      const to = +el.dataset.pe;
      if (from == null || from === to) return;
      const [it] = ui.draft.items.splice(from, 1);
      ui.draft.items.splice(to, 0, it);
      refreshPlanEditor();
    });
  });
}

function exEditorHtml() {
  const d = ui.draft;
  const stepLabel = d.type === 'weight' ? 'Steigerung Gewicht (kg)' : d.type === 'time' ? 'Steigerung (Sekunden)' : 'Steigerung (Wdh)';
  let h = modalHead(d.id ? 'Übung bearbeiten' : 'Neue Übung');
  h += `<div class="field"><label for="xn">Name</label><input type="text" id="xn" value="${esc(d.name)}" data-in="xd" data-f="name" placeholder="z. B. Goblet Squat"></div>
    <div class="row2"><div class="field"><label for="xt">Typ</label><select id="xt" data-c="xd-type" ${d.typeLocked ? 'disabled' : ''}>
      ${Object.keys(TYPE_LABEL).map((t) => `<option value="${t}" ${d.type === t ? 'selected' : ''}>${TYPE_LABEL[t]}</option>`).join('')}</select>
      ${d.typeLocked ? '<p class="hint">Fest, weil bereits trainiert.</p>' : ''}</div>
      <div class="field"><label for="xs">${stepLabel}</label><input type="text" inputmode="decimal" id="xs" value="${fmt(d.step)}" data-in="xd" data-f="step"><p class="hint">Größe eines Steigerungsschritts im Vorschlag.</p></div></div>`;
  if (d.type === 'weight') {
    h += `<div class="row2"><div class="field"><label for="xmin">Wdh-Bereich von</label><input type="text" inputmode="numeric" id="xmin" value="${d.repMin}" data-in="xd" data-f="repMin"></div>
      <div class="field"><label for="xmax">bis</label><input type="text" inputmode="numeric" id="xmax" value="${d.repMax}" data-in="xd" data-f="repMax"></div></div>
      <p class="hint" style="margin:-8px 0 14px">Erst steigen die Wiederholungen bis zum oberen Wert, dann das Gewicht.</p>`;
  }
  h += `<label class="check"><input type="checkbox" data-c="xd-check" data-f="perSide" ${d.perSide ? 'checked' : ''}> Je Seite (einseitige Übung)</label>
    <label class="check"><input type="checkbox" data-c="xd-check" data-f="scored" ${d.scored ? 'checked' : ''}> Zählt zum Score <span class="faint small">(aus für Mobilisation)</span></label>
    <div class="field" style="margin-top:10px"><div class="label">Bild</div><div class="img-drop" id="imgDrop">
      ${d.img ? `<img src="${d.img}" alt="" data-a="zoom-draft">` : ''}
      <div>Bild mit <b>Strg+V</b> einfügen, hierher ziehen oder auswählen</div>
      <div class="btn-row" style="justify-content:center;margin-top:10px"><label class="btn sm ghost" style="flex:0">${ic('image')}Datei wählen<input type="file" accept="image/*" data-c="xd-img" hidden></label>
      ${d.img ? `<button class="btn sm danger" style="flex:0" data-a="xd-img-del">${ic('trash')}Entfernen</button>` : ''}</div></div></div>
    <div class="field"><label for="xd">Beschreibung / Technik</label><textarea id="xd" rows="4" data-in="xd" data-f="desc">${esc(d.desc)}</textarea></div>
    <div class="field"><label for="xc">Kommentar / Einstellung</label><textarea id="xc" rows="2" data-in="xd" data-f="comment" placeholder="z. B. Sitzhöhe 3">${esc(d.comment)}</textarea><p class="hint">Wird im Training immer sichtbar angezeigt.</p></div>
    <div class="field"><label for="xu">Link (z. B. Video)</label><input type="url" id="xu" value="${esc(d.url)}" data-in="xd" data-f="url" placeholder="https://"></div>
    <div class="modal-foot">${d.id ? `<button class="btn danger" data-a="ex-del" data-id="${d.id}">${ic('trash')}</button>` : ''}<button class="btn ghost" data-a="modal-close">Abbrechen</button><button class="btn" data-a="ex-save">Speichern</button></div>`;
  return h;
}
function openExEditor(ex) {
  ui.draft = ex
    ? { kind: 'ex', id: ex.id, name: ex.name, type: ex.type, perSide: !!ex.perSide, scored: ex.scored !== false, repMin: ex.repMin || 8, repMax: ex.repMax || 12,
      step: +ex.step > 0 ? +ex.step : DEFAULT_STEP[ex.type], desc: ex.desc || '', comment: ex.comment || '', url: ex.url || '',
      img: ex.hasImg ? getImg(ex.id) : null, imgChanged: false, typeLocked: exUsed(ex.id) }
    : { kind: 'ex', id: null, name: '', type: 'weight', perSide: false, scored: true, repMin: 8, repMax: 12, step: DEFAULT_STEP.weight, desc: '', comment: '', url: '', img: null, imgChanged: false, typeLocked: false };
  openModal(exEditorHtml());
  bindImgDrop();
}
function refreshExEditor() { refreshModal(exEditorHtml()); bindImgDrop(); }
function bindImgDrop() {
  const z = $('#imgDrop');
  if (!z) return;
  z.addEventListener('dragover', (ev) => { ev.preventDefault(); z.classList.add('over'); });
  z.addEventListener('dragleave', () => z.classList.remove('over'));
  z.addEventListener('drop', (ev) => {
    ev.preventDefault();
    z.classList.remove('over');
    const f = [...(ev.dataTransfer.files || [])].find((x) => x.type.startsWith('image/'));
    if (f) takeDraftImage(f);
  });
}
async function takeDraftImage(blob) {
  try {
    ui.draft.img = await downscale(blob);
    ui.draft.imgChanged = true;
    refreshExEditor();
  } catch (e) { toast('Bild konnte nicht gelesen werden.', { error: true }); }
}

function freeStartHtml(retro) {
  const now = new Date();
  return `${modalHead(retro ? 'Freies Training nacherfassen' : 'Freies Training')}
    <div class="field"><label for="ft">Titel</label><input type="text" id="ft" value="Freies Training" placeholder="z. B. Joggen, Mobilität"></div>
    <div class="field"><label for="fn">Notizen</label><textarea id="fn" rows="3" placeholder="Was hast du vor bzw. gemacht?"></textarea></div>
    <p class="hint">Übungen aus deiner Liste kannst du im Training mit „Übung hinzufügen“ ergänzen.</p>
    <div class="modal-foot"><button class="btn ghost" data-a="modal-close">Abbrechen</button><button class="btn" data-a="free-start" data-retro="${retro ? 1 : 0}">${retro ? 'Weiter' : 'Starten'}</button></div>`;
}

function addExHtml(q = '') {
  const s = q.trim().toLowerCase();
  const list = db.exercises.filter((e) => !s || e.name.toLowerCase().includes(s)).sort(byName);
  return `${modalHead('Übung hinzufügen')}<div class="search">${ic('search')}<input type="search" id="addq" placeholder="Suchen" value="${esc(q)}" data-in="add-q"></div>
    <div id="add-list">${list.map((e) => `<button class="card tight" style="display:block;width:100%;text-align:left" data-a="add-ex" data-id="${e.id}"><div class="card-row">${thumb(e)}<div class="grow"><div class="card-title">${esc(e.name)}</div><div class="card-sub">${TYPE_LABEL[e.type]}</div></div></div></button>`).join('') || '<div class="empty">Keine Übung gefunden.</div>'}</div>`;
}

/* ================= 7 Aktionen ================= */
function newActive(fields) {
  const now = new Date();
  const back = new Date(now.getTime() - 60 * 60000);
  return Object.assign({
    id: uid(), planId: null, planName: '', title: 'Training', start: now.getTime(), retro: false, notes: '', entries: [],
    retroDate: isoDate(back), retroTime: isoTime(back), retroDur: 60
  }, fields);
}
function planEntries(plan) {
  const missing = [];
  const entries = [];
  for (const it of plan.items) {
    const ex = exById(it.exId);
    if (!ex) { missing.push(it); continue; }
    entries.push(buildEntry(ex, it));
  }
  if (missing.length) toast(`${missing.length} Übung(en) des Plans existieren nicht mehr und wurden ausgelassen.`);
  return entries;
}
function scrollToNext(i, k) {
  const a = db.active;
  const view = $('#view');
  for (let x = i; x < a.entries.length; x++) {
    const e = a.entries[x];
    if (e.skipped) continue;
    for (let y = x === i ? k + 1 : 0; y < e.sets.length; y++) {
      if (!e.sets[y].done) {
        const el = document.getElementById(`set-${x}-${y}`);
        if (el) {
          const r = el.getBoundingClientRect(), vr = view.getBoundingClientRect();
          if (r.top < vr.top + 150 || r.bottom > vr.bottom - 20) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        return;
      }
    }
  }
}
function finishWorkout() {
  const a = db.active;
  const { done, total } = progress(a);
  const verb = a.retro ? 'speichern' : 'abschließen';
  const msg = total - done > 0 ? `Noch ${total - done} Sätze offen. Offene Sätze zählen nicht.\n\nTrotzdem ${verb}?` : `Workout ${verb}?`;
  if (!confirm(msg)) return;
  let start = a.start, dur;
  if (a.retro) {
    const ts = new Date(`${a.retroDate}T${a.retroTime || '12:00'}`).getTime();
    if (!isFinite(ts)) { toast('Bitte Datum und Beginn angeben.', { error: true }); return; }
    start = ts;
    dur = Math.max(1, Math.round(num(a.retroDur)) || 1);
  } else {
    dur = Math.max(1, Math.round((Date.now() - a.start) / 60000));
  }
  const w = {
    id: a.id, planId: a.planId, planName: a.planName, title: a.title, start, durationMin: dur, retro: !!a.retro,
    notes: (a.notes || '').trim(), updatedAt: Date.now(),
    entries: a.entries.map((e) => ({
      exId: e.exId, name: e.name, type: e.type, perSide: !!e.perSide,
      sets: e.sets.map((s) => ({ w: +s.w || 0, r: +s.r || 0, done: !!s.done })),
      skipped: !!e.skipped, effort: e.effort || null, note: (e.note || '').trim()
    }))
  };
  db.workouts.push(w);
  db.active = null;
  db.meta.sinceExport = (db.meta.sinceExport || 0) + 1;
  ui.open = {};
  save();
  render();
  showWorkout(w.id, true);
}

const ACTIONS = {
  tab: (el) => {
    ui.tab = el.dataset.tab;
    render();
    $('#view').scrollTop = 0;
  },
  'modal-close': () => closeModal(),
  backdrop: (el, ev) => { if (ev.target === el && ui.modal && ui.modal.dismiss) closeModal(); },
  'toast-act': () => {
    const st = toastState;
    if (!st) return;
    clearTimeout(st.t);
    toastState = null;
    $('#toast-root').innerHTML = '';
    if (st.onAction) st.onAction();
  },
  zoom: (el) => lightbox(getImg(el.dataset.id)),
  'zoom-draft': () => lightbox(ui.draft && ui.draft.img),

  // Training starten
  'start-plan': (el) => {
    if (db.active) { toast('Es läuft bereits ein Workout.'); return; }
    const p = planById(el.dataset.id);
    if (!p) return;
    db.active = newActive({ planId: p.id, planName: p.name, title: p.name, entries: planEntries(p) });
    save(); render(); $('#view').scrollTop = 0;
  },
  'retro-plan': (el) => {
    if (db.active) { toast('Es läuft bereits ein Workout.'); return; }
    const p = planById(el.dataset.id);
    if (!p) return;
    db.active = newActive({ planId: p.id, planName: p.name, title: p.name, retro: true, entries: planEntries(p) });
    save(); render(); $('#view').scrollTop = 0;
  },
  'free-new': () => { if (db.active) { toast('Es läuft bereits ein Workout.'); return; } openModal(freeStartHtml(false)); },
  'free-retro': () => { if (db.active) { toast('Es läuft bereits ein Workout.'); return; } openModal(freeStartHtml(true)); },
  'free-start': (el) => {
    const title = ($('#ft').value || '').trim() || 'Freies Training';
    const notes = $('#fn').value || '';
    db.active = newActive({ title, notes, retro: el.dataset.retro === '1' });
    closeModal(); save(); render();
  },

  // Laufendes Workout
  'wo-cancel': () => {
    if (!confirm('Workout abbrechen? Es wird nicht gespeichert.')) return;
    db.active = null; ui.open = {}; save(); render();
  },
  'wo-finish': () => finishWorkout(),
  'toggle-entry': (el) => {
    const i = +el.dataset.i;
    ui.open[i] = !isOpen(i);
    render();
  },
  step: (el) => {
    const i = +el.dataset.i, k = +el.dataset.k, f = el.dataset.f, d = +el.dataset.d;
    const e = db.active.entries[i];
    const s = e.sets[k];
    const ex = exById(e.exId) || {};
    const amount = f === 'w' ? WEIGHT_BUTTON_STEP : e.type === 'time' ? (+ex.step > 0 ? +ex.step : DEFAULT_STEP.time) : 1;
    s[f] = Math.max(0, r2((+s[f] || 0) + d * amount));
    save();
    if (s.done) render();
    else { const inp = document.getElementById(`v-${i}-${k}-${f}`); if (inp) inp.value = fmt(s[f]); }
  },
  check: (el) => {
    const i = +el.dataset.i, k = +el.dataset.k;
    const e = db.active.entries[i];
    e.sets[k].done = !e.sets[k].done;
    if (isComplete(e)) delete ui.open[i];
    save(); render();
    if (e.sets[k].done) requestAnimationFrame(() => scrollToNext(i, k));
  },
  'check-all': () => {
    db.active.entries.forEach((e) => { if (!e.skipped) e.sets.forEach((s) => { s.done = true; }); });
    ui.open = {};
    save(); render();
  },
  'apply-sug': (el) => {
    const e = db.active.entries[+el.dataset.i];
    const sg = e.suggestion;
    if (!sg || !sg.sets) return;
    sg.sets.forEach((v, k) => { if (e.sets[k]) { e.sets[k].w = v.w; e.sets[k].r = v.r; } });
    sg.applied = true;
    save(); render();
  },
  'set-add': (el) => {
    const e = db.active.entries[+el.dataset.i];
    const l = e.sets[e.sets.length - 1] || { w: 0, r: 0 };
    e.sets.push({ w: l.w, r: l.r, done: false });
    save(); render();
  },
  'set-del': (el) => {
    const e = db.active.entries[+el.dataset.i];
    if (e.sets.length > 1) e.sets.pop();
    save(); render();
  },
  effort: (el) => {
    const e = db.active.entries[+el.dataset.i];
    e.effort = e.effort === el.dataset.v ? null : el.dataset.v;
    save(); render();
  },
  skip: (el) => {
    const i = +el.dataset.i;
    const e = db.active.entries[i];
    e.skipped = !e.skipped;
    delete ui.open[i];
    save(); render();
  },
  'entry-del': (el) => {
    db.active.entries.splice(+el.dataset.i, 1);
    ui.open = {};
    save(); render();
  },
  'wo-add-ex': () => {
    if (!db.exercises.length) { toast('Noch keine Übungen vorhanden.'); return; }
    openModal(addExHtml(), { dismiss: true });
  },
  'add-ex': (el) => {
    const ex = exById(el.dataset.id);
    if (!ex) return;
    const e = buildEntry(ex, null);
    e.added = true;
    db.active.entries.push(e);
    const i = db.active.entries.length - 1;
    ui.open[i] = true;
    closeModal(); save(); render();
    const node = document.getElementById(`entry-${i}`);
    if (node) node.scrollIntoView({ block: 'start', behavior: 'smooth' });
  },

  // Verlauf
  'wo-open': (el) => showWorkout(el.dataset.id, false),
  'wo-del': (el) => {
    const id = el.dataset.id;
    closeModal();
    withUndo('Workout gelöscht.', () => {
      db.workouts = db.workouts.filter((w) => w.id !== id);
      db.deleted[id] = Date.now();
    });
  },
  cal: (el) => {
    const now = new Date();
    const m = ui.calMonth || new Date(now.getFullYear(), now.getMonth(), 1);
    ui.calMonth = new Date(m.getFullYear(), m.getMonth() + (+el.dataset.d), 1);
    render();
  },

  // Pläne
  'plan-new': () => openPlanEditor(null),
  'plan-edit': (el) => { const p = planById(el.dataset.id); if (p) openPlanEditor(p); },
  'plan-copy': (el) => {
    const p = planById(el.dataset.id);
    if (!p) return;
    let name = p.name + ' (Kopie)';
    let n = 2;
    while (nameTaken(db.plans, name)) name = `${p.name} (Kopie ${n++})`;
    const now = Date.now();
    db.plans.push({ id: uid(), name, items: p.items.map((x) => ({ ...x })), archived: false, createdAt: now, updatedAt: now });
    save(); render(); toast('Plan kopiert.');
  },
  'plan-archive': (el) => {
    const p = planById(el.dataset.id);
    if (!p) return;
    withUndo('Plan archiviert.', () => { p.archived = true; p.updatedAt = Date.now(); });
  },
  'plan-unarchive': (el) => {
    const p = planById(el.dataset.id);
    if (!p) return;
    p.archived = false; p.updatedAt = Date.now();
    save(); render(); toast('Plan wiederhergestellt.');
  },
  'plan-del': (el) => {
    const id = el.dataset.id;
    withUndo('Plan gelöscht.', () => {
      db.plans = db.plans.filter((p) => p.id !== id);
      db.deleted[id] = Date.now();
    });
  },
  'toggle-archive': () => { ui.showArchive = !ui.showArchive; render(); },
  'pe-move': (el) => {
    const i = +el.dataset.i, d = +el.dataset.d, j = i + d;
    const items = ui.draft.items;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    refreshPlanEditor();
  },
  'pe-del': (el) => { ui.draft.items.splice(+el.dataset.i, 1); refreshPlanEditor(); },
  'plan-save': () => {
    const d = ui.draft;
    const name = d.name.trim();
    if (!name) { toast('Bitte einen Namen eingeben.', { error: true }); return; }
    if (!d.items.length) { toast('Bitte mindestens eine Übung hinzufügen.', { error: true }); return; }
    if (nameTaken(db.plans, name, d.id)) { toast('Es gibt bereits einen Plan mit diesem Namen.', { error: true }); return; }
    const now = Date.now();
    if (d.id) {
      const p = planById(d.id);
      if (!p) return;
      p.name = name;
      p.items = d.items.map((x) => ({ ...x }));
      p.updatedAt = now;
    } else {
      db.plans.push({ id: uid(), name, items: d.items.map((x) => ({ ...x })), archived: false, createdAt: now, updatedAt: now });
    }
    closeModal(); save(); render(); toast('Plan gespeichert.');
  },
  'plan-version': () => {
    const d = ui.draft;
    const orig = planById(d.id);
    if (!orig) return;
    const now = Date.now();
    const np = { id: uid(), name: nextVersionName(d.name.trim() || orig.name), items: d.items.map((x) => ({ ...x })), archived: false, createdAt: now, updatedAt: now };
    orig.archived = true;
    orig.updatedAt = now;
    db.plans.push(np);
    save(); render();
    openPlanEditor(np);
    toast(`„${np.name}“ angelegt, alte Version archiviert.`);
  },

  // Übungen
  'ex-new': () => openExEditor(null),
  'ex-edit': (el) => { const ex = exById(el.dataset.id); if (ex) openExEditor(ex); },
  'xd-img-del': () => { ui.draft.img = null; ui.draft.imgChanged = true; refreshExEditor(); },
  'ex-save': () => {
    const d = ui.draft;
    const name = d.name.trim();
    if (!name) { toast('Bitte einen Namen eingeben.', { error: true }); return; }
    if (nameTaken(db.exercises, name, d.id)) { toast('Es gibt bereits eine Übung mit diesem Namen.', { error: true }); return; }
    let repMin = Math.max(1, Math.round(num(d.repMin)) || 8), repMax = Math.max(1, Math.round(num(d.repMax)) || 12);
    if (repMin > repMax) [repMin, repMax] = [repMax, repMin];
    const step = num(d.step) > 0 ? r2(num(d.step)) : DEFAULT_STEP[d.type];
    const now = Date.now();
    let ex = d.id ? exById(d.id) : null;
    if (!ex) { ex = { id: uid(), createdAt: now, hasImg: false }; db.exercises.push(ex); }
    Object.assign(ex, {
      name, type: d.typeLocked ? ex.type : d.type, perSide: !!d.perSide, scored: !!d.scored, repMin, repMax, step,
      desc: d.desc.trim(), comment: d.comment.trim(), url: d.url.trim(), updatedAt: now
    });
    if (d.imgChanged) {
      if (d.img) ex.hasImg = setImg(ex.id, d.img);
      else { delImg(ex.id); ex.hasImg = false; }
    }
    closeModal(); save(); render(); toast('Übung gespeichert.');
  },
  'ex-del': (el) => {
    const id = el.dataset.id;
    const using = db.plans.filter((p) => p.items.some((it) => it.exId === id));
    if (using.length) {
      toast(`Wird in ${using.map((p) => '„' + p.name + '“').join(', ')} verwendet. Erst dort entfernen.`, { error: true, timeout: 6000 });
      return;
    }
    if (db.active && db.active.entries.some((e) => e.exId === id)) { toast('Übung ist im laufenden Workout.', { error: true }); return; }
    closeModal();
    withUndo('Übung gelöscht.', () => {
      db.exercises = db.exercises.filter((x) => x.id !== id);
      db.deleted[id] = Date.now();
    }, () => { if (!exById(id)) delImg(id); });
  },

  // Daten
  backup: () => { closeModal(); if (canShareFiles()) exportShare(); else exportFile(); },
  'export-share': () => exportShare(),
  'export-file': () => exportFile(),
  'import-apply': () => applyImport(),

  // CSV
  'csv-open': () => { ui.csv = null; openModal(csvHtml(), { wide: true }); },
  'csv-apply': () => applyCsv(),

  'sw-update': () => {
    ui.updateRequested = true;
    if (ui.waitingWorker) ui.waitingWorker.postMessage('skipWaiting');
    else location.reload();
  }
};

const CHANGES = {
  setval: (el) => {
    const i = +el.dataset.i, k = +el.dataset.k, f = el.dataset.f;
    const s = db.active.entries[i].sets[k];
    s[f] = Math.max(0, r2(num(el.value)));
    el.value = fmt(s[f]);
    save();
    if (s.done) render();
  },
  retro: (el) => { db.active[el.dataset.f] = el.value; save(); },
  'pe-field': (el) => {
    const it = ui.draft.items[+el.dataset.i];
    const f = el.dataset.f;
    it[f] = f === 'sets' ? Math.max(1, Math.round(num(el.value)) || 1) : Math.max(0, r2(num(el.value)));
    el.value = f === 'sets' ? it[f] : fmt(it[f]);
  },
  'pe-add': (el) => {
    const ex = exById(el.value);
    if (!ex) return;
    ui.draft.items.push({ exId: ex.id, sets: 3, r: ex.type === 'time' ? 30 : ex.type === 'weight' ? (ex.repMin || 8) : 10, w: 0 });
    refreshPlanEditor();
  },
  'xd-type': (el) => {
    const d = ui.draft;
    if (num(d.step) === DEFAULT_STEP[d.type]) d.step = DEFAULT_STEP[el.value];
    d.type = el.value;
    refreshExEditor();
  },
  'xd-check': (el) => { ui.draft[el.dataset.f] = el.checked; },
  'xd-img': (el) => { const f = el.files && el.files[0]; if (f) takeDraftImage(f); },
  device: (el) => { db.device = el.value.trim(); save(); },
  'import-file': (el) => { const f = el.files && el.files[0]; el.value = ''; if (f) readImport(f); },
  'csv-files': (el) => { const files = [...(el.files || [])]; el.value = ''; if (files.length) readCsv(files); }
};

const INPUTS = {
  'wo-notes': (el) => { db.active.notes = el.value; save(); },
  'entry-note': (el) => { db.active.entries[+el.dataset.i].note = el.value; save(); },
  'ex-q': (el) => { ui.exQuery = el.value; $('#ex-list').innerHTML = exerciseList(); },
  'add-q': (el) => {
    const pos = el.selectionStart;
    refreshModal(addExHtml(el.value));
    const inp = $('#addq');
    if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
  },
  'pd-name': (el) => { ui.draft.name = el.value; },
  xd: (el) => { ui.draft[el.dataset.f] = el.value; }
};

/* ================= 8 Sicherung & Import ================= */
function buildExport() {
  const images = {};
  for (const ex of db.exercises) if (ex.hasImg) { const d = getImg(ex.id); if (d) images[ex.id] = d; }
  const data = {
    app: 'ao-fitlog', schema: 1, version: APP_VERSION, exportedAt: Date.now(), device: db.device || '',
    exercises: db.exercises, plans: db.plans, workouts: db.workouts, deleted: db.deleted, images
  };
  const d = new Date();
  const dev = (db.device || 'Geraet').replace(/[^A-Za-z0-9_-]+/g, '_');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  return { json: JSON.stringify(data), base: `AO_fitlog_${dev}_${stamp}` };
}
function markExported() { db.meta.lastExport = Date.now(); db.meta.sinceExport = 0; save(); render(); }
async function exportShare() {
  const { json, base } = buildExport();
  // Android erlaubt beim Teilen keine .json-Dateien – daher .txt (Import akzeptiert beides).
  const file = new File([json], base + '.txt', { type: 'text/plain' });
  try {
    await navigator.share({ files: [file], title: 'AO fitlog Sicherung' });
    markExported();
    toast('Sicherung geteilt.');
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    exportFile();
  }
}
function exportFile() {
  const { json, base } = buildExport();
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = base + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  markExported();
  toast('Sicherungsdatei gespeichert.');
}

// Führt eingehende Daten in target zusammen und liefert einen Bericht.
function mergeInto(target, inc) {
  const rep = { exNew: 0, exUpd: 0, plNew: 0, plUpd: 0, woNew: 0, removed: 0, imgIds: [] };
  const del = Object.assign({}, target.deleted || {});
  for (const [id, ts] of Object.entries(inc.deleted || {})) if (!del[id] || ts > del[id]) del[id] = ts;
  target.deleted = del;
  const mergeList = (local, incoming, kNew, kUpd, onTake) => {
    for (const x of incoming || []) {
      if (!x || !x.id) continue;
      if (del[x.id] && del[x.id] >= (x.updatedAt || 0)) continue;
      const i = local.findIndex((y) => y.id === x.id);
      if (i < 0) { local.push(x); rep[kNew]++; if (onTake) onTake(x); }
      else if ((x.updatedAt || 0) > (local[i].updatedAt || 0)) { local[i] = x; rep[kUpd]++; if (onTake) onTake(x); }
    }
  };
  mergeList(target.exercises, inc.exercises, 'exNew', 'exUpd', (x) => rep.imgIds.push(x.id));
  mergeList(target.plans, inc.plans, 'plNew', 'plUpd');
  for (const w of inc.workouts || []) {
    if (!w || !w.id || del[w.id]) continue;
    if (!target.workouts.some((y) => y.id === w.id)) { target.workouts.push(w); rep.woNew++; }
  }
  const keep = (x) => { const t = del[x.id]; const gone = t && t >= (x.updatedAt || 0); if (gone) rep.removed++; return !gone; };
  target.exercises = target.exercises.filter(keep);
  target.plans = target.plans.filter(keep);
  target.workouts = target.workouts.filter((w) => { if (del[w.id]) { rep.removed++; return false; } return true; });
  return rep;
}
let pendingImport = null;
async function readImport(file) {
  let inc;
  try { inc = JSON.parse(await file.text()); } catch (e) { toast('Die Datei ist keine gültige Sicherung.', { error: true }); return; }
  if (!inc || inc.app !== 'ao-fitlog') {
    toast('Keine AO-fitlog-Datei. Sicherungen der alten App „AO Trainiert“ passen nicht – verwende die Startdaten-Datei.', { error: true, timeout: 9000 });
    return;
  }
  const preview = mergeInto(JSON.parse(JSON.stringify({ exercises: db.exercises, plans: db.plans, workouts: db.workouts, deleted: db.deleted })), inc);
  pendingImport = inc;
  const nothing = !preview.exNew && !preview.exUpd && !preview.plNew && !preview.plUpd && !preview.woNew && !preview.removed;
  const line = (label, a, b) => `<tr><td>${label}</td><td><b>${a}</b> neu</td><td>${b != null ? `<b>${b}</b> aktualisiert` : ''}</td></tr>`;
  openModal(`${modalHead('Import – Vorschau')}
    <p class="small muted">Datei von: <b>${esc(inc.device || 'unbekannt')}</b>${inc.exportedAt ? ', ' + fmtDate(inc.exportedAt) + ' ' + fmtTime(inc.exportedAt) + ' Uhr' : ''}</p>
    ${nothing ? '<div class="callout tip">Nichts Neues – deine Daten sind bereits auf diesem Stand.</div>' : `
    <div class="table-wrap" style="margin-top:12px"><table class="tbl"><tbody>
      ${line('Übungen', preview.exNew, preview.exUpd)}${line('Pläne', preview.plNew, preview.plUpd)}${line('Workouts', preview.woNew, null)}
      ${preview.removed ? `<tr><td>Entfernt</td><td colspan="2"><b>${preview.removed}</b> (auf dem anderen Gerät gelöscht)</td></tr>` : ''}
    </tbody></table></div>
    <p class="hint">Bestehende Workouts bleiben erhalten. Bei Übungen und Plänen gewinnt jeweils die zuletzt geänderte Fassung.</p>`}
    <div class="modal-foot"><button class="btn ghost" data-a="modal-close">${nothing ? 'Schließen' : 'Abbrechen'}</button>${nothing ? '' : '<button class="btn" data-a="import-apply">Übernehmen</button>'}</div>`, { dismiss: true });
}
function applyImport() {
  const inc = pendingImport;
  if (!inc) return;
  const rep = mergeInto(db, inc);
  for (const id of rep.imgIds) {
    const ex = exById(id);
    if (!ex) continue;
    if (ex.hasImg && inc.images && inc.images[id]) ex.hasImg = setImg(id, inc.images[id]);
    else if (!ex.hasImg) delImg(id);
  }
  for (const id of Object.keys(db.deleted)) if (!exById(id)) delImg(id);
  pendingImport = null;
  closeModal(); save(); render();
  toast(`Import fertig – Übungen: ${rep.exNew + rep.exUpd}, Pläne: ${rep.plNew + rep.plUpd}, Workouts: ${rep.woNew}.`, { timeout: 5000 });
}

/* ================= 9 CSV-Import (Excel) ================= */
const CSV_COLS = {
  name: ['name', 'uebung', 'uebungsname'],
  type: ['typ', 'type', 'art'],
  desc: ['beschreibung', 'technik', 'beschreibungtechnik', 'ausfuehrung'],
  comment: ['kommentar', 'einstellung', 'einstellungen', 'kommentareinstellung'],
  url: ['link', 'url', 'quelle', 'video'],
  perSide: ['jeseite', 'proseite', 'einseitig'],
  scored: ['zaehltzumscore', 'score', 'wertung'],
  repMin: ['wdhvon', 'wdhmin', 'wdhbereichvon'],
  repMax: ['wdhbis', 'wdhmax', 'wdhbereichbis'],
  step: ['schritt', 'steigerung', 'steigerungsschritt'],
  img: ['bild', 'bilddatei', 'foto']
};
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const delim = first.split(';').length >= first.split(',').length ? ';' : ',';
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function parseType(v) {
  const n = norm(v);
  if (['gewicht', 'weight', 'hantel', 'zusatzgewicht'].includes(n)) return 'weight';
  if (['koerpergewicht', 'bodyweight', 'kw', 'eigengewicht', 'bw', 'wdh', 'wiederholungen'].includes(n)) return 'bodyweight';
  if (['zeit', 'time', 'sek', 'sekunden', 's', 'dauer'].includes(n)) return 'time';
  return null;
}
function yesNo(v, def) {
  const n = norm(v);
  if (!n) return def;
  if (['ja', 'j', 'x', '1', 'true', 'yes', 'y', 'wahr'].includes(n)) return true;
  if (['nein', 'n', '0', 'false', 'no', 'falsch'].includes(n)) return false;
  return def;
}
function csvHtml() {
  const c = ui.csv;
  let h = modalHead('Übungen importieren (Excel/CSV)');
  h += `<div class="callout info" style="margin-top:0"><b>So geht's:</b> Excel-Vorlage ausfüllen → <i>Datei › Speichern unter › CSV UTF-8</i> → hier die CSV-Datei <b>zusammen mit den Bildern</b> auswählen (im Ordner Strg+A).</div>
    <div style="margin-top:12px"><input class="file-input" type="file" multiple accept=".csv,text/csv,image/*" data-c="csv-files" aria-label="CSV und Bilder wählen"></div>`;
  if (c) {
    if (c.error) h += `<div class="callout warn">${esc(c.error)}</div>`;
    else {
      const ok = c.rows.filter((r) => r.ok).length;
      h += `<div class="section-title">Vorschau – ${ok} von ${c.rows.length} werden importiert</div><div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Typ</th><th>Bild</th><th>Status</th></tr></thead><tbody>
        ${c.rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.type ? TYPE_LABEL[r.type] : '–'}</td><td>${r.file ? '✓' : r.imgName ? '<span class="red">fehlt</span>' : '–'}</td><td class="${r.ok ? 'lime' : 'red'}">${esc(r.status)}</td></tr>`).join('')}
        </tbody></table></div>`;
    }
  }
  const ok = c && !c.error ? c.rows.filter((r) => r.ok).length : 0;
  h += `<div class="modal-foot"><button class="btn ghost" data-a="modal-close">Abbrechen</button><button class="btn" data-a="csv-apply" ${ok ? '' : 'disabled'}>${ok ? ok + ' Übungen importieren' : 'Importieren'}</button></div>`;
  return h;
}
async function readCsv(files) {
  const csv = files.find((f) => /\.csv$/i.test(f.name) || f.type === 'text/csv');
  const images = files.filter((f) => f.type.startsWith('image/'));
  if (!csv) { ui.csv = { error: 'Keine CSV-Datei ausgewählt.' }; refreshModal(csvHtml()); return; }
  let text = await csv.text();
  if (text.includes('�')) {
    // Fallback für „CSV (Trennzeichen-getrennt)“ ohne UTF-8
    try { text = new TextDecoder('windows-1252').decode(await csv.arrayBuffer()); } catch (e) { /* bleibt */ }
  }
  const rows = parseCSV(text).filter((r) => r.some((x) => String(x).trim() !== ''));
  if (rows.length < 2) { ui.csv = { error: 'Die CSV-Datei enthält keine Übungen.' }; refreshModal(csvHtml()); return; }
  const head = rows[0].map(norm);
  const col = {};
  for (const [k, aliases] of Object.entries(CSV_COLS)) { const i = head.findIndex((h) => aliases.includes(h)); if (i >= 0) col[k] = i; }
  if (col.name == null || col.type == null) { ui.csv = { error: 'Spalten „Name“ und „Typ“ wurden nicht gefunden. Bitte die Vorlage verwenden.' }; refreshModal(csvHtml()); return; }
  const byFile = {}, byBase = {};
  for (const f of images) { byFile[f.name.toLowerCase()] = f; byBase[f.name.toLowerCase().replace(/\.[^.]+$/, '')] = f; }
  const seen = new Set(db.exercises.map((e) => e.name.trim().toLowerCase()));
  const out = [];
  for (const r of rows.slice(1)) {
    const get = (k) => (col[k] != null ? String(r[col[k]] ?? '').trim() : '');
    const name = get('name');
    if (!name) continue;
    const type = parseType(get('type'));
    const imgName = get('img');
    const file = imgName ? byFile[imgName.toLowerCase()] || byBase[imgName.toLowerCase().replace(/\.[^.]+$/, '')] : byBase[name.toLowerCase()];
    const row = {
      name, type, imgName, file: file || null,
      desc: get('desc'), comment: get('comment'), url: get('url'),
      perSide: yesNo(get('perSide'), false), scored: yesNo(get('scored'), true),
      repMin: Math.round(num(get('repMin'))) || 8, repMax: Math.round(num(get('repMax'))) || 12,
      step: num(get('step')), ok: false, status: ''
    };
    if (!type) row.status = `Typ „${get('type')}“ unbekannt (Gewicht, Körpergewicht oder Zeit)`;
    else if (seen.has(name.toLowerCase())) row.status = 'Existiert bereits – übersprungen';
    else { row.ok = true; row.status = imgName && !file ? 'Neu (Bild fehlt)' : 'Neu'; seen.add(name.toLowerCase()); }
    out.push(row);
  }
  ui.csv = { rows: out };
  refreshModal(csvHtml());
}
async function applyCsv() {
  const c = ui.csv;
  if (!c || !c.rows) return;
  const now = Date.now();
  let n = 0;
  for (const r of c.rows.filter((x) => x.ok)) {
    let repMin = Math.max(1, r.repMin), repMax = Math.max(1, r.repMax);
    if (repMin > repMax) [repMin, repMax] = [repMax, repMin];
    const ex = {
      id: uid(), name: r.name, type: r.type, perSide: r.perSide, scored: r.scored, repMin, repMax,
      step: r.step > 0 ? r2(r.step) : DEFAULT_STEP[r.type], desc: r.desc, comment: r.comment, url: r.url,
      hasImg: false, createdAt: now, updatedAt: now
    };
    if (r.file) { try { ex.hasImg = setImg(ex.id, await downscale(r.file)); } catch (e) { /* ohne Bild */ } }
    db.exercises.push(ex);
    n++;
  }
  closeModal(); save(); render();
  toast(`${n} Übungen importiert.`);
}

/* ================= 10 Start ================= */
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.a];
  if (fn) fn(el, ev);
});
document.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-c]');
  if (el && CHANGES[el.dataset.c]) CHANGES[el.dataset.c](el, ev);
});
document.addEventListener('input', (ev) => {
  const el = ev.target.closest('[data-in]');
  if (el && INPUTS[el.dataset.in]) INPUTS[el.dataset.in](el, ev);
});
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  const lb = $('.lightbox');
  if (lb) { lb.remove(); return; }
  if (ui.modal && ui.modal.dismiss) closeModal();
});
// Strg+V: Bild in die gerade geöffnete Übung einfügen
document.addEventListener('paste', (ev) => {
  if (!ui.draft || ui.draft.kind !== 'ex') return;
  const item = [...(ev.clipboardData ? ev.clipboardData.items : [])].find((x) => x.type.startsWith('image/'));
  if (!item) return;
  ev.preventDefault();
  const f = item.getAsFile();
  if (f) takeDraftImage(f);
});
document.addEventListener('visibilitychange', updateWake);

function showUpdateBanner(worker) {
  ui.waitingWorker = worker;
  $('#banner-root').innerHTML = `<div class="banner"><span>Neue Version verfügbar</span><button class="btn sm" data-a="sw-update">Neu laden</button></div>`;
}
function initSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (ui.updateRequested) location.reload();
  });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(nw);
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch(() => {});
}

function init() {
  $('#helpBtn').innerHTML = ic('help');
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  render();
  initSW();
}
init();
