// Live, free data sources. All callable from the browser (CORS or JSONP), no paid keys.
import type { Property } from './types';
function jsonp<T>(url: string, timeout = 15000): Promise<T> {
  return new Promise((res, rej) => {
    const cb = 'cfs_cb_' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    const t = setTimeout(() => { cleanup(); rej(new Error('timeout')); }, timeout);
    const cleanup = () => { clearTimeout(t); delete (window as any)[cb]; s.remove(); };
    (window as any)[cb] = (d: T) => { cleanup(); res(d); };
    s.onerror = () => { cleanup(); rej(new Error('network')); };
    s.src = url + '&format=jsonp&callback=' + cb; document.head.appendChild(s);
  });
}
export type LookupResult = { patch: Partial<Property>; log: string[] };
export async function lookupAddress(full: string, censusKey: string, pinColor = '#d33'): Promise<LookupResult> {
  const log: string[] = []; const patch: Partial<Property> = {};
  let state = '', county = '', tract = '';
  // 1) US Census Geocoder (free, keyless)
  try {
    const u = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=' + encodeURIComponent(full) +
      '&benchmark=Public_AR_Current&vintage=Current_Current&layers=' + encodeURIComponent('Census Tracts,Counties');
    const d: any = await jsonp(u);
    const m = d?.result?.addressMatches?.[0];
    if (m) {
      patch.lat = String(m.coordinates.y.toFixed(6)); patch.lon = String(m.coordinates.x.toFixed(6));
      const c = m.addressComponents || {};
      const parts = String(m.matchedAddress).split(',').map((x: string) => x.trim());
      if (parts[0]) patch.address = titleCase(parts[0]);
      if (c.city) patch.city = titleCase(c.city); if (c.state) patch.state = c.state; if (c.zip) patch.zip = c.zip;
      const co = m.geographies?.Counties?.[0]; const tr = m.geographies?.['Census Tracts']?.[0];
      if (co) { patch.county = co.NAME; state = co.STATE; county = co.COUNTY; }
      if (tr) { patch.tract = tr.NAME; tract = tr.TRACT; }
      log.push('Census geocoder: matched ' + m.matchedAddress);
    } else log.push('Census geocoder: no match');
  } catch (e) { log.push('Census geocoder failed: ' + (e as Error).message); }
  // 2) Fallback: OpenStreetMap Nominatim
  if (!patch.lat) {
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=us&q=' + encodeURIComponent(full));
      const j = await r.json(); const h = j[0];
      if (h) { patch.lat = (+h.lat).toFixed(6); patch.lon = (+h.lon).toFixed(6); const a = h.address || {};
        patch.city = a.city || a.town || a.village || patch.city; patch.zip = a.postcode || patch.zip; patch.county = a.county || patch.county;
        log.push('OSM Nominatim: ' + h.display_name); } else log.push('OSM Nominatim: no match');
    } catch (e) { log.push('Nominatim failed: ' + (e as Error).message); }
  }
  if (!patch.lat) return { patch, log };
  const lat = +patch.lat, lon = +patch.lon!;
  // 3) FEMA National Flood Hazard Layer (free ArcGIS REST)
  try {
    const u = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY&returnGeometry=false&f=json`;
    const j = await (await fetch(u)).json(); const a = j?.features?.[0]?.attributes;
    patch.floodZone = a ? `Zone ${a.FLD_ZONE}${a.ZONE_SUBTY ? ' (' + titleCase(a.ZONE_SUBTY) + ')' : ''}` : 'Not mapped';
    log.push('FEMA NFHL: ' + patch.floodZone);
  } catch (e) { log.push('FEMA flood lookup failed: ' + (e as Error).message); }
  // 4) Census ACS 5-yr demographics (needs free key from api.census.gov/data/key_signup.html)
  if (state && county && tract) {
    if (!censusKey) log.push('ACS demographics skipped: add a free Census API key in Brand & Settings');
    else try {
      const u = `https://api.census.gov/data/2023/acs/acs5?get=B01003_001E,B19013_001E,B01002_001E&for=tract:${tract}&in=state:${state}%20county:${county}&key=${censusKey}`;
      const j = await (await fetch(u)).json(); const [pop, inc, age] = j[1];
      patch.population = (+pop).toLocaleString(); patch.medianIncome = +inc > 0 ? '$' + (+inc).toLocaleString() : 'n/a'; patch.medianAge = age;
      log.push(`ACS 2023 tract: pop ${patch.population}, median HH income ${patch.medianIncome}`);
    } catch (e) { log.push('ACS failed: ' + (e as Error).message); }
  }
  // 5) Static map image from OSM tiles
  try { patch.mapImg = await staticMap(lat, lon, 16, { pin: pinColor }); log.push('Map rendered (OpenStreetMap)'); }
  catch (e) { log.push('Map render failed: ' + (e as Error).message); }
  return { patch, log };
}
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
// Composite OSM tiles into a single PNG (export-safe, no live iframe needed).
export async function staticMap(lat: number, lon: number, z: number, o: { gray?: boolean; pin?: string; W?: number; H?: number } = {}): Promise<string> {
  const W = o.W || 1400, H = o.H || 900;
  const n = 2 ** z; const px = (lon + 180) / 360 * n * 256;
  const r = lat * Math.PI / 180; const py = (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n * 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!;
  g.fillStyle = '#e5e3df'; g.fillRect(0, 0, W, H);
  const x0 = px - W / 2, y0 = py - H / 2; const jobs: Promise<void>[] = [];
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + W) / 256); tx++)
    for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + H) / 256); ty++)
      jobs.push(new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous';
        im.onload = () => { g.drawImage(im, tx * 256 - x0, ty * 256 - y0); res(); }; im.onerror = () => res();
        im.src = `https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png`; }));
  await Promise.all(jobs);
  if (o.gray) { const d = g.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const v = d.data[i] * .3 + d.data[i + 1] * .59 + d.data[i + 2] * .11; const t = 0.35; d.data[i] = d.data[i + 1] = d.data[i + 2] = v * (1 - t) + 255 * t; } g.putImageData(d, 0, 0); }
  // pin
  g.fillStyle = o.pin || '#d33'; g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath();
  g.arc(W / 2, H / 2 - 28, 18, Math.PI, 0); g.lineTo(W / 2, H / 2); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H / 2 - 28, 7, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(W - 250, H - 26, 250, 26); g.fillStyle = '#333'; g.font = '16px sans-serif';
  g.fillText('© OpenStreetMap contributors', W - 240, H - 8);
  return c.toDataURL('image/jpeg', 0.88);
}
