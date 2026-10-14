import type { Brand, El, Property } from './types';
export function resolveColor(c: string | undefined, b: Brand) {
  if (!c) return undefined; return c === '$primary' ? b.primary : c === '$accent' ? b.accent : c === '$dark' ? b.dark : c;
}
export function resolveText(s: string, p: Property, b: Brand) {
  return s.replace(/\{\{(\w+)(?:\|(\w+))?\}\}/g, (_, k, f) => {
    let v = String((p as any)[k] ?? (b as any)[k] ?? '');
    if (!v) v = '—';
    if (f === 'upper') v = v.toUpperCase();
    if (f === 'bullets') v = v.split('\n').filter(Boolean).map(l => '•  ' + l).join('\n');
    return v;
  });
}
export function resolveSrc(src: string | undefined, p: Property, b: Brand) {
  if (!src) return '';
  if (src === 'logo') return b.logo; if (src === 'map') return p.mapImg;
  if (src.startsWith('photo:')) { const n = +src.slice(6); return p.photos.length ? p.photos[n % p.photos.length] : ''; }
  return src;
}
export function ElView({ e, p, b, editing }: { e: El; p: Property; b: Brand; editing: boolean }) {
  const base: React.CSSProperties = { position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h, opacity: e.opacity ?? 1, borderRadius: e.radius, overflow: 'hidden' };
  if (e.type === 'rect') return <div style={{ ...base, background: resolveColor(e.fill, b) }} />;
  if (e.type === 'text') return <div style={{ ...base, color: resolveColor(e.color, b), fontSize: e.fontSize, fontWeight: e.bold ? 700 : 400, fontStyle: e.italic ? 'italic' : 'normal',
    textAlign: e.align, lineHeight: e.lineHeight ?? 1.25, whiteSpace: 'pre-wrap', background: resolveColor(e.fill, b), fontFamily: b.font }}>{resolveText(e.text || '', p, b)}</div>;
  const src = resolveSrc(e.src, p, b);
  if (!src) return <div style={{ ...base, background: e.src === 'logo' ? 'transparent' : '#d9dde3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a8594', fontSize: 13, fontFamily: b.font,
    border: editing ? '1px dashed #9aa4b2' : 'none' }}>{editing ? (e.type === 'map' ? 'Map: run address lookup' : e.src === 'logo' ? 'Logo (Brand tab)' : 'Photo (Property tab)') : (e.src === 'logo' ? <b style={{ color: resolveColor('$accent', b), fontSize: 18 }}>{b.company}</b> : '')}</div>;
  return <img src={src} draggable={false} style={{ ...base, objectFit: e.fit || 'cover', display: 'block' }} />;
}
