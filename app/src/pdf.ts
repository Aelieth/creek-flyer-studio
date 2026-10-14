import { jsPDF } from 'jspdf';
import type { Brand, Doc, El, Property } from './types';
import { compilePage } from './compile';
import { processImage } from './images';
import { fontBase64 } from './fonts';
// Vector PDF: shapes as paths, text as real (selectable, searchable) text with embedded subsets of the same TTFs, images pre-cropped.
const K = 0.75; // px -> pt
export async function buildPdf(doc: Doc, p: Property, b: Brand): Promise<jsPDF> {
  const W = doc.size.w * K, H = doc.size.h * K;
  const pdf = new jsPDF({ unit: 'pt', format: [W, H], orientation: W > H ? 'landscape' : 'portrait', compress: true, putOnlyUsedFonts: true });
  pdf.setProperties({ title: doc.name, creator: 'Creek Flyer Studio' });
  const pages = doc.pages.map(pg => compilePage(pg.els, p, b, false));
  const fonts = new Set<string>(); pages.forEach(c => c.prims.forEach(q => q.k === 'text' && fonts.add(q.font + '|' + q.weight)));
  for (const f of fonts) { const [fam, w] = f.split('|'); const name = `${fam.replace(/ /g, '')}-${w}`; pdf.addFileToVFS(name + '.ttf', await fontBase64(fam, +w)); pdf.addFont(name + '.ttf', name, 'normal'); }
  const imgs = new Map<string, { url: string; fmt: 'JPEG' | 'PNG' }>();
  await Promise.all(pages.flatMap(c => c.imgs).map(async r => { try { imgs.set(r.key, await processImage(r)); } catch { /* skip broken image */ } }));
  const raw = (s: string) => (pdf as any).internal.write(s);
  pages.forEach((c, pi) => {
    if (pi) pdf.addPage([W, H], W > H ? 'landscape' : 'portrait');
    for (const q of c.prims) {
      const wrapped = q.xf.rot || q.xf.opacity < 1;
      if (wrapped) {
        raw('q');
        if (q.xf.opacity < 1) pdf.setGState(new (pdf as any).GState({ opacity: q.xf.opacity, 'stroke-opacity': q.xf.opacity }));
        if (q.xf.rot) { const t = -q.xf.rot * Math.PI / 180, a = Math.cos(t), bb = Math.sin(t), cc = -Math.sin(t), d = Math.cos(t); const cx = q.xf.cx * K, cy = H - q.xf.cy * K;
          raw([a, bb, cc, d, cx - (a * cx + cc * cy), cy - (bb * cx + d * cy)].map(n => n.toFixed(5)).join(' ') + ' cm'); }
      }
      if (q.k === 'rect') {
        if (q.fill) pdf.setFillColor(q.fill); if (q.stroke) { pdf.setDrawColor(q.stroke); pdf.setLineWidth((q.sw || 1) * K); }
        const st = q.fill && q.stroke ? 'FD' : q.fill ? 'F' : 'S';
        if (q.r) pdf.roundedRect(q.x * K, q.y * K, q.w * K, q.h * K, q.r * K, q.r * K, st); else pdf.rect(q.x * K, q.y * K, q.w * K, q.h * K, st);
      } else if (q.k === 'text') {
        pdf.setFont(`${q.font.replace(/ /g, '')}-${q.weight}`, 'normal'); pdf.setFontSize(q.size * K); pdf.setTextColor(q.color);
        // keep browser-measured start; correct tiny width drift for right-aligned runs is unnecessary since x is absolute
        pdf.text(q.str, q.x * K, q.y * K, { baseline: 'alphabetic', charSpace: q.ls * K });
      } else if (q.k === 'img') {
        const im = imgs.get(q.key); if (im) pdf.addImage(im.url, im.fmt, q.x * K, q.y * K, q.w * K, q.h * K, q.key, 'FAST');
      }
      if (wrapped) { if (q.xf.opacity < 1) pdf.setGState(new (pdf as any).GState({ opacity: 1, 'stroke-opacity': 1 })); raw('Q'); }
    }
  });
  return pdf;
}
export async function exportPdf(doc: Doc, p: Property, b: Brand) { const pdf = await buildPdf(doc, p, b); pdf.save(safeName(doc.name) + '.pdf'); }
export const safeName = (s: string) => s.replace(/[^\w-]+/g, '_').replace(/_+/g, '_') || 'flyer';
// PNG/JPEG: draw the same primitives to a canvas.
export async function renderPng(els: El[], p: Property, b: Brand, w: number, h: number, scale = 2, fmt: 'png' | 'jpeg' = 'png'): Promise<string> {
  // draw primitives straight to canvas (fonts already loaded)
  const c = compilePage(els, p, b, false); const cv = document.createElement('canvas'); cv.width = w * scale; cv.height = h * scale; const g = cv.getContext('2d')!; g.scale(scale, scale);
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  for (const q of c.prims) {
    g.save(); g.globalAlpha = q.xf.opacity; if (q.xf.rot) { g.translate(q.xf.cx, q.xf.cy); g.rotate(q.xf.rot * Math.PI / 180); g.translate(-q.xf.cx, -q.xf.cy); }
    if (q.k === 'rect') { if (q.fill) { g.fillStyle = q.fill; g.beginPath(); g.roundRect(q.x, q.y, q.w, q.h, q.r || 0); g.fill(); } if (q.stroke) { g.strokeStyle = q.stroke; g.lineWidth = q.sw || 1; g.strokeRect(q.x, q.y, q.w, q.h); } }
    else if (q.k === 'text') { g.font = `${q.italic ? 'italic ' : ''}${q.weight} ${q.size}px "${q.font}"`; g.fillStyle = q.color; (g as any).letterSpacing = q.ls + 'px'; g.fillText(q.str, q.x, q.y); }
    else if (q.k === 'img') { const r = c.imgs.find(i => i.key === q.key)!; const im = await processImage(r); const el = new Image(); await new Promise(res => { el.onload = res; el.src = im.url; }); g.drawImage(el, q.x, q.y, q.w, q.h); }
    g.restore();
  }
  return fmt === 'jpeg' ? cv.toDataURL('image/jpeg', 0.88) : cv.toDataURL('image/png');
}
