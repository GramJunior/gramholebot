#!/usr/bin/env node
// Эмбервейл v42 — офлайн-генератор звуков (без сэмпл-библиотек и сети).
// Каждый звук собирается из слоёв: шумы (белый/розовый/бурый), фильтры с огибающей частоты, FM, модальный синтез (металл, дерево,
// колокола), струна Карплуса — Стронга, голосовой тракт (глоттальный источник + форманты), гранулы, реверберация (Freeverb).
// Затем: обрезка тишины, нормализация громкости (BS.1770: K-фильтр, стробирование; цель по категории, пик −1 dBFS),
// кодирование ffmpeg в моно Opus (.ogg) и AAC (.m4a — для iOS без Opus), манифест sfx/sfx.json (id, варианты, группа, хэш).
// Запуск: node apps/emberveil/tools/sfxgen.js [--only id1,id2] [--keepwav]
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const OUT = path.resolve(__dirname, '..', 'sfx');
const TMP = process.env.SFX_TMP || path.join(require('os').tmpdir(), 'ev_sfxgen');
const FF = process.env.FFMPEG || '/usr/bin/ffmpeg';
const SR = 48000, PI = Math.PI, TAU = PI * 2;
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });

// ---------------- генератор случайных чисел (повторяемый) ----------------
let _s = 1;
function seed(n) { _s = (n >>> 0) || 1; }
function R() { _s = (_s + 0x6D2B79F5) >>> 0; let t = _s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const rnd = (a = 0, b = 1) => a + (b - a) * R();
const pick = a => a[Math.floor(R() * a.length)];
const N = s => Math.max(1, Math.round(s * SR));
const A = s => new Float32Array(N(s));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const db = d => Math.pow(10, d / 20);

// ---------------- базовые блоки ----------------
function noise(d, type = 'white') {
  const x = A(d); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, br = 0;
  for (let i = 0; i < x.length; i++) {
    const w = R() * 2 - 1;
    if (type === 'pink') { b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; x[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; }
    else if (type === 'brown') { br = (br + .02 * w) / 1.02; x[i] = br * 3.5; }
    else x[i] = w;
  }
  return x;
}
function bqc(type, f, q, g) {
  f = clamp(f, 15, SR * .45); q = Math.max(.05, q);
  const w = TAU * f / SR, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * q), Ag = Math.pow(10, (g || 0) / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === 'pk') { b0 = 1 + al * Ag; b1 = -2 * cs; b2 = 1 - al * Ag; a0 = 1 + al / Ag; a1 = -2 * cs; a2 = 1 - al / Ag; }
  else if (type === 'ls') { const s = 2 * Math.sqrt(Ag) * al; b0 = Ag * ((Ag + 1) - (Ag - 1) * cs + s); b1 = 2 * Ag * ((Ag - 1) - (Ag + 1) * cs); b2 = Ag * ((Ag + 1) - (Ag - 1) * cs - s); a0 = (Ag + 1) + (Ag - 1) * cs + s; a1 = -2 * ((Ag - 1) + (Ag + 1) * cs); a2 = (Ag + 1) + (Ag - 1) * cs - s; }
  else { const s = 2 * Math.sqrt(Ag) * al; b0 = Ag * ((Ag + 1) + (Ag - 1) * cs + s); b1 = -2 * Ag * ((Ag - 1) + (Ag + 1) * cs); b2 = Ag * ((Ag + 1) + (Ag - 1) * cs - s); a0 = (Ag + 1) - (Ag - 1) * cs + s; a1 = 2 * ((Ag - 1) - (Ag + 1) * cs); a2 = (Ag + 1) - (Ag - 1) * cs - s; } // hs
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
class BQ {
  constructor(t, f, q, g) { this.x1 = this.x2 = this.y1 = this.y2 = 0; this.t = t; this.q = q || .707; this.g = g || 0; this.c = bqc(t, f || 1000, this.q, this.g); }
  set(f, q) { this.c = bqc(this.t, f, q || this.q, this.g); }
  p(x) { const c = this.c, y = c[0] * x + c[1] * this.x1 + c[2] * this.x2 - c[3] * this.y1 - c[4] * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
}
// фильтр: f — число или функция времени (с); q — число или функция
function F(x, type, f, q = .707, g = 0) {
  const y = new Float32Array(x.length), b = new BQ(type, typeof f === 'function' ? f(0) : f, typeof q === 'function' ? q(0) : q, g);
  const dyn = typeof f === 'function' || typeof q === 'function';
  for (let i = 0; i < x.length; i++) { if (dyn && (i & 31) === 0) { const t = i / SR; b.set(typeof f === 'function' ? f(t) : f, typeof q === 'function' ? q(t) : q); } y[i] = b.p(x[i]); }
  return y;
}
function osc(type, f, d, o = {}) {
  const x = A(d); let ph = o.ph != null ? o.ph : R(); const dyn = typeof f === 'function';
  const blep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
  for (let i = 0; i < x.length; i++) {
    const fr = dyn ? f(i / SR) : f, dt = Math.min(.45, Math.abs(fr) / SR);
    let v;
    if (type === 'sine') v = Math.sin(TAU * ph);
    else if (type === 'saw') v = 2 * ph - 1 - blep(ph, dt);
    else if (type === 'square') { v = (ph < .5 ? 1 : -1) + blep(ph, dt) - blep((ph + .5) % 1, dt); }
    else v = 1 - 4 * Math.abs(ph - .5); // tri
    x[i] = v; ph += dt; ph -= Math.floor(ph);
  }
  return x;
}
// FM: несущая fc(t), модулятор fc*ratio, индекс I(t)
function fm(fc, ratio, I, d) {
  const x = A(d); let pc = R(), pm = R(); const dc = typeof fc === 'function', dI = typeof I === 'function';
  for (let i = 0; i < x.length; i++) { const t = i / SR, f = dc ? fc(t) : fc; pc += f / SR; pm += f * ratio / SR; x[i] = Math.sin(TAU * pc + (dI ? I(t) : I) * Math.sin(TAU * pm)); }
  return x;
}
// модальный синтез: моды [частота, время спада (с), амплитуда]
function modal(modes, d, o = {}) {
  const x = A(d), att = o.att || .0008;
  for (const [f, dec, amp] of modes) {
    if (f >= SR * .45) continue; const ph = R() * TAU, w = TAU * f / SR, k = Math.exp(-1 / (dec * SR));
    let e = amp; const n = Math.min(x.length, Math.ceil(dec * SR * 7));
    for (let i = 0; i < n; i++) { const a = i < att * SR ? i / (att * SR) : 1; x[i] += e * a * Math.sin(w * i + ph); e *= k; }
  }
  return x;
}
// струна (Карплус — Стронг)
function ks(f, d, o = {}) {
  const L = Math.max(2, Math.round(SR / f)), b = new Float32Array(L), x = A(d), damp = o.damp || .996, br = o.bright == null ? .5 : o.bright;
  for (let i = 0; i < L; i++) b[i] = (R() * 2 - 1) * (1 - br) + (i < L / 2 ? 1 : -1) * br;
  let j = 0;
  for (let i = 0; i < x.length; i++) { const n = (j + 1) % L; x[i] = b[j]; b[j] = damp * (.5 * (b[j] + b[n])); j = n; }
  return x;
}
const sat = (x, dr = 2) => { const k = Math.tanh(dr); for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * dr) / k; return x; };
const mul = (x, fn) => { for (let i = 0; i < x.length; i++) x[i] *= fn(i / SR, i); return x; };
const gain = (x, g) => { for (let i = 0; i < x.length; i++) x[i] *= g; return x; };
// огибающие: экспоненциальный спад с атакой; кусочно-линейная по точкам [t, v]
const dec = (x, tau, att = .002, hold = 0) => mul(x, t => t < att ? t / att : t < att + hold ? 1 : Math.exp(-(t - att - hold) / tau));
function envPts(pts) { return t => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, v0] = pts[i - 1], [t1, v1] = pts[i]; return lerp(v0, v1, (t - t0) / Math.max(1e-9, t1 - t0)); } return pts[pts.length - 1][1]; }; }
const env = (x, pts) => mul(x, envPts(pts));
function mix(dst, src, off = 0, g = 1) { const o = Math.round(off * SR); for (let i = 0; i < src.length && o + i < dst.length; i++) if (o + i >= 0) dst[o + i] += src[i] * g; return dst; }
function sum(d, parts) { const x = A(d); for (const p of parts) mix(x, p[0], p[1] || 0, p[2] == null ? 1 : p[2]); return x; }
function rev(x, o = {}) { // Freeverb (моно), хвост дописывается
  const room = o.room == null ? .82 : o.room, damp = o.damp == null ? .3 : o.damp, wet = o.wet == null ? .3 : o.wet, dry = o.dry == null ? 1 : o.dry, tail = o.tail == null ? 1.2 : o.tail, pre = Math.round((o.pre || .012) * SR);
  const sc = SR / 44100, CL = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(v => Math.round(v * sc * (o.size || 1))), AL = [556, 441, 341, 225].map(v => Math.round(v * sc));
  const n = x.length + N(tail), y = new Float32Array(n);
  const cb = CL.map(l => ({ b: new Float32Array(l), i: 0, f: 0 })), ab = AL.map(l => ({ b: new Float32Array(l), i: 0 }));
  const fb = room * .28 + .7, d1 = damp * .4, d2 = 1 - d1;
  for (let i = 0; i < n; i++) {
    const inp = (i - pre >= 0 && i - pre < x.length ? x[i - pre] : 0) * .015;
    let out = 0;
    for (const c of cb) { const v = c.b[c.i]; out += v; c.f = v * d2 + c.f * d1; c.b[c.i] = inp + c.f * fb; c.i = (c.i + 1) % c.b.length; }
    for (const a of ab) { const bo = a.b[a.i]; const v = -out + bo; a.b[a.i] = out + bo * .5; a.i = (a.i + 1) % a.b.length; out = v; }
    y[i] = out * wet * 3 + (i < x.length ? x[i] * dry : 0);
  }
  return y;
}
// гранулы: короткие кусочки источника с окном Ханна, частота плотности (шт/с)
function grains(d, dens, make) { const x = A(d); const n = Math.round(d * dens); for (let k = 0; k < n; k++) { const t = rnd(0, d); const g = make(t / d); if (g) mix(x, g, t); } return x; }
const hann = (x) => mul(x, (t, i) => .5 - .5 * Math.cos(TAU * i / (x.length - 1 || 1)));
const rev1 = x => { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[x.length - 1 - i]; return y; };
function slow(fn, rate, d) { // плавная случайная кривая (интерполяция случайных точек), значения 0..1
  const pts = []; const n = Math.ceil(d * rate) + 3; for (let i = 0; i < n; i++) pts.push(R()); return t => { const u = t * rate, i = Math.floor(u), f = u - i, s = f * f * (3 - 2 * f); return fn(lerp(pts[i % n], pts[(i + 1) % n], s)); };
}
function click(d = .004, f = 3000, q = 1.2) { return dec(F(noise(d + .01), 'bp', f, q), d * .4, .0003); }

// ---------------- голосовой тракт ----------------
const BLEP = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
const VOW = { a: [730, 1090, 2440], o: [570, 840, 2410], u: [300, 870, 2240], e: [530, 1840, 2480], i: [270, 2290, 3010], ae: [660, 1720, 2410], er: [490, 1350, 1690] };
function vowAt(keys, u) { if (typeof keys === 'string') return VOW[keys]; let a = keys[0], b = keys[keys.length - 1]; for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) { a = keys[i - 1]; b = keys[i]; break; } const t = clamp((u - a[0]) / Math.max(1e-6, b[0] - a[0]), 0, 1); const A1 = VOW[a[1]], B1 = VOW[b[1]]; return A1.map((v, k) => lerp(v, B1[k], t)); }
// o: f0(u) (u = 0..1), vow, fs (масштаб формант: <1 — крупнее), jit, growl (субгармоника), rasp (АМ-хрип), breath, env(u), bw, tilt
function voice(d, o) {
  const x = A(d), n = x.length; let ph = R(), cyc = 0; const fl = [new BQ('bp', 700, 5), new BQ('bp', 1200, 8), new BQ('bp', 2500, 10)], G = [1, .55, .28];
  const jit = slow(v => v * 2 - 1, 18, d + 1), rasp = slow(v => v, o.raspRate || 60, d + 1), tilt = new BQ('lp', o.tilt || 3500, .6), bn = new BQ('bp', 1500, 1.4), bl = new BQ('lp', 5000, .7);
  const fs = o.fs || 1, bw = o.bw || 1, envf = o.env || (u => Math.sin(PI * Math.min(1, u)) ** .6);
  for (let i = 0; i < n; i++) {
    const u = i / n, t = i / SR;
    if ((i & 31) === 0) { const fm_ = vowAt(o.vow || 'a', u); for (let k = 0; k < 3; k++) fl[k].set(fm_[k] * fs, (fm_[k] * fs) / ((60 + k * 40) * bw)); bn.set(fm_[1] * fs, .9); }
    const f0 = o.f0(u) * (1 + (o.jit || .02) * jit(t) + (o.vib || 0) * Math.sin(TAU * (o.vibR || 5.5) * t));
    const dt = f0 / SR; ph += dt; if (ph >= 1) { ph -= 1; cyc++; }
    let s = 2 * ph - 1 - BLEP(ph, dt); // пила
    if (o.growl) s *= (cyc & 1) ? 1 - o.growl * .7 : 1 + o.growl * .2; // удвоение периода = рык
    if (o.rasp) s *= 1 - o.rasp + o.rasp * 2 * rasp(t);
    s = tilt.p(s);
    const br = bl.p((R() * 2 - 1) * (o.breath == null ? .15 : o.breath));
    let y = 0; for (let k = 0; k < 3; k++) y += fl[k].p(s + br * .5) * G[k];
    y += bn.p(br) * .35;
    x[i] = y * envf(u);
  }
  return x;
}

// ---------------- громкость (BS.1770, моно) ----------------
function lufs(x) {
  const s1 = [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, .73248077421585], s2 = [1, -2, 1, -1.99004745483398, .99007225036621];
  const y = new Float32Array(x.length); let a1 = 0, a2 = 0, b1 = 0, b2 = 0, c1 = 0, c2 = 0, d1 = 0, d2 = 0;
  for (let i = 0; i < x.length; i++) { const v = s1[0] * x[i] + s1[1] * a1 + s1[2] * a2 - s1[3] * b1 - s1[4] * b2; a2 = a1; a1 = x[i]; b2 = b1; b1 = v; const w = s2[0] * v + s2[1] * c1 + s2[2] * c2 - s2[3] * d1 - s2[4] * d2; c2 = c1; c1 = v; d2 = d1; d1 = w; y[i] = w; }
  const B = Math.round(.4 * SR), H = Math.round(.1 * SR), ms = [];
  if (y.length <= B) { let s = 0; for (const v of y) s += v * v; ms.push(s / y.length); }
  else for (let i = 0; i + B <= y.length; i += H) { let s = 0; for (let k = i; k < i + B; k++) s += y[k] * y[k]; ms.push(s / B); }
  const L = m => -.691 + 10 * Math.log10(m + 1e-12);
  let g = ms.filter(m => L(m) > -70); if (!g.length) return -70;
  const rel = L(g.reduce((a, b) => a + b, 0) / g.length) - 10; g = g.filter(m => L(m) > rel);
  return L(g.reduce((a, b) => a + b, 0) / g.length);
}
const peak = x => { let p = 0; for (const v of x) { const a = Math.abs(v); if (a > p) p = a; } return p; };
function finish(x, target, o = {}) {
  // DC и инфразвук прочь, обрезка тишины в хвосте, короткие края
  x = F(x, 'hp', o.hp || 28, .7);
  if (!o.loop) { const p = peak(x) || 1; let e = x.length - 1; while (e > 0 && Math.abs(x[e]) < p * .004) e--; x = x.slice(0, Math.min(x.length, e + N(.01))); let s = 0; while (s < x.length && Math.abs(x[s]) < p * .0005) s++; if (s > 0) x = x.slice(Math.max(0, s - 8)); const fo = Math.min(x.length, N(.012)); for (let i = 0; i < fo; i++) x[x.length - 1 - i] *= i / fo; }
  const L = lufs(x), pk = peak(x) || 1;
  let g = db(target - L); const pkLim = db(o.peak == null ? -1.2 : o.peak) / pk;
  if (g > pkLim) {
    // мягкое ограничение пиков (до 4 дБ) для плотных ударов, остальное — понижение уровня
    const extra = Math.min(db(4), g / pkLim); const pre = pkLim * extra; const lim = db(o.peak == null ? -1.2 : o.peak);
    for (let i = 0; i < x.length; i++) { const v = x[i] * pre; const a = Math.abs(v); x[i] = a <= lim * .7 ? v : Math.sign(v) * (lim * .7 + (lim * .3) * Math.tanh((a - lim * .7) / (lim * .3))); }
    return { x, lufs: lufs(x), peakDb: 20 * Math.log10(peak(x)) };
  }
  gain(x, g); return { x, lufs: lufs(x), peakDb: 20 * Math.log10(peak(x)) };
}
function loopify(x, xf) { // бесшовная петля: хвост длиной xf наплывает на начало
  const n = N(xf), L = x.length - n, y = new Float32Array(L);
  for (let i = 0; i < L; i++) y[i] = x[i];
  for (let i = 0; i < n; i++) { const t = i / n, a = Math.sin(t * PI / 2), b = Math.cos(t * PI / 2); y[i] = x[i] * a + x[L + i] * b; }
  return y;
}
function wav(file, x) {
  const b = Buffer.alloc(44 + x.length * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.round(clamp(x[i], -1, 1) * 32767), 44 + i * 2);
  fs.writeFileSync(file, b);
}

// ======================================================================================
//                                        РЕЦЕПТЫ
// ======================================================================================
// общие слои
const whoosh = (d, f0, f1, q = 1.4, shape = .45) => env(F(noise(d, 'pink'), 'bp', t => lerp(f0, f1, Math.sin(PI * clamp(t / d, 0, 1) * .5) ** 1.3), q), [[0, 0], [d * shape, 1], [d, 0]]);
const thump = (f0, f1, d, g = 1) => gain(dec(osc('sine', t => f1 + (f0 - f1) * Math.exp(-t / (d * .25)), d), d * .35, .001), g);
const metal = (base, d, br = 1) => modal([[base, .35 * d, 1], [base * 2.76, .22 * d, .6 * br], [base * 5.40, .14 * d, .35 * br], [base * 8.93, .09 * d, .2 * br], [base * 1.51, .3 * d, .3]], d * 1.5);
const wood = (base, d) => modal([[base, d, 1], [base * 2.32, d * .6, .5], [base * 4.25, d * .35, .3], [base * 6.63, d * .2, .15]], d * 4);
const bell = (f, d, o = {}) => modal([[f * .5, d * 1.1, .5], [f, d, 1], [f * 1.19, d * .8, .45], [f * 1.5, d * .7, .4], [f * 2, d * .55, .5], [f * 2.52, d * .4, .25], [f * 3.01, d * .3, .2], [f * 4.17, d * .2, .12]].map(m => [m[0] * (1 + rnd(-.002, .002)), m[1], m[2] * (o.br == null ? 1 : (m[0] > f * 1.6 ? o.br : 1))]), d * 2.2);
const coin = () => modal([[rnd(2900, 3600), .18, 1], [rnd(5100, 5900), .12, .7], [rnd(7600, 8800), .08, .45], [rnd(10500, 11500), .05, .3]], .5);
const crackle = (d, dens, f = 3500, q = 1, amp = 1) => grains(d, dens, () => gain(click(rnd(.001, .004), f * rnd(.6, 1.6), q), amp * rnd(.2, 1) ** 2));
function bubbles(d, n, f0 = 300, f1 = 900, amp = .5) { const x = A(d); for (let k = 0; k < n; k++) { const t = rnd(0, d - .06), f = rnd(f0, f1), l = rnd(.02, .06); mix(x, dec(osc('sine', u => f * (1 + 2.2 * u / l), l), l * .4, .001), t, amp * rnd(.3, 1)); } return x; }

const RC = {}; // id → (k) => Float32Array
const MAN = []; // манифест: {id, n, g, c, ru, cd, pri, loop}
function def(id, n, g, c, ru, f, o = {}) { RC[id] = f; MAN.push(Object.assign({ id, n, g, c, ru }, o)); }

// ---------- оружие героя ----------
def('sw_sword', 4, 'cb', 'sfx', 'Взмах меча', k => {
  const d = rnd(.24, .32); const w = whoosh(d, rnd(500, 700), rnd(3000, 4200), 1.6, rnd(.4, .55));
  const air = env(F(noise(d, 'white'), 'hp', 5500), [[0, 0], [d * .5, .25], [d, 0]]);
  const ring = gain(metal(rnd(2200, 2900), .25, .7), .05);
  return sum(d + .3, [[w, 0, 1], [air, 0, .25], [ring, d * .45, 1]]);
}, { cd: .05, pri: 1 });
def('sw_axe', 3, 'cb', 'sfx', 'Взмах топора/молота', k => {
  const d = rnd(.38, .48); const w = whoosh(d, rnd(160, 220), rnd(900, 1300), 1.1, .6);
  const body = env(F(noise(d, 'brown'), 'lp', 600), [[0, 0], [d * .65, 1], [d, 0]]);
  const hum = env(osc('saw', t => 70 + 50 * t / d, d), [[0, 0], [d * .6, .12], [d, 0]]);
  return sum(d + .1, [[w, 0, 1], [body, 0, .6], [F(hum, 'lp', 300), 0, 1]]);
}, { cd: .08, pri: 1 });
def('hit_blade', 4, 'cb', 'sfx', 'Удар клинком', k => {
  const d = .3; const slash = dec(F(noise(.12), 'hp', rnd(1200, 2000)), rnd(.025, .04), .0005);
  const flesh = dec(F(noise(.2, 'pink'), 'bp', rnd(500, 800), 1.2), .05, .001);
  const wet = mul(F(noise(.12), 'bp', rnd(900, 1400), 3), t => Math.exp(-t / .04) * (.5 + .5 * Math.sin(TAU * 70 * t)));
  const tick = gain(metal(rnd(3200, 4200), .12), .06);
  const body = thump(rnd(140, 180), 55, .14, .9);
  return sat(sum(d, [[slash, 0, .7], [flesh, 0, .9], [wet, .005, .5], [tick, 0, 1], [body, 0, 1]]), 1.6);
}, { cd: .04, pri: 1 });
def('hit_blunt', 3, 'cb', 'sfx', 'Удар топором/молотом', k => {
  const d = .45; const sub = sat(thump(rnd(110, 130), 38, .3, 1.2), 2.5);
  const crunch = dec(F(noise(.3, 'brown'), 'lp', 1100), .08, .001);
  const bones = crackle(.08, 260, 2600, 2, .6);
  const dust = dec(F(noise(.4, 'pink'), 'bp', 400, .8), .15, .01);
  return rev(sum(d, [[sub, 0, 1], [crunch, 0, .9], [bones, .003, 1], [dust, .02, .4]]), { wet: .08, room: .5, tail: .3 });
}, { cd: .05, pri: 1 });
def('bow_draw', 2, 'cb', 'sfx', 'Натяжение лука', k => {
  const d = .55; const x = A(d);
  let t = 0; while (t < d - .02) { const u = t / d; mix(x, gain(wood(rnd(260, 340) * (1 + u * .4), .025), .25 + .5 * u), t); t += lerp(.06, .018, u) * rnd(.7, 1.3); }
  const leather = env(F(noise(d, 'pink'), 'bp', 1800, 1), [[0, 0], [.1, .3], [d, .15]]);
  const str = env(osc('saw', t => 55 + 60 * t / d, d), [[0, 0], [d * .8, .05], [d, 0]]);
  return sum(d, [[x, 0, 1], [leather, 0, .5], [F(str, 'lp', 500), 0, 1]]);
}, { cd: .3, pri: 1 });
def('bow_rel', 3, 'cb', 'sfx', 'Выстрел из лука', k => {
  const d = .45; const twang = dec(F(ks(rnd(95, 140), .4, { damp: .993, bright: .7 }), 'lp', 2500), .12, .0005);
  const thwp = thump(rnd(220, 280), 90, .08, .7);
  const fly = env(F(noise(.35), 'bp', t => lerp(5000, 1800, t / .35), 1.5), [[0, 0], [.015, 1], [.35, 0]]);
  return sum(d, [[twang, 0, .9], [thwp, 0, 1], [fly, .01, .45]]);
}, { cd: .05, pri: 1 });
def('arrow_hit', 3, 'cb', 'sfx', 'Стрела попала', k => {
  const d = .4; const thk = gain(wood(rnd(170, 230), .05), .9);
  const clk = click(.003, 2500, .8);
  const boing = dec(F(ks(rnd(60, 80), .35, { damp: .985, bright: .2 }), 'lp', 900), .1, .001);
  const flesh = dec(F(noise(.1, 'pink'), 'bp', 700, 1.5), .04);
  return sum(d, [[thk, 0, 1], [clk, 0, .8], [boing, .005, .5], [flesh, 0, .6]]);
}, { cd: .04, pri: 1 });
// посох — заклинание по стихии
def('st_fire', 2, 'cb', 'sfx', 'Посох: огонь', k => {
  const d = .75; const roar = env(F(noise(d, 'brown'), 'lp', t => lerp(250, 2600, Math.min(1, t / .25)) * (1 - .5 * t / d), .9), [[0, 0], [.08, 1], [d, 0]]);
  const crk = env(crackle(d, 90, 3800, 1.4, .7), [[0, 0], [.1, 1], [d, 0]]);
  const sub = thump(90, 40, .3, .7);
  return rev(sat(sum(d, [[roar, 0, 1.2], [crk, .05, 1], [sub, 0, 1]]), 1.4), { wet: .18, room: .6, tail: .6 });
}, { cd: .06, pri: 1 });
def('st_ice', 2, 'cb', 'sfx', 'Посох: лёд', k => {
  const d = .9; const cl = A(d); for (let i = 0; i < 6; i++) mix(cl, modal([[rnd(2400, 6200), rnd(.15, .4), 1], [rnd(6000, 9000), .1, .4]], .8), i * rnd(.015, .04), rnd(.08, .16));
  const frost = env(F(noise(d), 'hp', 6000), [[0, 0], [.02, .6], [d, 0]]);
  const crack = dec(F(noise(.2), 'bp', 1600, 1.8), .03, .0005);
  return rev(sum(d, [[cl, 0, 1], [frost, 0, .35], [crack, 0, .6], [thump(200, 90, .1, .4), 0, 1]]), { wet: .3, room: .75, tail: .9 });
}, { cd: .06, pri: 1 });
def('st_light', 2, 'cb', 'sfx', 'Посох: молния', k => {
  const d = .8; const zap = env(F(fm(t => lerp(1800, 160, Math.min(1, t / .3)), 1.41, t => 6 * Math.exp(-t / .2), d), 'lp', 5000), [[0, 0], [.005, .6], [.4, .15], [d, 0]]);
  const crk = env(crackle(.35, 900, 3200, .8, 1), [[0, 1], [.35, 0]]);
  const thunder = env(F(noise(d, 'brown'), 'lp', t => lerp(900, 150, t / d)), [[0, 0], [.06, 1], [d, 0]]);
  return rev(sat(sum(d, [[zap, 0, .5], [crk, 0, .8], [thunder, .03, 1.1]]), 1.8), { wet: .2, room: .7, tail: .8 });
}, { cd: .06, pri: 1 });
def('st_arcane', 2, 'cb', 'sfx', 'Посох: чары', k => {
  const d = .7; const f = rnd(420, 520); const b = env(fm(t => f * (1 + .5 * Math.min(1, t / .25)), 3.5, t => 2.2 * Math.exp(-t / .3), d), [[0, 0], [.02, 1], [d, 0]]);
  const ch = sum(d, [[env(osc('sine', t => f * 2 * (1.003 + .5 * Math.min(1, t / .25)), d), [[0, 0], [.05, .4], [d, 0]]), 0, 1], [env(osc('sine', t => f * 3.01 * (1 + .5 * Math.min(1, t / .25)), d), [[0, 0], [.08, .2], [d, 0]]), 0, 1]]);
  const swell = env(F(noise(.3), 'bp', t => lerp(1500, 6000, t / .3), 2), [[0, 0], [.28, .5], [.3, 0]]);
  return rev(sum(d, [[b, 0, .6], [ch, 0, .5], [swell, 0, .5]]), { wet: .35, room: .8, tail: 1 });
}, { cd: .06, pri: 1 });
def('st_poison', 2, 'cb', 'sfx', 'Посох: яд', k => {
  const d = .7; const bub = bubbles(d, 14, 250, 700, .6);
  const hiss = env(F(noise(d, 'pink'), 'lp', 1200), [[0, 0], [.08, .7], [d, 0]]);
  const gl = env(F(osc('saw', t => 120 + 40 * Math.sin(TAU * 7 * t), d), 'lp', 600), [[0, 0], [.1, .3], [d, 0]]);
  return rev(sum(d, [[bub, 0, 1], [hiss, 0, .6], [gl, 0, .6]]), { wet: .15, room: .5, tail: .4 });
}, { cd: .06, pri: 1 });
def('mg_hit', 3, 'cb', 'sfx', 'Попадание чарами', k => {
  const d = .35; const f = rnd(700, 1000); const p = dec(fm(f, 2.01, t => 3 * Math.exp(-t / .05), d), .08, .001);
  const burst = dec(F(noise(.2, 'pink'), 'bp', rnd(1200, 2000), .9), .04, .0005);
  return sum(d, [[p, 0, .5], [burst, 0, .9], [thump(160, 60, .12, .7), 0, 1]]);
}, { cd: .04, pri: 1 });
def('crit', 3, 'cb', 'sfx', 'Критический удар', k => {
  const d = .7; const slash = dec(F(noise(.2), 'hp', 1600), .05, .0005);
  const ring = gain(metal(rnd(1300, 1700), .6, 1), .25);
  const sub = sat(thump(140, 35, .35, 1.2), 2);
  const shimmer = env(F(noise(.5), 'hp', 7000), [[0, 0], [.02, .5], [.5, 0]]);
  return rev(sum(d, [[slash, 0, .9], [ring, 0, 1], [sub, 0, 1], [shimmer, .02, .3]]), { wet: .2, room: .7, tail: .6 });
}, { cd: .05, pri: 2 });
def('block', 3, 'cb', 'sfx', 'Блок щитом', k => {
  const d = .7; const b = rnd(380, 470); const plate = modal([[b, .25, 1], [b * 2.13, .2, .7], [b * 3.04, .16, .5], [b * 4.41, .12, .35], [b * 6.07, .09, .25], [b * 8.3, .06, .2]], .9);
  const clk = click(.003, 3500, .7); const th = thump(150, 70, .12, .8);
  return rev(sum(d, [[plate, 0, .35], [clk, 0, .9], [th, 0, 1]]), { wet: .15, room: .6, tail: .5 });
}, { cd: .06, pri: 2 });
def('parry', 2, 'cb', 'sfx', 'Парирование', k => {
  const d = 1.2; const ring = modal([[rnd(1700, 1900), .9, 1], [rnd(2650, 2800), .7, .7], [rnd(4000, 4300), .5, .5], [rnd(5200, 5500), .35, .35], [rnd(7000, 7600), .2, .2]], 1.3);
  const scrape = env(F(noise(.25), 'bp', t => lerp(5000, 2500, t / .25), 4), [[0, 0], [.01, .6], [.25, 0]]);
  const clk = click(.002, 5000, .8);
  return rev(sum(d, [[ring, 0, .25], [scrape, 0, .6], [clk, 0, 1]]), { wet: .3, room: .85, tail: 1 });
}, { cd: .1, pri: 2 });
def('roll', 2, 'cb', 'sfx', 'Кувырок', k => {
  const d = .45; const cloth = env(F(noise(d, 'pink'), 'bp', t => lerp(400, 1600, Math.sin(PI * t / d)), .8), [[0, 0], [.15, 1], [.32, .5], [d, 0]]);
  const land = thump(120, 60, .1, .7); const grit = env(crackle(.15, 300, 2500, 1, .5), [[0, 1], [.15, 0]]);
  return sum(d, [[cloth, 0, 1], [land, .3, 1], [grit, .3, 1]]);
}, { cd: .15, pri: 1 });
def('hero_hurt', 3, 'cb', 'sfx', 'Герой ранен', k => {
  const d = .45; const th = sat(thump(110, 50, .18, 1), 2);
  const chain = crackle(.12, 400, 4500, 3, .5);
  const grunt = voice(.2, { f0: u => rnd(115, 135) * (1 - .2 * u), vow: [[0, 'u'], [1, 'a']], growl: .3, breath: .3, jit: .04, env: u => Math.sin(PI * u) ** .5, fs: .95 });
  return sum(d, [[th, 0, 1], [chain, 0, .8], [grunt, .02, .9]]);
}, { cd: .15, pri: 2 });
def('boom', 3, 'cb', 'sfx', 'Взрыв', k => {
  const d = 1.6; const crack = dec(F(noise(.1), 'hp', 900), .02, .0003);
  const body = env(F(noise(d, 'brown'), 'lp', t => lerp(3000, 90, Math.min(1, t / 1.1) ** .5)), [[0, 0], [.01, 1], [d, 0]]);
  const sub = sat(thump(70, 28, .8, 1.3), 2);
  const debris = env(crackle(1, 70, 2000, 1.2, .8), [[0, 0], [.2, 1], [1, 0]]);
  return rev(sum(d, [[crack, 0, .8], [body, 0, 1.3], [sub, 0, 1], [debris, .15, .5]]), { wet: .2, room: .8, tail: 1 });
}, { cd: .08, pri: 2 });
def('slam', 2, 'cb', 'sfx', 'Удар по земле', k => {
  const d = .8; const sub = sat(thump(90, 30, .5, 1.3), 2.5); const dust = env(F(noise(d, 'pink'), 'lp', t => lerp(1500, 300, t / d)), [[0, 0], [.02, 1], [d, 0]]);
  const rocks = env(crackle(.5, 120, 1500, 1.2, .8), [[0, 1], [.5, 0]]);
  return rev(sum(d, [[sub, 0, 1], [dust, 0, .7], [rocks, .02, .6]]), { wet: .12, room: .6, tail: .5 });
}, { cd: .1, pri: 1 });
def('land', 1, 'cb', 'sfx', 'Приземление', k => sum(.4, [[thump(100, 45, .2, 1), 0, 1], [env(F(noise(.3, 'pink'), 'lp', 900), [[0, 0], [.01, 1], [.3, 0]]), 0, .5], [crackle(.12, 200, 2500, 1, .5), 0, 1]]), { cd: .2, pri: 1 });
def('bite', 2, 'cb', 'sfx', 'Укус', k => {
  const d = .3; const c1 = click(.002, 2800, 1.5), c2 = click(.002, 2400, 1.5); const wet = dec(F(noise(.2, 'pink'), 'bp', 900, 1.5), .05);
  return sum(d, [[c1, 0, 1], [c2, .045, .8], [wet, .04, .8], [thump(200, 90, .08, .5), .04, 1]]);
}, { cd: .06, pri: 1 });
// ---------- телеграфы и боссы (общие) ----------
def('tele_boss', 2, 'cb', 'sfx', 'Владыка замахивается (крупный удар)', k => {
  const d = .9; const suck = rev1(env(F(noise(d, 'pink'), 'bp', t => lerp(4000, 300, t / d), 1.2), [[0, 1], [d * .7, .3], [d, 0]]));
  const swell = env(osc('saw', t => lerp(55, 110, t / d), d), [[0, 0], [d * .9, .3], [d, 0]]);
  const ring = env(metal(rnd(600, 700), 1), [[0, 0], [d * .85, 1], [d, 0]]);
  const tick = click(.002, 4000, 1);
  return rev(sum(d + .1, [[suck, 0, .9], [F(swell, 'lp', 700), 0, 1], [ring, 0, .12], [tick, d - .02, .7]]), { wet: .25, room: .7, tail: .5 });
}, { cd: .8, pri: 2 });
def('tele_red', 1, 'cb', 'sfx', 'Красная вспышка (уклоняйтесь)', k => {
  const d = .6; const sh = env(F(noise(.3), 'bp', t => lerp(2500, 7000, t / .3), 5), [[0, 0], [.03, 1], [.3, 0]]);
  const pulse = env(osc('square', 110, d), [[0, 0], [.01, .25], [.12, .05], [.2, .25], [.32, 0]]);
  return rev(sum(d, [[sh, 0, .6], [F(pulse, 'lp', 900), 0, 1], [gain(metal(1400, .3), .1), 0, 1]]), { wet: .2, room: .6, tail: .4 });
}, { cd: .3, pri: 2 });
def('tele_gold', 1, 'cb', 'sfx', 'Золотая вспышка (парируйте)', k => rev(sum(.8, [[gain(bell(1568, .5, { br: .6 }), .3), 0, 1], [env(F(noise(.2), 'hp', 6000), [[0, 0], [.01, .4], [.2, 0]]), 0, 1]]), { wet: .3, room: .7, tail: .6 }), { cd: .3, pri: 2 });
def('boss_heavy', 2, 'cb', 'sfx', 'Сокрушительный удар владыки', k => {
  const d = 1.4; const sub = sat(thump(80, 26, .9, 1.4), 3); const crunch = dec(F(noise(.4, 'brown'), 'lp', 2000), .12, .0005);
  const ring = gain(metal(rnd(240, 300), 1.2, 1.2), .2); const debris = env(crackle(.8, 90, 1800, 1, .7), [[0, 1], [.8, 0]]);
  return rev(sum(d, [[sub, 0, 1], [crunch, 0, 1], [ring, 0, 1], [debris, .05, .6]]), { wet: .25, room: .85, tail: 1.2 });
}, { cd: .4, pri: 2 });
def('boss_rage', 1, 'cb', 'sfx', 'Ярость владыки', k => {
  const d = 2.8; const x = A(d);
  for (const f of [55, 58.3, 82.4, 110.6]) mix(x, env(F(sat(osc('saw', t => f * (1 + .03 * t), d), 1.5), 'lp', t => 300 + 900 * t / d), [[0, 0], [2, .5], [d, 0]]), 0, .4);
  const growl = voice(2, { f0: u => 60 + 30 * u, vow: [[0, 'u'], [.6, 'a'], [1, 'o']], fs: .55, growl: .9, rasp: .7, breath: .5, env: u => Math.min(1, u * 3) * (1 - u) ** .4 });
  const heart = sum(1, [[thump(70, 40, .2, 1), 0, 1], [thump(65, 38, .22, .8), .25, 1]]);
  const fire = env(F(noise(d, 'brown'), 'lp', 1500), [[0, 0], [1.5, .8], [d, 0]]);
  return rev(sum(d, [[x, 0, 1], [sat(growl, 2), .4, .9], [heart, 1.8, 1], [fire, .3, .6]]), { wet: .3, room: .85, tail: 1.2 });
}, { cd: 3, pri: 2 });
def('boss_phase', 1, 'cb', 'sfx', 'Новая фаза владыки', k => {
  const d = 2; const x = A(d); for (const f of [110, 116.5, 164.8, 233]) mix(x, env(F(osc('saw', f, d), 'lp', 1400), [[0, 0], [.03, .5], [d, 0]]), 0, .35);
  return rev(sum(d, [[x, 0, 1], [sat(thump(60, 30, 1, 1.2), 2), 0, 1], [env(F(noise(d), 'hp', 5000), [[0, 0], [.1, .3], [d, 0]]), 0, 1]]), { wet: .35, room: .9, tail: 1.5 });
}, { cd: 2, pri: 2 });
def('boss_die', 1, 'cb', 'sfx', 'Владыка повержен', k => {
  const d = 3.2; const body = env(F(noise(d, 'brown'), 'lp', t => lerp(2000, 60, t / d)), [[0, 0], [.05, 1], [d, 0]]);
  const sub = sat(thump(62, 20, 2.4, 1.3), 2); const deb = env(crackle(2, 50, 1500, 1, .7), [[0, 0], [.3, 1], [2, 0]]);
  const sh = env(F(noise(d), 'hp', 6500), [[0, 0], [1, .3], [d, 0]]);
  return rev(sum(d, [[body, 0, 1], [sub, 0, 1], [deb, .2, .7], [sh, .5, .6], [gain(bell(220, 2.2, { br: .5 }), .25), .6, 1]]), { wet: .35, room: .9, tail: 2 });
}, { cd: 3, pri: 2 });
def('stagger', 1, 'cb', 'sfx', 'Пролом стойки', k => rev(sum(1, [[dec(F(noise(.5), 'hp', 2500), .08, .0005), 0, .8], [gain(modal([[1975, .3, 1], [2960, .25, .7], [4100, .2, .5], [5600, .12, .3]], .6), .2), 0, 1], [sat(thump(100, 32, .5, 1.2), 2), 0, 1]]), { wet: .25, room: .8, tail: .8 }), { cd: .3, pri: 2 });

// ---------- голоса врагов по семействам ----------
const FAM = {
  beast: {
    aggro: () => sat(voice(rnd(.6, .8), { f0: u => rnd(85, 110) * (1 + .3 * Math.sin(PI * u)), vow: [[0, 'u'], [.5, 'a'], [1, 'o']], fs: .55, growl: .8, rasp: .6, breath: .45, jit: .06, env: u => Math.min(1, u * 5) * (1 - u) ** .6 }), 2.2),
    hurt: () => sat(voice(rnd(.18, .26), { f0: u => rnd(260, 340) * (1 + .4 * u) * (1 - .6 * u * u), vow: [[0, 'a'], [1, 'i']], fs: .7, growl: .3, breath: .3, jit: .05, env: u => Math.sin(PI * u) ** .4 }), 1.6),
    die: () => sat(voice(rnd(.8, 1), { f0: u => rnd(200, 260) * (1 - .65 * u), vow: [[0, 'a'], [.5, 'o'], [1, 'u']], fs: .65, growl: .6, rasp: .5, breath: .6, env: u => Math.min(1, u * 8) * (1 - u) ** .8 }), 1.8)
  },
  undead: {
    aggro: () => { const d = rnd(.8, 1); const m = voice(d, { f0: u => rnd(90, 110) * (1 + .15 * Math.sin(PI * u)), vow: [[0, 'u'], [.6, 'o'], [1, 'u']], fs: .85, breath: .9, jit: .05, vib: .02, vibR: 4, env: u => Math.min(1, u * 3) * (1 - u) ** .5 }); const rat = crackle(.4, 120, 1600, 3, .5); return rev(sum(d, [[m, 0, 1], [rat, .05, .9]]), { wet: .35, room: .75, tail: .5 }); },
    hurt: () => { const x = A(.35); for (let i = 0; i < 6; i++) mix(x, gain(wood(rnd(600, 1300), .03), .4), rnd(0, .12)); return sum(.35, [[x, 0, 1], [dec(F(noise(.1), 'bp', 2500, 2), .02), 0, .6], [voice(.18, { f0: u => 140 * (1 - .2 * u), vow: 'o', breath: .8, env: u => Math.sin(PI * u) }), .02, .5]]); },
    die: () => { const d = 1.2, x = A(d); let t = 0; for (let i = 0; i < 22; i++) { t += rnd(.01, .07) * (1 + i * .05); if (t > d - .1) break; mix(x, gain(wood(rnd(500, 1500), rnd(.02, .05)), rnd(.2, .5)), t); } return rev(sum(d, [[x, 0, 1], [voice(.9, { f0: u => 110 * (1 - .4 * u), vow: [[0, 'o'], [1, 'u']], breath: 1, env: u => (1 - u) ** 1.2 * Math.min(1, u * 10) }), 0, .6]]), { wet: .25, room: .7, tail: .5 }); }
  },
  insect: {
    aggro: () => { const d = rnd(.6, .8), x = A(d); let t = 0; while (t < d - .02) { mix(x, click(.0015, rnd(3500, 6000), 2.5), t, rnd(.4, 1)); t += rnd(.012, .03); } const buzz = env(F(mul(osc('saw', t => 190 + 25 * Math.sin(TAU * 9 * t), d), t => .6 + .4 * Math.sin(TAU * 40 * t)), 'bp', 1200, 1.2), [[0, 0], [.08, 1], [d, 0]]); return sum(d, [[x, 0, .8], [buzz, 0, .5]]); },
    hurt: () => { const d = .25; const sq = dec(fm(t => lerp(2400, 3600, t / d), 1.5, 2.5, d), .08, .002); return sum(d, [[sq, 0, .35], [crackle(.06, 400, 3000, 1.5, .8), 0, 1], [dec(F(noise(.12, 'pink'), 'bp', 1100, 1.2), .03), 0, .6]]); },
    die: () => { const d = .9; const sq = dec(F(noise(.3, 'pink'), 'lp', 900), .07, .001); const crk = crackle(.08, 500, 2200, 1.2, 1); const buzz = env(F(osc('saw', t => 200 * (1 - .6 * t / d), d), 'bp', 900, 1), [[0, .6], [d, 0]]); return sum(d, [[sq, 0, 1], [crk, 0, .9], [buzz, .05, .4], [bubbles(.3, 5, 300, 700, .4), .05, 1]]); }
  },
  spirit: {
    aggro: () => { const d = rnd(1, 1.3); const f = rnd(420, 560); const w = A(d); for (const dt of [1, 1.007, .993]) mix(w, env(osc('tri', t => f * dt * (1 + .25 * Math.sin(PI * t / d)) * (1 + .02 * Math.sin(TAU * 6 * t)), d), [[0, 0], [d * .3, .5], [d, 0]]), 0, .35); const wh = env(F(noise(d), 'bp', t => lerp(2000, 4500, t / d), 2), [[0, 0], [d * .5, .4], [d, 0]]); return rev(sum(d, [[F(w, 'lp', 2500), 0, 1], [wh, 0, .4]]), { wet: .5, room: .9, tail: 1.2 }); },
    hurt: () => { const d = .4; const s = env(osc('tri', t => rnd(700, 900) * (1 + 1.2 * t / d), d), [[0, 0], [.03, 1], [d, 0]]); return rev(sum(d, [[s, 0, .5], [env(F(noise(d), 'hp', 3000), [[0, 0], [.02, .5], [d, 0]]), 0, .5]]), { wet: .45, room: .85, tail: .7 }); },
    die: () => { const d = 1.6; const f = rnd(500, 650); const w = env(osc('tri', t => f * (1 - .6 * t / d) * (1 + .03 * Math.sin(TAU * 7 * t)), d), [[0, 0], [.05, 1], [d, 0]]); const sh = env(F(noise(d), 'hp', 6000), [[0, 0], [.4, .5], [d, 0]]); return rev(sum(d, [[F(w, 'lp', 3000), 0, .7], [sh, 0, .4], [gain(bell(1760, .8, { br: .5 }), .1), .1, 1]]), { wet: .55, room: .92, tail: 1.5 }); }
  },
  human: {
    aggro: () => sat(voice(rnd(.35, .5), { f0: u => rnd(130, 160) * (1 + .25 * Math.sin(PI * u)), vow: [[0, 'e'], [.4, 'a'], [1, 'a']], growl: .4, rasp: .3, breath: .3, jit: .04, env: u => Math.min(1, u * 6) * (1 - u) ** .5 }), 1.7),
    hurt: () => voice(rnd(.16, .24), { f0: u => rnd(150, 190) * (1 - .25 * u), vow: [[0, 'u'], [1, 'a']], growl: .25, breath: .35, jit: .05, env: u => Math.sin(PI * u) ** .4 }),
    die: () => voice(rnd(.6, .8), { f0: u => rnd(150, 180) * (1 - .45 * u), vow: [[0, 'a'], [.6, 'o'], [1, 'u']], growl: .4, breath: .6, rasp: .3, env: u => Math.min(1, u * 8) * (1 - u) ** .9 })
  },
  golem: {
    aggro: () => { const d = 1; const gr = env(F(noise(d, 'brown'), 'lp', t => 200 + 300 * Math.sin(PI * t / d), 3), [[0, 0], [.2, 1], [d, 0]]); const v = voice(d, { f0: u => 45 + 10 * u, vow: 'o', fs: .5, growl: .9, rasp: .8, breath: .2 }); return sat(sum(d, [[gr, 0, 1], [v, 0, .7], [crackle(d, 40, 1500, 1, .6), 0, 1]]), 1.8); },
    hurt: () => sum(.4, [[dec(F(noise(.3, 'brown'), 'lp', 1600), .06), 0, 1], [crackle(.1, 300, 2200, 1.2, .8), 0, 1], [thump(130, 60, .1, .7), 0, 1]]),
    die: () => { const d = 1.5; return rev(sum(d, [[env(F(noise(d, 'brown'), 'lp', t => lerp(1500, 120, t / d)), [[0, 0], [.03, 1], [d, 0]]), 0, 1], [env(crackle(1.2, 120, 1600, 1.1, .9), [[0, 1], [1.2, 0]]), 0, 1], [sat(thump(80, 30, .8, 1.2), 2), 0, 1]]), { wet: .2, room: .7, tail: .6 }); }
  },
  plant: {
    aggro: () => { const d = .8; const cr = A(d); let t = 0; while (t < d - .03) { mix(cr, gain(wood(rnd(180, 320), .04), rnd(.2, .5)), t); t += rnd(.02, .06); } const v = voice(d, { f0: u => 70 + 20 * Math.sin(PI * u), vow: [[0, 'u'], [1, 'o']], fs: .7, growl: .5, breath: .5 }); return sum(d, [[F(cr, 'lp', 1500), 0, 1], [v, 0, .5]]); },
    hurt: () => sum(.3, [[dec(F(noise(.2, 'pink'), 'lp', 800), .05), 0, 1], [bubbles(.2, 4, 200, 500, .6), 0, 1], [gain(wood(rnd(250, 350), .03), .5), 0, 1]]),
    die: () => { const d = 1; const sq = env(F(noise(d, 'pink'), 'lp', t => lerp(900, 200, t / d)), [[0, 0], [.02, 1], [d, 0]]); return sum(d, [[sq, 0, .9], [bubbles(.8, 12, 150, 450, .7), 0, 1], [gain(wood(220, .1), .4), 0, 1]]); }
  }
};
const FAM_RU = { beast: 'Звери', undead: 'Нежить', insect: 'Жуки и насекомые', spirit: 'Духи', human: 'Люди и гоблины', golem: 'Големы и великаны', plant: 'Растения и топляки' };
for (const f in FAM) {
  def('v_' + f + '_aggro', 2, 'cb', 'voc', FAM_RU[f] + ': заметил', FAM[f].aggro, { cd: .9, pri: 1 });
  def('v_' + f + '_hurt', 3, 'cb', 'voc', FAM_RU[f] + ': больно', FAM[f].hurt, { cd: .14, pri: 0 });
  def('v_' + f + '_die', 2, 'cb', 'voc', FAM_RU[f] + ': гибель', FAM[f].die, { cd: .1, pri: 1 });
}

// ---------- фирменные рыки владык ----------
const BOSS = { // f — основной тон, v — гласные, fs — размер, x — окраска, z — зона
  gobKing: { f: 120, v: [[0, 'a'], [.5, 'ae'], [1, 'o']], fs: .8, x: 'gob', z: 1, ru: 'Брюхан' },
  rotroot: { f: 52, v: [[0, 'u'], [1, 'o']], fs: .6, x: 'creak', z: 2, ru: 'Гнилокорень' },
  bogMother: { f: 210, v: [[0, 'i'], [.5, 'e'], [1, 'a']], fs: 1.05, x: 'cackle', z: 3, ru: 'Матушка Трясина' },
  morven: { f: 72, v: [[0, 'u'], [1, 'o']], fs: .75, x: 'metal', z: 4, ru: 'Морвен' },
  colossus: { f: 38, v: 'o', fs: .45, x: 'rumble', z: 5, ru: 'Пепельный Колосс' },
  dragon: { f: 46, v: [[0, 'o'], [.4, 'a'], [1, 'a']], fs: .45, x: 'fire', z: 6, ru: 'Игнар' },
  ashKing: { f: 88, v: [[0, 'o'], [1, 'u']], fs: .8, x: 'whisper', z: 6, ru: 'Остен, Пепельный Король' },
  stuzhen: { f: 78, v: [[0, 'a'], [1, 'o']], fs: .7, x: 'ice', z: 7, ru: 'Стужень' },
  belava: { f: 340, v: [[0, 'i'], [1, 'e']], fs: 1.1, x: 'glass', z: 7, ru: 'Белава' },
  chamberlain: { f: 150, v: [[0, 'e'], [1, 'o']], fs: .9, x: 'water', z: 8, ru: 'Камергер Утоплый' },
  inkmaw: { f: 58, v: [[0, 'u'], [1, 'a']], fs: .6, x: 'page', z: 8, ru: 'Строкоед' },
  duneWorm: { f: 34, v: 'o', fs: .4, x: 'sand', z: 9, ru: 'Барханщик' },
  zenith: { f: 105, v: [[0, 'a'], [1, 'e']], fs: .8, x: 'metal', z: 9, ru: 'Зенит' },
  attal: { f: 118, v: [[0, 'a'], [.6, 'o'], [1, 'a']], fs: .85, x: 'fire', z: 9, ru: 'Аттал' },
  ostenMem: { f: 90, v: [[0, 'o'], [1, 'u']], fs: .8, x: 'echo', z: 10, ru: 'Остен-память' },
  shade: { f: 140, v: [[0, 'e'], [1, 'a']], fs: .9, x: 'choir', z: 10, ru: 'Тень Искроносца' },
  faceless: { f: 190, v: [[0, 'u'], [.5, 'i'], [1, 'u']], fs: 1, x: 'choir', z: 10, ru: 'Безликая' }
};
function bossRoar(B) {
  const d = B.f < 60 ? 2.2 : 1.7; const big = B.f < 80;
  const v = voice(d, { f0: u => B.f * (1 + .35 * Math.sin(PI * Math.min(1, u * 1.3))) * (1 - .25 * u * u), vow: B.v, fs: B.fs, growl: big ? .9 : .55, rasp: big ? .7 : .4, breath: .5, jit: .05, vib: B.x === 'choir' || B.x === 'glass' ? .03 : 0, env: u => Math.min(1, u * 4) * (1 - u) ** .5 });
  const lay = [[sat(v, big ? 2.6 : 1.8), 0, 1]];
  if (big) lay.push([env(F(noise(d, 'brown'), 'lp', 400), [[0, 0], [.3, 1], [d, 0]]), 0, .6], [sat(thump(50, 25, 1, 1), 2), 0, .7]);
  const x = B.x;
  if (x === 'gob') lay.push([crackle(.6, 30, 900, 2, .7), .2, 1], [voice(.5, { f0: u => 260 * (1 - .3 * u), vow: 'a', breath: .3 }), .9, .5]);
  if (x === 'creak') { const c = A(d); let t = 0; while (t < d - .05) { mix(c, gain(wood(rnd(90, 200), .08), rnd(.3, .7)), t); t += rnd(.05, .14); } lay.push([c, 0, .8]); }
  if (x === 'cackle') for (let i = 0; i < 5; i++) lay.push([voice(.11, { f0: () => 380 + i * 25, vow: [[0, 'a'], [1, 'e']], breath: .2 }), .9 + i * .13, .7]);
  if (x === 'metal') lay.push([gain(metal(rnd(180, 230), 1.8, 1), .12), 0, 1], [gain(metal(rnd(400, 480), 1.2, .8), .08), .3, 1]);
  if (x === 'rumble') lay.push([sat(thump(40, 20, 1.6, 1.3), 2), 0, 1], [env(crackle(d, 60, 1200, 1, .7), [[0, 0], [.5, 1], [d, 0]]), 0, 1]);
  if (x === 'fire') lay.push([env(F(noise(d, 'brown'), 'lp', t => 300 + 2200 * Math.sin(PI * t / d)), [[0, 0], [.3, 1], [d, 0]]), 0, 1], [env(crackle(d, 80, 3500, 1.3, .6), [[0, 0], [.3, 1], [d, 0]]), 0, 1]);
  if (x === 'whisper') lay.push([env(F(noise(d), 'bp', t => 3000 + 1500 * Math.sin(TAU * 3 * t), 2), [[0, 0], [.4, .7], [d, 0]]), 0, .8], [gain(bell(110, 2, { br: .3 }), .15), 0, 1]);
  if (x === 'ice') lay.push([env(F(noise(d), 'bp', t => 900 + 700 * Math.sin(TAU * .8 * t), 8), [[0, 0], [.5, 1], [d, 0]]), 0, .7], [crackle(.3, 200, 5000, 2, .6), .1, 1]);
  if (x === 'glass') for (let i = 0; i < 4; i++) lay.push([gain(modal([[rnd(1500, 3200), .8, 1], [rnd(4000, 6000), .4, .4]], 1.2), .12), i * .12, 1]);
  if (x === 'water') lay.push([bubbles(d, 26, 200, 900, .6), 0, 1], [env(F(noise(d, 'brown'), 'lp', 300), [[0, 0], [.4, 1], [d, 0]]), 0, .5]);
  if (x === 'page') for (let i = 0; i < 5; i++) lay.push([env(mul(F(noise(.18), 'bp', 2500, .8), t => .5 + .5 * Math.sin(TAU * 35 * t)), [[0, 0], [.03, 1], [.18, 0]]), .1 + i * .2, .6]);
  if (x === 'sand') lay.push([env(F(noise(d), 'hp', t => 2500 + 1500 * Math.sin(PI * t / d)), [[0, 0], [.5, 1], [d, 0]]), 0, .5], [sat(thump(36, 18, 1.8, 1.4), 2), 0, 1]);
  if (x === 'echo') { const e = rev(v, { wet: .8, dry: 0, room: .95, tail: 1.5 }); lay.push([e, .25, .5]); }
  if (x === 'choir') for (const s of [0, 4, 7]) lay.push([env(F(osc('saw', B.f * 2 * Math.pow(2, s / 12) * (1 + rnd(-.004, .004)), d), 'lp', 1600), [[0, 0], [.4, .25], [d, 0]]), 0, .4]);
  return rev(sum(d + .2, lay), { wet: x === 'echo' || x === 'choir' ? .45 : .25, room: .85, tail: 1.3 });
}
for (const id in BOSS) def('boss_' + id, 1, 'z' + BOSS[id].z, 'voc', 'Рык: ' + BOSS[id].ru, () => bossRoar(BOSS[id]), { cd: 1.2, pri: 2 });

// ---------- шаги по поверхностям ----------
const STEP = {
  grass: () => sum(.14, [[dec(F(noise(.12, 'pink'), 'lp', 1300), .03, .004), 0, 1], [dec(F(noise(.1), 'hp', 4500), .025, .006), .01, .35]]),
  leaf: () => sum(.16, [[dec(F(noise(.12, 'pink'), 'lp', 900), .03), 0, .7], [env(crackle(.09, 500, 3500, 1.2, .9), [[0, 1], [.09, 0]]), 0, 1]]),
  dirt: () => sum(.14, [[thump(110, 60, .06, .7), 0, 1], [dec(F(noise(.1, 'pink'), 'bp', 900, .8), .03), 0, .8], [crackle(.05, 300, 2000, 1, .4), 0, 1]]),
  mud: () => sum(.22, [[dec(F(noise(.2, 'pink'), 'lp', 500), .05), 0, 1], [bubbles(.15, 3, 200, 500, .5), .03, 1], [env(F(noise(.15), 'bp', 1200, 2), [[0, 0], [.08, .3], [.15, 0]]), .04, 1]]),
  stone: () => rev(sum(.12, [[click(.004, rnd(1800, 2600), 1.5), 0, .8], [gain(wood(rnd(140, 190), .02), .7), 0, 1], [dec(F(noise(.05), 'hp', 3500), .01), .015, .4]]), { wet: .12, room: .55, tail: .2 }),
  gravel: () => env(crackle(.14, 1200, 2600, .9, .9), [[0, 0], [.01, 1], [.14, 0]]),
  snow: () => env(F(crackle(.18, 2500, 2500, .7, .7), 'lp', 5000), [[0, 0], [.04, 1], [.18, 0]]),
  water: () => sum(.28, [[env(F(noise(.25), 'bp', t => lerp(900, 2600, t / .25), .9), [[0, 0], [.01, 1], [.25, 0]]), 0, .9], [bubbles(.2, 5, 400, 1400, .4), .02, 1], [thump(120, 60, .08, .4), 0, 1]]),
  sand: () => sum(.18, [[env(F(noise(.16), 'hp', 2600), [[0, 0], [.03, 1], [.16, 0]]), 0, .7], [dec(F(noise(.1, 'pink'), 'lp', 600), .03), 0, .8]]),
  wood: () => sum(.18, [[gain(wood(rnd(190, 240), .045), 1), 0, 1], [click(.003, 1600, 1), 0, .4], [gain(wood(rnd(400, 480), .02), .4), .01, 1]])
};
const STEP_RU = { grass: 'трава', leaf: 'листва', dirt: 'утоптанная земля', mud: 'топь', stone: 'камень', gravel: 'пепел и щебень', snow: 'снег', water: 'вода', sand: 'песок', wood: 'доски' };
for (const s in STEP) def('fs_' + s, 4, 'st', 'step', 'Шаги: ' + STEP_RU[s], STEP[s], { cd: .12, pri: 0 });

// ---------- интерфейс ----------
def('ui_click', 3, 'ui', 'ui', 'Кнопка', k => sum(.08, [[gain(modal([[rnd(1700, 2100), .02, 1], [rnd(3300, 3800), .012, .5]], .1), .5), 0, 1], [click(.002, 2500, .9), 0, .5], [gain(wood(rnd(380, 450), .012), .4), 0, 1]]), { cd: .05, pri: 0 });
def('ui_page', 2, 'ui', 'ui', 'Перелистнуть', k => { const d = .3; return env(mul(F(noise(d, 'pink'), 'bp', t => lerp(1500, 4000, t / d), .7), t => .6 + .4 * Math.sin(TAU * rnd(25, 35) * t)), [[0, 0], [.04, 1], [d, 0]]); }, { cd: .08, pri: 0 });
def('ui_deny', 1, 'ui', 'ui', 'Нельзя', k => sum(.35, [[gain(wood(150, .05), 1), 0, 1], [gain(wood(140, .06), 1), .11, 1], [env(F(osc('saw', 98, .3), 'lp', 600), [[0, 0], [.01, .15], [.3, 0]]), 0, 1]]), { cd: .1, pri: 1 });
def('coin', 3, 'ui', 'ui', 'Монеты', k => { const x = A(.6); const n = 2 + (k % 2); for (let i = 0; i < n; i++) mix(x, coin(), i * rnd(.04, .08), rnd(.5, 1)); return gain(x, .3); }, { cd: .05, pri: 0 });
def('buy', 1, 'ui', 'ui', 'Покупка', k => { const x = A(1); for (let i = 0; i < 7; i++) mix(x, coin(), .05 + i * rnd(.02, .05), rnd(.2, .5)); return rev(sum(1, [[x, 0, .3], [dec(F(noise(.2, 'pink'), 'lp', 700), .05), 0, .7], [thump(130, 70, .08, .6), 0, 1], [gain(bell(2093, .5, { br: .5 }), .15), .3, 1]]), { wet: .15, room: .5, tail: .4 }); }, { cd: .25, pri: 1 });
def('pick', 2, 'ui', 'ui', 'Подобрать вещь', k => rev(sum(.5, [[whoosh(.15, 800, 2500, 1, .5), 0, .3], [gain(bell(rnd(1300, 1500), .25, { br: .4 }), .25), .05, 1]]), { wet: .2, room: .6, tail: .4 }), { cd: .05, pri: 0 });
def('loot', 1, 'ui', 'ui', 'Добыча', k => { const x = A(1.2); [784, 988, 1175, 1568].forEach((f, i) => mix(x, gain(bell(f, .5, { br: .5 }), .25), i * .07)); return rev(x, { wet: .25, room: .7, tail: .6 }); }, { cd: .1, pri: 1 });
def('legend', 1, 'ui', 'ui', 'Легендарная находка', k => { const x = A(2.4); [392, 494, 587, 784, 988].forEach((f, i) => mix(x, gain(bell(f, 1.2, { br: .7 }), .22), i * .09)); mix(x, env(F(noise(2), 'hp', 6500), [[0, 0], [.3, .25], [2, 0]]), .1); for (const f of [196, 247, 294]) mix(x, env(F(osc('saw', f, 2), 'lp', 1500), [[0, 0], [.4, .06], [2, 0]]), .2); return rev(x, { wet: .35, room: .85, tail: 1.4 }); }, { cd: .4, pri: 2 });
const lidCreak = (d, f, g = 1) => { const x = A(d); let t = 0; while (t < d - .02) { mix(x, gain(wood(f * rnd(.9, 1.15) * (1 + t), .02), .25 * g), t); t += rnd(.012, .03); } return F(x, 'bp', f * 3, .7); };
def('chest_wood', 1, 'ui', 'ui', 'Сундук: деревянный', k => sum(1.1, [[click(.004, 1500, 1), 0, 1], [gain(wood(300, .03), .6), .02, 1], [lidCreak(.45, 220), .1, 1], [gain(wood(160, .08), 1), .6, 1], [gain(bell(1319, .4, { br: .4 }), .15), .65, 1]]), { cd: .3, pri: 2 });
def('chest_iron', 1, 'ui', 'ui', 'Сундук: железный', k => rev(sum(1.4, [[gain(metal(900, .2), .3), 0, 1], [gain(metal(1250, .15), .25), .08, 1], [lidCreak(.5, 300, 1.2), .15, 1], [gain(metal(320, .5, .8), .3), .7, 1], [thump(120, 60, .1, .7), .7, 1], [gain(bell(1568, .5, { br: .5 }), .15), .8, 1]]), { wet: .15, room: .6, tail: .5 }), { cd: .3, pri: 2 });
def('chest_gold', 1, 'ui', 'ui', 'Сундук: золотой', k => { const x = sum(2, [[gain(metal(1100, .25), .3), 0, 1], [lidCreak(.5, 280, 1.2), .12, 1], [thump(110, 55, .1, .7), .65, 1]]); [659, 784, 988, 1319].forEach((f, i) => mix(x, gain(bell(f, .7, { br: .6 }), .2), .7 + i * .07)); mix(x, env(F(noise(1.2), 'hp', 6500), [[0, 0], [.2, .3], [1.2, 0]]), .7); return rev(x, { wet: .25, room: .75, tail: 1 }); }, { cd: .3, pri: 2 });
def('chest_leg', 1, 'ui', 'ui', 'Сундук: легендарный', k => { const x = sum(3, [[gain(metal(800, .4, 1.2), .3), 0, 1], [lidCreak(.6, 260, 1.4), .12, 1], [sat(thump(80, 30, .6, 1.2), 2), .75, 1]]); for (const f of [196, 294, 392, 494]) mix(x, env(F(osc('saw', f * (1 + rnd(-.003, .003)), 2.2), 'lp', 1800), [[0, 0], [.5, .08], [2.2, 0]]), .6); [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => mix(x, gain(bell(f, 1.1, { br: .7 }), .18), .8 + i * .08)); mix(x, env(F(noise(2), 'hp', 6000), [[0, 0], [.3, .4], [2, 0]]), .8); return rev(x, { wet: .35, room: .88, tail: 1.6 }); }, { cd: .3, pri: 2 });
const anvil = (g = 1) => sum(1.2, [[gain(modal([[rnd(1050, 1150), .5, 1], [rnd(2250, 2400), .35, .7], [rnd(3500, 3700), .25, .5], [rnd(4900, 5200), .15, .35], [rnd(6900, 7300), .08, .2]], 1.2), .3 * g), 0, 1], [click(.002, 4000, .8), 0, .9 * g], [thump(160, 80, .05, .5 * g), 0, 1], [env(crackle(.3, 200, 6000, 2, .5), [[0, 1], [.3, 0]]), .01, .6 * g]]);
def('forge', 1, 'ui', 'ui', 'Кузня: ковка', k => { const x = A(1.8); mix(x, anvil(.8), 0); mix(x, anvil(.9), .32); mix(x, anvil(1.1), .64); [523, 659, 784].forEach((f, i) => mix(x, gain(bell(f, .5, { br: .5 }), .12), 1 + i * .08)); return rev(x, { wet: .18, room: .65, tail: .7 }); }, { cd: .3, pri: 1 });
def('forge_hit', 3, 'vil', 'spot', 'Кузня: удар молота', k => rev(anvil(1), { wet: .3, room: .7, tail: .8 }), { cd: .2, pri: 0 });
def('enh_ok', 1, 'ui', 'ui', 'Заточка удалась', k => { const x = sum(2.2, [[anvil(1), 0, 1]]); mix(x, env(F(noise(1), 'bp', t => lerp(1000, 8000, t), 2), [[0, 0], [.8, .4], [1, 0]]), .15); [523, 784, 1047, 1568].forEach((f, i) => mix(x, gain(bell(f, .8, { br: .6 }), .2), .9 + i * .06)); return rev(x, { wet: .3, room: .8, tail: 1.2 }); }, { cd: .3, pri: 2 });
def('enh_fail', 1, 'ui', 'ui', 'Заточка сорвалась', k => { const x = sum(1.8, [[anvil(1), 0, 1], [dec(F(noise(.3), 'hp', 2000), .05, .0005), .35, .8], [gain(metal(520, .5, 1.3), .15), .35, 1]]); mix(x, env(F(osc('saw', t => 220 * (1 - .4 * t), 1.2), 'lp', 900), [[0, 0], [.02, .12], [1.2, 0]]), .45); for (let i = 0; i < 5; i++) mix(x, gain(metal(rnd(1500, 2600), .15), .06), .55 + i * rnd(.05, .1)); return rev(x, { wet: .2, room: .7, tail: .8 }); }, { cd: .3, pri: 2 });
def('lvlup', 1, 'ui', 'ui', 'Новый уровень', k => { const d = 2.6; const x = A(d); mix(x, whoosh(.7, 300, 5000, 1, .9), 0, .4); for (const [f, t] of [[392, .55], [523, .62], [659, .69], [784, .76]]) mix(x, voice(1.6, { f0: () => f / 2, vow: [[0, 'o'], [1, 'a']], breath: .1, jit: .005, vib: .008, env: u => Math.min(1, u * 6) * (1 - u) ** 1.2, tilt: 5000 }), t, .25); [1047, 1319, 1568, 2093].forEach((f, i) => mix(x, gain(bell(f, .9, { br: .5 }), .15), .7 + i * .06)); mix(x, sat(thump(90, 45, .4, 1), 1.5), .55); return rev(x, { wet: .35, room: .85, tail: 1.4 }); }, { cd: .5, pri: 2 });
def('unlock', 1, 'ui', 'ui', 'Открыто новое', k => { const x = A(2); mix(x, gain(metal(700, .3, 1), .3), 0); mix(x, thump(140, 60, .1, .8), 0); for (let i = 0; i < 8; i++) mix(x, gain(metal(rnd(1800, 3000), .06), .08), .15 + i * .035); mix(x, gain(wood(200, .1), .8), .45); mix(x, whoosh(.5, 500, 4000, 1, .7), .4, .3); [659, 880, 1175, 1760].forEach((f, i) => mix(x, gain(bell(f, .8, { br: .6 }), .2), .65 + i * .07)); return rev(x, { wet: .3, room: .8, tail: 1.2 }); }, { cd: .5, pri: 2 });
def('tree_invest', 2, 'ui', 'ui', 'Древо: вложить очко', k => rev(sum(.8, [[gain(bell(rnd(880, 990), .35, { br: .4 }), .25), 0, 1], [env(crackle(.25, 120, 4000, 1.5, .6), [[0, 1], [.25, 0]]), .02, 1], [fm(t => 440 * (1 + t), 2, t => 1.5 * Math.exp(-t / .1), .3), 0, .08]]), { wet: .3, room: .7, tail: .6 }), { cd: .08, pri: 1 });
def('tree_accept', 1, 'ui', 'ui', 'Древо: принять', k => { const x = sum(1.8, [[gain(wood(180, .1), 1), 0, 1], [thump(100, 50, .15, .8), 0, 1]]); for (const f of [294, 440, 587]) mix(x, env(F(osc('saw', f, 1.4), 'lp', 1500), [[0, 0], [.2, .07], [1.4, 0]]), .08); [880, 1175, 1760].forEach((f, i) => mix(x, gain(bell(f, .7, { br: .5 }), .15), .15 + i * .06)); return rev(x, { wet: .3, room: .8, tail: 1 }); }, { cd: .3, pri: 2 });
def('quest', 1, 'ui', 'ui', 'Задание выполнено', k => { const x = A(1.6); [587, 784, 988, 1175].forEach((f, i) => mix(x, gain(bell(f, .7, { br: .5 }), .2), i * .09)); mix(x, env(F(osc('saw', 147, 1.2), 'lp', 900), [[0, 0], [.1, .08], [1.2, 0]]), 0); return rev(x, { wet: .3, room: .8, tail: 1 }); }, { cd: .3, pri: 1 });
def('potion', 1, 'ui', 'ui', 'Зелье', k => { const x = A(1); mix(x, sum(.1, [[click(.003, 900, 2), 0, 1], [thump(400, 200, .03, .5), 0, 1]]), 0); mix(x, bubbles(.5, 10, 300, 800, .6), .1); mix(x, env(F(noise(.4), 'hp', 6000), [[0, 0], [.1, .2], [.4, 0]]), .5); mix(x, gain(bell(1175, .4, { br: .4 }), .15), .55); return rev(x, { wet: .2, room: .6, tail: .5 }); }, { cd: .3, pri: 1 });
def('heal', 1, 'ui', 'ui', 'Лечение', k => { const x = A(1.4); for (const f of [523, 659, 784]) mix(x, env(osc('sine', f * (1 + rnd(-.002, .002)), 1.2), [[0, 0], [.3, .15], [1.2, 0]]), 0); mix(x, env(F(noise(1.2), 'hp', 7000), [[0, 0], [.4, .2], [1.2, 0]]), 0); return rev(x, { wet: .35, room: .8, tail: 1 }); }, { cd: .4, pri: 1 });
def('win', 1, 'ui', 'ui', 'Победа', k => { const x = A(3); [392, 494, 587, 784].forEach((f, i) => mix(x, gain(bell(f, 1.2, { br: .6 }), .2), i * .12)); for (const f of [196, 247, 294, 392]) mix(x, env(F(osc('saw', f * (1 + rnd(-.003, .003)), 2.2), 'lp', 2000), [[0, 0], [.1, .06], [1.6, .05], [2.2, 0]]), .5); mix(x, sat(thump(70, 40, .6, 1), 1.5), .5); return rev(x, { wet: .3, room: .85, tail: 1.5 }); }, { cd: 1, pri: 2 });
def('lose', 1, 'ui', 'ui', 'Поражение', k => { const x = A(3.2); mix(x, gain(bell(147, 2.4, { br: .5 }), .4), 0); mix(x, gain(bell(139, 2.2, { br: .4 }), .3), 1.1); for (const f of [110, 131, 156]) mix(x, env(F(osc('saw', t => f * (1 - .03 * t), 2.8), 'lp', 700), [[0, 0], [.4, .06], [2.8, 0]]), .2); return rev(x, { wet: .4, room: .9, tail: 1.6 }); }, { cd: 1, pri: 2 });
def('bell', 1, 'z8', 'sfx', 'Колокол', k => rev(gain(bell(220, 2.8, { br: .8 }), .5), { wet: .35, room: .9, tail: 2 }), { cd: .5, pri: 1 });

// ---------- окружение: петли (12 с) и «точечные» звуки ----------
const LOOP = 12, XF = 2;
function windBed(d, lo, hi, q, amt = 1, whistle = 0) {
  const c = slow(v => lerp(lo, hi, v), .35, d), a = slow(v => .4 + .6 * v, .25, d);
  let x = mul(F(noise(d, 'pink'), 'bp', c, q), t => a(t) * amt);
  if (whistle) { const w = slow(v => lerp(600, 1500, v), .2, d), wa = slow(v => Math.max(0, v - .4) * 1.6, .3, d); x = sum(d, [[x, 0, 1], [mul(F(noise(d), 'bp', w, 30), t => wa(t) * whistle), 0, 1]]); }
  return x;
}
function birds(d, n) { const x = A(d); for (let k = 0; k < n; k++) { const t0 = rnd(0, d - 1), f = rnd(2500, 4200), nn = Math.floor(rnd(2, 6)), sp = rnd(.07, .14); for (let j = 0; j < nn; j++) { const l = rnd(.04, .09); const s = env(fm(u => f * (1 + .5 * Math.sin(PI * u / l)) * (j % 2 ? 1.1 : 1), 1, .5, l), [[0, 0], [l * .2, 1], [l, 0]]); mix(x, s, t0 + j * sp, rnd(.15, .35)); } } return x; }
function crickets(d, n) { const x = A(d); for (let c = 0; c < n; c++) { const f = rnd(4200, 5200), per = rnd(.4, .8), g = rnd(.08, .2), ph = rnd(0, per); for (let t = ph; t < d - .2; t += per * rnd(.95, 1.05)) for (let p = 0; p < 3; p++) mix(x, env(osc('sine', f, .018), [[0, 0], [.003, 1], [.018, 0]]), t + p * .03, g); } return x; }
function murmur(d, dens) { const x = grains(d, dens, () => { const l = rnd(.08, .25); return gain(voice(l, { f0: u => rnd(100, 230) * (1 + rnd(-.15, .15) * u), vow: [[0, pick(['a', 'e', 'o', 'u', 'i'])], [1, pick(['a', 'e', 'o', 'er'])]], breath: .2, jit: .04, env: u => Math.sin(PI * u) }), rnd(.05, .2)); }); return rev(F(x, 'lp', 1800), { wet: .3, room: .7, tail: .5, dry: .7 }); }
function waves(d) { const per = rnd(5, 6.5); const sw = t => { const p = (t % per) / per; return p < .35 ? Math.sin(PI / 2 * p / .35) ** 2 : Math.exp(-(p - .35) * 4); }; return sum(d, [[mul(F(noise(d, 'brown'), 'lp', t => 200 + 900 * sw(t)), t => .3 + .7 * sw(t)), 0, 1], [mul(F(noise(d), 'hp', 3500), t => sw(t) ** 2 * .25), 0, 1]]); }
function hum(d, fs) { const x = A(d); for (const f of fs) mix(x, mul(osc('sine', f, d), slow(v => .4 + .6 * v, .15, d)), 0, .2 / fs.length * 3); return x; }
const BEDS = {
  amb_vil_day: ['Деревня днём', d => sum(d, [[windBed(d, 300, 900, .6, .5), 0, 1], [murmur(d, 14), 0, .8], [birds(d, 5), 0, .6], [F(noise(d, 'pink'), 'lp', 400), 0, .08]]), 'vil'],
  amb_vil_night: ['Деревня ночью', d => sum(d, [[windBed(d, 250, 700, .6, .35), 0, 1], [crickets(d, 6), 0, 1], [F(noise(d, 'pink'), 'lp', 300), 0, .06]]), 'vil'],
  amb_z1: ['Солнечные Луга', d => sum(d, [[windBed(d, 400, 1400, .5, .6), 0, 1], [mul(F(noise(d), 'hp', 4500), slow(v => .1 + .25 * v, .4, d)), 0, .4], [birds(d, 7), 0, .5], [env(F(mul(osc('saw', 220, d), t => .5 + .5 * Math.sin(TAU * 11 * t)), 'bp', 900, 2), [[0, 0], [3, .02], [6, .04], [9, .01], [d, 0]]), 0, 1]]), 'z1'],
  amb_z2: ['Шепчущая Чаща', d => { const cr = A(d); for (let i = 0; i < 5; i++) mix(cr, F(lidCreak(rnd(.3, .7), rnd(100, 160), .6), 'lp', 900), rnd(0, d - 1), .5); return sum(d, [[windBed(d, 800, 3500, .7, .8), 0, 1], [windBed(d, 150, 400, .5, .5), 0, 1], [cr, 0, 1]]); }, 'z2'],
  amb_z3: ['Гнилые Топи', d => { const fr = A(d); for (let i = 0; i < 9; i++) { const t = rnd(0, d - 1); const n = Math.floor(rnd(2, 4)); for (let j = 0; j < n; j++) mix(fr, voice(.12, { f0: () => rnd(55, 75), vow: 'o', fs: .6, growl: .8, rasp: .9, raspRate: 30, breath: .1 }), t + j * .16, .25); } return sum(d, [[hum(d, [55, 82.5]), 0, .3], [bubbles(d, 40, 120, 450, .4), 0, 1], [fr, 0, 1], [windBed(d, 200, 600, .5, .25), 0, 1]]); }, 'z3'],
  amb_z4: ['Склепы Остена', d => sum(d, [[hum(d, [49, 73.5, 98.3]), 0, .5], [windBed(d, 120, 400, .8, .4), 0, 1], [rev(F(noise(d, 'pink'), 'bp', 900, 3), { wet: .5, room: .9, tail: 0, dry: 0 }), 0, .04]]), 'z4'],
  amb_z5: ['Пепельные Пустоши', d => sum(d, [[windBed(d, 300, 1200, .5, .9), 0, 1], [mul(crackle(d, 40, 3000, 1.2, .5), slow(v => v, .5, d)), 0, .6], [F(noise(d, 'brown'), 'lp', 150), 0, .5]]), 'z5'],
  amb_z6: ['Логово Игнара', d => sum(d, [[F(noise(d, 'brown'), 'lp', 120), 0, 1.2], [bubbles(d, 30, 50, 160, .7), 0, 1], [mul(F(noise(d, 'brown'), 'lp', 700), slow(v => .2 + .8 * v, .3, d)), 0, .5], [crackle(d, 30, 2500, 1, .5), 0, .7]]), 'z6'],
  amb_z7: ['Ледяной Предел', d => sum(d, [[windBed(d, 400, 2000, 1.2, 1, .25), 0, 1], [windBed(d, 120, 300, .5, .5), 0, 1], [mul(F(noise(d), 'hp', 6000), slow(v => v * .2, .5, d)), 0, 1]]), 'z7'],
  amb_z8: ['Затонувший Златоверх (море)', d => sum(d, [[waves(d), 0, 1], [F(noise(d, 'brown'), 'lp', 250), 0, .6], [bubbles(d, 28, 300, 1200, .3), 0, 1], [hum(d, [65.4, 98]), 0, .15]]), 'z8'],
  amb_z9: ['Небесные Руины (песок)', d => { const g = slow(v => v ** 2, .3, d); return sum(d, [[mul(F(noise(d), 'hp', t => 2000 + 3000 * g(t)), t => .15 + .6 * g(t)), 0, .7], [windBed(d, 200, 700, .5, .7), 0, 1], [mul(crackle(d, 600, 5000, .8, .3), g), 0, .4]]); }, 'z9'],
  amb_z10: ['Изнанка Хмари (гул памяти)', d => { const wh = grains(d, 2.5, () => { const l = rnd(.4, .9); return gain(rev1(voice(l, { f0: () => rnd(150, 220), vow: [[0, pick(['i', 'e'])], [1, pick(['u', 'o'])]], breath: 2, jit: .02, env: u => Math.sin(PI * u) })), .15); }); return sum(d, [[hum(d, [110, 110.6, 164.9, 221.3]), 0, .6], [mul(F(noise(d, 'pink'), 'bp', 600, 2), slow(v => .2 + .8 * v, .2, d)), 0, .25], [rev(wh, { wet: .7, room: .92, tail: 0, dry: .3 }), 0, 1]]); }, 'z10']
};
for (const id in BEDS) def(id, 1, BEDS[id][2], 'amb', 'Фон: ' + BEDS[id][0], () => BEDS[id][1](LOOP + XF), { loop: 1 });
// точечные звуки окружения (случайно, раз в несколько секунд, со сдвигом по панораме)
def('sp_bird', 4, 'vil', 'spot', 'Птица', k => birds(1.4, 1), {});
def('sp_owl', 1, 'vil', 'spot', 'Сова', k => rev(sum(1.6, [[voice(.35, { f0: u => 380 * (1 - .1 * u), vow: 'u', breath: .1, jit: .01 }), 0, 1], [voice(.6, { f0: u => 400 * (1 - .15 * u), vow: 'u', breath: .1, jit: .01 }), .55, 1]]), { wet: .4, room: .85, tail: 1 }), {});
def('sp_twig', 2, 'z2', 'spot', 'Хруст ветки', k => rev(sum(.3, [[env(crackle(.12, 300, 2200, 1, 1), [[0, 1], [.12, 0]]), 0, 1], [gain(wood(rnd(400, 600), .03), .6), 0, 1]]), { wet: .3, room: .8, tail: .5 }), {});
def('sp_frog', 2, 'z3', 'spot', 'Лягушка', k => { const x = A(.8); for (let j = 0; j < 3; j++) mix(x, voice(.14, { f0: () => rnd(90, 120), vow: 'o', fs: .7, growl: .8, rasp: .9, raspRate: 35, breath: .1 }), j * .18); return x; }, {});
def('sp_drip', 3, 'z4', 'spot', 'Капля', k => rev(dec(osc('sine', t => rnd(900, 1500) * (1 + 6 * t), .05), .015, .001), { wet: .6, room: .92, tail: 1.6 }), {});
def('sp_chain', 1, 'z4', 'spot', 'Цепь', k => { const x = A(.8); for (let i = 0; i < 9; i++) mix(x, gain(metal(rnd(1500, 2600), .1), .1), i * rnd(.04, .08)); return rev(x, { wet: .45, room: .9, tail: 1 }); }, {});
def('sp_ember', 2, 'z5', 'spot', 'Треск углей', k => env(crackle(.6, 150, 3500, 1.2, 1), [[0, 0], [.05, 1], [.6, 0]]), {});
def('sp_lava', 2, 'z6', 'spot', 'Лава', k => sum(.8, [[bubbles(.4, 4, 60, 140, 1), 0, 1], [dec(F(noise(.4, 'brown'), 'lp', 400), .1), .2, 1], [crackle(.2, 100, 2000, 1, .5), .25, 1]]), {});
def('sp_ice', 2, 'z7', 'spot', 'Треск льда', k => rev(sum(.6, [[dec(F(noise(.2), 'hp', 2000), .04, .0005), 0, .7], [gain(modal([[rnd(1200, 2400), .2, 1], [rnd(3500, 5000), .1, .5]], .4), .2), 0, 1], [crackle(.1, 300, 5000, 2, .5), .02, 1]]), { wet: .35, room: .85, tail: .8 }), {});
def('sp_bell', 2, 'z8', 'spot', 'Далёкий колокол', k => F(rev(gain(bell(k ? 196 : 262, 3, { br: .5 }), .4), { wet: .6, room: .92, tail: 2 }), 'lp', 1400), {});
def('sp_gust', 2, 'z9', 'spot', 'Порыв песка', k => env(F(noise(1.6), 'hp', t => 1800 + 2500 * Math.sin(PI * t / 1.6)), [[0, 0], [.6, 1], [1.6, 0]]), {});
def('sp_whisper', 2, 'z10', 'spot', 'Шёпот памяти', k => rev(rev1(voice(rnd(.8, 1.1), { f0: () => rnd(160, 210), vow: [[0, 'i'], [.5, 'e'], [1, 'u']], breath: 2.5, env: u => Math.sin(PI * u) })), { wet: .6, room: .93, tail: 1.5 }), {});
def('sp_memchime', 1, 'z10', 'spot', 'Отзвук', k => F(rev(gain(bell(523, 2, { br: .3 }), .3), { wet: .7, room: .95, tail: 2.5 }), 'lp', 3000), {});

// цели громкости (LUFS) по категориям: SFX около −18, интерфейс тише, шаги и фон — заметно тише (миксуется поверх музыки)
const TGT = { sfx: -18, voc: -18, ui: -20, step: -24, amb: -26, spot: -24 };
const BR = { amb: [24, 32], spot: [24, 32], step: [28, 32], ui: [32, 40], sfx: [32, 40], voc: [32, 40] }; // кбит/с: Opus, AAC

// ======================================================================================
function enc(wavf, outf, args) { cp.execFileSync(FF, ['-y', '-v', 'error', '-i', wavf, '-ac', '1', '-map_metadata', '-1', ...args, outf]); }
function main() {
  const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
  const keep = process.argv.includes('--keepwav');
  const prev = (() => { try { return JSON.parse(fs.readFileSync(OUT + '/sfx.json', 'utf8')); } catch (e) { return null; } })();
  const out = { v: 42, sr: SR, fmt: ['ogg', 'm4a'], files: {}, list: [] };
  let tot = { ogg: 0, m4a: 0 }, nf = 0;
  for (const m of MAN) {
    const ent = { id: m.id, n: m.n, g: m.g, c: m.c, ru: m.ru };
    if (m.cd) ent.cd = m.cd; if (m.pri != null) ent.pri = m.pri; if (m.loop) ent.loop = 1;
    if (only.length && !only.includes(m.id) && prev) { const p = prev.list.find(e => e.id === m.id); if (p) { out.list.push(p); for (let k = 0; k < p.n; k++) { const b = p.id + '_' + k; for (const f of ['ogg', 'm4a']) { const fn = b + '.' + f; if (prev.files[fn]) { out.files[fn] = prev.files[fn]; tot[f] += prev.files[fn].s; } } } continue; } }
    ent.len = []; ent.lufs = [];
    for (let k = 0; k < m.n; k++) {
      seed(crypto.createHash('md5').update(m.id + ':' + k).digest().readUInt32LE(0));
      let x = RC[m.id](k);
      if (m.loop) x = loopify(x, XF);
      const r = finish(x, TGT[m.c] || -18, { loop: !!m.loop });
      const b = m.id + '_' + k, wf = path.join(TMP, b + '.wav'); wav(wf, r.x);
      const [bo, ba] = BR[m.c] || [32, 48];
      enc(wf, path.join(OUT, b + '.ogg'), ['-c:a', 'libopus', '-b:a', bo + 'k', '-vbr', 'on', '-compression_level', '10', '-application', 'audio', '-frame_duration', '20']);
      enc(wf, path.join(OUT, b + '.m4a'), ['-c:a', 'aac', '-b:a', ba + 'k', '-ar', m.c === 'amb' || m.c === 'step' ? '24000' : '32000', '-movflags', '+faststart']);
      for (const f of ['ogg', 'm4a']) { const fn = b + '.' + f, buf = fs.readFileSync(path.join(OUT, fn)); out.files[fn] = { s: buf.length, h: crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8) }; tot[f] += buf.length; }
      if (!keep) fs.unlinkSync(wf);
      ent.len.push(+(r.x.length / SR).toFixed(2)); ent.lufs.push(+r.lufs.toFixed(1)); nf++;
    }
    out.list.push(ent);
    process.stdout.write('.');
  }
  // убрать старые файлы, которых нет в манифесте
  for (const f of fs.readdirSync(OUT)) if (/\.(ogg|m4a)$/.test(f) && !out.files[f]) fs.unlinkSync(path.join(OUT, f));
  out.total = tot;
  fs.writeFileSync(OUT + '/sfx.json', JSON.stringify(out));
  console.log(`\n${out.list.length} звуков, ${nf} файлов заново; ogg ${(tot.ogg / 1024).toFixed(0)} КБ, m4a ${(tot.m4a / 1024).toFixed(0)} КБ, всего ${((tot.ogg + tot.m4a) / 1048576).toFixed(2)} МБ`);
  const byG = {}; for (const e of out.list) { for (let k = 0; k < e.n; k++) { const s = (out.files[e.id + '_' + k + '.ogg'] || {}).s || 0; byG[e.g] = (byG[e.g] || 0) + s; } }
  console.log('ogg по группам (КБ):', Object.entries(byG).map(([g, s]) => g + ' ' + (s / 1024).toFixed(0)).join(', '));
}
if (require.main === module) main();
module.exports = { MAN, BOSS, RC, voice, wav, finish, peak, lufs, seed, sat, F, noise, osc };
