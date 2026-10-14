import { useMemo, useState } from 'react';
import type { Brand, Property } from './types';
import { SIZES } from './types';
import { TEMPLATES, makeDocPages, sizeOf, type Template } from './templates';
import { SvgPage } from './SvgPage';
export function Gallery({ p, b, create }: { p: Property; b: Brand; create: (t: Template, sizeId?: string) => void }) {
  const [tag, setTag] = useState('all'); const [size, setSize] = useState('');
  const tags = ['all', ...Array.from(new Set(TEMPLATES.flatMap(t => t.tags)))];
  const list = TEMPLATES.filter(t => tag === 'all' || t.tags.includes(tag));
  return <div className="gallery-wrap">
    <div className="row wrap gal-filter"><b>Templates</b>{tags.map(t => <button key={t} className={'sm' + (tag === t ? ' on' : '')} onClick={() => setTag(t)}>{t}</button>)}
      <span className="grow" /><span className="muted">Output size:</span><select value={size} onChange={e => setSize(e.target.value)}><option value="">Template default</option>{SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
    <p className="muted">Previews use your active property “{p.name}” and brand kit. Click to create a document.</p>
    <div className="gallery">{list.map(t => <Card key={t.id} t={t} p={p} b={b} size={size} onClick={() => create(t, size || undefined)} />)}</div>
  </div>;
}
function Card({ t, p, b, size, onClick }: { t: Template; p: Property; b: Brand; size: string; onClick: () => void }) {
  const sz = size ? SIZES.find(s => s.id === size)! : sizeOf(t.size);
  const pages = useMemo(() => makeDocPages(t, sz), [t, sz]);
  const sc = 220 / Math.max(sz.w, sz.h);
  return <div className="tcard" onClick={onClick}><div className="tpages">{pages.slice(0, 3).map((pg, i) => <div key={i} className="tthumb" style={{ zIndex: 3 - i, marginLeft: i ? -sz.w * sc * 0.72 : 0, transform: `translate(${i * 14}px, ${i * 8}px)` }}>
    <SvgPage els={pg.els} p={p} b={b} w={sz.w} h={sz.h} scale={sc} editing={false} /></div>)}</div>
    <b>{t.name}</b><small>{t.desc}</small><small className="muted">{sz.label} · {t.pages.length} page{t.pages.length > 1 ? 's' : ''}</small></div>;
}
