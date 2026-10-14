import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Align, Brand, Doc, El, ImageEl, Property, TableEl, TextEl } from './types';
import { SIZES } from './types';
import { SvgPage } from './SvgPage';
import { PAGES, fitEls, makePage, sizeOf } from './templates';
import { uid, download, fileToDataUrl } from './store';
import { exportPdf, renderPng, safeName } from './pdf';
import { ColorPick, Num } from './ui';
import { FONT_NAMES, FONTS, pickWeight } from './fonts';
import { fontOf } from './compile';
import { ICONS } from './icons';

type Sel = { page: number; id: string } | null;
type Drag = { mode: 'move' | 'resize' | 'rotate'; hx: number; hy: number; sx: number; sy: number; o: El; page: number; snapshot: Doc['pages'] };
type Guide = { x?: number; y?: number };
const HANDLES: [number, number][] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
const TOKENS = ['name', 'fullAddress', 'address', 'cityStateZip', 'forLabel', 'price', 'leaseRate', 'leaseType', 'priceOrRate', 'availableSf', 'buildingSf', 'lotAcres', 'yearBuilt', 'zoning', 'parking', 'clearHeight', 'traffic', 'capRate', 'noi', 'description', 'locationDescription', 'highlights|bullets', 'county', 'floodZone', 'population', 'medianIncome', 'broker1Name', 'broker1Phone', 'broker1Email', 'company', 'website', 'disclaimer'];

export function Editor(props: {
  doc: Doc | null; docs: Doc[]; setDoc: (d: Doc) => void; props: Property[]; b: Brand; openDoc: (id: string) => void; newDocFromGallery: () => void; deleteDoc: (id: string) => void; dupDoc: (d: Doc) => void }) {
  const { doc, docs, openDoc, deleteDoc, newDocFromGallery } = props;
  if (!doc) return <div className="design"><aside className="left"><DocList docs={docs} cur={null} openDoc={openDoc} deleteDoc={deleteDoc} /></aside>
    <main className="center"><div className="empty">No document open. <button className="primary" onClick={newDocFromGallery}>Open the template gallery</button></div></main><aside className="right" /></div>;
  return <DocEditor key={doc.id} {...props} doc={doc} />;
}
function DocEditor({ doc, docs, setDoc, props, b, openDoc, newDocFromGallery, deleteDoc, dupDoc }: {
  doc: Doc; docs: Doc[]; setDoc: (d: Doc) => void; props: Property[]; b: Brand; openDoc: (id: string) => void; newDocFromGallery: () => void; deleteDoc: (id: string) => void; dupDoc: (d: Doc) => void }) {
  const [sel, setSel] = useState<Sel>(null); const [zoom, setZoom] = useState(0.8); const [snap, setSnap] = useState(true);
  const [guides, setGuides] = useState<Guide[]>([]); const [busy, setBusy] = useState(''); const [editing, setEditing] = useState<string | null>(null);
  const [overflow, setOverflow] = useState<Record<number, string[]>>({}); const [lib, setLib] = useState(false);
  const hist = useRef<{ past: Doc['pages'][]; future: Doc['pages'][] }>({ past: [], future: [] });
  const drag = useRef<Drag | null>(null); const clip = useRef<El | null>(null); const centerRef = useRef<HTMLDivElement>(null);
  const svgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const p = props.find(x => x.id === doc?.propertyId) || props[0];
  useEffect(() => { setSel(null); hist.current = { past: [], future: [] }; }, [doc?.id]);
  const fit = () => { if (!doc || !centerRef.current) return; setZoom(Math.min(1.5, Math.max(0.2, (centerRef.current.clientWidth - 80) / doc.size.w))); };
  useLayoutEffect(fit, [doc?.id, doc?.size.id]); // eslint-disable-line
  const W = doc.size.w, H = doc.size.h;
  const commit = (pages: Doc['pages'], record = true) => { if (record) { hist.current.past.push(doc.pages); hist.current.future = []; if (hist.current.past.length > 150) hist.current.past.shift(); } setDoc({ ...doc, pages, updated: Date.now() }); };
  const selEl = sel ? doc.pages[sel.page]?.els.find(e => e.id === sel.id) : undefined;
  const upd = (patch: Partial<El>, record = true) => { if (!sel) return; commit(doc.pages.map((pg, i) => i !== sel.page ? pg : { els: pg.els.map(e => e.id === sel.id ? { ...e, ...patch } as El : e) }), record); };
  const undo = () => { const h = hist.current; if (!h.past.length) return; h.future.push(doc.pages); setDoc({ ...doc, pages: h.past.pop()! }); };
  const redo = () => { const h = hist.current; if (!h.future.length) return; h.past.push(doc.pages); setDoc({ ...doc, pages: h.future.pop()! }); };
  const add = (e: Partial<El> & { type: El['type'] }) => { const pg = sel?.page ?? 0; const n = { x: W / 2 - 150, y: H / 2 - 60, w: 300, h: 120, ...e, id: uid() } as El; commit(doc.pages.map((x, i) => i === pg ? { els: [...x.els, n] } : x)); setSel({ page: pg, id: n.id }); };
  const del = () => { if (!sel) return; commit(doc.pages.map((pg, i) => i !== sel.page ? pg : { els: pg.els.filter(e => e.id !== sel.id) })); setSel(null); };
  const dup = (src = selEl, page = sel?.page ?? 0) => { if (!src) return; const n = { ...src, id: uid(), x: src.x + 16, y: src.y + 16 } as El; commit(doc.pages.map((pg, i) => i === page ? { els: [...pg.els, n] } : pg)); setSel({ page, id: n.id }); };
  const order = (dir: 'front' | 'back' | 'up' | 'down') => { if (!sel) return; commit(doc.pages.map((pg, i) => { if (i !== sel.page) return pg; const a = [...pg.els]; const k = a.findIndex(e => e.id === sel.id); const [it] = a.splice(k, 1);
    a.splice(dir === 'front' ? a.length : dir === 'back' ? 0 : dir === 'up' ? Math.min(a.length, k + 1) : Math.max(0, k - 1), 0, it); return { els: a }; })); };
  const alignTo = (how: 'l' | 'cx' | 'r' | 't' | 'cy' | 'b') => selEl && upd(how === 'l' ? { x: 35 } : how === 'cx' ? { x: Math.round((W - selEl.w) / 2) } : how === 'r' ? { x: W - 35 - selEl.w } : how === 't' ? { y: 35 } : how === 'cy' ? { y: Math.round((H - selEl.h) / 2) } : { y: H - 35 - selEl.h });

  // ---- pointer interaction ----
  const startDrag = (ev: React.PointerEvent, mode: Drag['mode'], page: number, el: El, hx = 0, hy = 0) => {
    ev.stopPropagation(); ev.preventDefault(); setSel({ page, id: el.id }); if (el.locked && mode !== 'move') return; if (el.locked) return;
    drag.current = { mode, hx, hy, sx: ev.clientX, sy: ev.clientY, o: el, page, snapshot: doc.pages };
  };
  useEffect(() => {
    const mv = (ev: PointerEvent) => {
      const d = drag.current; if (!d) return; const o = d.o; const dx = (ev.clientX - d.sx) / zoom, dy = (ev.clientY - d.sy) / zoom;
      let patch: Partial<El> = {}; const gs: Guide[] = [];
      if (d.mode === 'move') {
        let nx = o.x + dx, ny = o.y + dy;
        if (snap && !o.rot && !ev.altKey) {
          const others = doc.pages[d.page].els.filter(e => e.id !== o.id && !e.rot);
          const xs = [0, W / 2, W, 35, W - 35, ...others.flatMap(e => [e.x, e.x + e.w / 2, e.x + e.w])], ys = [0, H / 2, H, 35, H - 35, ...others.flatMap(e => [e.y, e.y + e.h / 2, e.y + e.h])];
          const th = 6 / zoom; const sx = best([nx, nx + o.w / 2, nx + o.w], xs, th), sy = best([ny, ny + o.h / 2, ny + o.h], ys, th);
          if (sx) { nx += sx.d; gs.push({ x: sx.v }); } else nx = Math.round(nx); if (sy) { ny += sy.d; gs.push({ y: sy.v }); } else ny = Math.round(ny);
        }
        if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) ny = o.y; else nx = o.x; }
        patch = { x: nx, y: ny };
      } else if (d.mode === 'resize') {
        const t = (o.rot || 0) * Math.PI / 180; const lx = dx * Math.cos(t) + dy * Math.sin(t), ly = -dx * Math.sin(t) + dy * Math.cos(t);
        let nw = Math.max(8, o.w + d.hx * lx), nh = Math.max(8, o.h + d.hy * ly);
        if (ev.shiftKey && d.hx && d.hy) { const r = o.w / o.h; if (nw / nh > r) nh = nw / r; else nw = nh * r; }
        if (snap && !o.rot) { const g = (v: number) => Math.round(v); nw = g(nw); nh = g(nh); }
        const cdx = d.hx * (nw - o.w) / 2, cdy = d.hy * (nh - o.h) / 2; const ccx = o.x + o.w / 2 + cdx * Math.cos(t) - cdy * Math.sin(t), ccy = o.y + o.h / 2 + cdx * Math.sin(t) + cdy * Math.cos(t);
        patch = { x: ccx - nw / 2, y: ccy - nh / 2, w: nw, h: nh };
      } else {
        const host = svgRefs.current[d.page]!.getBoundingClientRect(); const cx = host.left + (o.x + o.w / 2) * zoom, cy = host.top + (o.y + o.h / 2) * zoom;
        let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90; if (ev.shiftKey || snap) a = Math.round(a / (ev.shiftKey ? 15 : 1)) * (ev.shiftKey ? 15 : 1);
        a = ((a % 360) + 360) % 360; if (snap && (a < 3 || a > 357)) a = 0; patch = { rot: a };
      }
      setGuides(gs);
      setDoc({ ...doc, pages: doc.pages.map((pg, i) => i !== d.page ? pg : { els: pg.els.map(e => e.id === o.id ? { ...e, ...patch } as El : e) }) });
    };
    const up = () => { const d = drag.current; if (d) { hist.current.past.push(d.snapshot); hist.current.future = []; } drag.current = null; setGuides([]); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
  });
  useEffect(() => {
    const kd = (ev: KeyboardEvent) => {
      const tg = ev.target as HTMLElement; if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tg.tagName)) return;
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
      if (mod && ev.key.toLowerCase() === 'y') { ev.preventDefault(); redo(); return; }
      if (mod && ev.key.toLowerCase() === 'v' && clip.current) { ev.preventDefault(); dup(clip.current, sel?.page ?? 0); return; }
      if (!selEl) return; const st = ev.shiftKey ? 10 : 1;
      if (ev.key === 'Escape') setSel(null);
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); del(); }
      const mvk: Record<string, [number, number]> = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] };
      if (mvk[ev.key]) { ev.preventDefault(); upd({ x: selEl.x + mvk[ev.key][0], y: selEl.y + mvk[ev.key][1] }); }
      if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); dup(); }
      if (mod && ev.key.toLowerCase() === 'c') { clip.current = selEl; }
      if (ev.key === 'Enter' && selEl.type === 'text') { ev.preventDefault(); setEditing(selEl.id); }
    };
    window.addEventListener('keydown', kd); return () => window.removeEventListener('keydown', kd);
  });

  const doExport = async (kind: 'pdf' | 'png' | 'png-all') => {
    setBusy('Exporting…'); try {
      if (kind === 'pdf') await exportPdf(doc, p, b);
      else { const idx = kind === 'png' ? [sel?.page ?? 0] : doc.pages.map((_, i) => i);
        for (const i of idx) { const url = await renderPng(doc.pages[i].els, p, b, W, H, W > 1100 ? 1.5 : 2); download(await (await fetch(url)).blob(), `${safeName(doc.name)}${doc.pages.length > 1 ? '_p' + (i + 1) : ''}.png`); } }
    } catch (e) { alert('Export failed: ' + (e as Error).message); console.error(e); } setBusy('');
  };
  const resize = (sid: string) => { const to = SIZES.find(s => s.id === sid)!; hist.current.past.push(doc.pages); setDoc({ ...doc, size: to, pages: doc.pages.map(pg => ({ els: fitEls(pg.els, doc.size, to) })), updated: Date.now() }); };
  const imgUpload = async (fl: FileList | null) => { const file = fl?.[0]; if (!file) return; const d = await fileToDataUrl(file); if (selEl?.type === 'image') upd({ src: d }); else add({ type: 'image', src: d, fit: 'cover', w: 320, h: 220 } as Partial<ImageEl> & { type: 'image' }); };
  const ovIds = new Set(Object.values(overflow).flat());

  return <div className="design">
    <aside className="left">
      <button className="primary wide" onClick={newDocFromGallery}>+ New from template</button>
      <DocList docs={docs} cur={doc.id} openDoc={openDoc} deleteDoc={deleteDoc} />
      <h3>Page library</h3><p className="muted">Insert any page layout into this document (auto-fit to its size).</p>
      <button className="wide" onClick={() => setLib(!lib)}>{lib ? 'Hide' : 'Show'} page library</button>
      {lib && <div className="plib">{PAGES.map(pd => <div key={pd.id} className="plib-item" title={pd.name} onClick={() => commit([...doc.pages, makePage(pd.id, doc.size)])}>
        <SvgPage els={fitEls(pd.make(), sizeOf(pd.size), doc.size)} p={p} b={b} w={W} h={H} scale={96 / Math.max(W, H)} editing={false} /><small>{pd.name}</small></div>)}</div>}
    </aside>
    <main className="center" ref={centerRef}>
      <div className="toolbar">
        <input className="docname" value={doc.name} onChange={e => setDoc({ ...doc, name: e.target.value })} />
        <select title="Property record" value={doc.propertyId} onChange={e => setDoc({ ...doc, propertyId: e.target.value })}>{props.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select title="Page size" value={doc.size.id} onChange={e => resize(e.target.value)}>{SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        <span className="sep" />
        <button title="Text" onClick={() => add({ type: 'text', text: 'Double-click to edit', size: 20, font: '$body', color: '$dark', h: 60 } as Partial<TextEl> & { type: 'text' })}>T</button>
        <button title="Shape" onClick={() => add({ type: 'rect', fill: '$primary' })}>▭</button>
        <label className="btn" title="Image">🖼<input type="file" accept="image/*" hidden onChange={e => { imgUpload(e.target.files); e.target.value = ''; }} /></label>
        <button title="Map" onClick={() => add({ type: 'image', src: 'map', fit: 'cover', w: 360, h: 240 } as Partial<ImageEl> & { type: 'image' })}>⌖</button>
        <button title="Table" onClick={() => add({ type: 'table', rows: 'Price:|{{price}}\nSize:|{{buildingSf}}\nZoning:|{{zoning}}', cols: [1, 1], aligns: ['left', 'right'], size: 12, rowH: 27, font: '$body', color: '$dark', labelColor: '$secondary', labelWeight: 800, rule: '$light', skipEmpty: true, w: 365, h: 90 } as Partial<TableEl> & { type: 'table' })}>▦</button>
        <span className="sep" />
        <button onClick={undo} title="Undo (Ctrl+Z)">↶</button><button onClick={redo} title="Redo (Ctrl+Shift+Z)">↷</button>
        <label className="chk" title="Smart guides & snapping (hold Alt to bypass)"><input type="checkbox" checked={snap} onChange={e => setSnap(e.target.checked)} />Snap</label>
        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>−</button><span className="zoomv">{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button><button onClick={fit}>Fit</button>
        <span className="grow" />{busy && <span className="muted">{busy}</span>}
        <button onClick={() => dupDoc(doc)}>Duplicate</button>
        <button className="primary" disabled={!!busy} onClick={() => doExport('pdf')}>Export PDF</button>
        <button disabled={!!busy} onClick={() => doExport('png-all')} title="PNG of every page">PNG</button>
      </div>
      {ovIds.size > 0 && <div className="warn">⚠ {ovIds.size} text box(es) overflow — outlined in red. Enlarge them, shorten text or turn on Auto-fit.</div>}
      <div className="pages" onPointerDown={e => { if (e.target === e.currentTarget) { setSel(null); setEditing(null); } }}>
        {doc.pages.map((pg, pi) => <div key={pi} className="pagewrap">
          <div className="pagelabel">Page {pi + 1} / {doc.pages.length}
            <button className="sm" disabled={pi === 0} onClick={() => { const a = [...doc.pages]; [a[pi - 1], a[pi]] = [a[pi], a[pi - 1]]; commit(a); }}>↑</button>
            <button className="sm" disabled={pi === doc.pages.length - 1} onClick={() => { const a = [...doc.pages]; [a[pi + 1], a[pi]] = [a[pi], a[pi + 1]]; commit(a); }}>↓</button>
            <button className="sm" onClick={() => { const a = [...doc.pages]; a.splice(pi + 1, 0, { els: pg.els.map(e => ({ ...e, id: uid() })) }); commit(a); }}>duplicate</button>
            <button className="sm" onClick={() => commit([...doc.pages.slice(0, pi + 1), { els: [] }, ...doc.pages.slice(pi + 1)])}>+ blank</button>
            {doc.pages.length > 1 && <button className="sm danger" onClick={() => confirm('Delete page ' + (pi + 1) + '?') && commit(doc.pages.filter((_, i) => i !== pi))}>delete</button>}</div>
          <div className="sheet" ref={el => { svgRefs.current[pi] = el; }} style={{ width: W * zoom, height: H * zoom }}>
            <div className="export-wrap"><SvgPage els={pg.els} p={p} b={b} w={W} h={H} scale={zoom} editing={true} onOverflow={ids => setOverflow(o => (o[pi] || []).join() === ids.join() ? o : { ...o, [pi]: ids })} /></div>
            <div className="overlay" style={{ width: W, height: H, transform: `scale(${zoom})` }} onPointerDown={e => { if (e.target === e.currentTarget) { setSel(null); setEditing(null); } }}>
              {pg.els.map(e => <div key={e.id} className={'hit' + (ovIds.has(e.id) ? ' over' : '') + (e.locked ? ' locked' : '')} style={box(e)}
                onPointerDown={ev => { if (editing === e.id) return; startDrag(ev, 'move', pi, e); }}
                onDoubleClick={() => { if (e.type === 'text') setEditing(e.id); }} />)}
              {sel?.page === pi && selEl && editing !== selEl.id && <div className="selbox" style={{ ...box(selEl), outlineWidth: 2 / zoom }}>
                {!selEl.locked && HANDLES.map(([hx, hy]) => <div key={hx + ',' + hy} className="handle" style={{ left: `${(hx + 1) * 50}%`, top: `${(hy + 1) * 50}%`, width: 12 / zoom, height: 12 / zoom, borderWidth: 2 / zoom, cursor: cursorFor(hx, hy, selEl.rot || 0) }}
                  onPointerDown={ev => startDrag(ev, 'resize', pi, selEl, hx, hy)} />)}
                {!selEl.locked && <div className="rothandle" style={{ width: 14 / zoom, height: 14 / zoom, top: -34 / zoom, borderWidth: 2 / zoom }} onPointerDown={ev => startDrag(ev, 'rotate', pi, selEl)} title="Rotate (Shift = 15°)" />}
              </div>}
              {sel?.page === pi && selEl?.type === 'text' && editing === selEl.id && <InlineText el={selEl} b={b} onDone={t => { setEditing(null); if (t !== selEl.text) upd({ text: t }); }} />}
              {guides.map((g, i) => g.x !== undefined ? <div key={i} className="guide v" style={{ left: g.x, width: 1 / zoom }} /> : <div key={i} className="guide h" style={{ top: g.y, height: 1 / zoom }} />)}
            </div>
          </div></div>)}
        <button className="addpage" onClick={() => setLib(true)}>+ Add page from library</button>
      </div>
    </main>
    <aside className="right">
      {!selEl ? <Help /> : <Inspector el={selEl} b={b} p={p} upd={upd} del={del} dup={() => dup()} order={order} alignTo={alignTo} imgUpload={imgUpload} edit={() => setEditing(selEl.id)} />}
      {sel && <><h4>Layers · page {sel.page + 1}</h4><div className="layers">{[...doc.pages[sel.page].els].reverse().map(e => <div key={e.id} className={e.id === sel.id ? 'on' : ''} onClick={() => setSel({ page: sel.page, id: e.id })}>
        {icon(e)} {e.name || label(e)}{e.locked ? ' 🔒' : ''}</div>)}</div></>}
    </aside>
  </div>;
}
function best(cands: number[], lines: number[], th: number) {
  let r: { d: number; v: number } | null = null;
  for (const c of cands) for (const l of lines) { const d = l - c; if (Math.abs(d) <= th && (!r || Math.abs(d) < Math.abs(r.d))) r = { d, v: l }; }
  return r;
}
const box = (e: El): React.CSSProperties => ({ left: e.x, top: e.y, width: e.w, height: e.h, transform: e.rot ? `rotate(${e.rot}deg)` : undefined });
const cursorFor = (hx: number, hy: number, rot: number) => { const a = ((Math.atan2(hy, hx) * 180 / Math.PI + rot) % 180 + 180) % 180; return a < 22.5 || a > 157.5 ? 'ew-resize' : a < 67.5 ? 'nwse-resize' : a < 112.5 ? 'ns-resize' : 'nesw-resize'; };
const icon = (e: El) => e.type === 'text' ? 'T' : e.type === 'image' ? (e.src === 'map' ? '⌖' : '🖼') : e.type === 'table' ? '▦' : '▭';
const label = (e: El) => e.type === 'text' ? e.text.slice(0, 26) : e.type === 'image' ? (e.src.startsWith('data:') ? 'uploaded image' : e.src) : e.type === 'table' ? 'table' : 'shape';
function InlineText({ el, b, onDone }: { el: TextEl; b: Brand; onDone: (t: string) => void }) {
  const [v, setV] = useState(el.text); const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const font = fontOf(el.font, b);
  return <textarea ref={ref} className="inline-edit" value={v} onChange={e => setV(e.target.value)} onBlur={() => onDone(v)} onPointerDown={e => e.stopPropagation()}
    onKeyDown={e => { if (e.key === 'Escape') onDone(el.text); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onDone(v); e.stopPropagation(); }}
    style={{ ...box(el), minHeight: el.h, fontFamily: `"${font}"`, fontWeight: pickWeight(font, el.weight), fontSize: Math.min(el.size, 40), lineHeight: el.lh ?? 1.25, textAlign: el.align === 'justify' ? 'left' : el.align }} />;
}
function DocList({ docs, cur, openDoc, deleteDoc }: { docs: Doc[]; cur: string | null; openDoc: (id: string) => void; deleteDoc: (id: string) => void }) {
  return <><h3>My documents</h3>{docs.length === 0 && <p className="muted">None yet.</p>}
    {docs.map(d => <div key={d.id} className={'docitem' + (cur === d.id ? ' on' : '')} onClick={() => openDoc(d.id)}><span>{d.name}</span><small>{d.size.label.split(' ')[0]} · {d.pages.length}p · {new Date(d.updated).toLocaleDateString()}</small>
      <button className="x" title="Delete" onClick={ev => { ev.stopPropagation(); if (confirm('Delete ' + d.name + '?')) deleteDoc(d.id); }}>✕</button></div>)}</>;
}
function Help() {
  return <div className="muted help"><h3>Inspector</h3><p>Click an element to edit it. Double-click text to type on the canvas.</p>
    <b>Mouse</b><ul><li>Drag to move · handles resize (Shift = keep ratio)</li><li>Top knob rotates (Shift = 15° steps)</li><li>Guides snap to edges/centers (Alt = no snap)</li></ul>
    <b>Keys</b><ul><li>Arrows nudge (Shift ×10)</li><li>Enter edit text · Esc deselect</li><li>Del delete · Ctrl+D duplicate</li><li>Ctrl+C / Ctrl+V copy/paste (across pages)</li><li>Ctrl+Z / Ctrl+Shift+Z undo/redo</li></ul>
    <b>Live data</b><p>Text with {'{{fields}}'} fills from the property record, e.g. {'{{name}}, {{price}}, {{highlights|bullets}}, {{broker1Phone|pre:O: }}'}.</p></div>;
}
function Inspector({ el, b, p, upd, del, dup, order, alignTo, imgUpload, edit }: { el: El; b: Brand; p: Property; upd: (x: Partial<El>, r?: boolean) => void; del: () => void; dup: () => void; order: (d: 'front' | 'back' | 'up' | 'down') => void; alignTo: (h: 'l' | 'cx' | 'r' | 't' | 'cy' | 'b') => void; imgUpload: (f: FileList | null) => void; edit: () => void }) {
  const u = upd as (x: any) => void;
  return <div className="insp">
    <h3>{el.type === 'image' && el.src === 'map' ? 'Map' : el.type}</h3>
    <div className="row wrap"><Num label="X" v={el.x} on={x => u({ x })} /><Num label="Y" v={el.y} on={y => u({ y })} /><Num label="W" v={el.w} on={w => u({ w: Math.max(4, w) })} /><Num label="H" v={el.h} on={h => u({ h: Math.max(4, h) })} /><Num label="°" v={el.rot || 0} on={rot => u({ rot })} w={52} /></div>
    {el.type === 'text' && <>
      <label className="field"><span>Text <button className="sm" onClick={edit}>edit on canvas</button></span><textarea rows={4} value={el.text} onChange={e => u({ text: e.target.value })} /></label>
      <div className="row"><select value="" onChange={e => { if (e.target.value) u({ text: el.text + `{{${e.target.value}}}` }); }}><option value="">+ insert data field…</option>{TOKENS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div className="row wrap"><select value={el.font || '$body'} onChange={e => u({ font: e.target.value })}><option value="$head">Brand heading ({b.headFont})</option><option value="$body">Brand body ({b.bodyFont})</option>{FONT_NAMES.map(f => <option key={f}>{f}</option>)}</select>
        <select value={pickWeight(fontOf(el.font, b), el.weight)} onChange={e => u({ weight: +e.target.value })}>{(FONTS[fontOf(el.font, b)] || FONTS['Open Sans']).weights.map(w => <option key={w} value={w}>{w}</option>)}</select></div>
      <div className="row wrap"><Num label="Size" v={el.size} step={0.5} on={size => u({ size })} /><Num label="Line" v={el.lh ?? 1.25} step={0.05} on={lh => u({ lh })} /><Num label="Track" v={el.ls ?? 0} on={ls => u({ ls })} /><Num label="Pad" v={el.pad ?? 0} on={pad => u({ pad })} /></div>
      <div className="row wrap">{(['left', 'center', 'right', 'justify'] as Align[]).map(a => <button key={a} className={'sm' + ((el.align || 'left') === a ? ' on' : '')} onClick={() => u({ align: a })}>{a[0].toUpperCase()}</button>)}
        <span className="sep" />{(['top', 'middle', 'bottom'] as const).map(a => <button key={a} className={'sm' + ((el.valign || 'top') === a ? ' on' : '')} onClick={() => u({ valign: a })}>{a === 'top' ? '⤒' : a === 'middle' ? '↕' : '⤓'}</button>)}</div>
      <div className="row wrap"><label className="chk"><input type="checkbox" checked={!!el.autoFit} onChange={e => u({ autoFit: e.target.checked })} />Auto-fit (shrink)</label><label className="chk"><input type="checkbox" checked={!!el.upper} onChange={e => u({ upper: e.target.checked })} />CAPS</label><label className="chk"><input type="checkbox" checked={!!el.italic} onChange={e => u({ italic: e.target.checked })} />Italic</label></div>
      <ColorPick label="Color" v={el.color} b={b} on={c => u({ color: c })} /><ColorPick label="Background" v={el.fill} b={b} on={c => u({ fill: c })} none />
    </>}
    {el.type === 'rect' && <><ColorPick label="Fill" v={el.fill} b={b} on={c => u({ fill: c })} none /><ColorPick label="Border" v={el.stroke} b={b} on={c => u({ stroke: c })} none />
      <div className="row"><Num label="Border px" v={el.sw ?? 0} on={sw => u({ sw })} /><Num label="Radius" v={el.radius ?? 0} on={radius => u({ radius })} /></div></>}
    {el.type === 'image' && <>
      <label className="field"><span>Source</span><select value={el.src.startsWith('data:') ? 'custom' : el.src} onChange={e => e.target.value !== 'custom' && u({ src: e.target.value })}>
        <option value="logo">Brand logo</option><option value="logoLight">Brand logo (on dark)</option><option value="map">Location map</option><option value="aerial">Aerial</option><option value="sitePlan">Site plan</option>
        {Array.from({ length: Math.max(8, p.photos.length) }, (_, i) => <option key={i} value={'photo:' + i}>Property photo #{i + 1}{p.photos[i] ? '' : ' (empty)'}</option>)}
        {ICONS.map(i => <option key={i} value={'icon:' + i}>Icon: {i}</option>)}<option value="custom">Uploaded image</option></select></label>
      <label className="btn sm">Replace with upload…<input type="file" accept="image/*" hidden onChange={e => { imgUpload(e.target.files); e.target.value = ''; }} /></label>
      <div className="row">{(['cover', 'contain'] as const).map(f => <button key={f} className={'sm' + ((el.fit || 'cover') === f ? ' on' : '')} onClick={() => u({ fit: f })}>{f === 'cover' ? 'Fill (crop)' : 'Fit (no crop)'}</button>)}</div>
      <Slider label="Zoom" v={el.zoom ?? 1} min={0.5} max={4} step={0.05} on={zoom => u({ zoom })} />
      <Slider label="Crop focus ←→" v={el.fx ?? 0.5} min={0} max={1} step={0.01} on={fx => u({ fx })} /><Slider label="Crop focus ↑↓" v={el.fy ?? 0.5} min={0} max={1} step={0.01} on={fy => u({ fy })} />
      <div className="row wrap"><Num label="Radius" v={el.radius ?? 0} on={radius => u({ radius })} /><label className="chk"><input type="checkbox" checked={!!el.gray} onChange={e => u({ gray: e.target.checked })} />Grayscale</label></div>
      <ColorPick label="Tint" v={el.tint} b={b} on={c => u({ tint: c, tintAlpha: el.tintAlpha || 0.35 })} none />{el.tint && <Slider label="Tint strength" v={el.tintAlpha ?? 0.35} min={0} max={1} step={0.05} on={tintAlpha => u({ tintAlpha })} />}
      <ColorPick label="Border" v={el.stroke} b={b} on={c => u({ stroke: c, sw: el.sw || 1 })} none />
    </>}
    {el.type === 'table' && <>
      <label className="field"><span>Rows — one per line, cells split by |</span><textarea rows={6} value={el.rows} onChange={e => u({ rows: e.target.value })} /></label>
      <div className="row wrap"><select value={el.source || 'rows'} onChange={e => u({ source: e.target.value })}><option value="rows">Rows above</option><option value="suites">Suites from property</option><option value="comps">Comps from property</option></select>
        <label className="chk"><input type="checkbox" checked={!!el.header} onChange={e => u({ header: e.target.checked })} />Header row</label><label className="chk"><input type="checkbox" checked={!!el.skipEmpty} onChange={e => u({ skipEmpty: e.target.checked })} />Hide empty</label></div>
      <label className="field"><span>Column widths (relative)</span><input value={el.cols.join(', ')} onChange={e => { const cols = e.target.value.split(',').map(x => +x.trim()).filter(x => x > 0); if (cols.length) u({ cols, aligns: cols.map((_, i) => el.aligns[i] || 'left') }); }} /></label>
      <div className="row wrap">{el.cols.map((_, i) => <select key={i} value={el.aligns[i] || 'left'} onChange={e => u({ aligns: el.cols.map((__, j) => j === i ? e.target.value : el.aligns[j] || 'left') })}><option>left</option><option>center</option><option>right</option></select>)}</div>
      <div className="row wrap"><Num label="Size" v={el.size} step={0.5} on={size => u({ size })} /><Num label="Row H" v={el.rowH} on={rowH => u({ rowH })} /></div>
      <ColorPick label="Label color" v={el.labelColor} b={b} on={c => u({ labelColor: c })} /><ColorPick label="Value color" v={el.color} b={b} on={c => u({ color: c })} />
      <ColorPick label="Rule color" v={el.rule} b={b} on={c => u({ rule: c })} none /><ColorPick label="Header fill" v={el.headFill} b={b} on={c => u({ headFill: c })} none /><ColorPick label="Stripe" v={el.zebra} b={b} on={c => u({ zebra: c })} none />
    </>}
    <Slider label="Opacity" v={el.opacity ?? 1} min={0} max={1} step={0.05} on={opacity => u({ opacity })} />
    <label className="field"><span>Show only if field has a value (e.g. {'{{broker3Name}}'})</span><input value={el.showIf || ''} onChange={e => u({ showIf: e.target.value || undefined })} /></label>
    <h4>Arrange</h4>
    <div className="row wrap"><button className="sm" onClick={() => order('front')}>To front</button><button className="sm" onClick={() => order('up')}>Forward</button><button className="sm" onClick={() => order('down')}>Backward</button><button className="sm" onClick={() => order('back')}>To back</button></div>
    <div className="row wrap"><button className="sm" onClick={() => alignTo('l')}>⇤</button><button className="sm" onClick={() => alignTo('cx')}>↔</button><button className="sm" onClick={() => alignTo('r')}>⇥</button><button className="sm" onClick={() => alignTo('t')}>⤒</button><button className="sm" onClick={() => alignTo('cy')}>↕</button><button className="sm" onClick={() => alignTo('b')}>⤓</button><span className="muted">page margins</span></div>
    <div className="row wrap"><button className="sm" onClick={dup}>Duplicate</button><button className={'sm' + (el.locked ? ' on' : '')} onClick={() => u({ locked: !el.locked })}>{el.locked ? 'Unlock' : 'Lock'}</button><button className="sm danger" onClick={del}>Delete</button></div>
  </div>;
}
function Slider({ label, v, min, max, step, on }: { label: string; v: number; min: number; max: number; step: number; on: (n: number) => void }) {
  return <label className="field"><span>{label} <i>{Math.round(v * 100) / 100}</i></span><input type="range" min={min} max={max} step={step} value={v} onChange={e => on(+e.target.value)} /></label>;
}
