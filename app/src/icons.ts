// Small original line-icon set (white strokes) for feature strips. Referenced in templates as src "icon:<name>".
const P: Record<string, string> = {
  dollar: '<rect x="6" y="14" width="36" height="22" rx="3"/><circle cx="24" cy="25" r="6"/><path d="M11 19v12M37 19v12"/>',
  building: '<path d="M10 42V8h20v34M30 18h10v24M6 42h38"/><path d="M15 14h4M21 14h4M15 21h4M21 21h4M15 28h4M21 28h4M34 24h2M34 30h2M17 42v-7h6v7"/>',
  bank: '<path d="M6 18L24 7l18 11zM8 42h32M10 38h28"/><path d="M12 22v14M20 22v14M28 22v14M36 22v14"/>',
  car: '<path d="M8 30l4-11h24l4 11v8H8z"/><circle cx="15" cy="33" r="2.5"/><circle cx="33" cy="33" r="2.5"/><path d="M8 38v4h5v-4M35 38v4h5v-4"/>',
  people: '<circle cx="18" cy="16" r="6"/><path d="M6 40c0-8 5-13 12-13s12 5 12 13"/><circle cx="33" cy="18" r="5"/><path d="M31 27c7 0 11 5 11 12"/>',
  shield: '<path d="M24 6l16 6v11c0 10-7 17-16 20C15 40 8 33 8 23V12z"/><path d="M17 24l5 5 9-10"/>',
  pin: '<path d="M24 43s-13-14-13-24a13 13 0 0126 0c0 10-13 24-13 24z"/><circle cx="24" cy="19" r="5"/>',
  food: '<path d="M14 6v14c0 3 2 5 4 5v17M10 6v10M18 6v10M34 42V6c-5 2-7 8-7 16h7"/>',
  clock: '<circle cx="24" cy="24" r="17"/><path d="M24 13v12l8 5"/>',
  truck: '<path d="M4 12h24v20H4zM28 19h9l7 7v6H28z"/><circle cx="12" cy="35" r="4"/><circle cx="36" cy="35" r="4"/>',
  road: '<path d="M16 6L8 42M32 6l8 36M24 8v6M24 20v6M24 32v6"/>',
  sign: '<rect x="8" y="8" width="32" height="18" rx="2"/><path d="M24 26v16M16 42h16M14 15h20M14 20h12"/>',
  bolt: '<path d="M27 4L10 27h12l-3 17 19-25H25z"/>',
  water: '<path d="M24 6s-13 15-13 24a13 13 0 0026 0C37 21 24 6 24 6z"/>',
  tree: '<path d="M24 42V26M24 6c-9 0-14 7-12 14-3 3-1 9 5 9h14c6 0 8-6 5-9 2-7-3-14-12-14z"/>',
  wifi: '<path d="M6 18a26 26 0 0136 0M12 25a17 17 0 0124 0M18 32a8 8 0 0112 0"/><circle cx="24" cy="38" r="2"/>',
  key: '<circle cx="15" cy="24" r="8"/><path d="M23 24h20M37 24v7M43 24v5"/>',
  star: '<path d="M24 5l6 13 14 1-11 9 4 14-13-8-13 8 4-14L4 19l14-1z"/>',
};
export const ICONS = Object.keys(P);
export function iconUrl(name: string, color = '#ffffff') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.star}</svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
