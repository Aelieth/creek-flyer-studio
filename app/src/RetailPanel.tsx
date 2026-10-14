import { useState } from 'react';
import type { Brand, Poi, Property } from './types';
import { fileToDataUrl } from './store';
import { drawRetailMap, fetchPois, fetchTraffic, fmtVpd, ringDemographics } from './retail';
type Props = { p: Property; b: Brand; upd: (f: (p: Property) => Property) => void; goBrand?: () => void };
const DEM_ROWS: [string, string][] = [['pop', 'Population'], ['hh', 'Households'], ['med', 'Median HH income'], ['inc', 'Average HH income'], ['day', 'Daytime population'], ['growth', 'Pop. growth (2019–23)']];
export function DemographicsCard({ p, b, upd, goBrand }: Props) {
  const [busy, setBusy] = useState(false); const [log, setLog] = useState<string[]>([]);
  const run = async () => { setBusy(true); setLog(['Finding census block groups within 5 miles…']);
    try { const r = await ringDemographics(+p.lat, +p.lon, b.censusKey); upd(x => ({ ...x, dem: { ...x.dem, ...r.dem } })); setLog(r.log); }
    catch (e) { setLog([(e as Error).message]); } setBusy(false); };
  return <section className="card"><h2>Radius demographics <small>1 / 3 / 5-mile rings</small></h2>
    {!b.censusKey && <div className="keyprompt"><b>Free Census key needed for automatic ring demographics.</b> It takes a minute:
      <ol><li>Request a key at <a href="https://api.census.gov/data/key_signup.html" target="_blank" rel="noreferrer">api.census.gov/data/key_signup.html</a> (name + email; it arrives by email).</li>
        <li>Click the activation link in that email.</li><li>Paste the key in <a href="#" onClick={e => { e.preventDefault(); goBrand?.(); }}>Brand &amp; Settings → Census API key</a>.</li></ol>
      Until then the table below shows <i>sample</i> figures you can overwrite by hand.</div>}
    <div className="row"><button className="primary" disabled={busy || !p.lat || !b.censusKey} onClick={run}>{busy ? 'Calculating…' : 'Calculate rings from Census ACS'}</button>
      {!p.lat && <span className="muted">Run the address lookup first (needs latitude/longitude).</span>}</div>
    {log.length > 0 && <ul className="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
    <table className="dem"><thead><tr><th></th><th>1 mile</th><th>3 miles</th><th>5 miles</th></tr></thead><tbody>
      {DEM_ROWS.map(([k, l]) => <tr key={k}><td>{l}</td>{[1, 3, 5].map(r => <td key={r}><input value={p.dem[k + r] || ''} onChange={e => upd(x => ({ ...x, dem: { ...x.dem, [k + r]: e.target.value } }))} /></td>)}</tr>)}
    </tbody></table>
    <p className="muted">Sums every ACS 2023 5-year block group whose center falls inside each ring. Median income is a household-weighted estimate; growth compares to ACS 2019. Daytime population is not in free Census data, so enter it by hand.</p></section>;
}
export function RetailMapCard({ p, b, upd }: Props) {
  const [busy, setBusy] = useState(''); const [log, setLog] = useState<string[]>([]);
  const [sat, setSat] = useState(true); const [z, setZ] = useState(16); const [label, setLabel] = useState('SITE'); const [show, setShow] = useState<'all' | 'on'>('on');
  const pois = p.pois || [], tr = p.trafficPts || [];
  const setPoi = (id: string, o: Partial<Poi>) => upd(x => ({ ...x, pois: x.pois.map(q => q.id === id ? { ...q, ...o } : q) }));
  const pull = async () => { setBusy('pois'); setLog(['Searching OpenStreetMap for retailers and traffic generators (public servers can take up to a minute)…']);
    try { const r = await fetchPois(+p.lat, +p.lon); upd(x => ({ ...x, pois: [...x.pois.filter(q => q.kind === 'custom' || q.logo), ...r.filter(q => !x.pois.some(o => (o.kind === 'custom' || o.logo) && o.name === q.name))] })); setLog([`Found ${r.length} nearby places; the top 12 are switched on.`]); }
    catch (e) { setLog([(e as Error).message]); } setBusy(''); };
  const pullTraffic = async () => { setBusy('traffic'); try { const r = await fetchTraffic(+p.lat, +p.lon, p.state);
      upd(x => ({ ...x, trafficPts: r, traffic: r[0] ? fmtVpd(r[0].value) : x.traffic })); setLog([`${r.length} traffic counts (${r[0]?.source || ''} ${r[0]?.year || ''}). Name each road below.`]); }
    catch (e) { setLog([(e as Error).message]); } setBusy(''); };
  const draw = async () => { setBusy('draw');
    try { const [m, r] = await Promise.all([drawRetailMap(p, b, { mode: 'cotenancy', sat, z, siteLabel: label }), drawRetailMap(p, b, { mode: 'rings', sat: false, siteLabel: label, H: 925 })]);
      upd(x => ({ ...x, retailMap: m, ringMap: r })); setLog(['Maps drawn. Templates using "Retail co-tenancy map" and "Ring map" update automatically.']); }
    catch (e) { setLog(['Map failed: ' + (e as Error).message]); } setBusy(''); };
  const addCustom = () => upd(x => ({ ...x, pois: [{ id: Math.random().toString(36).slice(2, 9), name: 'New tenant', kind: 'custom', lat: +x.lat + 0.002, lon: +x.lon + 0.002, on: true }, ...x.pois] }));
  const list = show === 'on' ? pois.filter(q => q.on) : pois;
  return <section className="card retail"><h2>Retail aerial &amp; co-tenancy map <small>OpenStreetMap · state DOT traffic counts</small></h2>
    <div className="row wrap">
      <button disabled={!!busy || !p.lat} onClick={pull}>{busy === 'pois' ? 'Searching…' : 'Find nearby retailers'}</button>
      <button disabled={!!busy || !p.lat} onClick={pullTraffic}>{busy === 'traffic' ? 'Loading…' : 'Get traffic counts'}</button>
      <button onClick={addCustom}>+ Custom pin</button>
      <label className="chk"><input type="checkbox" checked={sat} onChange={e => setSat(e.target.checked)} />satellite</label>
      <select value={z} onChange={e => setZ(+e.target.value)}>{[14, 15, 16, 17, 18].map(v => <option key={v} value={v}>zoom {v}</option>)}</select>
      <label className="chk">site label <input style={{ width: 110 }} value={label} onChange={e => setLabel(e.target.value)} /></label>
      <button className="primary" disabled={!!busy || !p.lat} onClick={draw}>{busy === 'draw' ? 'Drawing…' : 'Draw maps'}</button></div>
    {log.length > 0 && <ul className="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
    <div className="two">
      <div><div className="row"><b>Pins</b><span className="muted">{pois.filter(q => q.on).length} on / {pois.length}</span>
        <select value={show} onChange={e => setShow(e.target.value as any)}><option value="on">show: on</option><option value="all">show: all</option></select></div>
        <table className="arr pois"><tbody>{list.map(q => <tr key={q.id}>
          <td><input type="checkbox" checked={q.on} onChange={e => setPoi(q.id, { on: e.target.checked })} /></td>
          <td><input value={q.name} onChange={e => setPoi(q.id, { name: e.target.value })} /></td>
          <td><select value={q.kind} onChange={e => setPoi(q.id, { kind: e.target.value as Poi['kind'] })}><option value="anchor">anchor</option><option value="draw">draw</option><option value="retail">retail</option><option value="custom">custom</option></select></td>
          <td className="muted">{q.dist != null ? q.dist + ' mi' : ''}</td>
          <td>{q.logo ? <img className="logo-th" src={q.logo} /> : null}<label className="btn sm" title="Upload a logo to show instead of the name">Logo<input hidden type="file" accept="image/*" onChange={async e => { const fl = e.target.files?.[0]; if (fl) setPoi(q.id, { logo: await fileToDataUrl(fl, 400) }); }} /></label>
            {q.logo && <button className="sm" onClick={() => setPoi(q.id, { logo: undefined })}>✕</button>}</td>
          {q.kind === 'custom' && <td><input style={{ width: 80 }} value={q.lat} onChange={e => setPoi(q.id, { lat: +e.target.value })} /><input style={{ width: 80 }} value={q.lon} onChange={e => setPoi(q.id, { lon: +e.target.value })} /></td>}
        </tr>)}</tbody></table>
        <b>Traffic counts</b>
        <table className="arr"><tbody>{tr.map(t => <tr key={t.id}><td><input type="checkbox" checked={t.on} onChange={e => upd(x => ({ ...x, trafficPts: x.trafficPts.map(o => o.id === t.id ? { ...o, on: e.target.checked } : o) }))} /></td>
          <td><input placeholder="Road name" value={t.label} onChange={e => upd(x => ({ ...x, trafficPts: x.trafficPts.map(o => o.id === t.id ? { ...o, label: e.target.value } : o) }))} /></td>
          <td><input style={{ width: 90 }} value={t.value} onChange={e => upd(x => ({ ...x, trafficPts: x.trafficPts.map(o => o.id === t.id ? { ...o, value: +e.target.value.replace(/\D/g, '') || 0 } : o) }))} /></td>
          <td className="muted">{t.source} {t.year}</td></tr>)}</tbody></table></div>
      <div className="mapprev">{p.retailMap ? <img src={p.retailMap} /> : <div className="empty-slot">Click “Draw maps”</div>}{p.ringMap && <img src={p.ringMap} />}</div>
    </div>
    <p className="muted">Retailers © OpenStreetMap contributors (ODbL). Traffic: ODOT (Oklahoma) and TxDOT (Texas) annual AADT. Satellite imagery: Esri World Imagery, check licensing before wide distribution (see docs).</p></section>;
}
