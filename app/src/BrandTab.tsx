import type { Brand, State } from './types';
import { Field } from './ui';
import { FONT_NAMES } from './fonts';
import { download, fileToDataUrl } from './store';
export function BrandTab({ b, setB, state, load }: { b: Brand; setB: (f: (x: Brand) => Brand) => void; state: State; load: (s: State) => void }) {
  const f = (k: keyof Brand) => (s: string) => setB(x => ({ ...x, [k]: s }));
  const logo = (k: 'logo' | 'logoLight', label: string, bg: string) => <div className="logoprev" style={{ background: bg }}><span>{label}</span>{b[k] ? <img src={b[k]} /> : <i>none — company name is used</i>}
    <label className="btn sm">Upload<input hidden type="file" accept="image/*" onChange={async e => { const fl = e.target.files?.[0]; if (fl) { const d = await fileToDataUrl(fl, 1600); setB(x => ({ ...x, [k]: d })); } }} /></label>
    {b[k] && <button className="sm" onClick={() => f(k)('')}>Remove</button>}</div>;
  return <div className="page-form">
    <section className="card"><h2>Brand kit <small>applies to every template</small></h2><div className="grid">
      <Field label="Company" v={b.company} on={f('company')} /><Field label="Tagline" v={b.tagline} on={f('tagline')} /><Field label="Website" v={b.website} on={f('website')} /><Field label="Office address (brochure footer)" v={b.officeAddress || ''} on={f('officeAddress')} /><Field label="Main phone" v={b.phone} on={f('phone')} />
      {(['primary', 'secondary', 'accent', 'dark', 'light'] as const).map(k => <label key={k} className="field"><span>{k} color</span><div className="row"><input type="color" value={b[k]} onChange={e => f(k)(e.target.value)} /><input value={b[k]} onChange={e => f(k)(e.target.value)} style={{ width: 90 }} /></div></label>)}
      <label className="field"><span>Heading font</span><select value={b.headFont} onChange={e => f('headFont')(e.target.value)}>{FONT_NAMES.map(o => <option key={o}>{o}</option>)}</select></label>
      <label className="field"><span>Body font</span><select value={b.bodyFont} onChange={e => f('bodyFont')(e.target.value)}>{FONT_NAMES.map(o => <option key={o}>{o}</option>)}</select></label>
      <Field label="Disclaimer (footer)" v={b.disclaimer} on={f('disclaimer')} area rows={2} wide={4} />
    </div>
      <div className="row wrap">{logo('logo', 'Logo (on white)', '#ffffff')}{logo('logoLight', 'Logo (on dark)', b.secondary)}</div>
      <p className="muted">Logos are stored only in this browser. PNG/SVG with transparency works best.</p></section>
    <section className="card"><h2>Data settings</h2><div className="grid"><Field label="Census API key (free, enables ACS demographics)" v={b.censusKey} on={f('censusKey')} wide={3} /></div>
      <p className="muted">Powers 1/3/5-mile ring demographics and tract data. Get a free key in about a minute at <a href="https://api.census.gov/data/key_signup.html" target="_blank" rel="noreferrer">api.census.gov/data/key_signup.html</a>, click the activation link in the email, then paste it here. Stored only in this browser.</p>
      <p className="muted">Free key: <a href="https://api.census.gov/data/key_signup.html" target="_blank">api.census.gov/data/key_signup.html</a></p></section>
    <section className="card"><h2>Project file</h2><p className="muted">Everything (properties, brand, documents, photos) as one JSON file — back up, move between computers, or share with a coworker.</p>
      <div className="row"><button onClick={() => download(JSON.stringify(state), `creek-flyer-project-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')}>Export project JSON</button>
        <label className="btn">Import project JSON<input hidden type="file" accept=".json,application/json" onChange={async e => { const fl = e.target.files?.[0]; if (!fl) return; try { const s = JSON.parse(await fl.text()); if (s.v !== 2) throw new Error('Not a v2 project file'); if (confirm('Replace current project with imported file?')) load(s); } catch (er) { alert('Import failed: ' + (er as Error).message); } }} /></label></div></section>
  </div>;
}
