import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Brand, Poi, Property, State } from './types';
import { drawRetailMap } from './retail';
// Sample co-tenants (from OpenStreetMap, © OpenStreetMap contributors) for the demo map.
const SAMPLE_POIS: Omit<Poi, 'id' | 'on'>[] = [{"name": "Quail Springs Mall", "kind": "draw", "lat": 35.613145, "lon": -97.558319}, {"name": "Lowe's", "kind": "anchor", "lat": 35.606632, "lon": -97.55635}, {"name": "AMC", "kind": "anchor", "lat": 35.612198, "lon": -97.558404}, {"name": "Barnes & Noble", "kind": "anchor", "lat": 35.611256, "lon": -97.566415}, {"name": "ALDI", "kind": "anchor", "lat": 35.605274, "lon": -97.550506}, {"name": "Best Buy", "kind": "anchor", "lat": 35.611103, "lon": -97.551456}, {"name": "Shoppes at NorthPark", "kind": "draw", "lat": 35.592599, "lon": -97.565894}, {"name": "The Home Depot", "kind": "anchor", "lat": 35.614559, "lon": -97.551903}, {"name": "Sam's Club", "kind": "anchor", "lat": 35.607408, "lon": -97.546029}, {"name": "Walmart", "kind": "anchor", "lat": 35.60501, "lon": -97.545926}, {"name": "Target", "kind": "anchor", "lat": 35.612516, "lon": -97.546854}, {"name": "Oklahoma Spine Hospital", "kind": "draw", "lat": 35.614506, "lon": -97.583191}, {"name": "JCPenney", "kind": "anchor", "lat": 35.612574, "lon": -97.56014}, {"name": "Hibbett Sports", "kind": "anchor", "lat": 35.61286, "lon": -97.559705}];
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
  lat: '35.6062', lon: '-97.5609', county: '', tract: '', floodZone: '', population: '', medianIncome: '', medianAge: '',
  dem: { pop1: '9,812', pop3: '74,205', pop5: '198,630', hh1: '4,410', hh3: '31,877', hh5: '83,915', inc1: '$62,300', inc3: '$71,480', inc5: '$68,950', med1: '$54,100', med3: '$60,250', med5: '$57,800', growth1: '+3.1%', growth3: '+4.6%', growth5: '+3.9%', day1: '14,250', day3: '88,400', day5: '231,700' },
  pois: SAMPLE_POIS.map((q, i) => ({ ...q, id: 's' + i, on: i < 12 })), trafficPts: [{ id: 't0', label: 'Kilpatrick Tpke', value: 80800, year: '2023', source: 'ODOT', lat: 35.60909, lon: -97.55618, on: true }], retailMap: '', ringMap: '',
  suites: [{ suite: 'Suite 100', sf: '2,150 SF', rate: '$18.50 SF/yr', status: 'Available', notes: 'Corner, open plan' },
    { suite: 'Suite 210', sf: '1,850 SF', rate: '$18.50 SF/yr', status: 'Available', notes: '4 offices' },
    { suite: 'Suite 300', sf: '9,400 SF', rate: '$17.75 SF/yr', status: 'Available', notes: 'Full floor' },
    { suite: 'Suite 120', sf: '3,200 SF', rate: '', status: 'Leased', notes: '' }],
  comps: [{ name: 'Northpark Plaza', address: '1200 NW 63rd St', date: '03/2026', price: '$2,900,000', sf: '38,000', ppsf: '$76.32', cap: '7.5%', notes: '' },
    { name: 'Lakeside Office', address: '3800 N Classen', date: '11/2025', price: '$4,100,000', sf: '51,200', ppsf: '$80.08', cap: '7.0%', notes: '' },
    { name: 'Penn Square Tower', address: '1900 NW Expwy', date: '07/2025', price: '$6,750,000', sf: '82,000', ppsf: '$82.32', cap: '6.8%', notes: '' }],
  photos: [], mapImg: '', sitePlan: '', aerial: '', ...o,
});
export const defaultBrand: Brand = { company: 'Your Company', tagline: 'Commercial Real Estate', primary: '#003057', secondary: '#05664f', accent: '#3f8f7b', dark: '#272324', light: '#faf7e8',
  logo: '', logoLight: '', headFont: 'Playfair Display', bodyFont: 'Lato', website: 'www.example.com', phone: '405.555.0100',
  disclaimer: 'The information contained herein is from sources deemed reliable. No representation is made to the accuracy herein. Photos herein are the property of their respective owners, and use of them without express written consent of the owner is prohibited.', censusKey: '' };
export function freshState(): State { const p = newProperty(); return { v: 2, properties: [p], activePropertyId: p.id, brand: defaultBrand, docs: [] }; }
export async function loadState(): Promise<State> {
  try { const s = await idbGet('cfs.state.v2'); if (s && s.v === 2) return { ...s, brand: { ...defaultBrand, ...s.brand }, properties: s.properties.map((p: Property) => newProperty({ ...p, pois: p.pois || [], trafficPts: p.trafficPts || [] })) }; } catch { /* ignore */ }
  const st = freshState();
  try { // first run: load bundled CC0 demo photos so templates look real
    const urls = ['office-1', 'office-2', 'retail-1', 'industrial-1', 'aerial-1'].map(n => `${import.meta.env.BASE_URL}demo/${n}.jpg.b64`);
    const data = await Promise.all(urls.map(async u => 'data:image/jpeg;base64,' + (await (await fetch(u)).text()).trim()));
    st.properties[0].photos = data.slice(0, 4); st.properties[0].aerial = data[4];
  } catch { /* offline: no demo photos */ }
  try { // sample co-tenancy + ring maps for the demo record
    const p = st.properties[0]; const to = new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 9000));
    const [m, r] = await Promise.race([Promise.all([drawRetailMap(p, st.brand, { mode: 'cotenancy', sat: true, siteLabel: 'SITE' }), drawRetailMap(p, st.brand, { mode: 'rings', siteLabel: 'SITE', H: 925 })]), to]);
    p.retailMap = m; p.ringMap = r;
  } catch { /* offline */ }
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
