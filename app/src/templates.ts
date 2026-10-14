import type { El } from './types';
import { uid } from './store';
// Colors: "$primary" "$accent" "$dark" resolve to brand. Text: {{field}} tokens resolve to property data.
// Image src: "photo:N" | "logo" | "map" | data URL.
type P = Omit<El, 'id'>;
const t = (x: number, y: number, w: number, h: number, text: string, o: Partial<P> = {}): P => ({ type: 'text', x, y, w, h, text, fontSize: 14, color: '$dark', ...o });
const r = (x: number, y: number, w: number, h: number, fill: string, o: Partial<P> = {}): P => ({ type: 'rect', x, y, w, h, fill, ...o });
const i = (x: number, y: number, w: number, h: number, src: string, o: Partial<P> = {}): P => ({ type: 'image', x, y, w, h, src, fit: 'cover', ...o });
const m = (x: number, y: number, w: number, h: number): P => ({ type: 'map', x, y, w, h, src: 'map' });
const footer = (y = 960): P[] => [
  r(0, y, 816, 1056 - y, '$primary'),
  i(40, y + 22, 150, 52, 'logo', { fit: 'contain' }),
  t(220, y + 18, 330, 70, '{{brokerName}}, {{brokerTitle}}\n{{brokerPhone}}  |  {{brokerEmail}}', { color: '#ffffff', fontSize: 13, lineHeight: 1.5 }),
  t(560, y + 18, 220, 70, '{{company}}\n{{website}}', { color: '#ffffff', fontSize: 13, align: 'right', bold: true, lineHeight: 1.5 }),
];
const disclaimer = (y = 940): P => t(40, y, 736, 18, 'Information deemed reliable but not guaranteed. Subject to change without notice.', { fontSize: 8, color: '#888888' });
const facts = (x: number, y: number, w: number, keys: [string, string][], o: Partial<P> = {}): P[] => keys.flatMap(([k, v], n) => [
  t(x, y + n * 30, w * 0.45, 26, k, { fontSize: 12, bold: true, color: '$primary', ...o }),
  t(x + w * 0.45, y + n * 30, w * 0.55, 26, v, { fontSize: 12, ...o }),
  r(x, y + n * 30 + 25, w, 1, '#dddddd'),
]);
export type Template = { id: string; name: string; desc: string; pages: () => P[][] };
export const TEMPLATES: Template[] = [
  { id: 'sale', name: 'Sale Flyer', desc: '1 page · hero photo · price + key facts', pages: () => [[
    r(0, 0, 816, 90, '$primary'),
    t(40, 18, 560, 34, 'FOR SALE', { color: '$accent', fontSize: 26, bold: true }),
    t(40, 52, 600, 26, '{{propType}} Property', { color: '#ffffff', fontSize: 15 }),
    i(626, 15, 160, 60, 'logo', { fit: 'contain' }),
    i(0, 90, 816, 400, 'photo:0'),
    r(0, 430, 420, 60, '$accent', { opacity: 0.95 }),
    t(20, 440, 390, 40, '{{price}}', { color: '#ffffff', fontSize: 28, bold: true }),
    t(40, 510, 736, 36, '{{name}}', { fontSize: 26, bold: true, color: '$primary' }),
    t(40, 548, 736, 24, '{{address}}, {{city}}, {{state}} {{zip}}', { fontSize: 15, color: '#555555' }),
    t(40, 590, 400, 150, '{{description}}', { fontSize: 12.5, lineHeight: 1.5 }),
    t(40, 750, 400, 24, 'HIGHLIGHTS', { fontSize: 13, bold: true, color: '$primary' }),
    t(40, 776, 400, 150, '{{highlights|bullets}}', { fontSize: 12, lineHeight: 1.6 }),
    ...facts(470, 590, 306, [['Building', '{{buildingSf}} SF'], ['Lot', '{{lotAcres}} AC'], ['Year Built', '{{yearBuilt}}'], ['Zoning', '{{zoning}}'], ['Parking', '{{parking}}'], ['Flood Zone', '{{floodZone}}']]),
    m(470, 790, 306, 140),
    disclaimer(), ...footer(),
  ]] },
  { id: 'lease', name: 'Lease Flyer', desc: '1 page · split photos · lease rate', pages: () => [[
    i(0, 0, 540, 420, 'photo:0'), i(540, 0, 276, 210, 'photo:1'), i(540, 210, 276, 210, 'photo:2'),
    r(0, 420, 816, 120, '$dark'),
    t(40, 436, 200, 26, 'FOR LEASE', { color: '$accent', fontSize: 18, bold: true }),
    t(40, 464, 560, 36, '{{name}}', { color: '#ffffff', fontSize: 28, bold: true }),
    t(40, 504, 560, 24, '{{address}}, {{city}}, {{state}} {{zip}}', { color: '#dddddd', fontSize: 14 }),
    t(560, 450, 220, 70, '{{leaseRate}}', { color: '$accent', fontSize: 20, bold: true, align: 'right' }),
    t(40, 570, 440, 30, 'PROPERTY OVERVIEW', { fontSize: 14, bold: true, color: '$primary' }),
    t(40, 600, 440, 140, '{{description}}', { fontSize: 12.5, lineHeight: 1.5 }),
    t(40, 750, 440, 180, '{{highlights|bullets}}', { fontSize: 12, lineHeight: 1.6 }),
    ...facts(510, 570, 266, [['Available', '{{buildingSf}} SF'], ['Type', '{{propType}}'], ['Zoning', '{{zoning}}'], ['Parking', '{{parking}}'], ['Year Built', '{{yearBuilt}}']]),
    m(510, 730, 266, 200),
    disclaimer(), ...footer(),
  ]] },
  { id: 'bold', name: 'Bold Single-Page', desc: '1 page · full-bleed photo · minimal', pages: () => [[
    i(0, 0, 816, 1056, 'photo:0'),
    r(0, 560, 816, 496, '$primary', { opacity: 0.92 }),
    t(50, 590, 716, 30, '{{listing|upper}}  ·  {{propType|upper}}', { color: '$accent', fontSize: 16, bold: true }),
    t(50, 625, 716, 60, '{{name}}', { color: '#ffffff', fontSize: 40, bold: true }),
    t(50, 690, 716, 26, '{{address}}, {{city}}, {{state}}', { color: '#ffffff', fontSize: 16 }),
    r(50, 735, 80, 4, '$accent'),
    t(50, 760, 230, 60, '{{price}}\nPRICE', { color: '#ffffff', fontSize: 18, bold: true, lineHeight: 1.4 }),
    t(290, 760, 230, 60, '{{buildingSf}} SF\nBUILDING', { color: '#ffffff', fontSize: 18, bold: true, lineHeight: 1.4 }),
    t(530, 760, 230, 60, '{{lotAcres}} AC\nLAND', { color: '#ffffff', fontSize: 18, bold: true, lineHeight: 1.4 }),
    t(50, 840, 716, 80, '{{description}}', { color: '#eeeeee', fontSize: 12.5, lineHeight: 1.5 }),
    i(50, 950, 150, 60, 'logo', { fit: 'contain' }),
    t(380, 950, 386, 70, '{{brokerName}}  ·  {{brokerPhone}}\n{{brokerEmail}}  ·  {{website}}', { color: '#ffffff', fontSize: 12, align: 'right', lineHeight: 1.6 }),
  ]] },
  { id: 'brochure', name: 'Brochure (4 pages)', desc: 'Cover · overview · photos · location & demographics', pages: () => [
    [ i(0, 0, 816, 1056, 'photo:0'), r(0, 0, 816, 1056, '#000000', { opacity: 0.35 }),
      r(0, 700, 816, 220, '$primary', { opacity: 0.94 }),
      t(50, 720, 716, 28, 'OFFERING BROCHURE', { color: '$accent', fontSize: 16, bold: true }),
      t(50, 752, 716, 60, '{{name}}', { color: '#ffffff', fontSize: 42, bold: true }),
      t(50, 820, 716, 30, '{{address}}  ·  {{city}}, {{state}} {{zip}}', { color: '#ffffff', fontSize: 17 }),
      t(50, 860, 716, 30, '{{price}}  ·  {{buildingSf}} SF  ·  {{propType}}', { color: '$accent', fontSize: 17, bold: true }),
      r(0, 920, 816, 136, '#ffffff'), i(50, 950, 200, 76, 'logo', { fit: 'contain' }),
      t(400, 950, 366, 76, '{{company}}\n{{tagline}}\n{{website}}', { align: 'right', fontSize: 13, lineHeight: 1.6, color: '$primary', bold: true }) ],
    [ r(0, 0, 816, 80, '$primary'), t(40, 24, 600, 34, 'PROPERTY OVERVIEW', { color: '#ffffff', fontSize: 22, bold: true }),
      t(40, 110, 736, 200, '{{description}}', { fontSize: 14, lineHeight: 1.6 }),
      t(40, 320, 360, 26, 'INVESTMENT HIGHLIGHTS', { fontSize: 15, bold: true, color: '$primary' }),
      t(40, 352, 360, 300, '{{highlights|bullets}}', { fontSize: 13, lineHeight: 1.8 }),
      r(430, 320, 346, 360, '#f3f4f6'),
      ...facts(450, 336, 306, [['Price', '{{price}}'], ['Lease Rate', '{{leaseRate}}'], ['Building', '{{buildingSf}} SF'], ['Lot', '{{lotAcres}} AC'], ['Year Built', '{{yearBuilt}}'], ['Zoning', '{{zoning}}'], ['Parking', '{{parking}}'], ['County', '{{county}}'], ['Flood Zone', '{{floodZone}}'], ['Coordinates', '{{lat}}, {{lon}}']]),
      i(40, 700, 736, 230, 'photo:1'), disclaimer(950), ...footer(980) ],
    [ r(0, 0, 816, 80, '$primary'), t(40, 24, 600, 34, 'PROPERTY PHOTOS', { color: '#ffffff', fontSize: 22, bold: true }),
      i(40, 110, 736, 400, 'photo:2'), i(40, 530, 358, 210, 'photo:3'), i(418, 530, 358, 210, 'photo:4'),
      i(40, 760, 358, 200, 'photo:5'), i(418, 760, 358, 200, 'photo:0'), ...footer(980) ],
    [ r(0, 0, 816, 80, '$primary'), t(40, 24, 600, 34, 'LOCATION & DEMOGRAPHICS', { color: '#ffffff', fontSize: 22, bold: true }),
      m(40, 110, 736, 480),
      t(40, 615, 736, 26, 'AREA DEMOGRAPHICS (CENSUS TRACT {{tract}})', { fontSize: 15, bold: true, color: '$primary' }),
      r(40, 655, 230, 110, '#f3f4f6'), r(293, 655, 230, 110, '#f3f4f6'), r(546, 655, 230, 110, '#f3f4f6'),
      t(40, 675, 230, 80, '{{population}}\nPopulation', { align: 'center', fontSize: 22, bold: true, color: '$primary', lineHeight: 1.5 }),
      t(293, 675, 230, 80, '{{medianIncome}}\nMedian HH Income', { align: 'center', fontSize: 22, bold: true, color: '$primary', lineHeight: 1.5 }),
      t(546, 675, 230, 80, '{{medianAge}}\nMedian Age', { align: 'center', fontSize: 22, bold: true, color: '$primary', lineHeight: 1.5 }),
      t(40, 790, 736, 60, 'Source: U.S. Census Bureau ACS 5-year estimates; FEMA NFHL flood zone: {{floodZone}}. Map © OpenStreetMap contributors.', { fontSize: 10, color: '#777777' }),
      t(40, 860, 736, 90, 'For more information contact {{brokerName}} at {{brokerPhone}} or {{brokerEmail}}.', { fontSize: 14, bold: true, color: '$dark' }),
      ...footer(980) ],
  ] },
];
export function instantiate(tp: Template): El[][] { return tp.pages().map(pg => pg.map(e => ({ ...e, id: uid() }))); }
