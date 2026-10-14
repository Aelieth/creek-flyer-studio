import { useState } from 'react';
import type { Brand, DocSize, Page, Property } from './types';
import { PAGES, SMART, fitEls, smartDef, sizeOf, makeSmartPage } from './templates';
import type { SmartOpt } from './templates';
import { SvgPage } from './SvgPage';

export const pageName = (pg: Page, i: number) => pg.name || `Page ${i + 1}`;

export function PageOptions({ pg, i, p, onBack, rename, setOpts, setRings, reset }: { pg: Page; i: number; p: Property; onBack: () => void; rename: (n: string) => void;
  setOpts: (o: Record<string, any>) => void; setRings: (v: string) => void; reset: () => void }) {
  const d = pg.kind ? smartDef(pg.kind) : undefined; const o = { ...(d?.defaults || {}), ...(pg.opts || {}) } as Record<string, any>;
  return <div className="pageopts">
    <button className="link" onClick={onBack}>← Back to pages</button>
    <label className="field"><span>Page name</span><input value={pageName(pg, i)} onChange={e => rename(e.target.value)} /></label>
    {d ? <><h4>Options</h4>
      {d.opts.map(op => op.prop ? <Select key={op.key} op={op} v={(p.rings || [1, 3, 5]).join(',')} on={setRings} />
        : op.type === 'multi' ? <Multi key={op.key} op={op} v={o[op.key] || []} on={v => setOpts({ [op.key]: v })} />
        : <Select key={op.key} op={op} v={o[op.key]} on={v => setOpts({ [op.key]: v })} />)}
      <p className="muted">Options rebuild this page from the listing. Hand edits on this page are replaced when you change an option.</p></>
      : <p className="muted">{pg.def ? 'This library layout has no options. Edit elements directly, or reset it to the original layout.' : 'Custom page: edit elements directly.'}</p>}
    {(pg.kind || pg.def) && <button className="wide" onClick={reset}>↺ Reset page</button>}
  </div>;
}
function Select({ op, v, on }: { op: SmartOpt; v: string; on: (v: string) => void }) {
  return <label className="field"><span>{op.label}</span><select value={v} onChange={e => on(e.target.value)}>{op.choices.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>;
}
function Multi({ op, v, on }: { op: SmartOpt; v: string[]; on: (v: string[]) => void }) {
  const rest = op.choices.filter(([k]) => !v.includes(k)); const lab = (k: string) => (op.choices.find(c => c[0] === k) || [k, k])[1];
  return <div className="field multi"><span>{op.label}</span>
    <div className="chips">{v.map((k, j) => <span key={k} className="chip">{lab(k)}
      {j > 0 && <button title="Move earlier" onClick={() => { const a = [...v]; [a[j - 1], a[j]] = [a[j], a[j - 1]]; on(a); }}>‹</button>}
      <button title="Remove" onClick={() => on(v.filter(x => x !== k))}>×</button></span>)}
      {!v.length && <span className="muted">none</span>}</div>
    {rest.length > 0 && <select value="" onChange={e => e.target.value && on([...v, e.target.value])}><option value="">+ add…</option>{rest.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
  </div>;
}

export function AddPageDialog({ onClose, onSmart, onLib, p, b, size }: { onClose: () => void; onSmart: (k: string) => void; onLib: (id: string) => void; p: Property; b: Brand; size: DocSize }) {
  const [q, setQ] = useState(''); const m = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase()); const sc = 120 / Math.max(size.w, size.h);
  return <div className="modal-bg" onClick={onClose}><div className="modal wide-modal" onClick={e => e.stopPropagation()}>
    <div className="row"><h2>Add page</h2><span className="grow" /><button onClick={onClose}>Close</button></div>
    <input className="wide" autoFocus placeholder="Search page layouts…" value={q} onChange={e => setQ(e.target.value)} />
    <h4>Configurable pages <small className="muted">options panel, always data-bound</small></h4>
    <div className="plib big">{SMART.filter(d => m(d.name + d.desc)).map(d => <div key={d.id} className="plib-item" onClick={() => onSmart(d.id)} title={d.desc}>
      <SvgPage els={makeSmartPage(d.id, undefined, size).els} p={p} b={b} w={size.w} h={size.h} scale={sc} editing={false} /><small><b>{d.name}</b><br />{d.desc}</small></div>)}</div>
    <h4>Library layouts</h4>
    <div className="plib big">{PAGES.filter(d => m(d.name)).map(d => <div key={d.id} className="plib-item" onClick={() => onLib(d.id)}>
      <SvgPage els={fitEls(d.make(), sizeOf(d.size), size)} p={p} b={b} w={size.w} h={size.h} scale={sc} editing={false} /><small>{d.name}</small></div>)}</div>
  </div></div>;
}

// Deterministic copy drafts from the listing record (no AI service involved).
export function CopyHelper({ p, updProp }: { p: Property; b?: Brand; updProp: (f: (p: Property) => Property) => void }) {
  const [draft, setDraft] = useState(''); const [target, setTarget] = useState<'highlights' | 'description' | 'locationDescription'>('highlights');
  const where = [p.city, p.state].filter(Boolean).join(', ');
  const highlights = () => [p.availableSf && `${p.availableSf} available`, p.leaseRate && p.listing !== 'Sale' && `${p.leaseRate}${p.leaseType ? ' ' + p.leaseType : ''}`, p.price && p.listing !== 'Lease' && `Offered at ${p.price}`,
    p.buildingSf && `${p.buildingSf} ${p.propType.toLowerCase()} building${p.yearBuilt ? ` built ${p.yearBuilt}` : ''}`, p.traffic && `${p.traffic} traffic count`, p.parking && `Parking: ${p.parking}`,
    p.zoning && `Zoned ${p.zoning}`, ...p.suites.filter(s => s.suite && !/leased/i.test(s.status)).slice(0, 4).map(s => `${s.suite} · ${s.sf}${s.rate ? ' · ' + s.rate : ''}${s.notes ? ' · ' + s.notes : ''}`),
    ...(p.customFields || []).filter(f => f.label && f.value).map(f => `${f.label}: ${f.value}`)].filter(Boolean).join('\n');
  const overview = () => `${p.name} is a ${p.buildingSf ? p.buildingSf + ' ' : ''}${(p.buildingClass ? 'Class ' + p.buildingClass + ' ' : '')}${p.propType.toLowerCase()} property${p.address ? ' at ' + p.address : ''}${where ? ' in ' + where : ''}. ` +
    `${p.listing === 'Sale' ? `It is offered for sale${p.price ? ' at ' + p.price : ''}.` : `Space is available for lease${p.availableSf ? ' from ' + p.availableSf : ''}${p.leaseRate ? ' at ' + p.leaseRate + (p.leaseType ? ' ' + p.leaseType : '') : ''}.`} ` +
    `${p.yearBuilt ? 'Built in ' + p.yearBuilt + ', the ' : 'The '}property offers ${p.parking ? p.parking + ' parking' : 'convenient parking'}${p.traffic ? ' and exposure to ' + p.traffic : ''}.`;
  const location = () => `Located ${p.market ? 'in the ' + p.market + ' submarket ' : ''}${where ? 'of ' + where : ''}${p.traffic ? ', the site sees ' + p.traffic : ''}${(p.pois || []).filter(q => q.on).length ? '. Nearby: ' + (p.pois || []).filter(q => q.on).slice(0, 6).map(q => q.name).join(', ') : ''}.`;
  const make = (t: typeof target) => { setTarget(t); setDraft(t === 'highlights' ? highlights() : t === 'description' ? overview() : location()); };
  return <div><h3>Copy helper</h3><p className="muted">Drafts copy from the listing fields. Review and edit, then apply to the listing; every page bound to that field updates.</p>
    <div className="blockgrid"><button onClick={() => make('highlights')}>Draft highlights</button><button onClick={() => make('description')}>Draft overview</button><button onClick={() => make('locationDescription')}>Draft location</button></div>
    {draft && <><textarea rows={10} className="wide" value={draft} onChange={e => setDraft(e.target.value)} />
      <div className="row"><button className="primary" onClick={() => { updProp(x => ({ ...x, [target]: draft })); setDraft(''); }}>Apply to listing {target === 'description' ? 'overview' : target === 'locationDescription' ? 'location' : 'highlights'}</button><button onClick={() => setDraft('')}>Discard</button></div></>}
    </div>;
}
