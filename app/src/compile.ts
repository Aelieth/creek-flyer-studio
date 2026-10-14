// Turns document elements into drawing primitives. Both the SVG preview and the PDF writer
// consume these primitives, so what you see is what you export.
import type { Align, Brand, El, ImageEl, Property, TableEl, TextEl } from './types';
import { FONTS, pickWeight } from './fonts';
import { iconUrl } from './icons';

export type Xf = { rot: number; cx: number; cy: number; opacity: number };
export type Prim =
  | { k: 'rect'; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; sw?: number; r?: number; xf: Xf }
  | { k: 'text'; x: number; y: number; str: string; font: string; weight: number; size: number; color: string; ls: number; italic?: boolean; xf: Xf }
  | { k: 'img'; x: number; y: number; w: number; h: number; key: string; xf: Xf }
  | { k: 'ph'; x: number; y: number; w: number; h: number; label: string; xf: Xf };

// ---------- data binding ----------
export function context(p: Property, b: Brand): Record<string, string> {
  const c: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (typeof v === 'string') c[k] = v;
  for (const [k, v] of Object.entries(b)) if (typeof v === 'string' && !v.startsWith('data:')) c[k] = v;
  for (const [k, v] of Object.entries(p.dem || {})) c['dem_' + k] = v;
  p.brokers.forEach((br, i) => { for (const [k, v] of Object.entries(br)) c[`broker${i + 1}${k[0].toUpperCase()}${k.slice(1)}`] = v; });
  c.cityStateZip = [p.city, [p.state, p.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  c.fullAddress = [p.address, c.cityStateZip].filter(Boolean).join(', ');
  c.forLabel = p.listing === 'Sale' ? 'For Sale' : p.listing === 'Lease' ? 'For Lease' : 'For Sale or Lease';
  c.priceOrRate = p.listing === 'Lease' ? p.leaseRate : p.price;
  c.availableSuites = p.suites.filter(s => !/leased/i.test(s.status)).length + '';
  arraysToContext(p, c);
  return c;
}
export function resolve(s: string, c: Record<string, string>): string {
  return s.split('\n').map(line => {
    let had = false, any = false;
    const out = line.replace(/\{\{(\w+)((?:\|[^}|]+)*)\}\}/g, (_, k, fs: string) => {
      had = true; let v = c[k] ?? '';
      for (const f of fs.split('|').filter(Boolean)) {
        const [fn, ...arg] = f.split(':'); const a = arg.join(':');
        if (fn === 'upper') v = v.toUpperCase(); else if (fn === 'lower') v = v.toLowerCase();
        else if (fn === 'bullets') v = v.split('\n').filter(x => x.trim()).map(x => '• ' + x.trim()).join('\n');
        else if (fn === 'dash') v = v.split('\n').filter(x => x.trim()).map(x => '- ' + x.trim()).join('\n\n');
        else if (fn === 'pre' && v) v = a + v; else if (fn === 'post' && v) v = v + a; else if (fn === 'or' && !v) v = a;
      }
      if (v) any = true; return v;
    });
    return had && !any ? null : out;
  }).filter(l => l !== null).join('\n').replace(/^\n+|\n+$/g, '');
}
export function color(v: string | undefined, b: Brand): string | undefined {
  if (!v) return undefined;
  if (v[0] === '$') return (b as any)[v.slice(1)] || '#000000';
  return v;
}
export const fontOf = (f: string | undefined, b: Brand) => !f || f === '$body' ? b.bodyFont : f === '$head' ? b.headFont : f;

// ---------- text measurement ----------
const mctx = document.createElement('canvas').getContext('2d')!;
export function measure(str: string, font: string, weight: number, size: number, ls: number, italic = false) {
  mctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px "${font}"`; str = str.replace(/\u00a0/g, ' ');
  return mctx.measureText(str).width + ls * Math.max(0, [...str].length);
}
type Line = { words: string[]; prefix?: string; indent: number; last: boolean };
function wrap(text: string, maxW: number, m: (s: string) => number): Line[] {
  const out: Line[] = [];
  for (const para of text.split('\n')) {
    const bullet = /^(•|-)\s+/.exec(para); const prefix = bullet ? bullet[1] : undefined;
    const indent = bullet ? m(prefix + '  ') : 0; const body = bullet ? para.slice(bullet[0].length) : para;
    const words = body.split(/ +/).filter(w => w.length); if (!words.length) { out.push({ words: [], indent: 0, last: true }); continue; }
    let cur: string[] = []; let first = true;
    for (const w of words) {
      const trial = [...cur, w].join(' ');
      if (cur.length && m(trial) > maxW - indent) { out.push({ words: cur, prefix: first ? prefix : undefined, indent, last: false }); cur = [w]; first = false; }
      else cur.push(w);
    }
    out.push({ words: cur, prefix: first ? prefix : undefined, indent, last: true });
  }
  return out;
}
export type TextLayout = { size: number; lines: { x: number; y: number; str: string }[]; overflow: boolean };
export function layoutText(el: TextEl, text: string, b: Brand): TextLayout {
  const font = fontOf(el.font, b); const weight = pickWeight(font, el.weight); const met = FONTS[font] || FONTS['Open Sans'];
  const pad = el.pad ?? 0; const W = el.w - pad * 2, H = el.h - pad * 2; const s = el.upper ? text.toUpperCase() : text;
  let size = el.size; let lines: Line[] = []; let lh = 0;
  const lsOf = (sz: number) => (el.ls ?? 0) * sz / 100; // letter spacing in 1/100 em
  for (; ;) {
    const ls = lsOf(size); const m = (x: string) => measure(x, font, weight, size, ls, el.italic);
    lines = wrap(s, W, m); lh = size * (el.lh ?? 1.25);
    const tooWide = lines.some(l => l.words.length === 1 && m(l.words[0]) > W - l.indent + 0.5);
    if (!el.autoFit || size <= 5 || (lines.length * lh <= H + 0.5 && !tooWide)) break;
    size = Math.max(5, size - 0.5);
  }
  const ls = lsOf(size); const m = (x: string) => measure(x, font, weight, size, ls, el.italic);
  const total = lines.length * lh; const top = el.y + pad + (el.valign === 'middle' ? (H - total) / 2 : el.valign === 'bottom' ? H - total : 0);
  const base = (lh - (met.asc + met.desc) * size) / 2 + met.asc * size;
  const out: TextLayout['lines'] = []; const x0 = el.x + pad; const al: Align = el.align || 'left';
  lines.forEach((l, i) => {
    const y = top + i * lh + base; const str = l.words.join(' ');
    if (l.prefix) out.push({ x: x0, y, str: l.prefix });
    const avail = W - l.indent; const lw = m(str); const lx = x0 + l.indent;
    if (al === 'justify' && !l.last && l.words.length > 1) {
      const ws = l.words.map(w => m(w)); const gap = (avail - ws.reduce((a, c) => a + c, 0)) / (l.words.length - 1); let x = lx;
      l.words.forEach((w, j) => { out.push({ x, y, str: w }); x += ws[j] + gap; });
    } else if (str) out.push({ x: al === 'center' ? lx + (avail - lw) / 2 : al === 'right' ? lx + avail - lw : lx, y, str });
  });
  return { size, lines: out, overflow: total > H + 0.5 };
}

// ---------- images ----------
export type ImgReq = { key: string; src: string; w: number; h: number; fit: 'cover' | 'contain'; fx: number; fy: number; zoom: number; radius: number; gray: boolean; tint?: string; tintAlpha: number };
export function imageSrc(src: string, p: Property, b: Brand): string {
  if (src === 'logo') return b.logo; if (src === 'logoLight') return b.logoLight || b.logo; if (src === 'map') return p.mapImg;
  if (src === 'sitePlan') return p.sitePlan || p.mapImg; if (src === 'aerial') return p.aerial || p.photos[0] || '';
  if (src.startsWith('icon:')) { const [, n, col] = src.split(':'); return iconUrl(n, col ? color(col, b) : '#ffffff'); }
  if (src.startsWith('photo:')) { const n = +src.slice(6); return p.photos[n] || ''; }
  return src;
}
const shortHash = (s: string) => { let h = 0; const step = Math.max(1, Math.floor(s.length / 2000)); for (let i = 0; i < s.length; i += step) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length; };
export function imgReq(el: ImageEl, src: string, b: Brand): ImgReq {
  const r: Omit<ImgReq, 'key'> = { src, w: Math.round(el.w), h: Math.round(el.h), fit: el.fit || 'cover', fx: el.fx ?? 0.5, fy: el.fy ?? 0.5, zoom: el.zoom ?? 1, radius: el.radius ?? 0, gray: !!el.gray, tint: color(el.tint, b), tintAlpha: el.tintAlpha ?? 0 };
  return { ...r, key: [shortHash(src), r.w, r.h, r.fit, r.fx, r.fy, r.zoom, r.radius, r.gray, r.tint, r.tintAlpha].join('_') };
}

// ---------- compile ----------
export type Compiled = { prims: Prim[]; imgs: ImgReq[]; overflow: string[] };
// Flow groups: columns (e.g. broker contacts) that sit side by side, each starting flowGap px after the
// widest visible line of the previous column, so long emails/phones never collide and short ones stay tight.
function applyFlow(els: El[], c: Record<string, string>, b: Brand): El[] {
  const groups = new Map<string, El[]>();
  for (const e of els) if (e.flow) { if (!groups.has(e.flow)) groups.set(e.flow, []); groups.get(e.flow)!.push(e); }
  if (!groups.size) return els;
  const shift = new Map<El, number>();
  for (const g of groups.values()) {
    const idxs = [...new Set(g.map(e => e.flowIdx ?? 0))].sort((a, b) => a - b);
    let nextX: number | null = null;
    for (const i of idxs) {
      const col = g.filter(e => (e.flowIdx ?? 0) === i && !(e.showIf && !resolve(e.showIf, c).trim()));
      if (!col.length) continue;
      const minX: number = Math.min(...col.map(e => e.x)); const dx: number = nextX === null ? 0 : nextX - minX;
      let right = minX;
      for (const e of col) {
        shift.set(e, dx);
        if (e.type === 'text') {
          const font = fontOf(e.font, b); const w = pickWeight(font, e.weight); const L = layoutText({ ...e, w: 2000 }, resolve(e.text, c), b);
          for (const l of L.lines) right = Math.max(right, e.x + measure(l.str, font, w, L.size, (e.ls ?? 0) * L.size / 100, e.italic));
        } else right = Math.max(right, e.x + e.w);
      }
      nextX = right + dx + (col[0].flowGap ?? 20);
    }
  }
  return els.map(e => shift.has(e) && shift.get(e) ? { ...e, x: e.x + shift.get(e)! } as El : e);
}
export function compilePage(els0: El[], p: Property, b: Brand, editing: boolean): Compiled {
  const c = context(p, b); const prims: Prim[] = []; const imgs: ImgReq[] = []; const overflow: string[] = [];
  const els = applyFlow(els0, c, b);
  for (const el of els) {
    if (el.showIf && !resolve(el.showIf, c).trim()) continue;
    const xf: Xf = { rot: el.rot || 0, cx: el.x + el.w / 2, cy: el.y + el.h / 2, opacity: el.opacity ?? 1 };
    if (el.type === 'rect') prims.push({ k: 'rect', x: el.x, y: el.y, w: el.w, h: el.h, fill: color(el.fill, b), stroke: color(el.stroke, b), sw: el.sw, r: el.radius, xf });
    else if (el.type === 'text') {
      if (el.fill) prims.push({ k: 'rect', x: el.x, y: el.y, w: el.w, h: el.h, fill: color(el.fill, b), xf });
      const font = fontOf(el.font, b); const weight = pickWeight(font, el.weight);
      const L = layoutText(el, resolve(el.text, c), b); if (L.overflow) overflow.push(el.id);
      for (const l of L.lines) prims.push({ k: 'text', x: l.x, y: l.y, str: l.str.replace(/\u00a0/g, ' '), font, weight, size: L.size, color: color(el.color, b) || '#000', ls: (el.ls ?? 0) * L.size / 100, italic: el.italic, xf });
    } else if (el.type === 'image') {
      const src = imageSrc(el.src, p, b);
      if (!src && (el.src === 'logo' || el.src === 'logoLight')) {
        const t: TextEl = { id: '', type: 'text', x: el.x, y: el.y, w: el.w, h: el.h, text: b.company, font: '$head', weight: 500, size: el.h * 0.8, autoFit: true, valign: 'middle', ls: 8, upper: true,
          align: el.fit === 'contain' && el.name?.includes('center') ? 'center' : el.name?.includes('right') ? 'right' : 'left', color: el.src === 'logoLight' ? '#ffffff' : '$primary' };
        const L = layoutText(t, t.text, b); const font = fontOf('$head', b);
        for (const l of L.lines) prims.push({ k: 'text', x: l.x, y: l.y, str: l.str, font, weight: pickWeight(font, 500), size: L.size, color: color(t.color, b)!, ls: 8 * L.size / 100, xf });
        continue;
      }
      if (!src) { if (editing) prims.push({ k: 'ph', x: el.x, y: el.y, w: el.w, h: el.h, label: phLabel(el.src), xf }); continue; }
      const rq = imgReq(el, src, b); imgs.push(rq); prims.push({ k: 'img', x: el.x, y: el.y, w: el.w, h: el.h, key: rq.key, xf });
      if (el.stroke && el.sw) prims.push({ k: 'rect', x: el.x, y: el.y, w: el.w, h: el.h, stroke: color(el.stroke, b), sw: el.sw, r: el.radius, xf });
    } else if (el.type === 'table') compileTable(el, c, b, prims, xf);
  }
  return { prims, imgs, overflow };
}
const phLabel = (s: string) => s === 'logo' || s === 'logoLight' ? 'Logo · Brand tab' : s === 'map' ? 'Map · run address lookup' : s === 'sitePlan' ? 'Site plan · Property tab' : s.startsWith('photo:') ? `Photo ${+s.slice(6) + 1} · Property tab` : 'Image';
function tableRows(el: TableEl, c: Record<string, string>): string[][] {
  return el.rows.split('\n').filter(r => r.trim()).flatMap(r => r.trim() === '@suites' ? (JSON.parse(c.__suitesAvail || '[]') as string[]).map(x => '\u0001' + x) : [r]).map(r => splitCells(r).map(x => resolve(x.trim().replace(/\\n/g, '\n'), c).replace(/\\n/g, '\n')));
}
// Tables always fit their box: if the content is taller than el.h, drop the spacer gaps, then tighten rows.
function compileTable(el: TableEl, c: Record<string, string>, b: Brand, prims: Prim[], xf: Xf) {
  const tries: [number, number][] = [[el.rowGap ?? 0, el.rowH], [0, el.rowH], [0, Math.max(el.size * 1.6, el.rowH * 0.85)], [0, el.size * 1.45]];
  for (let i = 0; i < tries.length; i++) {
    const local: Prim[] = []; const hgt = drawTable({ ...el, rowGap: tries[i][0], rowH: tries[i][1] }, c, b, local, xf);
    if (hgt <= el.h + 1 || i === tries.length - 1) { prims.push(...local); return; }
  }
}
function drawTable(el: TableEl, c: Record<string, string>, b: Brand, prims: Prim[], xf: Xf): number {
  let rows: string[][];
  rows = tableRows(el, c);
  if (el.source === 'suites' || el.source === 'comps') rows = [rows[0] || [], ...(JSON.parse(c['__' + el.source] || '[]') as string[][])];
  const font = fontOf(el.font, b); const totalFr = el.cols.reduce((a, x) => a + x, 0);
  let y = el.y;
  rows.forEach((r0, ri) => {
    const compact = (r0[0] || '').startsWith('\u0001'); const r = compact ? [r0[0].slice(1), ...r0.slice(1)] : r0;
    const isHead = el.header && ri === 0;
    if (!isHead && el.skipEmpty && r.slice(1).every(v => !v.trim())) return;
    const cells = el.cols.map((fr, ci) => {
      const cw = el.w * fr / totalFr; const cx = el.x + el.w * el.cols.slice(0, ci).reduce((a, x) => a + x, 0) / totalFr;
      const t: TextEl = { id: '', type: 'text', x: cx + (ci === 0 ? 6 : 4), y: 0, w: cw - (ci === 0 ? 10 : 10), h: 9999, text: r[ci] ?? '', font, size: el.size, align: el.aligns[ci] || 'left', lh: 1.25,
        weight: isHead ? el.headWeight ?? 700 : ci === 0 ? el.labelWeight ?? 700 : 400, ls: isHead ? 6 : 0 };
      return { t, L: layoutText(t, t.text, b) };
    });
    const nLines = Math.max(1, ...cells.map(x => new Set(x.L.lines.map(l => l.y)).size));
    const rh = Math.max(el.rowH, nLines * el.size * 1.25 + 10);
    if (isHead && el.headFill) prims.push({ k: 'rect', x: el.x, y, w: el.w, h: rh, fill: color(el.headFill, b), xf });
    else if (el.zebra && ri % 2 === 0) prims.push({ k: 'rect', x: el.x, y, w: el.w, h: rh, fill: color(el.zebra, b), xf });
    cells.forEach(({ t, L }, ci) => {
      const off = y + (rh - nLines * el.size * 1.25) / 2; const w = pickWeight(font, t.weight);
      for (const l of L.lines) prims.push({ k: 'text', x: l.x, y: l.y + off, str: isHead ? l.str.toUpperCase() : l.str, font, weight: w, size: L.size, ls: isHead ? L.size * 0.06 : 0,
        color: color(isHead ? el.headColor : ci === 0 ? el.labelColor : el.color, b) || '#000', xf });
    });
    y += rh;
    if (el.rule) prims.push({ k: 'rect', x: el.x, y: y - (el.ruleW ?? 1), w: el.w, h: el.ruleW ?? 1, fill: color(el.rule, b), xf });
    if (el.rowGap && !compact && !isHead) { y += el.rowGap; if (el.rule) prims.push({ k: 'rect', x: el.x, y: y - (el.ruleW ?? 1), w: el.w, h: el.ruleW ?? 1, fill: color(el.rule, b), xf }); }
  });
  return y - el.y;
}
export function arraysToContext(p: Property, c: Record<string, string>) {
  c.__suites = JSON.stringify(p.suites.map(s => [s.suite, s.sf, s.rate || '—', s.status, s.notes]));
  c.__suitesAvail = JSON.stringify(p.suites.filter(s => s.suite && !/leased/i.test(s.status)).map(s => `${s.suite}:|${s.sf}`));
  c.__comps = JSON.stringify(p.comps.map(s => [s.name + (s.address ? '\n' + s.address : ''), s.date, s.price, s.sf, s.ppsf, s.cap]));
}

// split a table row on | but not inside {{ }}
export function splitCells(r: string): string[] {
  const out: string[] = []; let cur = '', depth = 0;
  for (let i = 0; i < r.length; i++) {
    if (r.startsWith('{{', i)) { depth++; cur += '{{'; i++; continue; }
    if (r.startsWith('}}', i) && depth) { depth--; cur += '}}'; i++; continue; }
    if (r[i] === '|' && !depth) { out.push(cur); cur = ''; } else cur += r[i];
  }
  out.push(cur); return out;
}
