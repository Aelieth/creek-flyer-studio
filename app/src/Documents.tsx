import { useState } from 'react';
import type { Brand, Doc, Property } from './types';
import { TEMPLATES, makeDocPages, sizeOf } from './templates';
import type { Template } from './templates';
import { SvgPage } from './SvgPage';
import { buildPdf, safeName } from './pdf';

const orient = (t: Template) => { const s = sizeOf(t.size); return s.w > s.h ? `Landscape ${(s.w / 96).toFixed(s.w % 96 ? 1 : 0)}x${(s.h / 96).toFixed(s.h % 96 ? 1 : 0)}` : `Portrait ${(s.w / 96).toFixed(s.w % 96 ? 1 : 0)}x${(s.h / 96).toFixed(s.h % 96 ? 1 : 0)}`; };
const kb = (d: Doc) => { const n = JSON.stringify(d.pages).length / 1024; return n > 1024 ? (n / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(n)) + ' KB'; };
export const KIND_ORDER = ['Brochure', '1-Page Flyer', 'Flyer', 'Proposal', "Owner's Report", 'Offering Memorandum', 'District Flyer', 'Marketing'];

export function NewDocPicker({ p, b, onClose, create }: { p: Property; b: Brand; onClose: () => void; create: (t: Template) => void }) {
  const [q, setQ] = useState(''); const [kind, setKind] = useState('All');
  const list = TEMPLATES.filter(t => (kind === 'All' || t.kind === kind) && (!q || `${t.name} ${t.kind} ${t.desc} ${orient(t)}`.toLowerCase().includes(q.toLowerCase())));
  return <div className="modal-bg" onClick={onClose}><div className="modal wide-modal" onClick={e => e.stopPropagation()}>
    <div className="row"><h2>New document</h2><span className="muted">for {p.name}</span><span className="grow" /><button onClick={onClose}>Close</button></div>
    <div className="row wrap"><input autoFocus placeholder="Search templates (e.g. brochure, landscape, proposal)…" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1 }} />
      {['All', ...KIND_ORDER].map(k => <button key={k} className={'sm' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>{k}</button>)}</div>
    <div className="pickgrid">{list.map(t => { const s = sizeOf(t.size); const pg = makeDocPages({ ...t, pages: t.pages.slice(0, 1) }, s)[0];
      return <button key={t.id} className="pick" onClick={() => create(t)}><div className="pthumb2"><SvgPage els={pg.els} p={p} b={b} w={s.w} h={s.h} scale={150 / Math.max(s.w, s.h)} editing={false} /></div>
        <b>{t.name}</b><small><span className="tag">{t.kind}</span> <span className="tag alt">{orient(t)}</span></small><small className="muted">{t.desc} · {t.pages.length}p</small></button>; })}
      {!list.length && <p className="muted">No templates match.</p>}</div>
  </div></div>;
}

export function DocumentsPanel({ p, b, docs, open, newDoc, setDoc, dupDoc, purge }: { p: Property; b: Brand; docs: Doc[]; open: (id: string) => void; newDoc: () => void;
  setDoc: (d: Doc) => void; dupDoc: (d: Doc) => void; purge: (id: string) => void; }) {
  const [bin, setBin] = useState(false); const [busy, setBusy] = useState('');
  const mine = docs.filter(d => d.propertyId === p.id); const live = mine.filter(d => !d.deleted), trash = mine.filter(d => d.deleted);
  const pdf = async (d: Doc, how: 'print' | 'download') => { setBusy(d.id); try { const x = await buildPdf(d, p, b);
    if (how === 'download') x.save(safeName(d.name) + '.pdf'); else { x.autoPrint(); const u = URL.createObjectURL(x.output('blob')); const w = window.open(u, '_blank'); if (!w) x.save(safeName(d.name) + '.pdf'); } }
    catch (e) { alert('PDF failed: ' + (e as Error).message); } setBusy(''); };
  const rerender = async (d: Doc) => { const { rerenderPage } = await import('./templates'); setDoc({ ...d, pages: d.pages.map(pg => rerenderPage(pg, d.size)), updated: Date.now() }); };
  return <section className="card docs"><div className="row"><h2>Documents <small>{live.length}</small></h2><span className="grow" />
    <button className={'sm' + (bin ? ' on' : '')} onClick={() => setBin(!bin)}>🗑 Recycle bin ({trash.length})</button><button className="primary" onClick={newDoc}>+ New document</button></div>
    {!bin ? <table className="doctable"><thead><tr><th>Name</th><th>Type</th><th>Access</th><th>Last modified</th><th>Size</th><th>Actions</th></tr></thead><tbody>
      {live.map(d => { const t = TEMPLATES.find(x => x.id === d.templateId); return <tr key={d.id}>
        <td><a href="#" onClick={e => { e.preventDefault(); open(d.id); }}>{d.name}</a><br /><small className="muted">{d.pages.length} page{d.pages.length > 1 ? 's' : ''} · {d.size.label}</small></td>
        <td>{t?.kind || '—'}</td>
        <td><select value={d.access || 'Private'} onChange={e => setDoc({ ...d, access: e.target.value as Doc['access'] })}><option>Private</option><option>Team</option></select></td>
        <td>{new Date(d.updated).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{kb(d)}</td>
        <td className="acts"><button className="sm" onClick={() => open(d.id)}>Edit</button>
          <button className="sm" title="Rebuild every page from its layout and the current listing data (hand edits are replaced)" onClick={() => confirm(`Rerender "${d.name}"? Pages are rebuilt from their layouts; hand edits are replaced.`) && rerender(d)}>Rerender</button>
          <button className="sm" disabled={busy === d.id} onClick={() => pdf(d, 'print')}>Print</button>
          <button className="sm" disabled={busy === d.id} onClick={() => pdf(d, 'download')}>{busy === d.id ? '…' : 'Download'}</button>
          <button className="sm" onClick={() => { const n = prompt('Rename document', d.name); if (n && n.trim()) setDoc({ ...d, name: n.trim(), updated: Date.now() }); }}>Rename</button>
          <button className="sm" onClick={() => dupDoc(d)}>Duplicate</button>
          <button className="sm danger" onClick={() => setDoc({ ...d, deleted: Date.now() })}>Delete</button></td></tr>; })}
      {!live.length && <tr><td colSpan={6} className="muted">No documents for this listing yet. Click “+ New document”.</td></tr>}</tbody></table>
    : <table className="doctable"><thead><tr><th>Deleted document</th><th>Deleted</th><th></th></tr></thead><tbody>
      {trash.map(d => <tr key={d.id}><td>{d.name}</td><td>{new Date(d.deleted!).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
        <td className="acts"><button className="sm" onClick={() => setDoc({ ...d, deleted: undefined })}>Restore</button><button className="sm danger" onClick={() => confirm(`Permanently delete "${d.name}"?`) && purge(d.id)}>Delete forever</button></td></tr>)}
      {!trash.length && <tr><td colSpan={3} className="muted">Recycle bin is empty.</td></tr>}</tbody></table>}
  </section>;
}
