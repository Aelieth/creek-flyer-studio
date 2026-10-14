import type { ImgReq } from './compile';
// Pre-renders each placed image (crop, zoom, focus, radius, grayscale, tint) to a bitmap at ~2x (≈192 dpi).
// Shared by preview and PDF so crops match exactly and PDFs only carry the pixels actually shown.
const cache = new Map<string, Promise<{ url: string; fmt: 'JPEG' | 'PNG' }>>();
const done = new Map<string, { url: string; fmt: 'JPEG' | 'PNG' }>();
const srcImgs = new Map<string, Promise<HTMLImageElement>>();
function loadImg(src: string) {
  let p = srcImgs.get(src);
  if (!p) { p = new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; }); srcImgs.set(src, p); }
  return p;
}
export const SCALE = 2;
export function getProcessed(key: string) { return done.get(key); }
export function processImage(r: ImgReq) {
  let p = cache.get(r.key);
  if (p) return p;
  p = loadImg(r.src).then(img => {
    const W = Math.max(1, Math.round(r.w * SCALE)), H = Math.max(1, Math.round(r.h * SCALE));
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!;
    if (r.radius) { g.beginPath(); g.roundRect(0, 0, W, H, r.radius * SCALE); g.clip(); }
    const iw = img.naturalWidth, ih = img.naturalHeight;
    let s = r.fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih); s *= r.zoom;
    const dw = iw * s, dh = ih * s;
    const dx = r.fit === 'contain' && r.zoom <= 1 ? (W - dw) / 2 : (W - dw) * r.fx, dy = r.fit === 'contain' && r.zoom <= 1 ? (H - dh) / 2 : (H - dh) * r.fy;
    if (r.gray) g.filter = 'grayscale(1)';
    g.imageSmoothingQuality = 'high'; g.drawImage(img, dx, dy, dw, dh); g.filter = 'none';
    if (r.tint && r.tintAlpha) { g.globalAlpha = r.tintAlpha; g.fillStyle = r.tint; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    const transparent = r.radius > 0 || r.fit === 'contain' || /^data:image\/(png|svg)/.test(r.src) || r.src.endsWith('.png') || r.src.endsWith('.svg');
    const out = transparent ? { url: c.toDataURL('image/png'), fmt: 'PNG' as const } : { url: c.toDataURL('image/jpeg', 0.84), fmt: 'JPEG' as const };
    done.set(r.key, out); return out;
  });
  cache.set(r.key, p); p.catch(() => cache.delete(r.key));
  return p;
}
