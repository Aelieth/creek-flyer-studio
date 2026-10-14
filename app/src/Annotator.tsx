import { useEffect, useRef, useState } from 'react';
import type { Brand, PhotoAnn } from './types';
// Draw outline polygons (e.g. suites) on a photo. The original is kept so outlines stay editable; the outlined
// image is what pages use, so it shows identically in preview, PDF and PNG.
export const annKey = (s: string) => { let h = 0; for (let i = 0; i < s.length; i += Math.max(1, Math.floor(s.length / 4000))) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + (h >>> 0).toString(36); };
type Pt = [number, number];
export async function bake(src: string, polys: Pt[][], color: string, width: number, fill: number): Promise<string> {
  const im = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d')!; g.drawImage(im, 0, 0);
  drawPolys(g, polys, im.width, im.height, color, width * im.width / 1000, fill);
  return c.toDataURL('image/jpeg', 0.9);
}
function drawPolys(g: CanvasRenderingContext2D, polys: Pt[][], W: number, H: number, color: string, lw: number, fill: number, open?: Pt[]) {
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (const P of polys) { if (P.length < 2) continue; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)); g.closePath();
    if (fill > 0) { g.globalAlpha = fill; g.fillStyle = color; g.fill(); g.globalAlpha = 1; } g.lineWidth = lw; g.strokeStyle = color; g.stroke(); }
  if (open && open.length) { g.beginPath(); open.forEach(([x, y], i) => i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)); g.lineWidth = lw; g.strokeStyle = color; g.setLineDash([lw * 2, lw * 1.5]); g.stroke(); g.setLineDash([]);
    for (const [x, y] of open) { g.beginPath(); g.arc(x * W, y * H, lw * 1.4, 0, Math.PI * 2); g.fillStyle = color; g.fill(); } }
}
export function Annotator({ src, ann, b, onClose, onSave }: { src: string; ann?: PhotoAnn; b: Brand; onClose: () => void; onSave: (img: string, a: PhotoAnn | null) => void }) {
  const orig = ann?.orig || src; const [polys, setPolys] = useState<Pt[][]>(ann?.polys || []); const [cur, setCur] = useState<Pt[]>([]);
  const [color, setColor] = useState(ann?.color || '#ffeb00'); const [width, setWidth] = useState(ann?.width || 4); const [fill, setFill] = useState(ann?.fill ?? 0);
  const ref = useRef<HTMLCanvasElement>(null); const [im, setIm] = useState<HTMLImageElement | null>(null);
  useEffect(() => { const i = new Image(); i.onload = () => setIm(i); i.src = orig; }, [orig]);
  useEffect(() => { const c = ref.current; if (!c || !im) return; const W = Math.min(900, im.width), H = W * im.height / im.width; c.width = W; c.height = H; const g = c.getContext('2d')!;
    g.drawImage(im, 0, 0, W, H); drawPolys(g, polys, W, H, color, width * W / 1000, fill, cur); });
  const pt = (e: React.MouseEvent): Pt => { const r = ref.current!.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  const close = () => { if (cur.length >= 3) setPolys([...polys, cur]); setCur([]); };
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Enter') close(); if (e.key === 'Escape') setCur([]); if ((e.key === 'Backspace' || e.key === 'z') && cur.length) setCur(cur.slice(0, -1)); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); });
  const save = async () => { const all = cur.length >= 3 ? [...polys, cur] : polys; if (!all.length) { onSave(orig, null); return; } onSave(await bake(orig, all, color, width, fill), { orig, polys: all, color, width, fill, source: 'manual' }); };
  return <div className="modal-bg"><div className="modal wide-modal annot" onClick={e => e.stopPropagation()}>
    <div className="row"><h2>Outline areas on photo</h2><span className="grow" /><button onClick={onClose}>Cancel</button><button className="primary" onClick={save}>Save outlines</button></div>
    <p className="muted">Click to drop corners; click the first point, double-click or press Enter to close the shape. Backspace removes the last point, Esc cancels the shape.</p>
    <div className="row wrap"><label className="chk">Color <input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
      {['#ffeb00', '#ffffff', b.primary, b.secondary, '#e53935'].map(c => <button key={c} className="swatch" style={{ background: c }} title={c} onClick={() => setColor(c)} />)}
      <label className="chk">Line <input type="range" min={1} max={12} value={width} onChange={e => setWidth(+e.target.value)} /></label>
      <label className="chk">Fill <input type="range" min={0} max={0.6} step={0.05} value={fill} onChange={e => setFill(+e.target.value)} /></label>
      <button className="sm" disabled={cur.length < 3} onClick={close}>Close shape</button>
      <button className="sm" disabled={!polys.length} onClick={() => setPolys(polys.slice(0, -1))}>Undo shape</button>
      <button className="sm danger" disabled={!polys.length && !cur.length} onClick={() => { setPolys([]); setCur([]); }}>Clear all</button>
      <span className="muted">{polys.length} shape{polys.length === 1 ? '' : 's'}</span></div>
    <canvas ref={ref} className="annot-canvas" onClick={e => { const q = pt(e); if (cur.length >= 3) { const [x0, y0] = cur[0]; const r = ref.current!.getBoundingClientRect(); if (Math.hypot((q[0] - x0) * r.width, (q[1] - y0) * r.height) < 12) { close(); return; } } setCur([...cur, q]); }}
      onDoubleClick={e => { e.preventDefault(); close(); }} />
  </div></div>;
}
