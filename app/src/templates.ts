// Template library. Coordinates are CSS px at 96 dpi (Letter = 816×1056).
// Colors: $primary $secondary $accent $dark $light. Fonts: $head $body or a family name.
// Text supports {{field|filter}} tokens (see docs/template-authoring.md).
import type { DocSize, El, ImageEl, Page, RectEl, TableEl, TextEl } from './types';
import { SIZES } from './types';
import { uid } from './store';
type N<T> = Omit<T, 'id' | 'type'>;
const T = (x: number, y: number, w: number, h: number, text: string, o: Partial<N<TextEl>> = {}): El => ({ id: '', type: 'text', x, y, w, h, text, size: 12, color: '$dark', font: '$body', ...o });
const R = (x: number, y: number, w: number, h: number, fill: string, o: Partial<N<RectEl>> = {}): El => ({ id: '', type: 'rect', x, y, w, h, fill, ...o });
const I = (x: number, y: number, w: number, h: number, src: string, o: Partial<N<ImageEl>> = {}): El => ({ id: '', type: 'image', x, y, w, h, src, fit: 'cover', ...o });
const TB = (x: number, y: number, w: number, h: number, rows: string, o: Partial<N<TableEl>> = {}): El => ({ id: '', type: 'table', x, y, w, h, rows, cols: [1, 1], aligns: ['left', 'right'], size: 12, rowH: 27,
  font: '$body', color: '$dark', labelColor: '$secondary', labelWeight: 800, rule: '$light', ruleW: 1, skipEmpty: true, ...o });
const S = (id: string) => SIZES.find(s => s.id === id)!;

// ----- shared blocks: "Classic Band" family -----
const W = 816;
const classicHeader = (w = W, right = '{{cityStateZip|upper}}'): El[] => [
  I(35, 25, 509, 60, 'logo', { fit: 'contain', fx: 0, name: 'logo' }),
  T(w - 151, 14, 110, 80, '{{forLabel|upper}}', { font: '$head', weight: 400, size: 28, color: '$primary', align: 'right', lh: 1.1, ls: 7.5, valign: 'top', name: 'listing label' }),
  R(0, 100, w, 50, '$primary', { name: 'title band' }),
  T(35, 100, w * 0.55, 50, '{{name|upper}}', { font: '$head', size: 30, color: '#ffffff', valign: 'middle', autoFit: true, lh: 1.05, ls: 2.5, name: 'title' }),
  T(w * 0.55 + 45, 100, w * 0.45 - 81, 50, right, { font: '$head', size: 17, color: '#ffffff', valign: 'middle', align: 'right', autoFit: true, ls: 4.5, name: 'city' }),
];
const brokerCol = (n: number, x: number, y: number, w = 190): El[] => {
  const f = { showIf: `{{broker${n}Name}}`, flow: 'brokers', flowIdx: n, flowGap: 20 };
  return [
    R(x, y, 3, 65, '$primary', f),
    T(x + 18, y + 2, w, 20, `{{broker${n}Name|upper}}`, { font: 'Barlow Condensed', weight: 600, size: 16, ls: 3.3, color: '$secondary', ...f }),
    T(x + 18, y + 16, w, 50, `{{broker${n}Email}}\n{{broker${n}Phone|pre:O: }}{{broker${n}Mobile|pre: \u00a0C: }}`, { font: 'Barlow Condensed', weight: 400, size: 14, ls: 1, color: '#414042', lh: 1.32, autoFit: true, ...f }),
  ];
};
const classicFooter = (h = 1056, w = W): El[] => [
  ...brokerCol(1, 35, h - 102), ...brokerCol(2, 35 + (w > 900 ? 222 : 200), h - 102), ...brokerCol(3, 35 + (w > 900 ? 444 : 400), h - 102),
  T(35, h - 30, w - 70, 14, '{{disclaimer}}', { font: 'Barlow Condensed', size: 8.5, color: '#221e1f', autoFit: true, name: 'disclaimer' }),
];
const sectionHead = (x: number, y: number, w: number, text: string): El => T(x, y - 4, w, 18, text, { weight: 800, size: 13, color: '$secondary', ls: 6, upper: true });
const offering = (x: number, y: number, rows: string, h = 260, rowGap = 15): El[] => [
  T(x + 5, y + 1, 360, 18, 'Offering Summary', { weight: 800, size: 13, color: '$secondary', ls: 6.5, upper: true }),
  R(x, y + 23, 365, 4, '$light'),
  TB(x, y + 25, 365, h, rows, { rowGap }),
];
const leaseRows = '@suites\nLease Rate:|{{leaseRate}}{{leaseType|pre: (|post:)}}\nAvailable SF:|{{availableSf}}\nBuilding Size:|{{buildingSf}}\nOffice SF:|{{officeSf}}\nLot Size:|{{lotAcres}}\nClear Height:|{{clearHeight}}\nYear Built:|{{yearBuilt}}\nZoning:|{{zoning}}\nMarket:|{{market}}';
const saleRows = 'Sale Price:|{{price}}\nCap Rate:|{{capRate}}\nNOI:|{{noi}}\nBuilding SF:|{{buildingSf}}\nLot Size:|{{lotAcres}}\nYear Built:|{{yearBuilt}}\nZoning:|{{zoning}}\nMarket:|{{market}}';
const anyRows = 'Sale Price:|{{price}}\n' + leaseRows;

// ----- page builders -----

// ----- "Signature" family: clean white page, serif accents, navy title, broker strip + logo bottom right -----
const SIG_LH = 17 / 12;
const sigHeader = (pg: string): El[] => [
  T(36, 36.4, 560, 38, '{{name}}', { font: '$body', size: 30, color: '$primary', lh: 1.2, ls: -0.6, autoFit: true, name: 'title' }),
  T(36, 74.2, 560, 18, '{{subtitle}}', { font: '$body', size: 14, color: '$dark', lh: 1.2, autoFit: true, name: 'subtitle' }),
  T(560, 35.9, 220, 36, '{{forLabel}}', { font: '$head', size: 26, color: '$primary', align: 'right', lh: 1.333, autoFit: true, name: 'listing label' }),
  T(600, 998.2, 180, 18, pg, { font: '$body', size: 14, color: '#929091', align: 'right', lh: 1.2, name: 'page number' }),
];
const sigBroker = (n: number): El[] => {
  const f = { showIf: `{{broker${n}Name}}`, flow: 'sigbrokers', flowIdx: n, flowGap: 12.5 };
  return [
    T(36, 921.5, 200, 24, `{{broker${n}Name}}`, { font: '$head', size: 18, color: '$primary', lh: 1.333, ...f }),
    T(36, 946.2, 200, 32, `{{broker${n}Email}}\n{{broker${n}Phone}}`, { font: '$body', size: 11, color: '$dark', lh: 15 / 11, ...f }),
    R(240, 924, 1, 52, '$secondary', { ...f, flowEnd: 7 }),
  ];
};
const sigFooter = (): El[] => [
  ...sigBroker(1), ...sigBroker(2), ...sigBroker(3),
  I(640, 930, 140, 40, 'logo', { fit: 'contain', fx: 1, name: 'logo right' }),
  T(36, 996.1, 632, 26, '{{disclaimer}}', { font: '$body', size: 10, color: '#929091', lh: 1.2, ls: 1.7, autoFit: true, name: 'disclaimer' }),
];
const SIG_DETAILS = 'Sale Price:|{{salePrice}}\nLease Rate:|{{leaseRateIf}}\nLease Type:|{{leaseTypeIf}}\nAvailable:|{{availableSf}}\nLot Size:|{{lotAcres}}\nBuilding Size:|{{buildingSf}}\nClass:|{{buildingClass}}\nParking:|{{parking}}\nZoning:|{{zoning}}\nYear Built:|{{yearBuilt}}\nTraffic Count:|{{traffic}}';
const sigHead = (x: number, y: number, text: string, o: Partial<N<TextEl>> = {}): El => T(x, y, 360, 30, text, { font: '$body', size: 24, color: '$dark', lh: 1.2, ...o });
const sigBullets = (y: number, text: string, h: number, o: Partial<N<TextEl>> = {}): El =>
  T(41, y, 359, h, text, { font: '$body', size: 12, color: '$dark', lh: SIG_LH, indent: 15, paraGap: 5, ...o });
export type PageDef = { id: string; name: string; size: string; make: () => El[] };
const P: PageDef[] = [
  { id: 'sig-overview', name: 'Signature · Overview', size: 'letter', make: () => {
    const st = (i: number, grow = false, showIf?: string) => ({ stack: 'left', stackIdx: i, stackGrow: grow, stackMax: 905, ...(showIf ? { showIf } : {}) });
    return [
      ...sigHeader('1'),
      I(36, 132, 744, 340, 'photo:0', { name: 'hero' }),
      sigHead(36, 505.3, 'Details', st(0)),
      TB(36, 543.9, 364, 92, SIG_DETAILS, { ...st(1, true), size: 12, rowH: 23, cols: [1, 1], labelWeight: 400, labelColor: '$dark', color: '$dark', rule: '$light', ruleW: 1, font: '$body' }),
      sigHead(36, 635.3, 'Highlights', { ...st(2, false, '{{highlights}}') }),
      sigBullets(672.9, '{{highlights|bullets}}', 40, { ...st(3, true, '{{highlights}}'), stackGap: 48 }),
      sigHead(36, 719, 'Location Description', { ...st(4, false, '{{locationDescription}}') }),
      sigBullets(755.6, '{{locationDescription|bullets}}', 40, { ...st(5, true, '{{locationDescription}}'), stackGap: 48 }),
      sigHead(416, 505.3, 'Overview'),
      T(416, 543.9, 354, 330, '{{description}}', { font: '$body', size: 12, color: '$dark', lh: SIG_LH, align: 'justify', autoFit: true, name: 'overview' }),
      ...sigFooter()];
  } },
  { id: 'sig-photos5', name: 'Signature · Photos (2 + 3)', size: 'letter', make: () => [
    ...sigHeader('2'),
    I(36, 132, 364, 351, 'photo:1'), I(416, 132, 364, 351, 'photo:2'),
    I(36, 499, 237, 351, 'photo:3'), I(289, 499, 238, 351, 'photo:4'), I(543, 499, 237, 351, 'photo:5'),
    ...sigFooter()] },
  { id: 'sig-photos6', name: 'Signature · Photos (2 × 3)', size: 'letter', make: () => [
    ...sigHeader('3'),
    ...[132, 377, 621].flatMap((y, r) => [I(36, y, 364, 229, `photo:${1 + r * 2}`), I(416, y, 364, 229, `photo:${2 + r * 2}`)]),
    ...sigFooter()] },
  { id: 'sig-plans', name: 'Signature · Site plan', size: 'letter', make: () => [
    ...sigHeader('2'), I(36, 132, 744, 718, 'sitePlan', { fit: 'contain' }), ...sigFooter()] },
  { id: 'sig-maps', name: 'Signature · Maps', size: 'letter', make: () => [
    ...sigHeader('4'), I(36, 132, 744, 351, 'map'), I(36, 499, 744, 351, 'aerial'), ...sigFooter()] },
  { id: 'sig-retail', name: 'Signature · Co-tenancy & demographics', size: 'letter', make: () => [
    ...sigHeader('3'), I(36, 132, 744, 440, 'retailMap'),
    sigHead(36, 592, 'Demographics'),
    TB(36, 632, 744, 200, 'Radius|1 Mile|3 Miles|5 Miles\nPopulation|{{dem_pop1}}|{{dem_pop3}}|{{dem_pop5}}\nPopulation Growth|{{dem_growth1}}|{{dem_growth3}}|{{dem_growth5}}\nHouseholds|{{dem_hh1}}|{{dem_hh3}}|{{dem_hh5}}\nMedian HH Income|{{dem_med1}}|{{dem_med3}}|{{dem_med5}}\nAverage HH Income|{{dem_inc1}}|{{dem_inc3}}|{{dem_inc5}}\nDaytime Population|{{dem_day1}}|{{dem_day3}}|{{dem_day5}}',
      { cols: [2, 1, 1, 1], aligns: ['left', 'right', 'right', 'right'], header: true, headColor: '$primary', headWeight: 700, size: 12, rowH: 24, labelWeight: 400, labelColor: '$dark', rule: '$light', font: '$body', skipEmpty: true }),
    T(36, 860, 744, 30, 'Sources: U.S. Census Bureau ACS 5-year (2023; growth vs. 2019) by block group within each radius. Retailers © OpenStreetMap contributors.', { font: '$body', size: 9, color: '#777777', lh: 1.3 }),
    ...sigFooter()] },

  { id: 'classic-summary-left', name: 'Classic Band · Summary left', size: 'letter', make: () => [
    ...classicHeader(), I(0, 150, W, 383, 'photo:0', { name: 'hero photo' }),
    ...offering(35, 549, anyRows, 360),
    sectionHead(416, 549, 365, 'Location Description'),
    T(416, 568, 365, 50, '{{locationDescription}}', { size: 12.9, lh: 1.4, align: 'justify', autoFit: true }),
    sectionHead(416, 620, 365, 'Property Description'),
    T(416, 640, 365, 290, '{{description}}\n\n{{highlights|dash}}', { size: 12.9, lh: 1.4, align: 'justify', autoFit: true }),
    ...classicFooter()] },
  { id: 'classic-summary-right', name: 'Classic Band · Summary right', size: 'letter', make: () => [
    ...classicHeader(), I(0, 150, W, 383, 'photo:0', { name: 'hero photo' }),
    sectionHead(35, 549, 365, 'Location Description'),
    T(35, 564.5, 316, 160, '{{locationDescription}}', { size: 12, lh: 1.4, autoFit: true }),
    sectionHead(35, 738, 365, 'Property Highlights'),
    T(35, 741, 365, 185, '{{highlights|bullets}}', { size: 12, lh: 2.25, autoFit: true }),
    ...offering(416, 549, anyRows, 360),
    ...classicFooter()] },
  { id: 'classic-demographics', name: 'Classic Band · Demographics', size: 'letter', make: () => [
    ...classicHeader(), I(173, 150, 470, 383, 'photo:0', { name: 'photo' }),
    sectionHead(35, 549, 365, 'Property Description'),
    T(35, 568, 365, 100, '{{description}}', { size: 12.9, lh: 1.4, align: 'justify', autoFit: true }),
    sectionHead(35, 664, 365, 'Property Highlights'),
    T(35, 686, 365, 230, '{{highlights|bullets}}', { size: 12, lh: 2.1, autoFit: true }),
    ...offering(416, 549, 'Lease Rate:|{{leaseRate}}\nSale Price:|{{price}}\nAvailable SF:|{{availableSf}}\nBuilding Size:|{{buildingSf}}', 110, 0),
    TB(416, 673, 365, 120, 'Demographics|1 Mile|3 Miles|5 Miles\nTotal Households|{{dem_hh1}}|{{dem_hh3}}|{{dem_hh5}}\nTotal Population|{{dem_pop1}}|{{dem_pop3}}|{{dem_pop5}}\nAverage HH Income|{{dem_inc1}}|{{dem_inc3}}|{{dem_inc5}}',
      { cols: [145, 67, 76, 77], aligns: ['left', 'left', 'left', 'left'], header: true, headColor: '$secondary', headWeight: 800, rowH: 26, skipEmpty: false }),
    R(416, 696, 365, 4, '$light'),
    ...classicFooter()] },
  { id: 'classic-photos', name: 'Classic Band · Two photos', size: 'letter', make: () => [
    ...classicHeader(), I(0, 150, W, 383, 'photo:1'), I(0, 548, W, 383, 'photo:2'), ...classicFooter()] },
  { id: 'classic-aerial', name: 'Classic Band · Full aerial / plan', size: 'letter', make: () => [
    ...classicHeader(), I(0, 150, W, 781, 'aerial'), ...classicFooter()] },
  { id: 'classic-l-features', name: 'Classic Band Landscape · Feature strip', size: 'letter-l', make: () => {
    const w = 1056; const feats = [['dollar', '{{leaseRate}}'], ['building', '{{buildingClass|pre:Class }}'], ['car', '{{parking|pre:Parking }}'], ['people', 'On-Site Management'], ['shield', 'Secured Access'], ['pin', '{{market}}'], ['food', 'Nearby Dining'], ['road', '{{traffic}}']];
    const step = w / (feats.length + 1);
    return [...classicHeader(w, '{{address|upper|post: }}{{cityStateZip|upper}}'), I(0, 150, w, 428, 'photo:0'), R(0, 528, w, 50, '$primary', { opacity: 0.75 }),
      T(35, 528, w - 70, 50, '{{availableSf|upper|post: FOR }}{{listing|upper}}', { font: '$head', size: 23, color: '#ffffff', valign: 'middle', ls: 3 }),
      R(0, 578, w, 113, '$primary'),
      ...feats.flatMap(([ic, label], i) => [I(step * (i + 1) - 25, 592, 50, 50, 'icon:' + ic, { fit: 'contain' }),
        T(step * (i + 1) - step / 2 + 2, 646, step - 4, 40, label, { font: 'Open Sans', weight: 700, size: 9.5, color: '#ffffff', align: 'center', lh: 1.15, autoFit: true })]),
      ...feats.slice(1).map((_, i) => R(step * (i + 1) + step / 2, 598, 1, 80, '#ffffff', { opacity: 0.6 })),
      ...classicFooter(816, w)];
  } },
  { id: 'classic-l-photos', name: 'Classic Band Landscape · Photo collage', size: 'letter-l', make: () => [
    ...classicHeader(1056), I(0, 150, 529, 541, 'photo:1'), I(533, 150, 523, 268, 'photo:2'), I(533, 422, 523, 269, 'photo:3'), ...classicFooter(816, 1056)] },
  { id: 'corporate-header', name: 'Corporate Header · Overview', size: 'letter', make: () => [
    R(0, 0, 245, 140, '$secondary'), I(40, 32, 165, 76, 'logoLight', { fit: 'contain', name: 'logo center' }), R(245, 0, 571, 140, '$primary'),
    T(280, 30, 500, 40, '{{name}}', { font: 'Open Sans', size: 28, color: '#ffffff', autoFit: true }),
    T(280, 76, 500, 26, '{{fullAddress}}', { font: 'Open Sans', size: 18, color: '#ffffff', autoFit: true }),
    I(0, 140, W, 388, 'photo:0'),
    T(40, 540, 230, 20, 'Offering Summary', { font: 'Open Sans', weight: 700, size: 13, color: '$secondary', upper: true }),
    R(40, 562, 230, 1, '#b8c4cf'),
    TB(40, 566, 230, 300, 'Lease Rate:|{{leaseRate}}\nSale Price:|{{price}}\nAvailable:|{{availableSf}}\nBuilding SF:|{{buildingSf}}\nBuilding Class:|{{buildingClass}}\nYear Built:|{{yearBuilt}}\nParking:|{{parking}}',
      { font: 'Open Sans', labelWeight: 400, rule: undefined, rowH: 32, cols: [1, 1] }),
    T(292, 540, 490, 20, 'Property Overview', { font: 'Open Sans', weight: 700, size: 13, color: '$secondary', upper: true }),
    T(292, 562, 490, 64, '{{description}}', { font: 'Open Sans', size: 12, color: '#333333', lh: 1.55, autoFit: true }),
    T(292, 634, 490, 20, 'Location Overview', { font: 'Open Sans', weight: 700, size: 13, color: '$secondary', upper: true }),
    T(292, 656, 490, 46, '{{locationDescription}}', { font: 'Open Sans', size: 12, color: '#333333', lh: 1.55, autoFit: true }),
    T(292, 710, 490, 20, 'Property Highlights', { font: 'Open Sans', weight: 700, size: 13, color: '$secondary', upper: true }),
    T(292, 734, 490, 186, '{{highlights|bullets}}', { font: 'Open Sans', size: 12, color: '#333333', lh: 2.15, autoFit: true }),
    R(0, 926, W, 130, '$primary'),
    ...[1, 2, 3].flatMap(n => [T(40 + (n - 1) * 192, 944, 185, 18, `{{broker${n}Name|upper}}`, { font: 'Open Sans', weight: 700, size: 13, color: '$light' }),
      T(40 + (n - 1) * 192, 962, 185, 56, `{{broker${n}Phone}}\n{{broker${n}Email}}\n{{website}}`, { font: 'Open Sans', weight: 600, size: 13, color: '#ffffff', lh: 1.25, autoFit: true, showIf: `{{broker${n}Name}}` })]),
    T(40, 1020, 736, 12, '{{disclaimer}}', { font: 'Open Sans', size: 6, color: '#ffffff', autoFit: true })] },

  // ----- original layouts -----
  { id: 'availability', name: 'Multi-Tenant Availability · Site plan + suites', size: 'letter', make: () => [
    ...classicHeader(), I(35, 168, 746, 430, 'sitePlan', { fit: 'contain', stroke: '#d0d7de', sw: 1 }),
    T(35, 614, 746, 22, 'Availability', { weight: 800, size: 14, color: '$secondary', ls: 8, upper: true }), R(35, 638, 746, 4, '$light'),
    TB(35, 642, 746, 200, 'Suite|Size|Rate|Status|Notes', { source: 'suites', header: true, cols: [1.1, 1, 1.2, 0.9, 1.6], aligns: ['left', 'left', 'left', 'left', 'left'], headColor: '#ffffff', headFill: '$secondary', rowH: 28, zebra: '#f4f8f7', skipEmpty: false }),
    T(35, 860, 746, 70, '{{description}}', { size: 12, lh: 1.4, autoFit: true }),
    ...classicFooter()] },
  { id: 'land', name: 'Land for Sale · Aerial', size: 'letter', make: () => [
    I(0, 0, W, 600, 'aerial'), R(0, 0, W, 600, '#000000', { opacity: 0.18 }),
    I(36, 30, 300, 56, 'logoLight', { fit: 'contain', fx: 0 }),
    R(36, 470, 470, 100, '$primary', { opacity: 0.94 }),
    T(56, 480, 440, 26, '{{forLabel|upper}} · {{propType|upper}}', { font: '$head', size: 16, color: '#ffffff', ls: 10 }),
    T(56, 506, 440, 56, '{{lotAcres}}', { font: '$head', weight: 600, size: 44, color: '#ffffff', autoFit: true }),
    T(36, 622, 744, 38, '{{name}}', { font: '$head', weight: 600, size: 30, color: '$secondary', autoFit: true }),
    T(36, 660, 744, 24, '{{fullAddress}}', { size: 15, color: '#555555' }),
    T(36, 704, 420, 220, '{{description}}\n\n{{highlights|bullets}}', { size: 12.5, lh: 1.5, autoFit: true }),
    R(480, 704, 300, 220, '#f3f6f5'),
    TB(492, 712, 276, 200, 'Price:|{{price}}\nAcreage:|{{lotAcres}}\nZoning:|{{zoning}}\nFrontage / Traffic:|{{traffic}}\nFlood Zone:|{{floodZone}}\nCounty:|{{county}}', { rowH: 32 }),
    ...classicFooter()] },
  { id: 'retail-aerial', name: 'Retail · Aerial + traffic (landscape)', size: 'letter-l', make: () => [
    I(0, 0, 640, 816, 'retailMap'), R(640, 0, 416, 816, '$secondary'),
    I(670, 30, 250, 50, 'logoLight', { fit: 'contain', fx: 0 }),
    T(670, 110, 356, 24, '{{forLabel|upper}}', { font: '$head', size: 18, color: '$accent', ls: 12 }),
    T(670, 138, 356, 80, '{{name}}', { font: '$head', weight: 600, size: 32, color: '#ffffff', lh: 1.1, autoFit: true }),
    T(670, 222, 356, 40, '{{fullAddress}}', { size: 14, color: '#d9e2ea', lh: 1.35, autoFit: true }),
    R(670, 276, 60, 3, '$accent'),
    ...[['{{priceOrRate}}', 'Price / Rate'], ['{{availableSf}}', 'Available'], ['{{traffic}}', 'Traffic Count']].flatMap(([v, l], i) => [
      T(670, 300 + i * 70, 356, 34, v, { font: '$head', weight: 600, size: 26, color: '#ffffff', autoFit: true }), T(670, 334 + i * 70, 356, 18, l, { size: 11, color: '#9fb3c6', upper: true, ls: 10 })]),
    TB(670, 512, 356, 160, 'Demographics|1 Mi|3 Mi|5 Mi\nPopulation|{{dem_pop1}}|{{dem_pop3}}|{{dem_pop5}}\nHouseholds|{{dem_hh1}}|{{dem_hh3}}|{{dem_hh5}}\nMedian HH Inc.|{{dem_med1}}|{{dem_med3}}|{{dem_med5}}\nAvg HH Income|{{dem_inc1}}|{{dem_inc3}}|{{dem_inc5}}\nDaytime Pop.|{{dem_day1}}|{{dem_day3}}|{{dem_day5}}',
      { cols: [1.5, 1, 1, 1], aligns: ['left', 'right', 'right', 'right'], header: true, headColor: '$accent', color: '#ffffff', labelColor: '#ffffff', rule: '#33557a', rowH: 26, size: 11, skipEmpty: true }),
    ...[1, 2].flatMap(n => [T(670 + (n - 1) * 180, 690, 175, 20, `{{broker${n}Name|upper}}`, { font: 'Barlow Condensed', weight: 600, size: 15, color: '#ffffff' }),
      T(670 + (n - 1) * 180, 710, 175, 40, `{{broker${n}Phone}}\n{{broker${n}Email}}`, { font: 'Barlow Condensed', size: 13, color: '#c9d6e2', lh: 1.25, autoFit: true })]),
    T(670, 780, 356, 24, '{{disclaimer}}', { font: 'Barlow Condensed', size: 7, color: '#8ea3b8', lh: 1.2, autoFit: true })] },
  { id: 'retail-cotenancy', name: 'Retail · Co-tenancy aerial (landscape)', size: 'letter-l', make: () => [
    I(0, 0, 1056, 736, 'retailMap'), R(0, 0, 1056, 70, '$secondary', { opacity: 0.92 }),
    T(30, 0, 700, 70, '{{name|upper}}', { font: '$head', weight: 600, size: 28, color: '#ffffff', valign: 'middle', autoFit: true, ls: 2 }),
    T(700, 0, 326, 70, '{{fullAddress}}', { size: 13, color: '#d9e2ea', valign: 'middle', align: 'right', autoFit: true }),
    R(0, 736, 1056, 80, '#ffffff'), R(0, 736, 1056, 4, '$primary'),
    ...[1, 2, 3].flatMap(n => [T(30 + (n - 1) * 230, 752, 220, 20, `{{broker${n}Name|upper}}`, { font: 'Barlow Condensed', weight: 600, size: 15, color: '$secondary' }),
      T(30 + (n - 1) * 230, 772, 220, 36, `{{broker${n}Phone}}\n{{broker${n}Email}}`, { font: 'Barlow Condensed', size: 13, color: '#414042', lh: 1.2, autoFit: true })]),
    I(746, 750, 280, 52, 'logo', { fit: 'contain', fx: 1 })] },
  { id: 'retail-demographics', name: 'Retail · Ring demographics', size: 'letter', make: () => [
    ...classicHeader(), sectionHead(35, 175, 746, 'Trade Area Demographics'), R(35, 197, 746, 4, '$light'),
    I(35, 214, 746, 430, 'ringMap', { stroke: '#d0d7de', sw: 1 }),
    TB(35, 664, 746, 220, 'Demographics|1 Mile|3 Miles|5 Miles\nTotal Population|{{dem_pop1}}|{{dem_pop3}}|{{dem_pop5}}\nPopulation Growth (2019–23)|{{dem_growth1}}|{{dem_growth3}}|{{dem_growth5}}\nTotal Households|{{dem_hh1}}|{{dem_hh3}}|{{dem_hh5}}\nMedian HH Income|{{dem_med1}}|{{dem_med3}}|{{dem_med5}}\nAverage HH Income|{{dem_inc1}}|{{dem_inc3}}|{{dem_inc5}}\nDaytime Population|{{dem_day1}}|{{dem_day3}}|{{dem_day5}}',
      { cols: [2, 1, 1, 1], aligns: ['left', 'right', 'right', 'right'], header: true, headColor: '#ffffff', headFill: '$secondary', rowH: 30, skipEmpty: true }),
    T(35, 892, 746, 30, 'Sources: U.S. Census Bureau ACS 5-year estimates (2023; growth vs. 2019), aggregated by block group within each radius. Daytime population entered by broker. Map © OpenStreetMap contributors.', { size: 9, color: '#777777', lh: 1.3 }),
    ...classicFooter()] },
  { id: 'om-cover', name: 'Investment Summary · OM cover', size: 'letter', make: () => [
    I(0, 0, W, 1056, 'photo:0'), R(0, 0, W, 1056, '$secondary', { opacity: 0.55 }),
    I(56, 56, 320, 64, 'logoLight', { fit: 'contain', fx: 0 }),
    T(56, 560, 704, 24, 'Offering Memorandum', { font: '$head', size: 18, color: '$light', ls: 18, upper: true }),
    T(56, 590, 704, 120, '{{name}}', { font: '$head', weight: 600, size: 52, color: '#ffffff', lh: 1.05, autoFit: true }),
    T(56, 714, 704, 30, '{{fullAddress}}', { size: 18, color: '#ffffff', autoFit: true }),
    R(56, 770, 704, 1, '#ffffff', { opacity: 0.5 }),
    ...[['{{price}}', 'Offering Price'], ['{{capRate}}', 'Cap Rate'], ['{{noi}}', 'NOI'], ['{{buildingSf}}', 'Building']].flatMap(([v, l], i) => [
      T(56 + i * 176, 790, 170, 36, v, { font: '$head', weight: 600, size: 26, color: '#ffffff', autoFit: true }), T(56 + i * 176, 828, 170, 18, l, { size: 11, color: '$light', upper: true, ls: 10 })]),
    R(0, 940, W, 116, '#ffffff', { opacity: 0.96 }),
    ...[1, 2, 3].flatMap(n => [T(56 + (n - 1) * 236, 960, 220, 20, `{{broker${n}Name|upper}}`, { font: 'Barlow Condensed', weight: 600, size: 16, color: '$secondary' }),
      T(56 + (n - 1) * 236, 980, 220, 40, `{{broker${n}Phone}}\n{{broker${n}Email}}`, { font: 'Barlow Condensed', size: 14, color: '#414042', lh: 1.2, autoFit: true })]),
    T(56, 1030, 704, 14, 'Confidential — for qualified investors only. {{disclaimer}}', { font: 'Barlow Condensed', size: 7.5, color: '#666666', autoFit: true })] },
  { id: 'investment-summary', name: 'Investment Summary · Financial page', size: 'letter', make: () => [
    ...classicHeader(), sectionHead(35, 175, 746, 'Investment Summary'), R(35, 197, 746, 4, '$light'),
    ...[['{{price}}', 'Price'], ['{{capRate}}', 'Cap Rate'], ['{{noi}}', 'NOI'], ['{{buildingSf}}', 'Building']].flatMap(([v, l], i) => [
      R(35 + i * 189, 218, 179, 96, '#f3f6f5'), T(35 + i * 189, 236, 179, 36, v, { font: '$head', weight: 600, size: 26, color: '$primary', align: 'center', autoFit: true }),
      T(35 + i * 189, 276, 179, 20, l, { size: 11, upper: true, ls: 10, align: 'center', color: '#5b6573' })]),
    ...offering(35, 340, saleRows, 300),
    sectionHead(416, 340, 365, 'Investment Highlights'),
    T(416, 362, 365, 280, '{{highlights|bullets}}', { size: 12.5, lh: 1.9, autoFit: true }),
    I(35, 660, 746, 270, 'photo:1'), ...classicFooter()] },
  { id: 'comps', name: 'Sale Comparables', size: 'letter', make: () => [
    ...classicHeader(), sectionHead(35, 175, 746, 'Sale Comparables'), R(35, 197, 746, 4, '$light'),
    TB(35, 201, 746, 330, 'Property|Sold|Price|SF|$/SF|Cap', { source: 'comps', header: true, cols: [2.6, 0.9, 1.3, 0.9, 0.9, 0.7], aligns: ['left', 'left', 'right', 'right', 'right', 'right'], headColor: '#ffffff', headFill: '$secondary', rowH: 40, zebra: '#f4f8f7', skipEmpty: false }),
    I(35, 560, 746, 370, 'map', { stroke: '#d0d7de', sw: 1 }), ...classicFooter()] },
  { id: 'demographics', name: 'Location & Demographics', size: 'letter', make: () => [
    ...classicHeader(), sectionHead(35, 175, 746, 'Location Overview'), R(35, 197, 746, 4, '$light'),
    I(35, 214, 746, 400, 'map', { stroke: '#d0d7de', sw: 1 }),
    TB(35, 636, 746, 130, 'Demographics|1 Mile|3 Miles|5 Miles\nTotal Population|{{dem_pop1}}|{{dem_pop3}}|{{dem_pop5}}\nTotal Households|{{dem_hh1}}|{{dem_hh3}}|{{dem_hh5}}\nAverage HH Income|{{dem_inc1}}|{{dem_inc3}}|{{dem_inc5}}',
      { cols: [2, 1, 1, 1], aligns: ['left', 'right', 'right', 'right'], header: true, headColor: '#ffffff', headFill: '$secondary', rowH: 30, skipEmpty: false }),
    ...[['{{population}}', 'Census tract population'], ['{{medianIncome}}', 'Tract median HH income'], ['{{floodZone}}', 'FEMA flood zone']].flatMap(([v, l], i) => [
      R(35 + i * 252, 790, 242, 90, '#f3f6f5'), T(35 + i * 252, 806, 242, 34, v, { font: '$head', weight: 600, size: 22, color: '$primary', align: 'center', autoFit: true }),
      T(35 + i * 252, 846, 242, 20, l, { size: 11, align: 'center', color: '#5b6573' })]),
    T(35, 892, 746, 30, 'Sources: U.S. Census Bureau (ACS 5-yr), FEMA NFHL. Map © OpenStreetMap contributors. Radius demographics: Census ACS block groups within each ring.', { size: 9, color: '#777777' }),
    ...classicFooter()] },
  { id: 'tabloid-cover', name: 'Leasing Brochure · Dark band cover', size: 'tabloid-l', make: () => [
    R(0, 0, 1632, 150, '#2e3540'), T(0, 30, 1632, 70, '{{name|upper}}', { font: 'Montserrat', weight: 800, size: 54, color: '#ffffff', align: 'center', ls: 30, autoFit: true }),
    T(0, 100, 1632, 30, '{{fullAddress}}', { font: 'Montserrat', weight: 600, size: 16, color: '#ffffff', align: 'center' }),
    I(0, 150, 1632, 784, 'aerial'), R(0, 934, 1632, 122, '#2e3540'),
    I(1120, 960, 260, 70, 'logoLight', { fit: 'contain', name: 'logo right' }),
    T(60, 958, 600, 30, '{{forLabel|upper}} · {{availableSf}}', { font: 'Montserrat', weight: 600, size: 20, color: '#ffffff', ls: 10 }),
    T(60, 994, 900, 30, '{{broker1Name}} · {{broker1Phone}} · {{broker1Email}}', { font: 'Montserrat', size: 15, color: '#c7ced8' })] },
  { id: 'social', name: 'Social Post · Square', size: 'social', make: () => [
    I(0, 0, 1080, 1080, 'photo:0'), R(0, 700, 1080, 380, '$primary', { opacity: 0.94 }),
    T(60, 730, 960, 40, '{{forLabel|upper}}', { font: '$head', size: 32, color: '#ffffff', ls: 20 }),
    T(60, 778, 960, 110, '{{name}}', { font: '$head', weight: 600, size: 64, color: '#ffffff', lh: 1.05, autoFit: true }),
    T(60, 894, 960, 40, '{{cityStateZip}}', { size: 30, color: '$light' }),
    T(60, 960, 700, 60, '{{availableSf}}{{priceOrRate|pre:  ·  }}', { font: '$head', weight: 600, size: 34, color: '#ffffff', autoFit: true }),
    I(760, 950, 280, 90, 'logoLight', { fit: 'contain', name: 'logo right' })] },
  { id: 'email-banner', name: 'Email Banner · 1200×600', size: 'email', make: () => [
    I(0, 0, 720, 600, 'photo:0'), R(720, 0, 480, 600, '$primary'),
    I(760, 40, 300, 60, 'logoLight', { fit: 'contain', fx: 0 }),
    T(760, 160, 400, 30, '{{forLabel|upper}}', { font: '$head', size: 22, color: '$light', ls: 16 }),
    T(760, 196, 400, 150, '{{name}}', { font: '$head', weight: 600, size: 46, color: '#ffffff', lh: 1.08, autoFit: true }),
    T(760, 354, 400, 50, '{{fullAddress}}', { size: 18, color: '#ffffff', lh: 1.3, autoFit: true }),
    T(760, 430, 400, 44, '{{priceOrRate}}', { font: '$head', weight: 600, size: 30, color: '#ffffff', autoFit: true }),
    T(760, 520, 400, 50, '{{broker1Name}} · {{broker1Phone}}', { size: 18, color: '$light', autoFit: true })] },
];
export const PAGES = P;
export type Template = { id: string; name: string; desc: string; size: string; pages: string[]; tags: string[] };
export const TEMPLATES: Template[] = [
  { id: 'sig-flyer', name: 'Signature Flyer', desc: 'Hero · details · overview · photo page', size: 'letter', pages: ['sig-overview', 'sig-photos5'], tags: ['lease', 'sale', 'office', 'industrial'] },
  { id: 'sig-brochure', name: 'Signature Brochure', desc: 'Overview · site plan · photos · maps', size: 'letter', pages: ['sig-overview', 'sig-plans', 'sig-photos6', 'sig-maps'], tags: ['lease', 'sale', 'office'] },
  { id: 'sig-retail', name: 'Signature Retail', desc: 'Overview · co-tenancy map · 1/3/5-mile demographics', size: 'letter', pages: ['sig-overview', 'sig-retail', 'sig-photos6'], tags: ['retail', 'lease', 'sale'] },

  { id: 'classic-lease', name: 'Classic Band Flyer', desc: 'Summary left · photos · aerial', size: 'letter', pages: ['classic-summary-left', 'classic-photos', 'classic-aerial'], tags: ['lease', 'sale'] },
  { id: 'classic-office', name: 'Classic Band · Highlights', desc: 'Description + highlights, summary right', size: 'letter', pages: ['classic-summary-right', 'classic-photos'], tags: ['lease', 'office'] },
  { id: 'classic-demo', name: 'Classic Band · Demographics', desc: 'Photo, highlights, 1/3/5-mile table', size: 'letter', pages: ['classic-demographics', 'classic-photos'], tags: ['lease', 'retail'] },
  { id: 'classic-landscape', name: 'Classic Band Landscape', desc: 'Feature icon strip · photo collage', size: 'letter-l', pages: ['classic-l-features', 'classic-l-photos'], tags: ['lease', 'office'] },
  { id: 'corporate', name: 'Corporate Header', desc: 'Two-tone header · green footer', size: 'letter', pages: ['corporate-header'], tags: ['lease', 'office'] },
  { id: 'availability', name: 'Multi-Tenant Availability', desc: 'Site plan + live suites table', size: 'letter', pages: ['availability', 'classic-photos'], tags: ['lease', 'retail', 'multi-tenant'] },
  { id: 'land', name: 'Land for Sale', desc: 'Aerial hero · acreage callout', size: 'letter', pages: ['land', 'demographics'], tags: ['sale', 'land'] },
  { id: 'retail-aerial', name: 'Retail Aerial (landscape)', desc: 'Aerial + traffic + demographics', size: 'letter-l', pages: ['retail-aerial'], tags: ['retail', 'lease', 'sale'] },
  { id: 'retail-package', name: 'Retail Package', desc: 'Co-tenancy aerial · traffic · ring demographics', size: 'letter-l', pages: ['retail-cotenancy', 'retail-aerial'], tags: ['retail', 'lease', 'sale'] },
  { id: 'retail-rings', name: 'Retail Trade Area', desc: '1/3/5-mile ring map + full demographics', size: 'letter', pages: ['retail-demographics', 'classic-photos'], tags: ['retail', 'investment'] },
  { id: 'om', name: 'Offering Memorandum', desc: 'Cover · investment summary · comps · location', size: 'letter', pages: ['om-cover', 'investment-summary', 'comps', 'demographics'], tags: ['sale', 'investment'] },
  { id: 'comps', name: 'Comparables Page', desc: 'Sale comps table + map', size: 'letter', pages: ['comps'], tags: ['sale'] },
  { id: 'demographics', name: 'Demographics Page', desc: 'Map, radius + tract data', size: 'letter', pages: ['demographics'], tags: ['investment', 'retail', 'office'] },
  { id: 'tabloid', name: 'Leasing Brochure 11×17', desc: 'Dark band cover · tabloid', size: 'tabloid-l', pages: ['tabloid-cover', 'classic-l-photos'], tags: ['lease', 'industrial'] },
  { id: 'social', name: 'Social Post', desc: '1080×1080', size: 'social', pages: ['social'], tags: ['marketing'] },
  { id: 'email', name: 'Email Banner', desc: '1200×600 header image', size: 'email', pages: ['email-banner'], tags: ['marketing'] },
];
// Re-fit elements from one page size to another. Full-bleed pieces stretch; everything else scales uniformly and centers.
export function fitEls(els: El[], from: DocSize, to: DocSize): El[] {
  if (from.w === to.w && from.h === to.h) return els;
  const s = Math.min(to.w / from.w, to.h / from.h); const ox = (to.w - from.w * s) / 2, oy = (to.h - from.h * s) / 2;
  return els.map(e => {
    const n: any = { ...e, x: e.x * s + ox, y: e.y * s + oy, w: e.w * s, h: e.h * s };
    if (e.x <= 0 && e.x + e.w >= from.w) { n.x = 0; n.w = to.w; }
    if (e.y <= 0 && e.y + e.h >= from.h) { n.y = 0; n.h = to.h; }
    if (e.type === 'text') { n.size = e.size * s; if (e.pad) n.pad = e.pad * s; }
    if (e.type === 'table') { n.size = e.size * s; n.rowH = e.rowH * s; }
    if ('radius' in e && e.radius) n.radius = e.radius * s;
    return n as El;
  });
}
export function makePage(id: string, to?: DocSize): Page {
  const d = P.find(p => p.id === id)!; const from = S(d.size);
  return { els: fitEls(d.make(), from, to || from).map(e => ({ ...e, id: uid() })) };
}
export function makeDocPages(t: Template, size?: DocSize) { const to = size || S(t.size); return t.pages.map(id => makePage(id, to)); }
export const sizeOf = S;
