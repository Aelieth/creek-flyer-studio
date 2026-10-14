import type { Brand, Doc, Property } from './types';
export const emptyProperty: Property = {
  name: 'Creekside Commerce Center', address: '1200 Main St', city: 'Dallas', state: 'TX', zip: '75201',
  propType: 'Retail', listing: 'Sale', price: '$2,450,000', leaseRate: '$24.00/SF/yr NNN',
  buildingSf: '12,500', lotAcres: '1.25', yearBuilt: '2004', zoning: 'CR - Community Retail', parking: '62 spaces (4.9/1,000)',
  description: 'Well-located multi-tenant retail center with strong frontage, ample parking and a stable tenant mix. Ideal for an investor or owner-user.',
  highlights: 'High-visibility corner location\n95% occupied, staggered lease expirations\nRecent roof and HVAC updates\nMonument signage available',
  brokerName: 'Phil T', brokerTitle: 'Associate', brokerPhone: '(555) 555-0100', brokerEmail: 'phil@creekpe.com',
  lat: '', lon: '', county: '', tract: '', floodZone: '', population: '', medianIncome: '', medianAge: '', photos: [], mapImg: '',
};
export const defaultBrand: Brand = { company: 'Creek PE', tagline: 'Commercial Real Estate', primary: '#0f3d5e', accent: '#c8a24a', dark: '#1d2430', logo: '', font: 'Helvetica, Arial, sans-serif', website: 'www.creekpe.com', censusKey: '' };
const get = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? { ...d, ...JSON.parse(v) } : d; } catch { return d; } };
export const load = {
  property: () => get('cfs.property', emptyProperty),
  brand: () => get('cfs.brand', defaultBrand),
  docs: (): Doc[] => { try { return JSON.parse(localStorage.getItem('cfs.docs') || '[]'); } catch { return []; } },
};
export function save(k: 'property' | 'brand' | 'docs', v: unknown): string | null {
  try { localStorage.setItem('cfs.' + k, JSON.stringify(v)); return null; } catch { return 'Storage full: remove some photos (browser limit ~5MB).'; }
}
export const uid = () => Math.random().toString(36).slice(2, 10);
export function fileToDataUrl(f: File, max = 1600): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      res(f.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85)); };
      img.onerror = rej; img.src = r.result as string; };
    r.onerror = rej; r.readAsDataURL(f);
  });
}
