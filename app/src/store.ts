import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Brand, Property, State } from './types';
export const uid = () => Math.random().toString(36).slice(2, 10);
export const newProperty = (o: Partial<Property> = {}): Property => ({
  id: uid(), name: 'Riverside Business Center', address: '4500 W Example Pkwy', city: 'Oklahoma City', state: 'OK', zip: '73112',
  propType: 'Office', listing: 'Lease', price: '$3,250,000', leaseRate: '$18.50 SF/yr', leaseType: 'Full Service',
  buildingSf: '42,600 SF', availableSf: '1,850 - 9,400 SF', officeSf: '', lotAcres: '3.4 Acres', yearBuilt: '2006', zoning: 'O-2', parking: '4.2/1,000 SF', clearHeight: '',
  buildingClass: 'B', market: 'Northwest OKC', traffic: '38,500 VPD', capRate: '7.25%', noi: '$235,600',
  description: 'Riverside Business Center is a well-maintained three-story office building with a renovated lobby, abundant surface parking and quick access to the interstate. Suites range from small professional offices to a full-floor opportunity.',
  locationDescription: 'Located minutes from downtown with direct access to I-44 and surrounded by restaurants, hotels and retail amenities.',
  highlights: 'Renovated lobby and common areas\nOn-site property management\nMonument signage available\nAbundant free surface parking\nMinutes to downtown and I-44',
  brokers: [{ name: 'Phil T', title: 'Associate', email: 'phil@example.com', phone: '405.555.0100', mobile: '405.555.0101' }, { name: 'Jordan Lee', title: 'Vice President', email: 'jlee@example.com', phone: '405.555.0102', mobile: '' }],
  lat: '', lon: '', county: '', tract: '', floodZone: '', population: '', medianIncome: '', medianAge: '',
  dem: { pop1: '9,812', pop3: '74,205', pop5: '198,630', hh1: '4,410', hh3: '31,877', hh5: '83,915', inc1: '$62,300', inc3: '$71,480', inc5: '$68,950' },
  suites: [{ suite: 'Suite 100', sf: '2,150 SF', rate: '$18.50 SF/yr', status: 'Available', notes: 'Corner, open plan' },
    { suite: 'Suite 210', sf: '1,850 SF', rate: '$18.50 SF/yr', status: 'Available', notes: '4 offices' },
    { suite: 'Suite 300', sf: '9,400 SF', rate: '$17.75 SF/yr', status: 'Available', notes: 'Full floor' },
    { suite: 'Suite 120', sf: '3,200 SF', rate: '', status: 'Leased', notes: '' }],
  comps: [{ name: 'Northpark Plaza', address: '1200 NW 63rd St', date: '03/2026', price: '$2,900,000', sf: '38,000', ppsf: '$76.32', cap: '7.5%', notes: '' },
    { name: 'Lakeside Office', address: '3800 N Classen', date: '11/2025', price: '$4,100,000', sf: '51,200', ppsf: '$80.08', cap: '7.0%', notes: '' },
    { name: 'Penn Square Tower', address: '1900 NW Expwy', date: '07/2025', price: '$6,750,000', sf: '82,000', ppsf: '$82.32', cap: '6.8%', notes: '' }],
  photos: [], mapImg: '', sitePlan: '', aerial: '', ...o,
});
export const defaultBrand: Brand = { company: 'Your Company', tagline: 'Commercial Real Estate', primary: '#007359', secondary: '#002e5a', accent: '#409682', dark: '#1f2a37', light: '#d5ebe5',
  logo: '', logoLight: '', headFont: 'Jost', bodyFont: 'Nunito Sans', website: 'www.example.com', phone: '405.555.0100',
  disclaimer: 'The information contained herein is from sources deemed reliable. No representation is made to the accuracy herein. Photos herein are the property of their respective owners, and use of them without express written consent of the owner is prohibited.', censusKey: '' };
export function freshState(): State { const p = newProperty(); return { v: 2, properties: [p], activePropertyId: p.id, brand: defaultBrand, docs: [] }; }
export async function loadState(): Promise<State> {
  try { const s = await idbGet('cfs.state.v2'); if (s && s.v === 2) return { ...s, brand: { ...defaultBrand, ...s.brand }, properties: s.properties.map((p: Property) => newProperty(p)) }; } catch { /* ignore */ }
  const st = freshState();
  try { // first run: load bundled CC0 demo photos so templates look real
    const urls = ['office-1', 'office-2', 'retail-1', 'industrial-1', 'aerial-1'].map(n => `${import.meta.env.BASE_URL}demo/${n}.jpg.b64`);
    const data = await Promise.all(urls.map(async u => 'data:image/jpeg;base64,' + (await (await fetch(u)).text()).trim()));
    st.properties[0].photos = data.slice(0, 4); st.properties[0].aerial = data[4];
  } catch { /* offline: no demo photos */ }
  return st;
}
let t: number | undefined;
export function saveState(s: State) { clearTimeout(t); t = window.setTimeout(() => idbSet('cfs.state.v2', s).catch(e => console.error(e)), 300); }
export function fileToDataUrl(f: File, max = 2400): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      res(f.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.88)); };
      img.onerror = rej; img.src = r.result as string; };
    r.onerror = rej; r.readAsDataURL(f);
  });
}
export function download(data: string | Blob, file: string, mime = 'application/octet-stream') {
  const blob = typeof data === 'string' ? new Blob([data], { type: mime }) : data; const u = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = u; a.download = file; a.click(); setTimeout(() => URL.revokeObjectURL(u), 5000);
}
