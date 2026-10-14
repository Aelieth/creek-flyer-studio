export type Suite = { suite: string; sf: string; rate: string; status: string; notes: string };
export type Comp = { name: string; address: string; date: string; price: string; sf: string; ppsf: string; cap: string; notes: string };
export type Property = {
  id: string;
  name: string; address: string; city: string; state: string; zip: string;
  propType: string; listing: 'Sale' | 'Lease' | 'Sale or Lease'; price: string; leaseRate: string; leaseType: string;
  buildingSf: string; availableSf: string; officeSf: string; lotAcres: string; yearBuilt: string; zoning: string; parking: string; clearHeight: string;
  buildingClass: string; market: string; traffic: string; capRate: string; noi: string;
  description: string; locationDescription: string; highlights: string;
  brokers: { name: string; title: string; email: string; phone: string; mobile: string }[];
  lat: string; lon: string; county: string; tract: string; floodZone: string; population: string; medianIncome: string; medianAge: string;
  dem: Record<string, string>; // pop1 pop3 pop5 hh1 hh3 hh5 inc1 inc3 inc5
  suites: Suite[]; comps: Comp[];
  photos: string[]; mapImg: string; sitePlan: string; aerial: string;
};
export type Brand = { company: string; tagline: string; primary: string; secondary: string; accent: string; dark: string; light: string;
  logo: string; logoLight: string; headFont: string; bodyFont: string; website: string; phone: string; disclaimer: string; censusKey: string };
export type Align = 'left' | 'center' | 'right' | 'justify';
export type ElBase = { id: string; showIf?: string; x: number; y: number; w: number; h: number; rot?: number; opacity?: number; locked?: boolean; name?: string };
export type TextEl = ElBase & { type: 'text'; text: string; font?: string; weight?: number; size: number; color?: string; align?: Align; valign?: 'top' | 'middle' | 'bottom';
  lh?: number; ls?: number; upper?: boolean; autoFit?: boolean; fill?: string; pad?: number; italic?: boolean };
export type RectEl = ElBase & { type: 'rect'; fill?: string; stroke?: string; sw?: number; radius?: number };
export type ImageEl = ElBase & { type: 'image'; src: string; fit?: 'cover' | 'contain'; fx?: number; fy?: number; zoom?: number; radius?: number; gray?: boolean; tint?: string; tintAlpha?: number; stroke?: string; sw?: number };
export type TableEl = ElBase & { type: 'table'; rows: string; source?: 'rows' | 'suites' | 'comps'; cols: number[]; aligns: Align[]; header?: boolean;
  font?: string; size: number; color?: string; labelColor?: string; labelWeight?: number; headColor?: string; headFill?: string; headWeight?: number; rule?: string; ruleW?: number;
  rowH: number; skipEmpty?: boolean; zebra?: string };
export type El = TextEl | RectEl | ImageEl | TableEl;
export type Page = { els: El[] };
export type DocSize = { id: string; label: string; w: number; h: number };
export type Doc = { id: string; name: string; templateId: string; propertyId: string; size: DocSize; pages: Page[]; updated: number };
export type State = { v: 2; properties: Property[]; activePropertyId: string; brand: Brand; docs: Doc[] };

// px at 96 dpi
export const SIZES: DocSize[] = [
  { id: 'letter', label: 'Letter 8.5×11 portrait', w: 816, h: 1056 },
  { id: 'letter-l', label: 'Letter 11×8.5 landscape', w: 1056, h: 816 },
  { id: 'tabloid-l', label: 'Tabloid 17×11 landscape', w: 1632, h: 1056 },
  { id: 'tabloid', label: 'Tabloid 11×17 portrait', w: 1056, h: 1632 },
  { id: 'a4', label: 'A4 portrait', w: 794, h: 1123 },
  { id: 'social', label: 'Social square 1080', w: 1080, h: 1080 },
  { id: 'email', label: 'Email banner 1200×600', w: 1200, h: 600 },
];
