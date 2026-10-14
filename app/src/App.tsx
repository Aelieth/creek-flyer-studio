import { useEffect, useState } from 'react';
import type { Brand, Doc, Property, State } from './types';
import { loadState, saveState, uid } from './store';
import { loadFonts } from './fonts';
import { PropertyTab } from './PropertyTab';
import type { Sub } from './PropertyTab';
import { DocumentsPanel, NewDocPicker } from './Documents';
import type { Template } from './templates';
import { BrandTab } from './BrandTab';
import { Gallery } from './Gallery';
import { Editor } from './Editor';
import { Publish } from './Publish';
import { makeDocPages, sizeOf } from './templates';
import { SIZES } from './types';
import { Welcome, TourCard, Shortcuts, TOUR, useHelpKey, useWelcome } from './Help';
import { newProperty } from './store';
import { TEMPLATES } from './templates';
import { useCallback } from 'react';
import './app.css';
import { buildPdf } from './pdf';
import { ringDemographics, drawRetailMap } from './retail';
type Tab = 'property' | 'brand' | 'templates' | 'design' | 'publish';
const TABS: [Tab, string][] = [['property', 'Listing'], ['brand', 'Brand'], ['templates', 'Templates'], ['design', 'Design'], ['publish', 'Publish']];
export default function App() {
  const [s, setS] = useState<State | null>(null); const [tab, setTab] = useState<Tab>('property'); const [docId, setDocId] = useState<string | null>(null);
  useEffect(() => { Promise.all([loadState(), loadFonts()]).then(([st0]) => { let st = st0;
    if (!st.docs.length && !localStorage.getItem('cfs.seeded')) { // first run: one sample document so the listing workspace isn't empty
      localStorage.setItem('cfs.seeded', '1'); const t = TEMPLATES.find(x => x.id === 'exec-brochure')!; const pr = st.properties[0]; const size = sizeOf(t.size);
      st = { ...st, docs: [{ id: uid(), name: `${pr.name} – ${t.name}`, templateId: t.id, propertyId: pr.id, size, pages: makeDocPages(t, size), updated: Date.now(), access: 'Team' }] }; }
    setS(st); setDocId(st.docs[0]?.id ?? null); (window as any).__cfs = { get: () => st }; }); }, []);
  useEffect(() => { if (s) { saveState(s); (window as any).__cfs = { get: () => s, set: (n: State) => setS(n) }; } }, [s]);
  const [sub, setSub] = useState<Sub>('documents'); const [picker, setPicker] = useState(false);
  const [welcome, closeWelcome] = useWelcome(); const [tour, setTour] = useState<number | null>(null); const [help, setHelp] = useState(false);
  useHelpKey(useCallback(() => setHelp(true), []));
  const goStep = (i: number) => { setTour(i); const st = TOUR[i]; setTab(st.tab);
    if (st.tab === 'design' && s && !s.docs.length) { const active = s.properties.find(p => p.id === s.activePropertyId) || s.properties[0]; const t = TEMPLATES[0]; const size = sizeOf(t.size);
      const d: Doc = { id: uid(), name: `${active.name} – ${t.name}`, templateId: t.id, propertyId: active.id, size, pages: makeDocPages(t, size), updated: Date.now() }; setS({ ...s, docs: [d] }); setDocId(d.id); }
    else if (st.tab === 'design' && s && !docId) setDocId(s.docs[0].id); };
  (window as any).__cfsQA = { TEMPLATES, makeDocPages, sizeOf, buildPdf, ringDemographics, drawRetailMap };
  if (!s) return <div className="loading"><img src={`${import.meta.env.BASE_URL}brand/creekpe-logo.svg`} alt="Creek Price Edwards" /><span className="spinner" />Loading Creek Flyer Hub…</div>;
  const active = s.properties.find(p => p.id === s.activePropertyId) || s.properties[0];
  const updP = (f: (p: Property) => Property) => setS(x => x && ({ ...x, properties: x.properties.map(p => p.id === active.id ? f(p) : p) }));
  const setB = (f: (b: Brand) => Brand) => setS(x => x && ({ ...x, brand: f(x.brand) }));
  const setDoc = (d: Doc) => setS(x => x && ({ ...x, docs: x.docs.map(o => o.id === d.id ? d : o) }));
  const doc = s.docs.find(d => d.id === docId && !d.deleted) || null;
  const liveDocs = s.docs.filter(d => !d.deleted);
  const createDoc = (t: Template, sizeId?: string) => { const size = sizeId ? SIZES.find(z => z.id === sizeId)! : sizeOf(t.size);
    const d: Doc = { id: uid(), name: `${active.name} – ${t.name}`, templateId: t.id, propertyId: active.id, size, pages: makeDocPages(t, size), updated: Date.now(), access: 'Private' };
    setS({ ...s, docs: [d, ...s.docs] }); setDocId(d.id); setPicker(false); setTab('design'); };
  const dupDoc = (d: Doc) => { const n = { ...d, id: uid(), name: d.name + ' (copy)', updated: Date.now() }; setS({ ...s, docs: [n, ...s.docs] }); return n; };
  const softDelete = (id: string) => { setS({ ...s, docs: s.docs.map(d => d.id === id ? { ...d, deleted: Date.now() } : d) }); if (docId === id) setDocId(null); };
  return <div className="app">
    <header>
      <a className="brandmark" href="./" title="Creek Flyer Hub · Creek Price Edwards" onClick={e => { e.preventDefault(); setTab('property'); setSub('documents'); }}><img src={`${import.meta.env.BASE_URL}brand/creekpe-logo-white.svg`} alt="Creek Price Edwards" /><span className="appname">Flyer Hub</span></a>
      <nav>{TABS.map(([t, l], i) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}><i>{i + 1}</i>{l}</button>)}</nav>
      <div className="hint" title="Your work is saved in this browser"><b>{active.name}</b><small>Saved in this browser</small></div>
      <button className="helpbtn" title="Help & keyboard shortcuts (?)" onClick={() => setHelp(true)}>?</button>
    </header>
    {welcome && <Welcome onClose={closeWelcome} onTour={() => { closeWelcome(); goStep(0); }}
      onBlank={() => { closeWelcome(); const p = newProperty({ name: 'New Property', address: '', city: '', zip: '', description: '', highlights: '', locationDescription: '', photos: [], suites: [], comps: [], dem: {}, pois: [], trafficPts: [], lat: '', lon: '' }); setS({ ...s, properties: [...s.properties, p], activePropertyId: p.id }); setTab('property'); }} />}
    {tour !== null && <TourCard i={tour} onNext={() => goStep(tour + 1)} onPrev={() => goStep(tour - 1)} onEnd={() => setTour(null)} />}
    {help && <Shortcuts onClose={() => setHelp(false)} onTour={() => { setHelp(false); goStep(0); }} />}
    {picker && <NewDocPicker p={active} b={s.brand} onClose={() => setPicker(false)} create={t => createDoc(t)} />}
    {tab === 'property' && <PropertyTab props={s.properties} active={active} b={s.brand} upd={updP} setActive={id => setS({ ...s, activePropertyId: id })} sub={sub} setSub={setSub}
      add={p => setS({ ...s, properties: [...s.properties, p], activePropertyId: p.id })} remove={id => setS({ ...s, properties: s.properties.filter(p => p.id !== id), activePropertyId: s.properties.find(p => p.id !== id)!.id })} goBrand={() => setTab('brand')}
      docsPanel={<DocumentsPanel p={active} b={s.brand} docs={s.docs} open={id => { setDocId(id); setTab('design'); }} newDoc={() => setPicker(true)} setDoc={setDoc} dupDoc={dupDoc} purge={id => setS({ ...s, docs: s.docs.filter(d => d.id !== id) })} />} />}
    {tab === 'brand' && <BrandTab b={s.brand} setB={setB} state={s} load={n => { setS(n); setDocId(n.docs[0]?.id ?? null); }} />}
    {tab === 'templates' && <Gallery p={active} b={s.brand} create={(t, sizeId) => createDoc(t, sizeId)} />}
    {tab === 'design' && <Editor doc={doc} docs={liveDocs} setDoc={setDoc} props={s.properties} b={s.brand} openDoc={setDocId} newDocFromGallery={() => setPicker(true)}
      deleteDoc={softDelete} dupDoc={d => setDocId(dupDoc(d).id)} updProp={(id, f) => setS(x => x && ({ ...x, properties: x.properties.map(p => p.id === id ? f(p) : p) }))}
      goListing={(to?: string) => { if (doc) setS(x => x && ({ ...x, activePropertyId: doc.propertyId })); setSub((to as Sub) || 'documents'); setTab('property'); }} />}
    {tab === 'publish' && <Publish p={active} b={s.brand} docs={liveDocs} />}
  </div>;
}
