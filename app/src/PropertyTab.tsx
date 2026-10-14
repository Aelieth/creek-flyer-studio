import { useState } from 'react';
import type { Brand, Property } from './types';
import { Field } from './ui';
import { fileToDataUrl, newProperty } from './store';
const FIELD_LABELS: Record<string, string> = { name: 'Property name', address: 'Street address', city: 'City', state: 'State', zip: 'ZIP', price: 'Sale price', leaseRate: 'Lease rate', leaseType: 'Lease type', availableSf: 'Available SF', buildingSf: 'Building SF', officeSf: 'Office SF', lotAcres: 'Lot size', yearBuilt: 'Year built', zoning: 'Zoning', parking: 'Parking', clearHeight: 'Clear height', buildingClass: 'Building class', market: 'Market', traffic: 'Traffic count', capRate: 'Cap rate', noi: 'NOI', description: 'Description', locationDescription: 'Location description', highlights: 'Highlights', propType: 'Property type', listing: 'Listing', brokers: 'Brokers' };
import { lookupAddress, staticMap } from './lookup';
import { extractFields } from './extract';
import { DemographicsCard, RetailMapCard } from './RetailPanel';
import { Annotator, annKey } from './Annotator';
type Sub = 'documents' | 'settings' | 'brokers' | 'custom' | 'location' | 'property' | 'building' | 'units' | 'lease' | 'notes';
type Props = { props: Property[]; active: Property; b: Brand; setActive: (id: string) => void; upd: (f: (p: Property) => Property) => void; add: (p: Property) => void; remove: (id: string) => void; goBrand?: () => void; docsPanel: React.ReactNode; sub: Sub; setSub: (s: Sub) => void };
export type { Sub };
const TYPES = ['Office', 'Retail', 'Industrial', 'Flex', 'Medical Office', 'Land', 'Multifamily', 'Mixed Use', 'Hospitality', 'Special Purpose'];
export function PropertyTab({ props, active: p, b, setActive, upd, add, remove, goBrand, docsPanel, sub, setSub }: Props) {
  const [ann, setAnn] = useState<number | null>(null);
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const [log, setLog] = useState<string[]>([]);
  const [paste, setPaste] = useState(''); const [found, setFound] = useState<Partial<Property> | null>(null);
  const [mapZ, setMapZ] = useState(16); const [mapGray, setMapGray] = useState(false);
  const f = (k: keyof Property) => (s: string) => upd(x => ({ ...x, [k]: s }));
  const run = async () => { const addr = q || `${p.address}, ${p.city}, ${p.state} ${p.zip}`; setBusy(true); setLog(['Looking up ' + addr + ' …']);
    const r = await lookupAddress(addr, b.censusKey, b.primary); upd(x => ({ ...x, ...r.patch })); setLog(r.log); setBusy(false); };
  const remap = async () => { if (!p.lat) return; setBusy(true); const img = await staticMap(+p.lat, +p.lon, mapZ, { gray: mapGray, pin: b.primary }); upd(x => ({ ...x, mapImg: img })); setBusy(false); };
  const addPhotos = async (fl: FileList | null) => { if (!fl) return; const out: string[] = []; for (const file of Array.from(fl)) out.push(await fileToDataUrl(file)); upd(x => ({ ...x, photos: [...x.photos, ...out] })); };
  const movePhoto = (i: number, d: number) => upd(x => { const a = [...x.photos]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, photos: a }; });
  const brokers = [0, 1, 2].map(i => p.brokers[i] || { name: '', title: '', email: '', phone: '', mobile: '' });
  const setBroker = (i: number, k: string, v: string) => upd(x => { const bs = [0, 1, 2].map(j => x.brokers[j] || { name: '', title: '', email: '', phone: '', mobile: '' }); bs[i] = { ...bs[i], [k]: v }; return { ...x, brokers: bs.filter((bb, j) => bb.name || bb.email || j < x.brokers.length) }; });
  const img1 = (k: 'aerial' | 'sitePlan', label: string) => <div className="slot"><span>{label}</span>{p[k] ? <img src={p[k]} /> : <div className="empty-slot">none</div>}
    <label className="btn sm">Upload<input hidden type="file" accept="image/*" onChange={async e => { const fl = e.target.files?.[0]; if (fl) { const d = await fileToDataUrl(fl); upd(x => ({ ...x, [k]: d })); } }} /></label>
    {p[k] && <button className="sm" onClick={() => upd(x => ({ ...x, [k]: '' }))}>Remove</button>}</div>;
  const F = (label: string, k: keyof Property, o: { wide?: number; area?: boolean; rows?: number; ph?: string } = {}) => <Field label={label} v={(p[k] as string) || ''} on={f(k)} {...o} />;
  const flags = { sale: p.listing !== 'Lease', lease: p.listing !== 'Sale' };
  const setFlags = (sale: boolean, lease: boolean) => f('listing')(sale && lease ? 'Sale or Lease' : sale ? 'Sale' : 'Lease');
  const cfs = p.customFields || [];
  const SUBS: [Sub, string][] = [['documents', 'Documents'], ['settings', 'Settings'], ['brokers', 'Brokers'], ['custom', 'Custom fields'], ['location', 'Location'], ['property', 'Property'], ['building', 'Building'], ['units', 'Units'], ['lease', p.listing === 'Sale' ? 'Sale' : 'Lease'], ['notes', 'Notes']];
  return <div className="page-form listing">
    <section className="card listhead"><div className="row wrap">
      <select className="recsel" title="Listing" value={p.id} onChange={e => setActive(e.target.value)}>{props.map(x => <option key={x.id} value={x.id}>{x.name || 'Untitled'} — {x.city}</option>)}</select>
      <span className={'status s-' + (p.status || 'Active').replace(/\s/g, '')}>{p.status || 'Active'}</span>
      {flags.sale && <span className="tag">For Sale</span>}{flags.lease && <span className="tag alt">For Lease</span>}
      <span className="muted">{[p.address, p.city, p.state].filter(Boolean).join(', ')}</span><span className="grow" />
      <button onClick={() => add(newProperty({ name: 'New Property', address: '', city: '', zip: '', description: '', highlights: '', locationDescription: '', photos: [], suites: [], comps: [], dem: {}, pois: [], trafficPts: [], lat: '', lon: '', status: 'Proposal', notes: '', customFields: [] }))}>+ New listing</button>
      <button onClick={() => add({ ...p, id: Math.random().toString(36).slice(2, 10), name: p.name + ' (copy)' })}>Duplicate</button>
      {props.length > 1 && <button className="danger" onClick={() => confirm('Delete this listing record?') && remove(p.id)}>Delete</button>}</div>
      <nav className="subtabs">{SUBS.map(([k, l]) => <button key={k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{l}</button>)}</nav></section>
    {sub === 'documents' && docsPanel}
    {sub === 'settings' && <>
      <section className="card"><h2>Listing settings</h2><div className="grid">
        {F('Listing name', 'name', { wide: 2 })}
        <label className="field"><span>Status</span><select value={p.status || 'Active'} onChange={e => f('status')(e.target.value)}>{['Proposal', 'Active', 'Under Contract', 'Closed', 'Inactive'].map(o => <option key={o}>{o}</option>)}</select></label>
        <label className="field"><span>Property type</span><select value={p.propType} onChange={e => f('propType')(e.target.value)}>{TYPES.map(o => <option key={o}>{o}</option>)}</select></label>
        <div className="field"><span>Offered</span><div className="row"><label className="chk"><input type="checkbox" checked={flags.sale} onChange={e => setFlags(e.target.checked, flags.lease || !e.target.checked)} />For sale</label>
          <label className="chk"><input type="checkbox" checked={flags.lease} onChange={e => setFlags(flags.sale || !e.target.checked, e.target.checked)} />For lease</label></div></div>
        {F('Subtitle line (optional, defaults to full address)', 'subtitle', { wide: 3 })}
      </div><p className="muted">One listing record feeds every document, microsite and email built from it. Pages update when the listing changes.</p></section>
      <div className="two">
        <section className="card lookup"><h2>Address lookup <small>free public data</small></h2>
          <div className="row"><input placeholder="Street, City, ST ZIP (blank = address on Location tab)" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
            <button className="primary" disabled={busy} onClick={run}>{busy ? 'Working…' : 'Look up'}</button></div>
          <p className="muted">Census Geocoder → county & tract · FEMA flood zone · Census ACS (free key in Brand) · OpenStreetMap map. Nominatim fallback.</p>
          {log.length > 0 && <ul className="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}</section>
        <section className="card"><h2>Paste listing text <small>auto-extract fields</small></h2>
          <textarea rows={4} value={paste} onChange={e => setPaste(e.target.value)} placeholder="Paste an email, LOI, old flyer text or listing page. Price, SF, acres, zoning, address, highlights, brokers… are detected." />
          <div className="row"><button disabled={!paste.trim()} onClick={() => setFound(extractFields(paste))}>Extract</button>
            {found && <><span className="muted">{Object.keys(found).length} fields found</span><button className="primary" onClick={() => { upd(x => ({ ...x, ...found })); setFound(null); setPaste(''); }}>Apply</button><button onClick={() => setFound(null)}>Discard</button></>}</div>
          {found && <table className="found"><tbody>{Object.entries(found).map(([k, v]) => <tr key={k}><td>{FIELD_LABELS[k] || k}</td><td>{typeof v === 'string' ? v : Array.isArray(v) ? v.map((x: any) => x.name || JSON.stringify(x)).join(', ') : JSON.stringify(v)}</td></tr>)}</tbody></table>}</section>
      </div></>}
    {sub === 'brokers' && <section className="card"><h2>Brokers <small>up to 3; empty columns hide automatically</small></h2><div className="grid5">
      {brokers.map((br, i) => <div key={i} className="brk"><b>Broker {i + 1}</b>{(['name', 'title', 'email', 'phone', 'mobile'] as const).map(k => <input key={k} placeholder={k} value={br[k]} onChange={e => setBroker(i, k, e.target.value)} />)}</div>)}
    </div></section>}
    {sub === 'custom' && <section className="card"><h2>Custom fields <small>use on pages as a table (“Custom fields” block) or a token</small></h2>
      <table className="arr"><thead><tr><th>Label</th><th>Value</th><th>Token</th><th></th></tr></thead><tbody>{cfs.map((c, i) => <tr key={i}>
        <td><input value={c.label} onChange={e => upd(x => ({ ...x, customFields: cfs.map((y, j) => j === i ? { ...y, label: e.target.value } : y) }))} /></td>
        <td><input value={c.value} onChange={e => upd(x => ({ ...x, customFields: cfs.map((y, j) => j === i ? { ...y, value: e.target.value } : y) }))} /></td>
        <td><code>{'{{cf_' + c.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '}}'}</code></td>
        <td><button className="sm" onClick={() => upd(x => ({ ...x, customFields: cfs.filter((_, j) => j !== i) }))}>✕</button></td></tr>)}</tbody></table>
      <button className="sm" onClick={() => upd(x => ({ ...x, customFields: [...cfs, { label: '', value: '' }] }))}>+ Field</button></section>}
    {sub === 'location' && <>
      <section className="card"><h2>Location</h2><div className="grid">
        {F('Street address', 'address', { wide: 2 })}{F('City', 'city')}<div className="grid2">{F('State', 'state')}{F('ZIP', 'zip')}</div>
        {F('Market / submarket', 'market')}{F('Traffic count', 'traffic')}{F('Latitude', 'lat')}{F('Longitude', 'lon')}
        {F('County', 'county')}{F('Flood zone', 'floodZone')}{F('Tract', 'tract')}{F('Tract population', 'population')}
        {F('Tract median HH income', 'medianIncome')}{F('Tract median age', 'medianAge')}
        {F('Location description', 'locationDescription', { area: true, rows: 3, wide: 4 })}
      </div>
      <div className="slots"><div className="slot"><span>Street map</span>{p.mapImg ? <img src={p.mapImg} /> : <div className="empty-slot">run lookup (Settings tab)</div>}
          <div className="row"><select value={mapZ} onChange={e => setMapZ(+e.target.value)}>{[13, 14, 15, 16, 17, 18].map(z => <option key={z} value={z}>zoom {z}</option>)}</select>
            <label className="chk"><input type="checkbox" checked={mapGray} onChange={e => setMapGray(e.target.checked)} />muted</label><button className="sm" disabled={!p.lat || busy} onClick={remap}>Redraw</button></div></div></div></section>
      <DemographicsCard p={p} b={b} upd={upd} goBrand={goBrand} />
      <RetailMapCard p={p} b={b} upd={upd} /></>}
    {sub === 'property' && <>
      <section className="card"><h2>Property</h2><div className="grid">
        {F('Property description / overview', 'description', { area: true, wide: 4 })}
        {F('Highlights (one per line)', 'highlights', { area: true, rows: 5, wide: 2 })}
        {F("Custom Details rows (optional: one 'Label: Value' per line; replaces the standard list)", 'details', { area: true, rows: 5, wide: 2 })}
      </div></section>
      <section className="card"><h2>Photos & images <small>photo 1 = hero · ✎ outlines suites</small></h2>
        <input type="file" accept="image/*" multiple onChange={e => addPhotos(e.target.files)} />
        <div className="photos">{p.photos.map((ph, i) => <div key={i} className="ph"><img src={ph} /><div><small>#{i + 1}</small>
          <button className="sm" onClick={() => movePhoto(i, -1)}>◀</button><button className="sm" onClick={() => movePhoto(i, 1)}>▶</button>
          <button className="sm" title="Draw outlines on this photo" onClick={() => setAnn(i)}>✎</button>
          <button className="sm" title="Use as aerial" onClick={() => upd(x => ({ ...x, aerial: ph }))}>Aerial</button>
          <button className="sm" onClick={() => upd(x => ({ ...x, photos: x.photos.filter((_, j) => j !== i) }))}>✕</button></div></div>)}</div>
        <div className="slots">{img1('aerial', 'Aerial (defaults to photo 1)')}{img1('sitePlan', 'Site / floor plan')}</div>
      </section>
      {ann !== null && p.photos[ann] && <Annotator src={p.photos[ann]} ann={(p.photoAnn || {})[annKey(p.photos[ann])]} b={b} onClose={() => setAnn(null)}
        onSave={(img, a) => { const i = ann; upd(x => { const pa = { ...(x.photoAnn || {}) }; delete pa[annKey(x.photos[i])]; if (a) pa[annKey(img)] = a; return { ...x, photos: x.photos.map((q, j) => j === i ? img : q), photoAnn: pa }; }); setAnn(null); }} />}</>}
    {sub === 'building' && <section className="card"><h2>Building</h2><div className="grid">
      {F('Building SF', 'buildingSf')}{F('Office SF', 'officeSf')}{F('Lot size', 'lotAcres')}{F('Year built', 'yearBuilt')}
      {F('Building class', 'buildingClass')}{F('Clear height', 'clearHeight')}{F('Parking', 'parking')}{F('Zoning', 'zoning')}
    </div></section>}
    {sub === 'units' && <ArrayEditor title="Units / suites" rows={p.suites} cols={['suite', 'sf', 'rate', 'status', 'notes']} onChange={suites => upd(x => ({ ...x, suites: suites as any }))} />}
    {sub === 'lease' && <>
      <section className="card"><h2>{p.listing === 'Sale' ? 'Sale terms' : 'Lease & sale terms'}</h2><div className="grid">
        {flags.lease && <>{F('Lease rate', 'leaseRate')}{F('Lease type', 'leaseType', { ph: 'NNN, Full Service…' })}</>}{F('Available SF', 'availableSf')}
        {flags.sale && <>{F('Sale price', 'price')}{F('Cap rate', 'capRate')}{F('NOI', 'noi')}</>}
      </div></section>
      <ArrayEditor title="Sale comparables" rows={p.comps} cols={['name', 'address', 'date', 'price', 'sf', 'ppsf', 'cap', 'notes']} onChange={comps => upd(x => ({ ...x, comps: comps as any }))} /></>}
    {sub === 'notes' && <section className="card"><h2>Notes <small>internal; appears only on pages that use {'{{notes}}'} (e.g. Owner's Report)</small></h2>
      <textarea rows={12} className="wide" value={p.notes || ''} onChange={e => f('notes')(e.target.value)} placeholder="Tours, offers, marketing activity, next steps…" /></section>}
    {sub !== 'documents' && <div className="row end"><button className="primary" onClick={() => setSub('documents')}>Documents →</button></div>}
  </div>;
}
function ArrayEditor({ title, rows, cols, onChange }: { title: string; rows: Record<string, string>[]; cols: string[]; onChange: (r: Record<string, string>[]) => void }) {
  return <section className="card"><h2>{title}</h2><table className="arr"><thead><tr>{cols.map(c => <th key={c}>{c}</th>)}<th></th></tr></thead><tbody>
    {rows.map((r, i) => <tr key={i}>{cols.map(c => <td key={c}><input value={r[c] || ''} onChange={e => onChange(rows.map((x, j) => j === i ? { ...x, [c]: e.target.value } : x))} /></td>)}
      <td><button className="sm" onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button></td></tr>)}
  </tbody></table><button className="sm" onClick={() => onChange([...rows, Object.fromEntries(cols.map(c => [c, '']))])}>+ Row</button></section>;
}
