/* Module A: workspace tabs "Recording" (segments) and "Cleaning" (ICA review).
   Every signal on these tabs is generated here from a seeded PRNG, so it is deterministic and
   clearly synthetic (mockup assumption M22): it is not the report data. */
const A = window.APP;
const FS = 128, SEGLEN = 4, PX_MM = 96 / 25.4;
const CH = A.channels, NCH = CH.length, CI = Object.fromEntries(CH.map((c, i) => [c, i]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const INK = '#1c2a36', GRID = '#e6e8ea', MUTED = '#6b7279';
const REASON = {
  blink: { label: 'Blink', col: '#3d6fd1' }, muscle: { label: 'Muscle', col: '#c2452d' },
  electrode: { label: 'Electrode', col: '#8a4fc7' }, movement: { label: 'Movement', col: '#b07a12' },
  manual: { label: 'Excluded manually', short: 'Manual', col: '#5a6670' },
};
const INCL_COL = '#9fcfb0', TRIM_COL = '#d9dcdf';
const MIN_S = { EO: 120, EC: 120, VCPT: 900 }; /* mockup assumption: minimum analysed seconds */

/* ---------------- deterministic random numbers ---------------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
const U = (r, lo, hi) => lo + (hi - lo) * r();
const near = (c, x, y, s) => { const p = A.pos[c]; return Math.exp(-((p[0] - x) ** 2 + (p[1] - y) ** 2) / (2 * s * s)); };
/* pink-ish noise: three normalised one-pole low-pass noises plus a little white noise, std about 1 */
function pink(r, w = [1, 0.55, 0.3]) {
  const k = [1, 4, 12].map(f => Math.exp(-2 * Math.PI * f / FS)), nr = k.map(v => Math.sqrt((1 + v) / (1 - v))), y = [0, 0, 0];
  return () => { let o = 0.15 * gauss(r); for (let j = 0; j < 3; j++) { y[j] = k[j] * y[j] + (1 - k[j]) * gauss(r); o += w[j] * y[j] * nr[j]; } return o / 1.2; };
}
function slow(r, fc) { const k = Math.exp(-2 * Math.PI * fc / FS), nr = Math.sqrt((1 + k) / (1 - k)); let y = 0; return () => (y = k * y + (1 - k) * gauss(r)) * nr; }
const fmt = (t) => { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };

/* ---------------- recordings: artefact plan and proposed segments ---------------- */
const COND = {
  EO: { label: 'Eyes open', dur: 180, trim: 0, seed: 1101, alpha: 9, blinks: [2.4, 5.2], hem: 22,
    art: [[7, 'blink'], [18, 'muscle'], [29, 'electrode'], [38, 'movement']] },
  EC: { label: 'Eyes closed', dur: 180, trim: 1, seed: 2203, alpha: 32, blinks: null, hem: 45,
    art: [[12, 'muscle'], [33, 'electrode']] },
  VCPT: { label: 'VCPT', dur: 1220, trim: 0, seed: 3307, alpha: 9, blinks: [3, 7], hem: 40, art: null },
};
const W_BLINK = CH.map(c => ({ Fp1: 1, Fp2: 1, F3: 0.42, F4: 0.42, Fz: 0.48, F7: 0.36, F8: 0.36, C3: 0.1, Cz: 0.12, C4: 0.1 }[c] || 0));
const W_HEM = CH.map(c => ({ F7: 1, F8: -1, Fp1: 0.45, Fp2: -0.45, T3: 0.3, T4: -0.3, F3: 0.15, F4: -0.15 }[c] || 0));
const W_MUS = { L: CH.map(c => ({ T3: 1, F7: 0.6, T5: 0.5, C3: 0.18, Fp1: 0.12 }[c] || 0)), R: CH.map(c => ({ T4: 1, F8: 0.6, T6: 0.45, C4: 0.15 }[c] || 0)) };

function plan(key) {
  const cfg = COND[key];
  if (cfg._plan) return cfg._plan;
  const r = rng(cfg.seed), segs = [];
  for (let t = cfg.trim; t < cfg.dur - 1e-6; t += SEGLEN) segs.push({ t0: t, t1: Math.min(cfg.dur, t + SEGLEN) });
  let art = cfg.art;
  if (!art) { /* VCPT: 13 proposed exclusions spread over the task */
    const kinds = ['blink', 'blink', 'blink', 'blink', 'blink', 'muscle', 'muscle', 'muscle', 'movement', 'movement', 'movement', 'electrode', 'electrode'];
    const pick = new Set(); while (pick.size < kinds.length) pick.add(3 + Math.floor(r() * (segs.length - 6)));
    art = [...pick].sort((a, b) => a - b).map((s, i) => [s, kinds[(i * 5) % kinds.length]]);
  }
  const ev = [], prop = segs.map(() => null);
  if (cfg.blinks) for (let t = 1 + r() * 2; t < cfg.dur - 1; t += U(r, cfg.blinks[0], cfg.blinks[1])) ev.push({ k: 'blink', t, a: U(r, 75, 125) });
  for (let t = 8 + r() * 10; t < cfg.dur - 3; t += U(r, cfg.hem * 0.6, cfg.hem * 1.4)) ev.push({ k: 'hem', t, d: U(r, 0.5, 1.4), a: (r() < 0.5 ? -1 : 1) * U(r, 25, 50) });
  art.forEach(([s, kind]) => {
    prop[s] = kind; const t0 = segs[s].t0;
    for (let i = ev.length - 1; i >= 0; i--) if (ev[i].k === 'blink' && ev[i].t > t0 - 0.5 && ev[i].t < t0 + SEGLEN) ev.splice(i, 1);
    if (kind === 'blink') { [0.35, 1.25, 2.15, 3.0].forEach((o, j) => ev.push({ k: 'blink', t: t0 + o, a: [230, 270, 210, 180][j] })); ev.push({ k: 'move', t: t0 + 0.2, d: 3.5, a: 45 }); }
    if (kind === 'muscle') ev.push({ k: 'muscle', t: t0 + U(r, 0.3, 0.8), d: U(r, 2.4, 3), a: 26, side: 'L' });
    if (kind === 'electrode') [[0.7, 230], [2.0, -170], [3.0, 130]].forEach(([o, a]) => ev.push({ k: 'pop', t: t0 + o, a }));
    if (kind === 'movement') ev.push({ k: 'move', t: t0 + 0.25, d: 3.4, a: 150 });
  });
  for (let n = 0; n < (key === 'VCPT' ? 14 : 3); n++) ev.push({ k: 'muscle', t: U(r, 5, cfg.dur - 5), d: U(r, 0.3, 0.7), a: U(r, 6, 10), side: r() < 0.6 ? 'L' : 'R' });
  let marks = [];
  if (key === 'VCPT') {
    const types = []; ['Go', 'NoGo', 'Ignore', 'Novelty'].forEach(t => { for (let i = 0; i < 100; i++) types.push(t); });
    for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
    const S = { Go: ['A', 'A'], NoGo: ['A', 'P'], Ignore: ['P', 'P'], Novelty: ['P', 'H'] };
    const goIdx = types.map((t, i) => t === 'Go' ? i : -1).filter(i => i >= 0), ngIdx = types.map((t, i) => t === 'NoGo' ? i : -1).filter(i => i >= 0);
    const om = new Set(goIdx.filter((_, i) => i % 20 === 7)), cm = new Set(ngIdx.filter((_, i) => i % 33 === 11));
    types.forEach((ty, i) => {
      const T = 10 + i * 3; marks.push({ t: T, s: S[ty][0] }, { t: T + 1, s: S[ty][1], ty });
      if ((ty === 'Go' && !om.has(i)) || cm.has(i)) marks.push({ t: T + 1 + Math.max(0.22, 0.452 + 0.117 * gauss(r)), s: 'R' });
    });
  }
  return (cfg._plan = { segs, prop, ev: ev.sort((a, b) => a.t - b.t), marks });
}

/* ---------------- synthetic 19-channel signal, average reference ---------------- */
const GEN = {};
function gen(key) {
  if (GEN[key]) return GEN[key];
  const cfg = COND[key], P = plan(key), r = rng(cfg.seed * 7 + 1), n = cfg.dur * FS;
  const x = CH.map(() => new Float32Array(n));
  const src = [[0, 0.75, 0.45, 13], [0, 0, 0.45, 10], [-0.85, 0, 0.4, 8.5], [0.85, 0, 0.4, 8.5], [0, -0.5, 0.45, 10], [-0.4, 0.4, 0.35, 6], [0.4, -0.3, 0.35, 6]]
    .map(([sx, sy, s, g]) => ({ f: pink(r), w: CH.map(c => g * near(c, sx, sy, s)) }));
  const own = CH.map(() => pink(r, [0.6, 0.5, 0.4]));
  const aw = CH.map(c => near(c, 0, -0.88, 0.42) + 0.25 * near(c, 0, -0.3, 0.5));
  const mw = CH.map(c => near(c, 0.5, 0.05, 0.3) * 0.6);
  const envA = slow(r, 0.35), jit = slow(r, 0.2), envM = slow(r, 0.3);
  let ph = 0, phm = 0;
  for (let i = 0; i < n; i++) {
    const t = i / FS;
    ph += 2 * Math.PI * (9.0 + 0.25 * jit()) / FS; phm += 2 * Math.PI * 10.6 / FS;
    const av = cfg.alpha * Math.max(0.08, 0.72 + 0.42 * envA()) * Math.sin(ph);
    const mu = 3 * Math.max(0, 0.4 + 0.5 * envM()) * (Math.sin(phm) + 0.3 * Math.sin(2 * phm + 0.6));
    const sv = src.map(s => s.f()), mains = Math.sin(2 * Math.PI * 50 * t);
    for (let c = 0; c < NCH; c++) {
      let v = 3.2 * own[c]() + av * aw[c] + mu * mw[c] + mains * (c === CI.T4 ? 5 : 1.2);
      for (let k = 0; k < sv.length; k++) v += src[k].w[c] * sv[k];
      x[c][i] = v;
    }
  }
  for (const e of P.ev) { /* artefacts */
    const i0 = Math.max(0, Math.floor((e.t - 0.05) * FS));
    if (e.k === 'blink') { const L = 0.42 * FS; for (let i = 0; i < L && i0 + i < n; i++) { const u = i / L, v = e.a * Math.sin(Math.PI * Math.pow(u, 0.65)) ** 2; for (let c = 0; c < NCH; c++) if (W_BLINK[c]) x[c][i0 + i] += v * W_BLINK[c]; } }
    if (e.k === 'hem') { const L = (e.d + 0.4) * FS; for (let i = 0; i < L && i0 + i < n; i++) { const t = i / FS, v = e.a * (1 / (1 + Math.exp(-(t - 0.1) / 0.025)) - 1 / (1 + Math.exp(-(t - 0.1 - e.d) / 0.025))); for (let c = 0; c < NCH; c++) if (W_HEM[c]) x[c][i0 + i] += v * W_HEM[c]; } }
    if (e.k === 'muscle') { const L = e.d * FS, w = W_MUS[e.side]; let lp = 0; for (let i = 0; i < L && i0 + i < n; i++) { const g = gauss(r); lp = 0.55 * lp + 0.45 * g; const v = e.a * (g - lp) * Math.sqrt(Math.sin(Math.PI * i / L)); for (let c = 0; c < NCH; c++) if (w[c]) x[c][i0 + i] += v * w[c] * (0.8 + 0.4 * r()); } }
    if (e.k === 'pop') { const L = 1.6 * FS, c = CI.T4; for (let i = 0; i < L && i0 + i < n; i++) x[c][i0 + i] += e.a * Math.min(1, i / 2) * Math.exp(-i / FS / 0.3); }
    if (e.k === 'move') { const L = e.d * FS, w = CH.map(() => U(r, 0.4, 1)); for (let i = 0; i < L && i0 + i < n; i++) { const t = i / FS, v = e.a * Math.sin(2 * Math.PI * 0.55 * t + 0.4) * Math.sin(Math.PI * i / L); for (let c = 0; c < NCH; c++) x[c][i0 + i] += v * w[c] + (e.a > 100 ? 6 * gauss(r) : 0); } }
  }
  for (let i = 0; i < n; i++) { let m = 0; for (let c = 0; c < NCH; c++) m += x[c][i]; m /= NCH; for (let c = 0; c < NCH; c++) x[c][i] -= m; }
  return (GEN[key] = { x, n });
}

/* ---------------- display filters (display only) ---------------- */
function biquad(x, [b0, b1, b2, a1, a2]) { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; } }
function lpCoef(fc) { const w = 2 * Math.PI * fc / FS, c = Math.cos(w), al = Math.sin(w) / Math.SQRT2, a0 = 1 + al; return [(1 - c) / 2 / a0, (1 - c) / a0, (1 - c) / 2 / a0, -2 * c / a0, (1 - al) / a0]; }
function notchCoef(f0, Q = 25) { const w = 2 * Math.PI * f0 / FS, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; return [1 / a0, -2 * c / a0, 1 / a0, -2 * c / a0, (1 - al) / a0]; }
function hp1(x, fc) { const rc = 1 / (2 * Math.PI * fc), a = rc / (rc + 1 / FS); let y = 0, xp = x[0]; for (let i = 0; i < x.length; i++) { const v = x[i]; y = a * (y + v - xp); xp = v; x[i] = y; } }
function pageData(key, t0, tb) {
  const G = gen(key), n0 = Math.round(t0 * FS), n1 = Math.min(G.n, n0 + Math.round(tb * FS)), pre = Math.min(n0, 4 * FS);
  return G.x.map(ch => {
    const s = ch.slice(n0 - pre, n1);
    if (V.hp) hp1(s, V.hp);
    if (V.notch) biquad(s, notchCoef(50));
    if (V.lp) { const k = lpCoef(V.lp); biquad(s, k); }
    return s.subarray(pre);
  });
}
function setupCanvas(cv, W, H) {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = A.css_var('--paper') || '#fff'; g.fillRect(0, 0, W, H); return g;
}
const crisp = (v) => Math.round(v) + 0.5;
/* calibration mark in the right margin: vertical 100 uV bar, optional 1 s bar */
function calib(g, x, y, h, w1s) {
  g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x, y); if (w1s) g.lineTo(x - w1s, y); g.stroke(); g.lineWidth = 1;
  g.fillStyle = INK; g.font = '10px IBM Plex Mono, monospace'; g.fillText('100', x + 4, y - h + 8); g.fillText('µV', x + 4, y - h + 19);
  if (w1s) { g.textAlign = 'center'; g.fillText('1 s', x - w1s / 2, y + 11); g.textAlign = 'left'; }
}

/* ================================ Recording tab ================================ */
const V = { cond: 'EO', start: 0, tb: 10, gain: 10, hp: 0.5, lp: 35, notch: true, hover: null };
const SEG = {};
function segState(key) {
  if (!SEG[key]) { const P = plan(key); SEG[key] = { cur: P.prop.slice() }; }
  return SEG[key];
}
const isChanged = (key, i) => (plan(key).prop[i] == null) !== (segState(key).cur[i] == null);
function totals(key) {
  const P = plan(key), S = segState(key);
  let an = 0, ch = 0, ex = 0;
  P.segs.forEach((s, i) => { if (S.cur[i] == null) an += s.t1 - s.t0; else ex++; if (isChanged(key, i)) ch++; });
  return { an: Math.round(an), ch, ex, rec: COND[key].dur };
}
const allChanges = () => Object.keys(COND).reduce((a, k) => a + totals(k).ch, 0);

let L = null, drag = null, ro = null, keyH = null;

function drawTraces() {
  const cv = $('#aTr'); if (!cv) return;
  const box = cv.parentElement, W = Math.max(640, box.clientWidth - 24), key = V.cond, cfg = COND[key], P = plan(key), S = segState(key);
  const vc = key === 'VCPT', RUL = 18, BAND = 14, ML = vc ? 20 : 0, TOP = RUL + BAND + ML, ROW = 27, H = TOP + NCH * ROW + 22, GUT = 44, PW = W - GUT - 56;
  const t0 = V.start, tb = V.tb, x = (t) => GUT + (t - t0) / tb * PW;
  L = { GUT, PW, TOP, H, t0, tb, W };
  const g = setupCanvas(cv, W, H);
  /* segments: shading, bands, boundaries */
  if (cfg.trim && t0 < cfg.trim) { g.fillStyle = 'rgba(120,128,136,0.13)'; g.fillRect(x(t0), RUL, x(cfg.trim) - x(t0), H - RUL); g.fillStyle = MUTED; g.font = '10px IBM Plex Sans, sans-serif'; g.fillText(x(cfg.trim) - x(t0) > 110 ? 'Settling, not analysed' : 'Settling', x(t0) + 4, RUL + 10); }
  P.segs.forEach((s, i) => {
    if (s.t1 <= t0 || s.t0 >= t0 + tb) return;
    const xa = Math.max(GUT, x(s.t0)), xb = Math.min(GUT + PW, x(s.t1)), rs = S.cur[i], chg = isChanged(key, i);
    if (rs) { g.fillStyle = 'rgba(200,64,50,0.07)'; g.fillRect(xa, RUL + BAND, xb - xa, H - RUL - BAND); }
    if (V.hover === i) { g.fillStyle = 'rgba(19,94,125,0.07)'; g.fillRect(xa, RUL + BAND, xb - xa, H - RUL - BAND); }
    g.fillStyle = rs ? REASON[rs].col : (chg ? '#d9a32b' : '#cfe6d7'); g.globalAlpha = rs ? 0.85 : 1; g.fillRect(xa, RUL + 1, xb - xa, BAND - 2); g.globalAlpha = 1;
    g.font = '600 10px IBM Plex Sans, sans-serif'; g.fillStyle = rs ? '#fff' : (chg ? '#3b2a00' : '#24553a');
    const lab = (rs ? (REASON[rs].short || REASON[rs].label) : 'Included') + (chg && xb - xa > 110 ? ' · changed' : '');
    g.save(); g.beginPath(); g.rect(xa, RUL, xb - xa, BAND); g.clip(); g.fillText(`${i + 1}  ${lab}`, xa + 4, RUL + 10); g.restore();
    if (s.t0 >= t0) { g.strokeStyle = '#b9c0c6'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(crisp(x(s.t0)), RUL); g.lineTo(crisp(x(s.t0)), H); g.stroke(); g.setLineDash([]); }
  });
  /* time ruler: 1 s grid */
  const lstep = tb <= 10 ? 1 : (tb <= 20 ? 2 : 5);
  g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.textAlign = 'center';
  for (let t = Math.ceil(t0); t <= t0 + tb + 1e-6; t++) {
    const xx = crisp(x(t)); g.strokeStyle = GRID; g.beginPath(); g.moveTo(xx, TOP); g.lineTo(xx, H); g.stroke();
    g.strokeStyle = '#9aa2a9'; g.beginPath(); g.moveTo(xx, RUL - (t % lstep ? 3 : 6)); g.lineTo(xx, RUL); g.stroke();
    if (t % lstep === 0) g.fillText(fmt(t), Math.min(W - 18, Math.max(GUT + 14, xx)), 10);
  }
  g.textAlign = 'left'; g.strokeStyle = '#9aa2a9'; g.beginPath(); g.moveTo(GUT, crisp(RUL)); g.lineTo(GUT + PW, crisp(RUL)); g.stroke();
  /* VCPT stimulus markers */
  if (vc) {
    const y0 = RUL + BAND;
    g.fillStyle = '#f3f5f6'; g.fillRect(GUT, y0, PW, ML); g.fillStyle = MUTED; g.font = '10px IBM Plex Mono, monospace'; g.fillText('Stim', 6, y0 + 13);
    P.marks.forEach(m => {
      if (m.t < t0 || m.t > t0 + tb) return;
      const xx = crisp(x(m.t)), col = m.s === 'R' ? '#217a45' : (m.s === 'H' ? '#a04a12' : '#135e7d');
      g.strokeStyle = col; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(xx, y0 + ML); g.lineTo(xx, H); g.stroke(); g.globalAlpha = 1;
      g.beginPath(); g.moveTo(xx, y0 + ML - 7); g.lineTo(xx, y0 + ML); g.stroke();
      g.fillStyle = col; g.font = (m.ty ? '600 ' : '') + '9.5px IBM Plex Mono, monospace';
      if (m.s === 'R') { g.font = '8.5px IBM Plex Mono, monospace'; g.fillText('R', xx + 2, y0 + ML - 2); } else g.fillText(m.s + (m.ty && tb <= 20 ? ' ' + m.ty : ''), xx + 2, y0 + 9);
    });
  }
  /* traces */
  const data = pageData(key, t0, tb), k = PX_MM / V.gain, n = data[0].length, dx = PW / (tb * FS);
  g.save(); g.beginPath(); g.rect(GUT, TOP, PW, H - TOP); g.clip();
  g.strokeStyle = INK; g.lineWidth = 0.9; g.lineJoin = 'round';
  data.forEach((s, c) => {
    const y0 = TOP + ROW * (c + 0.5); g.beginPath();
    for (let i = 0; i < n; i++) { const xx = GUT + i * dx, yy = y0 - s[i] * k; if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); }
    g.stroke();
  });
  g.restore();
  g.font = '500 11px IBM Plex Mono, monospace'; g.fillStyle = INK; g.textAlign = 'right';
  CH.forEach((c, i) => g.fillText(c, GUT - 8, TOP + ROW * (i + 0.5) + 4)); g.textAlign = 'left';
  g.strokeStyle = '#9aa2a9'; g.beginPath(); g.moveTo(crisp(GUT), RUL); g.lineTo(crisp(GUT), H); g.stroke();
  /* scale bar: 100 uV vertical, 1 s horizontal */
  calib(g, GUT + PW + 10, H - 13, 100 * k, PW / tb);
}

function drawStrip() {
  const cv = $('#aStrip'); if (!cv) return;
  const W = Math.max(640, cv.parentElement.clientWidth - 24), H = 44, key = V.cond, cfg = COND[key], P = plan(key), S = segState(key);
  const X0 = 44, PW = W - X0 - 10, x = (t) => X0 + t / cfg.dur * PW;
  const g = setupCanvas(cv, W, H);
  g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.fillText('All', 8, 17);
  if (cfg.trim) { g.fillStyle = TRIM_COL; g.fillRect(x(0), 6, x(cfg.trim) - x(0), 16); }
  P.segs.forEach((s, i) => {
    const rs = S.cur[i]; g.fillStyle = rs ? REASON[rs].col : INCL_COL; g.fillRect(x(s.t0), 6, Math.max(1, x(s.t1) - x(s.t0) - (PW / P.segs.length > 4 ? 1 : 0)), 16);
    if (isChanged(key, i)) { g.fillStyle = '#d9a32b'; g.fillRect(x(s.t0), 22, Math.max(1.5, x(s.t1) - x(s.t0) - 1), 3); }
  });
  g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x(V.start), 3.5, Math.max(3, x(V.start + V.tb) - x(V.start)), 22); g.lineWidth = 1;
  const step = cfg.dur > 600 ? 120 : 30; g.fillStyle = MUTED; g.textAlign = 'center';
  for (let t = 0; t <= cfg.dur; t += step) { g.fillRect(Math.round(x(t)), 27, 1, 4); g.fillText(fmt(t), Math.min(W - 16, x(t)), 41); }
  g.textAlign = 'left';
}

function segAt(px) {
  if (!L || px < L.GUT || px > L.GUT + L.PW) return null;
  const t = L.t0 + (px - L.GUT) / L.PW * L.tb, P = plan(V.cond);
  const i = P.segs.findIndex(s => t >= s.t0 && t < s.t1); return i < 0 ? null : i;
}
function setExcl(i, ex) { const S = segState(V.cond), P = plan(V.cond); S.cur[i] = ex ? (P.prop[i] || 'manual') : null; }
function status() {
  const el = $('#aStat'); if (!el) return;
  const P = plan(V.cond), i = V.hover;
  if (i == null) { el.innerHTML = `<span>${fmt(V.start)} to ${fmt(Math.min(COND[V.cond].dur, V.start + V.tb))} of ${fmt(COND[V.cond].dur)} · page ${Math.floor(V.start / V.tb) + 1} of ${Math.ceil(COND[V.cond].dur / V.tb)}</span><span>Click or drag over segments to include or exclude · ← → page · ↑ ↓ gain</span>`; return; }
  const s = P.segs[i], rs = segState(V.cond).cur[i];
  el.innerHTML = `<span><b>Segment ${i + 1}</b> · ${fmt(s.t0)} to ${fmt(s.t1)} · ${rs ? 'excluded (' + (REASON[rs].short || REASON[rs].label).toLowerCase() + ')' : 'included'}${P.prop[i] ? ` · proposed: exclude (${REASON[P.prop[i]].label.toLowerCase()})` : ' · proposed: include'}</span><span>Click to ${rs ? 'include' : 'exclude'}</span>`;
}
function redraw() { drawTraces(); drawStrip(); status(); }

function side() {
  const el = $('#aSide'); if (!el) return;
  const st = A.state.segments, ch = allChanges(), key = V.cond, P = plan(key), S = segState(key);
  const rows = Object.keys(COND).map(k => { const t = totals(k), ok = t.an >= MIN_S[k];
    return `<tr class="link" data-cond="${k}"><td>${COND[k].label}${t.ch ? ' <span class="chip amber" title="Changed manually">' + t.ch + '</span>' : ''}</td><td class="num"><b>${t.an}</b> / ${t.rec} s</td><td class="num muted">${MIN_S[k]} s</td><td style="color:var(${ok ? '--ok' : '--warn'})" title="${ok ? 'Above the minimum' : 'Below the minimum'}">${ok ? '✓' : 'short'}</td></tr>`; }).join('');
  const short = Object.keys(COND).some(k => totals(k).an < MIN_S[k]);
  const ex = P.segs.map((s, i) => ({ s, i, rs: S.cur[i], pr: P.prop[i] })).filter(o => o.rs || o.pr);
  el.innerHTML = `
    <div class="card"><div class="hd"><h2>Segments ${A.ann('3.4 Clinician in control, Working')}</h2>${ch ? `<span class="chip amber"><span class="d"></span>Changed manually · ${ch}</span>` : '<span class="chip device">As proposed</span>'}</div>
      <div class="scroll-x"><table class="tbl a-tot"><tr><th>Condition</th><th class="num">Analysed</th><th class="num">Min</th><th></th></tr>${rows}</table></div>
      <div class="bd" style="display:grid;gap:10px">
        <div class="row between"><h3>${COND[key].label}: excluded</h3><span class="xs muted">${totals(key).ex} of ${P.segs.length} segments</span></div>
        <div class="a-xl">${ex.length ? `<table class="tbl">${ex.map(o => `<tr class="link" data-jump="${o.i}"><td class="mono small">${fmt(o.s.t0)}</td><td><span class="a-sw" style="background:${o.rs ? REASON[o.rs].col : INCL_COL}"></span>${o.rs ? REASON[o.rs].label : 'Included'}${o.rs !== o.pr && (o.rs == null) !== (o.pr == null) ? ' <span class="chip amber">changed</span>' : ''}<div class="xs muted">${o.pr ? 'Proposed: ' + REASON[o.pr].label.toLowerCase() : 'Proposed: include'}</div></td><td class="num"><button class="btn sm" data-tog="${o.i}">${o.rs ? 'Include' : 'Exclude'}</button></td></tr>`).join('')}</table>` : '<div class="empty small">No excluded segments</div>'}</div>
        <div class="a-legend">${Object.values(REASON).map(r => `<span><i style="background:${r.col}"></i>${r.label}</span>`).join('')}<span><i style="background:${INCL_COL}"></i>Included</span></div>
        ${st.confirmed ? `<div class="banner ok"><b>Confirmed</b><span style="flex:1">by Clinician 1${st.at ? ' at ' + st.at : ''}${st.changes ? ', ' + st.changes + ' manual change' + (st.changes > 1 ? 's' : '') : ''}</span></div>` : ''}
        ${short ? '<div class="banner warn small"><span>Below the minimum analysed time. Include segments or reject the recording.</span></div>' : ''}
        <div class="row between"><button class="btn" id="aReset" ${ch ? '' : 'disabled'}>Reset to proposal</button>
          ${st.confirmed ? '<button class="btn primary" id="aNext">Review cleaning ›</button>' : `<button class="btn primary" id="aOk" ${short ? 'disabled' : ''}>Confirm segments</button>`}</div>
      </div></div>`;
  $$('[data-cond]', el).forEach(r => r.onclick = () => selectCond(r.dataset.cond));
  $$('[data-jump]', el).forEach(r => r.onclick = (e) => { if (e.target.closest('[data-tog]')) return; const s = P.segs[+r.dataset.jump]; V.start = clampStart(Math.floor(s.t0 / V.tb) * V.tb); V.hover = +r.dataset.jump; redraw(); });
  $$('[data-tog]', el).forEach(b => b.onclick = () => { const i = +b.dataset.tog, ex = !S.cur[i]; setExcl(i, ex);
    A.addLog('Clinician 1', `${ex ? 'Excluded' : 'Included'} segment ${i + 1} (${fmt(P.segs[i].t0)} to ${fmt(P.segs[i].t1)}) of ${COND[key].label.toLowerCase()}`); afterEdit(); });
  const rs = $('#aReset', el); if (rs) rs.onclick = () => { Object.keys(COND).forEach(k => { SEG[k] = { cur: plan(k).prop.slice() }; }); A.addLog('Clinician 1', 'Reset segments to the automatic proposal'); A.toast('Segments reset to the proposal'); afterEdit(); };
  const ok = $('#aOk', el); if (ok) ok.onclick = () => {
    const analysed = Object.fromEntries(Object.keys(COND).map(k => [k, totals(k).an]));
    A.state.segments = Object.assign(A.state.segments, { confirmed: true, changes: ch, analysed, at: A.time() });
    A.addLog('Clinician 1', `Confirmed segments: eyes open ${analysed.EO} s, eyes closed ${analysed.EC} s, VCPT ${analysed.VCPT} s analysed; ${ch ? ch + ' manual change' + (ch > 1 ? 's' : '') : 'as proposed'}`);
    A.toast(ch ? 'Segments confirmed with your changes. In the mockup the results keep the proposed segments.' : 'Segments confirmed as proposed');
    A.refresh();
  };
  const nx = $('#aNext', el); if (nx) nx.onclick = () => A.go('cleaning');
}
function afterEdit() {
  if (A.state.segments.confirmed) { A.state.segments.confirmed = false; A.toast('Segments changed after confirmation: confirm them again'); A.refresh(); return; }
  redraw(); side();
}
const clampStart = (s) => Math.max(0, Math.min(Math.ceil(COND[V.cond].dur / V.tb) * V.tb - V.tb, s));
function page(d) { V.start = clampStart(V.start + d * V.tb); V.hover = null; redraw(); syncPager(); }
function syncPager() { const p = $('#aPrev'), n = $('#aNextP'); if (p) p.disabled = V.start <= 0; if (n) n.disabled = V.start + V.tb >= COND[V.cond].dur; }
function selectCond(k) { V.cond = k; V.start = 0; V.hover = null; $$('#aCond button').forEach(b => b.classList.toggle('on', b.dataset.k === k)); redraw(); side(); syncPager(); }

A.css('a-workspace', `
.a-seg { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
@media (max-width: 1180px) { .a-seg { grid-template-columns: minmax(0, 1fr); } }
.a-seg .toolbar { border-radius: var(--r) var(--r) 0 0; }
.a-seg .toolbar select { max-width: 150px; }
.a-pg { margin-left: auto; display: inline-flex; gap: 4px; align-items: center; }
.a-box { overflow-x: auto; padding: 10px 12px 0; }
.a-box canvas { display: block; border-radius: 4px; touch-action: none; }
#aTr { cursor: pointer; }
#aStrip { cursor: ew-resize; }
.a-stat { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; padding: 6px 12px 8px; font-size: 12px; color: var(--muted); }
.a-stat b { color: var(--ink); font-weight: 600; }
.a-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 11.5px; color: var(--muted); }
.a-legend i, .a-sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; vertical-align: -1px; }
.a-xl { max-height: 300px; overflow: auto; border: 1px solid var(--line); border-radius: 6px; }
.a-xl .tbl td { padding: 5px 8px; } .a-xl .tbl tr:last-child td { border-bottom: 0; }
.a-tot td, .a-tot th { padding: 6px 8px; white-space: nowrap; }
.a-ttl { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.a-cl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 16px; align-items: start; }
@media (max-width: 1100px) { .a-cl { grid-template-columns: minmax(0, 1fr); } }
.a-icg { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
.a-ic { border: 1px solid var(--line); border-radius: 7px; background: var(--surface); padding: 6px 6px 5px; display: grid; gap: 2px; cursor: pointer; position: relative; min-width: 0; }
.a-ic:hover { border-color: var(--accent); }
.a-ic.sel { box-shadow: 0 0 0 2px var(--accent); border-color: var(--accent); }
.a-ic.rm { background: var(--warn-soft); border-color: transparent; }
.a-ic.rm .a-map { opacity: 0.72; }
.a-ic .a-map { background: var(--paper); border-radius: 5px; display: grid; place-items: center; padding: 2px 0; }
.a-ic .n { font-family: var(--f-mono); font-size: 11px; color: var(--muted); display: flex; justify-content: space-between; }
.a-ic .lb { font-size: 12px; font-weight: 500; line-height: 1.25; min-height: 30px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.a-ic .pr { font-size: 11px; color: var(--muted); }
.a-ic label { font-size: 11.5px; display: flex; gap: 5px; align-items: center; cursor: pointer; }
.a-ic.rm label { color: var(--warn); font-weight: 600; }
.a-ic .chg { font-size: 10px; font-weight: 600; color: var(--amber); font-family: var(--f-ui); }
.a-det { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px; align-items: start; }
@media (max-width: 560px) { .a-det { grid-template-columns: minmax(0, 1fr); } }
.a-fig { padding: 8px; }
.a-fig h4 { font-size: 12px; color: #55554f; font-weight: 600; margin: 0 0 4px; }
.a-ba-leg { display: inline-flex; gap: 12px; font-size: 12px; color: var(--muted); align-items: center; }
.a-ba-leg i { display: inline-block; width: 16px; height: 2px; vertical-align: 3px; margin-right: 5px; }
`);

window.Modules.segments = {
  render(root) {
    if (!A.state.segments.confirmed) A.state.segments.changes = allChanges();
    root.innerHTML = `<div class="a-seg">
      <div class="card">
        <div class="toolbar" role="toolbar" aria-label="EEG viewer">
          <div class="seg" id="aCond">${Object.keys(COND).map(k => `<button data-k="${k}" class="${V.cond === k ? 'on' : ''}">${COND[k].label}</button>`).join('')}</div>
          <span class="sep"></span>
          <label>Montage <select id="aMont"><option>Average reference</option><option disabled>Bipolar longitudinal</option></select></label>
          <label>Gain <select id="aGain">${[3, 5, 7, 10, 15, 20, 30, 50].map(v => `<option value="${v}" ${v === V.gain ? 'selected' : ''}>${v} µV/mm</option>`).join('')}</select></label>
          <div class="seg" id="aTb" aria-label="Timebase">${[10, 20, 30].map(v => `<button data-v="${v}" class="${V.tb === v ? 'on' : ''}">${v} s</button>`).join('')}</div>
          <span class="sep"></span>
          <label>HP <select id="aHp">${[[0, 'Off'], [0.5, '0.5 Hz'], [1, '1 Hz'], [1.6, '1.6 Hz']].map(([v, l]) => `<option value="${v}" ${v === V.hp ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label>LP <select id="aLp">${[[0, 'Off'], [15, '15 Hz'], [30, '30 Hz'], [35, '35 Hz'], [45, '45 Hz']].map(([v, l]) => `<option value="${v}" ${v === V.lp ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label><input type="checkbox" id="aNotch" ${V.notch ? 'checked' : ''}> Notch 50 Hz</label>
          <span class="xs muted" title="Filters change the display only, not the analysis">display only</span>
          <span class="a-pg"><button class="btn sm" id="aPrev" aria-label="Previous page">◀</button><button class="btn sm" id="aNextP" aria-label="Next page">▶</button></span>
        </div>
        <div class="a-box paper" style="border:0;border-radius:0;background:var(--paper)"><canvas id="aTr" aria-label="EEG traces, 19 channels"></canvas><canvas id="aStrip" style="margin-top:6px" aria-label="Whole recording overview: segments and current page"></canvas></div>
        <div class="a-stat" id="aStat"></div>
      </div>
      <div id="aSide"></div>
    </div>`;
    $$('#aCond button', root).forEach(b => b.onclick = () => selectCond(b.dataset.k));
    $('#aGain', root).onchange = e => { V.gain = +e.target.value; drawTraces(); };
    $$('#aTb button', root).forEach(b => b.onclick = () => { V.tb = +b.dataset.v; V.start = clampStart(Math.floor(V.start / V.tb) * V.tb); $$('#aTb button').forEach(x => x.classList.toggle('on', x === b)); redraw(); syncPager(); });
    $('#aHp', root).onchange = e => { V.hp = +e.target.value; drawTraces(); };
    $('#aLp', root).onchange = e => { V.lp = +e.target.value; drawTraces(); };
    $('#aNotch', root).onchange = e => { V.notch = e.target.checked; drawTraces(); };
    $('#aPrev', root).onclick = () => page(-1); $('#aNextP', root).onclick = () => page(1);
    const tr = $('#aTr', root), strip = $('#aStrip', root);
    tr.onpointerdown = e => {
      const i = segAt(e.offsetX); if (i == null) return;
      const ex = !segState(V.cond).cur[i]; drag = { ex, seen: new Set([i]) }; setExcl(i, ex); tr.setPointerCapture(e.pointerId); redraw();
    };
    tr.onpointermove = e => {
      const i = segAt(e.offsetX);
      if (drag && i != null && !drag.seen.has(i)) { drag.seen.add(i); setExcl(i, drag.ex); V.hover = i; redraw(); return; }
      if (i !== V.hover) { V.hover = i; drawTraces(); status(); }
    };
    tr.onpointerup = () => {
      if (!drag) return; const ids = [...drag.seen].sort((a, b) => a - b), P = plan(V.cond);
      A.addLog('Clinician 1', `${drag.ex ? 'Excluded' : 'Included'} segment${ids.length > 1 ? 's' : ''} ${ids.length > 1 ? (ids[0] + 1) + ' to ' + (ids[ids.length - 1] + 1) : ids[0] + 1} (${fmt(P.segs[ids[0]].t0)} to ${fmt(P.segs[ids[ids.length - 1]].t1)}) of ${COND[V.cond].label.toLowerCase()}`);
      drag = null; afterEdit();
    };
    tr.onpointerleave = () => { if (!drag && V.hover != null) { V.hover = null; drawTraces(); status(); } };
    let scrub = false;
    const jump = (e) => { const W = strip.clientWidth, t = (e.offsetX - 44) / (W - 54) * COND[V.cond].dur; V.start = clampStart(Math.floor(t / V.tb) * V.tb); redraw(); syncPager(); };
    strip.onpointerdown = e => { scrub = true; strip.setPointerCapture(e.pointerId); jump(e); };
    strip.onpointermove = e => { if (scrub) jump(e); };
    strip.onpointerup = () => { scrub = false; };
    keyH = e => {
      if (e.target.closest && e.target.closest('input, select, textarea, .dlg-back') || $('.dlg-back')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); page(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); page(-1); }
      else if (e.key === 'Home') { V.start = 0; redraw(); syncPager(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const o = [3, 5, 7, 10, 15, 20, 30, 50], j = o.indexOf(V.gain) + (e.key === 'ArrowUp' ? -1 : 1); if (o[j]) { V.gain = o[j]; $('#aGain').value = V.gain; drawTraces(); } }
    };
    window.addEventListener('keydown', keyH);
    ro = new ResizeObserver(() => redraw()); ro.observe($('.a-box', root));
    side(); redraw(); syncPager();
  },
  destroy() { if (keyH) window.removeEventListener('keydown', keyH); keyH = null; if (ro) ro.disconnect(); ro = null; drag = null; L = null; },
};

/* ================================ Cleaning tab ================================ */
const PROP = A.m2.quality.ica.proposed_removed;
const PROPSET = new Set(PROP.map(p => p.ic));
const IC_DEF = [
  [1, 'Eye blinks', 'Eye', 0.97, 'blink'], [2, 'Horizontal eye movements', 'Eye', 0.91, 'hem'], [3, 'Posterior alpha', 'Brain', 0.94, 'alpha'],
  [4, 'Frontal midline', 'Brain', 0.86, 'theta'], [5, 'Central left', 'Brain', 0.81, 'muL'], [6, 'Muscle, left temporal', 'Muscle', 0.64, 'muscle'],
  [7, 'Central right', 'Brain', 0.79, 'muR'], [8, 'Parietal', 'Brain', 0.77, 'brain'], [9, 'Electrode noise, right temporal', 'Channel noise', 0.46, 'pop'],
  [10, 'Occipital left', 'Brain', 0.71, 'brain'], [11, 'Frontal right', 'Brain', 0.66, 'brain'], [12, 'Temporal right', 'Brain', 0.58, 'brain'],
  [13, 'Parietal left', 'Brain', 0.55, 'brain'], [14, 'Unclassified', 'Other', 0.49, 'other'], [15, 'Central midline', 'Brain', 0.52, 'brain'],
  [16, 'Unclassified', 'Other', 0.53, 'other'], [17, 'Frontal left', 'Brain', 0.47, 'brain'], [18, 'Unclassified', 'Other', 0.58, 'other'],
  [19, 'Unclassified', 'Other', 0.61, 'other'],
].map(([ic, label, cls, p, kind]) => { const pr = PROP.find(x => x.ic === ic); return { ic, label: pr ? pr.kind.charAt(0).toUpperCase() + pr.kind.slice(1) : label, kind: pr ? pr.kind : label.toLowerCase(), cls, p: pr ? pr.confidence : p, type: kind }; });
const CN = 20 * FS; /* 20 s of eyes open for the component view */
let ICM = null;
function icModel() {
  if (ICM) return ICM;
  const r = rng(6060);
  const zs = (w) => { const m = w.reduce((a, b) => a + b, 0) / NCH; return w.map(v => v - m); };
  const topoFor = (d) => {
    const g = (x, y, s) => CH.map(c => near(c, x, y, s));
    switch (d.type) {
      case 'blink': return zs(CH.map((c, i) => W_BLINK[i] + 0.25 * near(c, 0, 0.9, 0.35)));
      case 'hem': return zs(CH.map((c, i) => W_HEM[i] * 0.8 + 0.4 * A.pos[c][0] * near(c, 0, 0.6, 0.5)));
      case 'alpha': return zs(g(0, -0.9, 0.42));
      case 'theta': return zs(g(0, 0.45, 0.38));
      case 'muL': return zs(g(-0.5, 0.05, 0.3));
      case 'muR': return zs(g(0.5, 0.05, 0.3));
      case 'muscle': return zs(CH.map((c, i) => W_MUS.L[i] + 0.2 * near(c, -1, -0.1, 0.25)));
      case 'pop': return zs(CH.map(c => (c === 'T4' ? 1 : 0.04 * gauss(r))));
      default: {
        const p = d.label.toLowerCase(), x = p.includes('left') ? -0.5 : p.includes('right') ? 0.5 : U(r, -0.4, 0.4);
        const y = p.includes('frontal') ? 0.6 : p.includes('occipital') ? -0.85 : p.includes('parietal') ? -0.5 : p.includes('temporal') ? 0 : U(r, -0.6, 0.6);
        const s1 = g(x * (p.includes('temporal') ? 1.8 : 1), y, U(r, 0.3, 0.5)), s2 = g(U(r, -0.8, 0.8), U(r, -0.8, 0.8), 0.35), k = d.type === 'other' ? U(r, -0.9, 0.9) : U(r, -0.45, 0.45);
        return zs(s1.map((v, i) => v + k * s2[i]));
      }
    }
  };
  const tc = (d) => {
    const s = new Float32Array(CN), pk = pink(r);
    for (let i = 0; i < CN; i++) s[i] = 0.05 * gauss(r);
    const bump = (t, a) => { const i0 = Math.floor(t * FS), L = 0.42 * FS; for (let i = 0; i < L; i++) s[i0 + i] += a * Math.sin(Math.PI * Math.pow(i / L, 0.65)) ** 2; };
    let ph = 0; const env = slow(r, 0.35);
    switch (d.type) {
      case 'blink': [1.2, 4.6, 8.1, 11.9, 15.2, 18.4].forEach((t, j) => bump(t, [1, 0.9, 1.1, 0.95, 1.05, 0.85][j])); break;
      case 'hem': [[2.6, 0.8, 1], [6.1, 1.1, -0.9], [13.4, 0.9, 0.8], [16.9, 0.7, -1]].forEach(([t, d2, a]) => { for (let i = 0; i < CN; i++) { const u = i / FS; s[i] += a * (1 / (1 + Math.exp(-(u - t) / 0.025)) - 1 / (1 + Math.exp(-(u - t - d2) / 0.025))); } }); break;
      case 'alpha': case 'muL': case 'muR': case 'theta': { const f = { alpha: 9, muL: 10.6, muR: 10.4, theta: 6.2 }[d.type];
        for (let i = 0; i < CN; i++) { ph += 2 * Math.PI * f / FS; s[i] += Math.max(0.05, 0.7 + 0.45 * env()) * (Math.sin(ph) + (d.type.startsWith('mu') ? 0.3 * Math.sin(2 * ph + 0.6) : 0)) + 0.25 * pk(); } break; }
      case 'muscle': { let lp = 0; for (let i = 0; i < CN; i++) { const u = i / FS, g0 = gauss(r); lp = 0.55 * lp + 0.45 * g0; const e = 0.12 + (u > 3 && u < 4.9 ? Math.sin(Math.PI * (u - 3) / 1.9) : 0) + (u > 12.2 && u < 13.5 ? 0.8 * Math.sin(Math.PI * (u - 12.2) / 1.3) : 0); s[i] += 1.6 * e * (g0 - lp); } break; }
      case 'pop': [[7.2, 1], [7.95, -0.6], [15.6, 0.8]].forEach(([t, a]) => { const i0 = Math.floor(t * FS); for (let i = 0; i < 1.6 * FS; i++) s[i0 + i] += a * Math.min(1, i / 2) * Math.exp(-i / FS / 0.3); });
        for (let i = 0; i < CN; i++) s[i] += 0.06 * Math.sin(2 * Math.PI * 50 * i / FS) + 0.05 * pk(); break;
      case 'other': for (let i = 0; i < CN; i++) s[i] += 0.6 * gauss(r) + 0.5 * pk(); break;
      default: for (let i = 0; i < CN; i++) s[i] += pk();
    }
    return s;
  };
  const amp = { blink: 110, hem: 42, alpha: 13, theta: 6, muL: 5, muR: 5, muscle: 15, pop: 70, brain: 0, other: 0 };
  const comps = IC_DEF.map((d, j) => ({ ...d, w: topoFor(d), s: tc(d), a: amp[d.type] || (d.type === 'other' ? U(r, 2, 3.5) : 7 - j * 0.22) }));
  comps.forEach(c => { const mx = Math.max(...c.w.map(Math.abs)); c.w = c.w.map(v => v / mx); c.z = c.w.map(v => v * 2.7); });
  /* explained variance: each component's projected variance over the total */
  const pv = comps.map(c => { let ss = 0, m = 0; for (let i = 0; i < CN; i++) m += c.s[i]; m /= CN; for (let i = 0; i < CN; i++) ss += (c.s[i] - m) ** 2; return ss / CN * c.a * c.a * c.w.reduce((a, b) => a + b * b, 0); });
  const tot = pv.reduce((a, b) => a + b, 0); comps.forEach((c, j) => { c.var = pv[j] / tot * 100; });
  return (ICM = { comps });
}
function mix(chans, removed, from, len) {
  const { comps } = icModel();
  return chans.map(ch => { const c = CI[ch], out = new Float32Array(len); comps.forEach(k => { if (removed && removed.has(k.ic)) return; const w = k.a * k.w[c]; for (let i = 0; i < len; i++) out[i] += w * k.s[from + i]; }); return out; });
}
function spectrum(s) {
  const N = 256, hop = 128, F = []; for (let f = 1; f <= 45; f += 0.5) F.push(f);
  const P = F.map(() => 0), win = Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));
  let nw = 0;
  for (let o = 0; o + N <= s.length; o += hop, nw++) {
    let m = 0; for (let i = 0; i < N; i++) m += s[o + i]; m /= N;
    F.forEach((f, j) => { const b = f * N / FS; let re = 0, im = 0; for (let i = 0; i < N; i++) { const v = (s[o + i] - m) * win[i], a = 2 * Math.PI * b * i / N; re += v * Math.cos(a); im -= v * Math.sin(a); } P[j] += re * re + im * im; });
  }
  return { F, P: P.map(v => v / nw) };
}

const C = { sel: 1, removed: null, ba: 'overlay', win: 0, spec: {} };
const removedSet = () => { if (!C.removed) C.removed = new Set(PROPSET); return C.removed; };
const changes = () => icModel().comps.filter(c => removedSet().has(c.ic) !== PROPSET.has(c.ic)).map(c => ({ ic: c.ic, kind: c.kind, removed: removedSet().has(c.ic) }));
const pct = (p) => Math.round(p * 100) + '%';

function icCard(c) {
  const rm = removedSet().has(c.ic), chg = rm !== PROPSET.has(c.ic);
  return `<div class="a-ic ${rm ? 'rm' : ''} ${C.sel === c.ic ? 'sel' : ''}" data-ic="${c.ic}" tabindex="0" role="button" aria-pressed="${C.sel === c.ic}" aria-label="Component ${c.ic}, ${A.esc(c.label)}">
    <div class="n"><span>IC ${c.ic}</span>${chg ? '<span class="chg" title="Changed manually">● changed</span>' : (PROPSET.has(c.ic) ? '<span title="The automatic cleaning proposes removing it">proposed</span>' : '')}</div>
    <div class="a-map"><canvas data-map="${c.ic}"></canvas></div>
    <div class="lb">${A.esc(c.label)}</div>
    <div class="pr">${A.esc(c.cls)} ${pct(c.p)} · ${c.var.toFixed(1)}%</div>
    <label><input type="checkbox" data-rm="${c.ic}" ${rm ? 'checked' : ''}> Remove</label>
  </div>`;
}
function head() {
  const el = $('#aCHead'); if (!el) return;
  const ch = changes(), n = removedSet().size, st = A.state.cleaning, segOk = A.state.segments.confirmed;
  el.innerHTML = `<div class="a-ttl"><h2>Artefact removal, ICA ${A.ann('3.4 Clinician in control, Working')}${A.ann('I8')}</h2>
      <span class="small muted">${n} of 19 components removed · proposal: ${[...PROPSET].join(', ')}</span>
      ${ch.length ? `<span class="chip amber"><span class="d"></span>Changed manually · ${ch.map(c => 'IC ' + c.ic + (c.removed ? ' removed' : ' kept')).join(', ')}</span>` : '<span class="chip device">As proposed</span>'}
      ${st.confirmed ? '<span class="chip ok">Accepted</span>' : ''}</div>
    <div class="row">${ch.length ? '<button class="btn ghost sm" id="aCReset">Reset to proposal</button>' : ''}<button class="btn danger" id="aRej">Reject recording</button>
      <button class="btn primary" id="aAcc" ${segOk ? '' : 'disabled title="Confirm the segments first"'}>${st.confirmed ? 'Accept again' : 'Accept cleaning'}</button></div>`;
  const rs = $('#aCReset'); if (rs) rs.onclick = () => { C.removed = new Set(PROPSET); A.addLog('Clinician 1', 'Reset ICA cleaning to the automatic proposal'); refreshAll(); };
  $('#aRej').onclick = reject;
  $('#aAcc').onclick = accept;
}
function accept() {
  const ch = changes(), n = removedSet().size;
  ch.forEach(c => A.addLog('Clinician 1', `${c.removed ? 'Removed' : 'Kept'} component ${c.ic} (${c.kind}) ${c.removed ? 'although the automatic cleaning proposed keeping it' : 'although the automatic cleaning proposed removing it'}`));
  A.state.cleaning = { confirmed: true, changed: ch, removedCount: n };
  A.addLog('Clinician 1', `Accepted the ICA cleaning: ${n} of 19 components removed${ch.length ? ', changed manually' : ', as proposed'}`);
  A.toast(ch.length ? 'Cleaning accepted with your changes; the report states them' : 'Cleaning accepted as proposed');
  A.go('results');
}
function reject() {
  A.dialog({ title: 'Reject recording', ok: 'Reject recording', body: `
    <div class="field"><span>Reason</span><select id="aRjR"><option>Too many artefacts</option><option>Electrode problem</option><option>Protocol not followed</option><option>Patient could not cooperate</option><option>Other</option></select></div>
    <div class="field"><span>Note (optional)</span><textarea id="aRjN" rows="3" placeholder="Visible to the clinic only"></textarea></div>
    <p class="xs muted" style="margin:0">A rejected recording produces no results and no report. The patient can be recorded again.</p>`,
    onOk: (back) => {
      const why = $('#aRjR', back).value, note = $('#aRjN', back).value.trim();
      A.addLog('Clinician 1', `Rejected the recording of 15 Sep 2026: ${why}${note ? ' (' + note + ')' : ''}. Mockup: the case stays accepted`);
      A.toast('Rejection logged. In the mockup the case stays accepted so the walkthrough can go on.');
    } });
}
function grid() {
  const el = $('#aGrid'); if (!el) return;
  el.innerHTML = icModel().comps.map(icCard).join('');
  icModel().comps.forEach(c => A.topo($(`[data-map="${c.ic}"]`, el), c.z, { size: 76 }));
  $$('.a-ic', el).forEach(card => {
    const pick = () => { C.sel = +card.dataset.ic; $$('.a-ic', el).forEach(x => { x.classList.toggle('sel', x === card); x.setAttribute('aria-pressed', x === card); }); detail(); };
    card.onclick = (e) => { if (e.target.closest('label')) return; pick(); };
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
  });
  $$('[data-rm]', el).forEach(cb => cb.onchange = () => toggle(+cb.dataset.rm, cb.checked));
}
function toggle(ic, rm) {
  const s = removedSet(); if (rm) s.add(ic); else s.delete(ic);
  if (A.state.cleaning.confirmed) { A.state.cleaning.confirmed = false; A.toast('Cleaning changed after acceptance: accept it again'); C.sel = ic; A.refresh(); return; }
  C.sel = ic; refreshAll();
}
function refreshAll() { head(); grid(); detail(); before(); }

function detail() {
  const el = $('#aDet'); if (!el) return;
  const c = icModel().comps.find(k => k.ic === C.sel), rm = removedSet().has(c.ic), pr = PROPSET.has(c.ic);
  el.innerHTML = `<div class="hd"><h2>IC ${c.ic} · ${A.esc(c.label)}</h2><div class="row">${rm !== pr ? '<span class="chip amber">Changed manually</span>' : ''}<button class="btn sm ${rm ? '' : 'danger'}" id="aDetT">${rm ? 'Keep component' : 'Remove component'}</button></div></div>
    <div class="bd" style="display:grid;gap:12px">
      <div class="a-det"><div class="paper a-fig"><canvas id="aDetMap"></canvas></div>
        <dl class="kv"><dt>Classifier</dt><dd>${A.esc(c.cls)} <b class="num">${pct(c.p)}</b></dd><dt>Explained variance</dt><dd class="num">${c.var.toFixed(1)}%</dd>
          <dt>Proposal</dt><dd>${pr ? '<span class="chip device">Remove</span>' : '<span class="chip device">Keep</span>'}</dd><dt>Your choice</dt><dd>${rm ? '<span class="chip warn">Remove</span>' : '<span class="chip clinician">Keep</span>'}</dd>
          <dt>Strongest at</dt><dd class="mono">${CH.map((ch, i) => [ch, Math.abs(c.w[i])]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]).join(', ')}</dd></dl></div>
      <div class="paper a-fig"><h4>Time course, eyes open, 0 to 10 s (a.u.)</h4><canvas id="aDetTc"></canvas></div>
      <div class="paper a-fig"><h4>Power spectrum, 1 to 45 Hz (dB, relative to peak)</h4><canvas id="aDetSp"></canvas></div>
    </div>`;
  A.topo($('#aDetMap', el), c.z, { size: 170, names: true });
  $('#aDetT', el).onclick = () => toggle(c.ic, !rm);
  const wTc = Math.max(300, $('#aDetTc', el).parentElement.clientWidth - 16);
  /* time course */
  { const cv = $('#aDetTc', el), H = 96, g = setupCanvas(cv, wTc, H), n = 10 * FS, s = c.s; let mx = 1e-6; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(s[i]));
    g.strokeStyle = GRID; g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED;
    for (let t = 0; t <= 10; t++) { const x = crisp(8 + t / 10 * (wTc - 16)); g.beginPath(); g.moveTo(x, 4); g.lineTo(x, H - 14); g.stroke(); if (t % 2 === 0) g.fillText(t + ' s', Math.min(wTc - 22, x - 4), H - 2); }
    g.strokeStyle = INK; g.lineWidth = 0.9; g.beginPath();
    for (let i = 0; i < n; i++) { const x = 8 + i / n * (wTc - 16), y = (H - 14) / 2 + 2 - s[i] / mx * ((H - 22) / 2); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke(); }
  /* spectrum */
  { const cv = $('#aDetSp', el), H = 130, g = setupCanvas(cv, wTc, H), sp = C.spec[c.ic] || (C.spec[c.ic] = spectrum(c.s)), mx = Math.max(...sp.P);
    const X0 = 34, PW = wTc - X0 - 8, PH = H - 28, x = (f) => X0 + (f - 1) / 44 * PW, y = (db) => 6 + Math.min(1, -db / 40) * PH;
    g.fillStyle = 'rgba(19,94,125,0.06)'; g.fillRect(x(8), 6, x(12) - x(8), PH);
    g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.strokeStyle = GRID;
    [0, -10, -20, -30, -40].forEach(d => { g.beginPath(); g.moveTo(X0, crisp(y(d))); g.lineTo(X0 + PW, crisp(y(d))); g.stroke(); g.fillText(String(d), 4, y(d) + 3); });
    [1, 10, 20, 30, 40].forEach(f => { g.fillText(f + (f === 40 ? ' Hz' : ''), x(f) - 4, H - 8); });
    g.fillText('alpha', x(8) + 3, 16);
    g.beginPath(); sp.F.forEach((f, j) => { const db = 10 * Math.log10(sp.P[j] / mx + 1e-9); if (j) g.lineTo(x(f), y(db)); else g.moveTo(x(f), y(db)); });
    g.strokeStyle = '#135e7d'; g.lineWidth = 1.6; g.stroke(); g.lineWidth = 1; }
}

const BA_CH = ['Fp1', 'Fp2', 'F7', 'F8', 'T3', 'T4'];
function before() {
  const el = $('#aBA'); if (!el) return;
  const cv = $('#aBAc', el), W = Math.max(640, cv.parentElement.clientWidth - 2), ROW = 46, TOP = 6, H = TOP + ROW * BA_CH.length + 20, GUT = 44, PW = W - GUT - 56, len = 10 * FS, from = C.win * len;
  const g = setupCanvas(cv, W, H), b = mix(BA_CH, null, from, len), a = mix(BA_CH, removedSet(), from, len), k = PX_MM / 15;
  g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.strokeStyle = GRID;
  for (let t = 0; t <= 10; t++) { const x = crisp(GUT + t / 10 * PW); g.beginPath(); g.moveTo(x, TOP); g.lineTo(x, H - 16); g.stroke(); g.fillText(fmt(C.win * 10 + t), Math.min(W - 26, x - 10), H - 4); }
  const line = (s, y0, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let i = 0; i < len; i++) { const x = GUT + i / len * PW, y = y0 - s[i] * k; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); };
  g.save(); g.beginPath(); g.rect(GUT, 0, PW, H - 16); g.clip();
  BA_CH.forEach((ch, j) => { const y0 = TOP + ROW * (j + 0.5);
    if (C.ba !== 'after') line(b[j], y0, C.ba === 'overlay' ? 'rgba(196,62,48,0.75)' : INK, 0.9);
    if (C.ba !== 'before') line(a[j], y0, INK, 1); });
  g.restore(); g.lineWidth = 1;
  g.font = '500 11px IBM Plex Mono, monospace'; g.fillStyle = INK; g.textAlign = 'right'; BA_CH.forEach((ch, j) => g.fillText(ch, GUT - 8, TOP + ROW * (j + 0.5) + 4)); g.textAlign = 'left';
  calib(g, GUT + PW + 10, H - 18, 100 * k, 0);
}

window.Modules.cleaning = {
  render(root) {
    removedSet();
    const segOk = A.state.segments.confirmed;
    root.innerHTML = `<div class="grid" style="gap:14px">
      ${segOk ? '' : '<div class="banner amber"><b>Segments not confirmed</b><span style="flex:1">Confirm the segments on the Recording tab before accepting the cleaning.</span><button class="btn sm" id="aGoSeg">Open Recording</button></div>'}
      <div class="row between" id="aCHead"></div>
      <div class="a-cl">
        <div class="card"><div class="hd"><h3>Components</h3><span class="xs muted">Map · classifier · explained variance</span></div><div class="bd"><div class="a-icg" id="aGrid"></div></div></div>
        <div class="card" id="aDet"></div>
      </div>
      <div class="card" id="aBA"><div class="hd"><h3>Signal before and after removal</h3>
        <div class="row"><span class="a-ba-leg"><span><i style="background:rgba(196,62,48,0.75)"></i>Before</span><span><i style="background:${INK};outline:1px solid var(--line-2)"></i>After</span></span>
          <div class="seg" id="aBaM">${[['overlay', 'Overlay'], ['before', 'Before'], ['after', 'After']].map(([k, l]) => `<button data-k="${k}" class="${C.ba === k ? 'on' : ''}">${l}</button>`).join('')}</div>
          <div class="seg" id="aBaW"><button data-w="0" class="${C.win === 0 ? 'on' : ''}">0:00 to 0:10</button><button data-w="1" class="${C.win === 1 ? 'on' : ''}">0:10 to 0:20</button></div>
          <span class="xs muted">Eyes open · 15 µV/mm</span></div></div>
        <div class="paper scroll-x" style="margin:10px 12px 12px;padding:4px 0"><canvas id="aBAc" aria-label="Frontal and temporal channels before and after removing the selected components"></canvas></div></div>
    </div>`;
    const gs = $('#aGoSeg', root); if (gs) gs.onclick = () => A.go('segments');
    $$('#aBaM button', root).forEach(b => b.onclick = () => { C.ba = b.dataset.k; $$('#aBaM button').forEach(x => x.classList.toggle('on', x === b)); before(); });
    $$('#aBaW button', root).forEach(b => b.onclick = () => { C.win = +b.dataset.w; $$('#aBaW button').forEach(x => x.classList.toggle('on', x === b)); before(); });
    refreshAll();
    let last = 0;
    ro = new ResizeObserver(() => { const w = root.clientWidth; if (Math.abs(w - last) > 4) { last = w; detail(); before(); } }); ro.observe(root);
  },
  destroy() { if (ro) ro.disconnect(); ro = null; },
};
