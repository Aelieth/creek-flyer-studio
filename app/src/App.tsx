import { useEffect, useState } from 'react';
import type { Brand, Doc, Property, State } from './types';
import { loadState, saveState, uid } from './store';
import { loadFonts } from './fonts';
import { PropertyTab } from './PropertyTab';
import { BrandTab } from './BrandTab';
import { Gallery } from './Gallery';
import { Editor } from './Editor';
import { Publish } from './Publish';
import { makeDocPages, sizeOf } from './templates';
import { SIZES } from './types';
import './app.css';
type Tab = 'property' | 'brand' | 'templates' | 'design' | 'publish';
const TABS: [Tab, string][] = [['property', 'Property'], ['brand', 'Brand'], ['templates', 'Templates'], ['design', 'Design'], ['publish', 'Publish']];
export default function App() {
  const [s, setS] = useState<State | null>(null); const [tab, setTab] = useState<Tab>('property'); const [docId, setDocId] = useState<string | null>(null);
  useEffect(() => { Promise.all([loadState(), loadFonts()]).then(([st]) => { setS(st); setDocId(st.docs[0]?.id ?? null); (window as any).__cfs = { get: () => st }; }); }, []);
  useEffect(() => { if (s) { saveState(s); (window as any).__cfs = { get: () => s, set: (n: State) => setS(n) }; } }, [s]);
  if (!s) return <div className="loading">Loading Creek Flyer Studio…</div>;
  const active = s.properties.find(p => p.id === s.activePropertyId) || s.properties[0];
  const updP = (f: (p: Property) => Property) => setS(x => x && ({ ...x, properties: x.properties.map(p => p.id === active.id ? f(p) : p) }));
  const setB = (f: (b: Brand) => Brand) => setS(x => x && ({ ...x, brand: f(x.brand) }));
  const setDoc = (d: Doc) => setS(x => x && ({ ...x, docs: x.docs.map(o => o.id === d.id ? d : o) }));
  const doc = s.docs.find(d => d.id === docId) || null;
  return <div className="app">
    <header>
      <div className="brandmark"><span style={{ background: s.brand.primary }} />Creek Flyer Studio</div>
      <nav>{TABS.map(([t, l], i) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}><i>{i + 1}</i>{l}</button>)}</nav>
      <div className="hint">{active.name} · saved in this browser</div>
    </header>
    {tab === 'property' && <PropertyTab props={s.properties} active={active} b={s.brand} upd={updP} setActive={id => setS({ ...s, activePropertyId: id })}
      add={p => setS({ ...s, properties: [...s.properties, p], activePropertyId: p.id })} remove={id => setS({ ...s, properties: s.properties.filter(p => p.id !== id), activePropertyId: s.properties.find(p => p.id !== id)!.id })} next={() => setTab('templates')} />}
    {tab === 'brand' && <BrandTab b={s.brand} setB={setB} state={s} load={n => { setS(n); setDocId(n.docs[0]?.id ?? null); }} />}
    {tab === 'templates' && <Gallery p={active} b={s.brand} create={(t, sizeId) => { const size = sizeId ? SIZES.find(z => z.id === sizeId)! : sizeOf(t.size);
      const d: Doc = { id: uid(), name: `${active.name} – ${t.name}`, templateId: t.id, propertyId: active.id, size, pages: makeDocPages(t, size), updated: Date.now() };
      setS({ ...s, docs: [d, ...s.docs] }); setDocId(d.id); setTab('design'); }} />}
    {tab === 'design' && <Editor doc={doc} docs={s.docs} setDoc={setDoc} props={s.properties} b={s.brand} openDoc={setDocId} newDocFromGallery={() => setTab('templates')}
      deleteDoc={id => { setS({ ...s, docs: s.docs.filter(d => d.id !== id) }); if (docId === id) setDocId(null); }}
      dupDoc={d => { const n = { ...d, id: uid(), name: d.name + ' (copy)', updated: Date.now() }; setS({ ...s, docs: [n, ...s.docs] }); setDocId(n.id); }} />}
    {tab === 'publish' && <Publish p={active} b={s.brand} docs={s.docs} />}
  </div>;
}
