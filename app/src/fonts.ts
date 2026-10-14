// Self-hosted OFL fonts (Google Fonts static TTFs). Same files feed the browser preview and the PDF writer.
export const FONTS: Record<string, { weights: number[]; asc: number; desc: number }> = {
  'Open Sans': { weights: [400, 600, 700], asc: 2189 / 2048, desc: 600 / 2048 },
  'Nunito Sans': { weights: [400, 700, 800], asc: 1.011, desc: 0.353 },
  'Barlow Condensed': { weights: [400, 600, 700], asc: 1.0, desc: 0.2 },
  'Jost': { weights: [400, 500, 600], asc: 1.07, desc: 0.375 },
  'Montserrat': { weights: [400, 600, 800], asc: 0.968, desc: 0.251 },
  'Lora': { weights: [400, 700], asc: 1.006, desc: 0.274 },
};
export const FONT_NAMES = Object.keys(FONTS);
export function pickWeight(fam: string, w = 400) {
  const ws = (FONTS[fam] || FONTS['Open Sans']).weights;
  return ws.reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a, ws[0]);
}
export const fontFile = (fam: string, w: number) => `${import.meta.env.BASE_URL}fonts/${fam.replace(/ /g, '')}-${w}.ttf.b64`;
let ready: Promise<void> | null = null;
export function loadFonts() {
  if (ready) return ready;
  ready = Promise.all(FONT_NAMES.flatMap(f => FONTS[f].weights.map(async w => {
    const b64 = await fontBase64(f, w); const bin = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    const ff = new FontFace(f, bin.buffer, { weight: String(w) }); await ff.load(); document.fonts.add(ff);
  }))).then(() => undefined);
  return ready;
}
const b64cache: Record<string, Promise<string>> = {};
export function fontBase64(fam: string, w: number) {
  const k = fam + w;
  return b64cache[k] ||= fetch(fontFile(fam, w)).then(r => { if (!r.ok) throw new Error('font ' + k); return r.text(); }).then(t => t.trim());
}
