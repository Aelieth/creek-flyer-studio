import { useEffect, useRef, useState } from 'react';
import type { Brand, Doc, El, Property } from './types';
import { PAGE_H, PAGE_W } from './types';
import { emptyProperty, fileToDataUrl, load, save, uid } from './store';
import { TEMPLATES, instantiate } from './templates';
import { ElView } from './render';
import { exportPages } from './exporter';
import { lookupAddress, staticMap } from './lookup';
import './app.css';

type Tab = 'property' | 'brand' | 'design';
export default function App() {
  const [tab, setTab] = useState<Tab>('property');
  const [p, setP] = useState<Property>(load.property);
  const [b, setB] = useState<Brand>(load.brand);
  const [docs, setDocs] = useState<Doc[]>(load.docs);
  const [docId, setDocId] = useState<string | null>(docs[0]?.id ?? null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setErr(save('property', p)); }, [p]);
  useEffect(() => { setErr(save('brand', b)); }, [b]);
  useEffect(() => { setErr(save('docs', docs)); }, [docs]);
  const doc = docs.find(d => d.id === docId) || null;
  const newDoc = (tid: string) => { const tp = TEMPLATES.find(t => t.id === tid)!;
    const d: Doc = { id: uid(), name: `${p.name || 'Untitled'} – ${tp.name}`, templateId: tid, pages: instantiate(tp), updated: Date.now() };
    setDocs([d, ...docs]); setDocId(d.id); setTab('design'); };
  return <div className="app">
    <header>
      <div className="brandmark"><span style={{ background: b.primary }} />Creek Flyer Studio</div>
      <nav>{(['property', 'brand', 'design'] as Tab[]).map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
        {t === 'property' ? '1 · Property' : t === 'brand' ? '2 · Brand & Settings' : '3 · Design & Export'}</button>)}</nav>
      <div className="hint">Saved locally in this browser</div>
    </header>
    {err && <div className="err">{err}</div>}
    {tab === 'property' && <PropertyForm p={p} setP={setP} b={b} onNext={() => setTab('design')} />}
    {tab === 'brand' && <BrandForm b={b} setB={setB} />}
    {tab === 'design' && <Design p={p} b={b} docs={docs} setDocs={setDocs} doc={doc} setDocId={setDocId} newDoc={newDoc} />}
  </div>;
}

function Field({ label, v, on, area, wide }: { label: string; v: string; on: (s: string) => void; area?: boolean; wide?: boolean }) {
  return <label className={'field' + (wide ? ' wide' : '')}><span>{label}</span>{area ? <textarea value={v} onChange={e => on(e.target.value)} rows={4} /> : <input value={v} onChange={e => on(e.target.value)} />}</label>;
}

function PropertyForm({ p, setP, b, onNext }: { p: Property; setP: (f: (x: Property) => Property) => void; b: Brand; onNext: () => void }) {
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const [log, setLog] = useState<string[]>([]);
  const f = (k: keyof Property) => (s: string) => setP(x => ({ ...x, [k]: s }));
  const run = async () => { const addr = q || `${p.address}, ${p.city}, ${p.state} ${p.zip}`; setBusy(true); setLog(['Looking up ' + addr + ' …']);
    const r = await lookupAddress(addr, b.censusKey); setP(x => ({ ...x, ...r.patch })); setLog(r.log); setBusy(false); };
  const addPhotos = async (fl: FileList | null) => { if (!fl) return; const out: string[] = []; for (const file of Array.from(fl)) out.push(await fileToDataUrl(file)); setP(x => ({ ...x, photos: [...x.photos, ...out] })); };
  const movePhoto = (i: number, d: number) => setP(x => { const a = [...x.photos]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, photos: a }; });
  return <div className="page-form">
    <section className="card lookup">
      <h2>Address lookup <small>auto-fills from free public data</small></h2>
      <div className="row"><input placeholder="e.g. 1500 Marilla St, Dallas, TX 75201 (blank = use address below)" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
        <button className="primary" disabled={busy} onClick={run}>{busy ? 'Looking up…' : 'Look up'}</button></div>
      <p className="muted">Sources: U.S. Census Geocoder (address, county, tract) → OSM Nominatim fallback → FEMA flood zone → Census ACS demographics (needs free key in Settings) → OpenStreetMap map image.</p>
      {log.length > 0 && <ul className="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
    </section>
    <section className="card"><h2>Listing</h2><div className="grid">
      <Field label="Property name" v={p.name} on={f('name')} wide />
      <Field label="Street address" v={p.address} on={f('address')} wide /><Field label="City" v={p.city} on={f('city')} /><Field label="State" v={p.state} on={f('state')} /><Field label="ZIP" v={p.zip} on={f('zip')} />
      <label className="field"><span>Property type</span><select value={p.propType} onChange={e => f('propType')(e.target.value)}>{['Retail', 'Office', 'Industrial', 'Flex', 'Multifamily', 'Land', 'Medical Office', 'Mixed Use', 'Hospitality', 'Special Purpose'].map(o => <option key={o}>{o}</option>)}</select></label>
      <label className="field"><span>Listing</span><select value={p.listing} onChange={e => f('listing')(e.target.value)}><option>Sale</option><option>Lease</option></select></label>
      <Field label="Sale price" v={p.price} on={f('price')} /><Field label="Lease rate" v={p.leaseRate} on={f('leaseRate')} />
      <Field label="Building SF" v={p.buildingSf} on={f('buildingSf')} /><Field label="Lot (acres)" v={p.lotAcres} on={f('lotAcres')} /><Field label="Year built" v={p.yearBuilt} on={f('yearBuilt')} />
      <Field label="Zoning" v={p.zoning} on={f('zoning')} /><Field label="Parking" v={p.parking} on={f('parking')} />
      <Field label="Description" v={p.description} on={f('description')} area wide /><Field label="Highlights (one per line)" v={p.highlights} on={f('highlights')} area wide />
    </div></section>
    <section className="card"><h2>Location & demographics <small>filled by lookup, editable</small></h2><div className="grid">
      <Field label="Latitude" v={p.lat} on={f('lat')} /><Field label="Longitude" v={p.lon} on={f('lon')} /><Field label="County" v={p.county} on={f('county')} /><Field label="Census tract" v={p.tract} on={f('tract')} />
      <Field label="Flood zone" v={p.floodZone} on={f('floodZone')} /><Field label="Population (tract)" v={p.population} on={f('population')} /><Field label="Median HH income" v={p.medianIncome} on={f('medianIncome')} /><Field label="Median age" v={p.medianAge} on={f('medianAge')} />
    </div>
      <div className="row">
        {['14', '16', '17'].map(z => <button key={z} disabled={!p.lat} onClick={async () => { const img = await staticMap(+p.lat, +p.lon, +z); setP(x => ({ ...x, mapImg: img })); }}>Map zoom {z}</button>)}
        {p.mapImg && <img src={p.mapImg} className="mapthumb" />}</div></section>
    <section className="card"><h2>Broker</h2><div className="grid">
      <Field label="Name" v={p.brokerName} on={f('brokerName')} /><Field label="Title" v={p.brokerTitle} on={f('brokerTitle')} /><Field label="Phone" v={p.brokerPhone} on={f('brokerPhone')} /><Field label="Email" v={p.brokerEmail} on={f('brokerEmail')} />
    </div></section>
    <section className="card"><h2>Photos <small>first photo = hero; reorder with arrows</small></h2>
      <input type="file" accept="image/*" multiple onChange={e => addPhotos(e.target.files)} />
      <div className="photos">{p.photos.map((ph, i) => <div key={i} className="ph"><img src={ph} /><div>
        <button onClick={() => movePhoto(i, -1)}>◀</button><button onClick={() => movePhoto(i, 1)}>▶</button>
        <button onClick={() => setP(x => ({ ...x, photos: x.photos.filter((_, j) => j !== i) }))}>✕</button></div></div>)}</div></section>
    <div className="row end"><button onClick={() => confirm('Reset property to sample data?') && setP(() => emptyProperty)}>Reset sample</button><button className="primary" onClick={onNext}>Next: design →</button></div>
  </div>;
}

function BrandForm({ b, setB }: { b: Brand; setB: (f: (x: Brand) => Brand) => void }) {
  const f = (k: keyof Brand) => (s: string) => setB(x => ({ ...x, [k]: s }));
  return <div className="page-form"><section className="card"><h2>Branding</h2><div className="grid">
    <Field label="Company" v={b.company} on={f('company')} /><Field label="Tagline" v={b.tagline} on={f('tagline')} /><Field label="Website" v={b.website} on={f('website')} />
    {(['primary', 'accent', 'dark'] as const).map(k => <label key={k} className="field"><span>{k} color</span><input type="color" value={b[k]} onChange={e => f(k)(e.target.value)} /></label>)}
    <label className="field"><span>Font</span><select value={b.font} onChange={e => f('font')(e.target.value)}>
      {['Helvetica, Arial, sans-serif', 'Georgia, serif', '"Trebuchet MS", sans-serif', 'Verdana, sans-serif', '"Times New Roman", serif'].map(o => <option key={o} value={o}>{o.split(',')[0].replace(/"/g, '')}</option>)}</select></label>
    <label className="field wide"><span>Logo (PNG with transparency works best)</span><input type="file" accept="image/*" onChange={async e => { const fl = e.target.files?.[0]; if (fl) { const d = await fileToDataUrl(fl, 800); setB(x => ({ ...x, logo: d })); } }} /></label>
    {b.logo && <div className="logoprev" style={{ background: b.primary }}><img src={b.logo} /><button onClick={() => f('logo')('')}>Remove</button></div>}
  </div></section>
  <section className="card"><h2>Data settings</h2><div className="grid">
    <Field label="Census API key (free, for ACS demographics)" v={b.censusKey} on={f('censusKey')} wide />
  </div><p className="muted">Get a free key at <a href="https://api.census.gov/data/key_signup.html" target="_blank">api.census.gov/data/key_signup.html</a>. Stored only in this browser.</p></section></div>;
}

type Drag = { id: string; mode: 'move' | 'resize'; sx: number; sy: number; o: El; page: number };
function Design({ p, b, docs, setDocs, doc, setDocId, newDoc }: { p: Property; b: Brand; docs: Doc[]; setDocs: (d: Doc[]) => void; doc: Doc | null; setDocId: (s: string | null) => void; newDoc: (t: string) => void }) {
  const [sel, setSel] = useState<{ page: number; id: string } | null>(null);
  const [zoom, setZoom] = useState(0.75); const [snap, setSnap] = useState(true); const [busy, setBusy] = useState('');
  const hist = useRef<{ past: El[][][]; future: El[][][] }>({ past: [], future: [] });
  const drag = useRef<Drag | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setPages = (pages: El[][], record = true) => { if (!doc) return; if (record) { hist.current.past.push(doc.pages); hist.current.future = []; if (hist.current.past.length > 100) hist.current.past.shift(); }
    setDocs(docs.map(d => d.id === doc.id ? { ...d, pages, updated: Date.now() } : d)); };
  const updEl = (patch: Partial<El>, record = true) => { if (!doc || !sel) return; setPages(doc.pages.map((pg, i) => i !== sel.page ? pg : pg.map(e => e.id === sel.id ? { ...e, ...patch } : e)), record); };
  const selEl = doc && sel ? doc.pages[sel.page]?.find(e => e.id === sel.id) : undefined;
  const undo = () => { const h = hist.current; if (!doc || !h.past.length) return; h.future.push(doc.pages); setPages(h.past.pop()!, false); };
  const redo = () => { const h = hist.current; if (!doc || !h.future.length) return; h.past.push(doc.pages); setPages(h.future.pop()!, false); };
  const g = (v: number) => snap ? Math.round(v / 8) * 8 : Math.round(v);
  useEffect(() => {
    const mv = (ev: PointerEvent) => { const d = drag.current; if (!d || !doc) return; const dx = (ev.clientX - d.sx) / zoom, dy = (ev.clientY - d.sy) / zoom;
      const patch = d.mode === 'move' ? { x: g(d.o.x + dx), y: g(d.o.y + dy) } : { w: Math.max(10, g(d.o.w + dx)), h: Math.max(10, g(d.o.h + dy)) };
      setDocs(docs.map(x => x.id === doc.id ? { ...x, pages: x.pages.map((pg, i) => i !== d.page ? pg : pg.map(e => e.id === d.id ? { ...e, ...patch } : e)) } : x)); };
    const up = () => { drag.current = null; };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
  });
  useEffect(() => {
    const kd = (ev: KeyboardEvent) => { const tg = ev.target as HTMLElement; if (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT') return;
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'y') { ev.preventDefault(); redo(); return; }
      if (!selEl) return; const st = ev.shiftKey ? 10 : 1;
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); del(); }
      const mv: Record<string, [number, number]> = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] };
      if (mv[ev.key]) { ev.preventDefault(); updEl({ x: selEl.x + mv[ev.key][0], y: selEl.y + mv[ev.key][1] }); }
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'd') { ev.preventDefault(); dup(); } };
    window.addEventListener('keydown', kd); return () => window.removeEventListener('keydown', kd);
  });
  const add = (e: Omit<El, 'id' | 'x' | 'y'>) => { if (!doc) return; const pg = sel?.page ?? 0; const n: El = { ...e, id: uid(), x: 300, y: 400 } as El;
    setPages(doc.pages.map((x, i) => i === pg ? [...x, n] : x)); setSel({ page: pg, id: n.id }); };
  const del = () => { if (!doc || !sel) return; setPages(doc.pages.map((pg, i) => i !== sel.page ? pg : pg.filter(e => e.id !== sel.id))); setSel(null); };
  const dup = () => { if (!doc || !sel || !selEl) return; const n = { ...selEl, id: uid(), x: selEl.x + 16, y: selEl.y + 16 }; setPages(doc.pages.map((pg, i) => i === sel.page ? [...pg, n] : pg)); setSel({ page: sel.page, id: n.id }); };
  const order = (dir: 'front' | 'back' | 'up' | 'down') => { if (!doc || !sel) return; setPages(doc.pages.map((pg, i) => { if (i !== sel.page) return pg; const a = [...pg]; const k = a.findIndex(e => e.id === sel.id); const [it] = a.splice(k, 1);
    const to = dir === 'front' ? a.length : dir === 'back' ? 0 : dir === 'up' ? Math.min(a.length, k + 1) : Math.max(0, k - 1); a.splice(to, 0, it); return a; })); };
  const align = (how: 'cx' | 'l' | 'r') => selEl && updEl({ x: how === 'cx' ? Math.round((PAGE_W - selEl.w) / 2) : how === 'l' ? 40 : PAGE_W - 40 - selEl.w });
  const doExport = async (kind: 'pdf' | 'png') => { if (!doc) return; const keep = sel; setSel(null); setBusy('Exporting…'); await new Promise(r => setTimeout(r, 80));
    try { await exportPages(pageRefs.current.filter(Boolean).slice(0, doc.pages.length) as HTMLDivElement[], doc.name, kind); } catch (e) { alert('Export failed: ' + (e as Error).message); }
    setBusy(''); setSel(keep); };
  const imgUpload = async (fl: FileList | null, replace: boolean) => { const file = fl?.[0]; if (!file) return; const d = await fileToDataUrl(file);
    if (replace) updEl({ src: d }); else add({ type: 'image', w: 300, h: 200, src: d, fit: 'cover' }); };

  return <div className="design">
    <aside className="left">
      <h3>New from template</h3>
      {TEMPLATES.map(t => <button key={t.id} className="tpl" onClick={() => newDoc(t.id)}><b>{t.name}</b><small>{t.desc}</small></button>)}
      <h3>My documents</h3>
      {docs.length === 0 && <p className="muted">None yet. Pick a template.</p>}
      {docs.map(d => <div key={d.id} className={'docitem' + (doc?.id === d.id ? ' on' : '')} onClick={() => { setDocId(d.id); setSel(null); hist.current = { past: [], future: [] }; }}>
        <span>{d.name}</span><small>{d.pages.length}p · {new Date(d.updated).toLocaleString()}</small>
        <button title="Delete" onClick={ev => { ev.stopPropagation(); if (confirm('Delete ' + d.name + '?')) { setDocs(docs.filter(x => x.id !== d.id)); if (doc?.id === d.id) setDocId(null); } }}>✕</button></div>)}
    </aside>
    <main className="center">
      {!doc ? <div className="empty">Choose a template on the left to start a flyer. Property data and branding fill in automatically.</div> : <>
        <div className="toolbar">
          <input className="docname" value={doc.name} onChange={e => setDocs(docs.map(d => d.id === doc.id ? { ...d, name: e.target.value } : d))} />
          <button title="Add text" onClick={() => add({ type: 'text', w: 300, h: 40, text: 'New text — use {{price}} etc.', fontSize: 18, color: '$dark' })}>T Text</button>
          <button title="Add shape" onClick={() => add({ type: 'rect', w: 200, h: 120, fill: '$accent' })}>▭ Shape</button>
          <label className="btn">🖼 Image<input type="file" accept="image/*" hidden onChange={e => imgUpload(e.target.files, false)} /></label>
          <button onClick={() => add({ type: 'map', w: 320, h: 220, src: 'map' })}>⌖ Map</button>
          <span className="sep" />
          <button onClick={undo} title="Undo (Ctrl+Z)">↶</button><button onClick={redo} title="Redo (Ctrl+Shift+Z)">↷</button>
          <label className="chk"><input type="checkbox" checked={snap} onChange={e => setSnap(e.target.checked)} />Snap</label>
          <select value={zoom} onChange={e => setZoom(+e.target.value)}>{[0.5, 0.6, 0.75, 0.9, 1].map(z => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}</select>
          <span className="sep" />
          <button onClick={() => setPages([...doc.pages, []])}>+ Page</button>
          <span className="grow" />
          {busy && <span className="muted">{busy}</span>}
          <button className="primary" disabled={!!busy} onClick={() => doExport('pdf')}>Export PDF</button>
          <button disabled={!!busy} onClick={() => doExport('png')}>PNG</button>
        </div>
        <div className="pages" onPointerDown={e => { if (e.target === e.currentTarget) setSel(null); }}>
          {doc.pages.map((pg, pi) => <div key={pi} className="pagewrap">
            <div className="pagelabel">Page {pi + 1} of {doc.pages.length} {doc.pages.length > 1 && <button onClick={() => confirm('Delete page ' + (pi + 1) + '?') && setPages(doc.pages.filter((_, i) => i !== pi))}>delete page</button>}</div>
            <div style={{ width: PAGE_W * zoom, height: PAGE_H * zoom }}>
              <div className="sheet" ref={el => { pageRefs.current[pi] = el; }} style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${zoom})`, fontFamily: b.font }}
                onPointerDown={e => { if (e.target === e.currentTarget) setSel(null); }}>
                {pg.map(e => <div key={e.id} className="elhit" style={{ position: 'absolute', left: 0, top: 0 }}
                  onPointerDown={ev => { ev.stopPropagation(); setSel({ page: pi, id: e.id }); if (e.locked) return; hist.current.past.push(doc.pages); hist.current.future = [];
                    drag.current = { id: e.id, mode: 'move', sx: ev.clientX, sy: ev.clientY, o: e, page: pi }; }}>
                  <ElView e={e} p={p} b={b} editing={!busy} /></div>)}
                {sel?.page === pi && selEl && <div className="selbox" style={{ left: selEl.x, top: selEl.y, width: selEl.w, height: selEl.h }}>
                  {!selEl.locked && <div className="handle" onPointerDown={ev => { ev.stopPropagation(); hist.current.past.push(doc.pages); drag.current = { id: selEl.id, mode: 'resize', sx: ev.clientX, sy: ev.clientY, o: selEl, page: pi }; }} />}
                </div>}
              </div></div></div>)}
        </div></>}
    </main>
    <aside className="right">
      {!selEl ? <div className="muted"><h3>Inspector</h3>Click an element to edit it.<br /><br /><b>Shortcuts</b><br />Arrows nudge (Shift = 10px)<br />Del delete · Ctrl+D duplicate<br />Ctrl+Z / Ctrl+Shift+Z undo/redo<br /><br /><b>Data fields</b> (in text)<br />{'{{name}} {{address}} {{city}} {{price}} {{leaseRate}} {{buildingSf}} {{lotAcres}} {{zoning}} {{floodZone}} {{population}} {{medianIncome}} {{brokerName}} {{brokerPhone}} {{company}}'}<br />Filters: {'{{highlights|bullets}} {{propType|upper}}'}</div> : <>
        <h3>{selEl.type.toUpperCase()}</h3>
        <div className="xywh">{(['x', 'y', 'w', 'h'] as const).map(k => <label key={k}>{k}<input type="number" value={selEl[k]} onChange={e => updEl({ [k]: +e.target.value })} /></label>)}</div>
        {selEl.type === 'text' && <>
          <label className="field"><span>Text (supports {'{{fields}}'})</span><textarea rows={5} value={selEl.text} onChange={e => updEl({ text: e.target.value })} /></label>
          <div className="row"><label>Size<input type="number" value={selEl.fontSize} onChange={e => updEl({ fontSize: +e.target.value })} style={{ width: 60 }} /></label>
            <button className={selEl.bold ? 'on' : ''} onClick={() => updEl({ bold: !selEl.bold })}><b>B</b></button>
            <button className={selEl.italic ? 'on' : ''} onClick={() => updEl({ italic: !selEl.italic })}><i>I</i></button>
            {(['left', 'center', 'right'] as const).map(a => <button key={a} className={selEl.align === a ? 'on' : ''} onClick={() => updEl({ align: a })}>{a[0].toUpperCase()}</button>)}</div>
          <ColorPick label="Text color" v={selEl.color} b={b} on={c => updEl({ color: c })} />
          <ColorPick label="Background" v={selEl.fill} b={b} on={c => updEl({ fill: c })} allowNone />
        </>}
        {selEl.type === 'rect' && <ColorPick label="Fill" v={selEl.fill} b={b} on={c => updEl({ fill: c })} />}
        {(selEl.type === 'image' || selEl.type === 'map') && <>
          {selEl.type === 'image' && <label className="field"><span>Source</span><select value={selEl.src?.startsWith('data:') ? 'custom' : selEl.src} onChange={e => e.target.value !== 'custom' && updEl({ src: e.target.value })}>
            <option value="logo">Brand logo</option>{Array.from({ length: Math.max(6, p.photos.length) }, (_, i) => <option key={i} value={'photo:' + i}>Property photo #{i + 1}</option>)}<option value="map">Location map</option><option value="custom">Custom upload</option></select></label>}
          <label className="btn">Replace with upload…<input type="file" accept="image/*" hidden onChange={e => imgUpload(e.target.files, true)} /></label>
          <div className="row">{(['cover', 'contain'] as const).map(f => <button key={f} className={(selEl.fit || 'cover') === f ? 'on' : ''} onClick={() => updEl({ fit: f })}>{f}</button>)}</div>
        </>}
        <label className="field"><span>Opacity {Math.round((selEl.opacity ?? 1) * 100)}%</span><input type="range" min={0} max={1} step={0.05} value={selEl.opacity ?? 1} onChange={e => updEl({ opacity: +e.target.value })} /></label>
        <label className="field"><span>Corner radius</span><input type="range" min={0} max={80} value={selEl.radius ?? 0} onChange={e => updEl({ radius: +e.target.value })} /></label>
        <h4>Arrange</h4>
        <div className="row wrap"><button onClick={() => order('front')}>Front</button><button onClick={() => order('up')}>Fwd</button><button onClick={() => order('down')}>Back</button><button onClick={() => order('back')}>Bottom</button></div>
        <div className="row wrap"><button onClick={() => align('l')}>Align L</button><button onClick={() => align('cx')}>Center</button><button onClick={() => align('r')}>Align R</button></div>
        <div className="row wrap"><button onClick={dup}>Duplicate</button><button className={selEl.locked ? 'on' : ''} onClick={() => updEl({ locked: !selEl.locked })}>{selEl.locked ? 'Unlock' : 'Lock'}</button><button className="danger" onClick={del}>Delete</button></div>
        <h4>Layers (page {sel!.page + 1})</h4>
        <div className="layers">{[...doc!.pages[sel!.page]].reverse().map(e => <div key={e.id} className={e.id === sel!.id ? 'on' : ''} onClick={() => setSel({ page: sel!.page, id: e.id })}>
          {e.type === 'text' ? 'T ' + (e.text || '').slice(0, 24) : e.type === 'image' ? '🖼 ' + (e.src?.startsWith('data:') ? 'upload' : e.src) : e.type === 'map' ? '⌖ map' : '▭ shape'}{e.locked ? ' 🔒' : ''}</div>)}</div>
      </>}
    </aside>
  </div>;
}
function ColorPick({ label, v, b, on, allowNone }: { label: string; v?: string; b: Brand; on: (c: string | undefined) => void; allowNone?: boolean }) {
  const cur = v === '$primary' ? b.primary : v === '$accent' ? b.accent : v === '$dark' ? b.dark : v || '#ffffff';
  return <div className="field"><span>{label}</span><div className="row">
    {(['$primary', '$accent', '$dark'] as const).map(t => <button key={t} title={'Brand ' + t.slice(1)} className={'sw' + (v === t ? ' on' : '')} style={{ background: t === '$primary' ? b.primary : t === '$accent' ? b.accent : b.dark }} onClick={() => on(t)} />)}
    <button className={'sw' + (v === '#ffffff' ? ' on' : '')} style={{ background: '#fff' }} onClick={() => on('#ffffff')} />
    <input type="color" value={cur.length === 7 ? cur : '#ffffff'} onChange={e => on(e.target.value)} />
    {allowNone && <button onClick={() => on(undefined)}>none</button>}</div></div>;
}
