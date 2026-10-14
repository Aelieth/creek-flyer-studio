export type Property = {
  name: string; address: string; city: string; state: string; zip: string;
  propType: string; listing: 'Sale' | 'Lease'; price: string; leaseRate: string;
  buildingSf: string; lotAcres: string; yearBuilt: string; zoning: string; parking: string;
  description: string; highlights: string; brokerName: string; brokerTitle: string; brokerPhone: string; brokerEmail: string;
  lat: string; lon: string; county: string; tract: string; floodZone: string; population: string; medianIncome: string; medianAge: string;
  photos: string[]; mapImg: string;
};
export type Brand = { company: string; tagline: string; primary: string; accent: string; dark: string; logo: string; font: string; website: string; censusKey: string };
export type El = {
  id: string; type: 'text' | 'image' | 'rect' | 'map';
  x: number; y: number; w: number; h: number;
  text?: string; src?: string; fill?: string; color?: string; fontSize?: number; bold?: boolean; italic?: boolean;
  align?: 'left' | 'center' | 'right'; radius?: number; opacity?: number; fit?: 'cover' | 'contain'; locked?: boolean; lineHeight?: number;
};
export type Doc = { id: string; name: string; templateId: string; pages: El[][]; updated: number };
export const PAGE_W = 816, PAGE_H = 1056; // US Letter @ 96dpi
