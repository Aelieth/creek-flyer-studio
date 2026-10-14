import { useState } from 'react';
import type { Brand, Property } from './types';
import { Field } from './ui';
import { fileToDataUrl, newProperty } from './store';
const FIELD_LABELS: Record<string, string> = { name: 'Property name', address: 'Street address', city: 'City', state: 'State', zip: 'ZIP', price: 'Sale price', leaseRate: 'Lease rate', leaseType: 'Lease type', availableSf: 'Available SF', buildingSf: 'Building SF', officeSf: 'Office SF', lotAcres: 'Lot size', yearBuilt: 'Year built', zoning: 'Zoning', parking: 'Parking', clearHeight: 'Clear height', buildingClass: 'Building class', market: 'Market', traffic: 'Traffic count', capRate: 'Cap rate', noi: 'NOI', description: 'Description', locationDescription: 'Location description', highlights: 'Highlights', propType: 'Property type', listing: 'Listing', brokers: 'Brokers' };
import { lookupAddress, staticMap } from './lookup';
import { extractFields } from './extract';
type Props = { props: Property[]; active: Property; b: Brand; setActive: (id: string) => void; upd: (f: (p: Property) => Property) => void; add: (p: Property) => void; remove: (id: string) => void; next: () => void };
const TYPES = ['Office', 'Retail', 'Industrial', 'Flex', 'Medical Office', 'Land', 'Multifamily', 'Mixed Use', 'Hospitality', 'Special Purpose'];
export function PropertyTab({ props, active: p, b, setActive, upd, add, remove, next }: Props) {
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
  return <div className="page-form">
    <section className="card proplist"><div className="row wrap">
      <b>Property record:</b>
      <select value={p.id} onChange={e => setActive(e.target.value)}>{props.map(x => <option key={x.id} value={x.id}>{x.name || 'Untitled'} — {x.city}</option>)}</select>
      <button onClick={() => add(newProperty({ name: 'New Property', address: '', city: '', zip: '', description: '', highlights: '', locationDescription: '', photos: [], suites: [], comps: [], dem: {} }))}>+ New</button>
      <button onClick={() => add({ ...p, id: Math.random().toString(36).slice(2, 10), name: p.name + ' (copy)' })}>Duplicate</button>
      {props.length > 1 && <button className="danger" onClick={() => confirm('Delete this property record?') && remove(p.id)}>Delete</button>}
      <span className="muted">One record feeds every flyer, brochure, microsite and email built from it.</span></div></section>
    <div className="two">
      <section className="card lookup"><h2>Address lookup <small>free public data</small></h2>
        <div className="row"><input placeholder="Street, City, ST ZIP (blank = address below)" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
          <button className="primary" disabled={busy} onClick={run}>{busy ? 'Working…' : 'Look up'}</button></div>
        <p className="muted">Census Geocoder → county & tract · FEMA flood zone · Census ACS (free key in Brand) · OpenStreetMap map. Nominatim fallback.</p>
        {log.length > 0 && <ul className="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}</section>
      <section className="card"><h2>Paste listing text <small>auto-extract fields</small></h2>
        <textarea rows={4} value={paste} onChange={e => setPaste(e.target.value)} placeholder="Paste an email, LOI, old flyer text or listing page. Price, SF, acres, zoning, address, highlights, brokers… are detected." />
        <div className="row"><button disabled={!paste.trim()} onClick={() => setFound(extractFields(paste))}>Extract</button>
          {found && <><span className="muted">{Object.keys(found).length} fields found</span><button className="primary" onClick={() => { upd(x => ({ ...x, ...found })); setFound(null); setPaste(''); }}>Apply</button><button onClick={() => setFound(null)}>Discard</button></>}</div>
        {found && <table className="found"><tbody>{Object.entries(found).map(([k, v]) => <tr key={k}><td>{FIELD_LABELS[k] || k}</td><td>{typeof v === 'string' ? v : Array.isArray(v) ? v.map((x: any) => x.name || JSON.stringify(x)).join(', ') : JSON.stringify(v)}</td></tr>)}</tbody></table>}</section>
    </div>
    <section className="card"><h2>Listing</h2><div className="grid">
      <Field label="Property name" v={p.name} on={f('name')} wide={2} />
      <label className="field"><span>Type</span><select value={p.propType} onChange={e => f('propType')(e.target.value)}>{TYPES.map(o => <option key={o}>{o}</option>)}</select></label>
      <label className="field"><span>Listing</span><select value={p.listing} onChange={e => f('listing')(e.target.value)}><option>Lease</option><option>Sale</option><option>Sale or Lease</option></select></label>
      <Field label="Street address" v={p.address} on={f('address')} wide={2} /><Field label="City" v={p.city} on={f('city')} /><div className="grid2"><Field label="State" v={p.state} on={f('state')} /><Field label="ZIP" v={p.zip} on={f('zip')} /></div>
      <Field label="Sale price" v={p.price} on={f('price')} /><Field label="Lease rate" v={p.leaseRate} on={f('leaseRate')} /><Field label="Lease type" v={p.leaseType} on={f('leaseType')} ph="NNN, Full Service…" /><Field label="Available SF" v={p.availableSf} on={f('availableSf')} />
      <Field label="Building SF" v={p.buildingSf} on={f('buildingSf')} /><Field label="Office SF" v={p.officeSf} on={f('officeSf')} /><Field label="Lot size" v={p.lotAcres} on={f('lotAcres')} /><Field label="Year built" v={p.yearBuilt} on={f('yearBuilt')} />
      <Field label="Zoning" v={p.zoning} on={f('zoning')} /><Field label="Parking" v={p.parking} on={f('parking')} /><Field label="Clear height" v={p.clearHeight} on={f('clearHeight')} /><Field label="Building class" v={p.buildingClass} on={f('buildingClass')} />
      <Field label="Market / submarket" v={p.market} on={f('market')} /><Field label="Traffic count" v={p.traffic} on={f('traffic')} /><Field label="Cap rate" v={p.capRate} on={f('capRate')} /><Field label="NOI" v={p.noi} on={f('noi')} />
      <Field label="Property description" v={p.description} on={f('description')} area wide={4} />
      <Field label="Location description" v={p.locationDescription} on={f('locationDescription')} area rows={2} wide={2} /><Field label="Highlights (one per line)" v={p.highlights} on={f('highlights')} area rows={4} wide={2} />
    </div></section>
    <section className="card"><h2>Brokers <small>up to 3; empty columns hide automatically</small></h2><div className="grid5">
      {brokers.map((br, i) => <div key={i} className="brk"><b>Broker {i + 1}</b>{(['name', 'title', 'email', 'phone', 'mobile'] as const).map(k => <input key={k} placeholder={k} value={br[k]} onChange={e => setBroker(i, k, e.target.value)} />)}</div>)}
    </div></section>
    <section className="card"><h2>Photos & images <small>photo 1 = hero</small></h2>
      <input type="file" accept="image/*" multiple onChange={e => addPhotos(e.target.files)} />
      <div className="photos">{p.photos.map((ph, i) => <div key={i} className="ph"><img src={ph} /><div><small>#{i + 1}</small>
        <button className="sm" onClick={() => movePhoto(i, -1)}>◀</button><button className="sm" onClick={() => movePhoto(i, 1)}>▶</button>
        <button className="sm" title="Use as aerial" onClick={() => upd(x => ({ ...x, aerial: ph }))}>Aerial</button>
        <button className="sm" onClick={() => upd(x => ({ ...x, photos: x.photos.filter((_, j) => j !== i) }))}>✕</button></div></div>)}</div>
      <div className="slots">{img1('aerial', 'Aerial (defaults to photo 1)')}{img1('sitePlan', 'Site / floor plan')}
        <div className="slot"><span>Map</span>{p.mapImg ? <img src={p.mapImg} /> : <div className="empty-slot">run lookup</div>}
          <div className="row"><select value={mapZ} onChange={e => setMapZ(+e.target.value)}>{[13, 14, 15, 16, 17, 18].map(z => <option key={z} value={z}>zoom {z}</option>)}</select>
            <label className="chk"><input type="checkbox" checked={mapGray} onChange={e => setMapGray(e.target.checked)} />muted</label><button className="sm" disabled={!p.lat || busy} onClick={remap}>Redraw</button></div></div></div>
    </section>
    <section className="card"><h2>Location & demographics</h2><div className="grid">
      <Field label="Latitude" v={p.lat} on={f('lat')} /><Field label="Longitude" v={p.lon} on={f('lon')} /><Field label="County" v={p.county} on={f('county')} /><Field label="Flood zone" v={p.floodZone} on={f('floodZone')} />
      <Field label="Tract" v={p.tract} on={f('tract')} /><Field label="Tract population" v={p.population} on={f('population')} /><Field label="Tract median HH income" v={p.medianIncome} on={f('medianIncome')} /><Field label="Tract median age" v={p.medianAge} on={f('medianAge')} />
    </div>
      <table className="dem"><thead><tr><th></th><th>1 mile</th><th>3 miles</th><th>5 miles</th></tr></thead><tbody>
        {[['pop', 'Population'], ['hh', 'Households'], ['inc', 'Avg HH income']].map(([k, l]) => <tr key={k}><td>{l}</td>{[1, 3, 5].map(r => <td key={r}><input value={p.dem[k + r] || ''} onChange={e => upd(x => ({ ...x, dem: { ...x.dem, [k + r]: e.target.value } }))} /></td>)}</tr>)}
      </tbody></table><p className="muted">Radius demographics: paste from your demographics provider (see docs/data-connectors.md, "Review later").</p></section>
    <ArrayEditor title="Suites / availability" rows={p.suites} cols={['suite', 'sf', 'rate', 'status', 'notes']} onChange={suites => upd(x => ({ ...x, suites: suites as any }))} />
    <ArrayEditor title="Sale comparables" rows={p.comps} cols={['name', 'address', 'date', 'price', 'sf', 'ppsf', 'cap', 'notes']} onChange={comps => upd(x => ({ ...x, comps: comps as any }))} />
    <div className="row end"><button className="primary" onClick={next}>Next: pick a template →</button></div>
  </div>;
}
function ArrayEditor({ title, rows, cols, onChange }: { title: string; rows: Record<string, string>[]; cols: string[]; onChange: (r: Record<string, string>[]) => void }) {
  return <section className="card"><h2>{title}</h2><table className="arr"><thead><tr>{cols.map(c => <th key={c}>{c}</th>)}<th></th></tr></thead><tbody>
    {rows.map((r, i) => <tr key={i}>{cols.map(c => <td key={c}><input value={r[c] || ''} onChange={e => onChange(rows.map((x, j) => j === i ? { ...x, [c]: e.target.value } : x))} /></td>)}
      <td><button className="sm" onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button></td></tr>)}
  </tbody></table><button className="sm" onClick={() => onChange([...rows, Object.fromEntries(cols.map(c => [c, '']))])}>+ Row</button></section>;
}
