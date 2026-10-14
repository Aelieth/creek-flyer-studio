// Retail tools: nearby co-tenants (OpenStreetMap Overpass), state DOT traffic counts,
// 1/3/5-mile ring demographics (Census ACS block groups) and a canvas co-tenancy map.
// All sources are free public endpoints callable from the browser.
import type { Brand, Poi, Property, TrafficPt } from './types';
const MI = 1609.344;
const rid = () => Math.random().toString(36).slice(2, 9);
export function distMi(a: number, b: number, c: number, d: number) {
  const R = 3958.8, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r;
  const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function getJson(u: string, init?: RequestInit, ms = 30000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(u, { ...init, signal: ac.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
// ---------- nearby retailers & draws ----------
const DRAW = /^(hospital|university|college|mall|stadium|theme_park|airport)$/;
const ANCHOR = /^(supermarket|department_store|wholesale|doityourself|hardware|general|variety_store|furniture|electronics|sports|pet|books|cinema)$/;
const OVERPASS = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
export async function fetchPois(lat: number, lon: number, radiusMi = 1.25): Promise<Poi[]> {
  const a = `(around:${Math.round(radiusMi * MI)},${lat},${lon})`;
  const q = `[out:json][timeout:40];(nwr${a}["shop"~"^(supermarket|department_store|mall|wholesale|doityourself)$"]["name"];` +
    `nwr${a}["amenity"~"^(hospital|university|college|cinema)$"]["name"];nwr${a}["leisure"="stadium"]["name"];nwr${a}["brand"];);out center tags 600;`;
  let j: any = null, err = '';
  for (const ep of OVERPASS) { try { j = await getJson(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 90000); break; } catch (e) { err = (e as Error).message; } }
  if (!j) throw new Error('Overpass unavailable (' + err + ')');
  const best = new Map<string, Poi & { score: number }>();
  for (const e of j.elements || []) {
    const t = e.tags || {}; const name = (t.brand || t.name || '').trim(); if (!name) continue;
    const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon; if (la == null) continue;
    const cat = t.shop || t.amenity || t.leisure || '';
    if (/^(atm|charging_station|parking|vending_machine|post_box|bicycle_rental|fuel)$/.test(cat) && !t.shop) continue;
    const kind: Poi['kind'] = DRAW.test(cat) ? 'draw' : ANCHOR.test(cat) ? 'anchor' : 'retail';
    const dist = distMi(lat, lon, la, lo);
    const score = (kind === 'draw' ? 3 : kind === 'anchor' ? 2.2 : 1) + (t.brand ? 0.6 : 0) + (e.type !== 'node' ? 0.4 : 0) - dist * 0.6;
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prev = best.get(key); if (prev && prev.score >= score) continue;
    best.set(key, { id: rid(), name, kind, lat: +la.toFixed(6), lon: +lo.toFixed(6), on: false, dist: +dist.toFixed(2), score });
  }
  const list = [...best.values()].sort((x, y) => y.score - x.score);
  list.forEach((p, i) => { p.on = i < 12; });
  return list.slice(0, 60).map(({ score: _s, ...p }) => p);
}
// ---------- traffic counts ----------
export async function fetchTraffic(lat: number, lon: number, state: string, radiusMi = 1): Promise<TrafficPt[]> {
  const geo = `geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&distance=${radiusMi}&units=esriSRUnit_StatuteMile&outSR=4326&f=json`;
  const st = state.toUpperCase();
  if (st === 'OK' || st === 'OKLAHOMA') {
    const u = `https://services6.arcgis.com/RBtoEUQ2lmN0K3GY/ArcGIS/rest/services/AADT_Network/FeatureServer/0/query?${geo}&outFields=ROUTE_ID,AADT,AADT_YEAR&returnGeometry=true`;
    const j = await getJson(u);
    const byRoute = new Map<string, TrafficPt & { d: number }>();
    for (const f of j.features || []) {
      const v = +f.attributes.AADT; if (!v) continue;
      let bp = [0, 0], bd = 1e9; for (const path of f.geometry?.paths || []) for (const [x, y] of path) { const d = distMi(lat, lon, y, x); if (d < bd) { bd = d; bp = [x, y]; } }
      const k = f.attributes.ROUTE_ID; const prev = byRoute.get(k);
      if (!prev || bd < prev.d - 0.05 || (Math.abs(bd - prev.d) <= 0.05 && v > prev.value))
        byRoute.set(k, { id: rid(), label: '', value: v, year: String(f.attributes.AADT_YEAR || ''), lat: bp[1], lon: bp[0], on: true, d: bd });
    }
    return pickTraffic([...byRoute.values()], 'ODOT');
  }
  if (st === 'TX' || st === 'TEXAS') {
    const u = `https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT_Annuals_(Public_View)/FeatureServer/0/query?${geo}&outFields=ON_ROAD,AADT_RPT_QTY,AADT_RPT_YEAR,LATITUDE,LONGITUDE&returnGeometry=false`;
    const j = await getJson(u);
    const pts = (j.features || []).map((f: any) => { const a = f.attributes; return { id: rid(), label: a.ON_ROAD || '', value: +a.AADT_RPT_QTY || 0, year: String(a.AADT_RPT_YEAR || ''), lat: +a.LATITUDE, lon: +a.LONGITUDE, on: true, d: distMi(lat, lon, +a.LATITUDE, +a.LONGITUDE) }; }).filter((p: any) => p.value);
    return pickTraffic(pts, 'TxDOT');
  }
  throw new Error(`No free traffic-count connector for ${state || 'this state'} yet (OK and TX supported). Enter counts by hand.`);
}
function pickTraffic(pts: (TrafficPt & { d: number })[], src: string): TrafficPt[] {
  // nearest few distinct counts, biggest roads first
  const near = pts.sort((a, b) => a.d - b.d).slice(0, 8).sort((a, b) => b.value - a.value);
  const out: TrafficPt[] = [];
  for (const p of near) { if (out.some(o => distMi(o.lat, o.lon, p.lat, p.lon) < 0.12)) continue; const { d: _d, ...q } = p; q.source = src; q.on = out.length < 4; out.push(q); }
  return out;
}
export const fmtVpd = (v: number) => v.toLocaleString() + ' VPD';
// ---------- ring demographics ----------
export type RingResult = { dem: Record<string, string>; log: string[] };
// ACS 2019 tables use 2010 block groups; TIGERweb's ACS2019 service already serves 2020 block groups (GEOIDs don't match),
// so the 2019 comparison uses the Census 2010 block-group layer.
async function bgsWithin(lat: number, lon: number, vintage: 'ACS2023' | 'Census2010', r: number) {
  const u = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_${vintage}/MapServer/${vintage === 'Census2010' ? 16 : 10}/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&distance=${r}&units=esriSRUnit_StatuteMile&outFields=GEOID,STATE,COUNTY,CENTLAT,CENTLON&returnGeometry=false&f=json`;
  const j = await getJson(u, undefined, 45000);
  return (j.features || []).map((f: any) => ({ geoid: f.attributes.GEOID as string, st: f.attributes.STATE as string, co: f.attributes.COUNTY as string, d: distMi(lat, lon, +f.attributes.CENTLAT, +f.attributes.CENTLON) }));
}
async function acsByCounty(year: number, vars: string[], counties: string[], key: string) {
  const out = new Map<string, number[]>();
  await Promise.all(counties.map(async sc => {
    const [st, co] = sc.split(':');
    const u = `https://api.census.gov/data/${year}/acs/acs5?get=${vars.join(',')}&for=block%20group:*&in=state:${st}%20county:${co}&key=${encodeURIComponent(key.trim())}`;
    // A bad key makes Census redirect to an HTML page without CORS headers, which surfaces as a vague "Failed to fetch".
    const probe = await fetch(u, { redirect: 'manual' }).catch(() => null);
    if (probe && (probe.type === 'opaqueredirect' || (probe.status >= 300 && probe.status < 400))) throw new Error('The Census API rejected the key (invalid, or not activated yet: click the activation link in the email from Census, then try again).');
    const j = probe && probe.ok ? await probe.json() : await getJson(u, undefined, 45000);
    const h: string[] = j[0];
    for (const row of j.slice(1)) out.set(row[h.indexOf('state')] + row[h.indexOf('county')] + row[h.indexOf('tract')] + row[h.indexOf('block group')], vars.map((_, i) => +row[i]));
  }));
  return out;
}
const money = (n: number) => n > 0 ? '$' + Math.round(n).toLocaleString() : '—';
const num = (n: number) => Math.round(n).toLocaleString();
export async function ringDemographics(lat: number, lon: number, key: string, rings = [1, 3, 5]): Promise<RingResult> {
  if (!key) throw new Error('A free Census API key is needed for ring demographics. Get one at api.census.gov/data/key_signup.html and paste it in Brand & Settings.');
  const log: string[] = []; const R = Math.max(...rings);
  const bgs = (await bgsWithin(lat, lon, 'ACS2023', R)).filter((b: any) => b.d <= R);
  if (!bgs.length) throw new Error('No census block groups found near this point');
  const counties = [...new Set(bgs.map((b: any) => b.st + ':' + b.co))] as string[];
  const data = await acsByCounty(2023, ['B01003_001E', 'B11001_001E', 'B19013_001E', 'B19025_001E', 'B01002_001E', 'B01002_002E', 'B01002_003E', 'B25077_001E', 'B25003_002E'], counties, key);
  log.push(`ACS 2023 5-yr: ${bgs.length} block groups in ${counties.length} count${counties.length > 1 ? 'ies' : 'y'} within ${R} mi`);
  const dem: Record<string, string> = {};
  let old: { d: number; pop: number }[] = [];
  try {
    const b19 = (await bgsWithin(lat, lon, 'Census2010', R)).filter((b: any) => b.d <= R);
    const c19 = [...new Set(b19.map((b: any) => b.st + ':' + b.co))] as string[];
    const d19 = await acsByCounty(2019, ['B01003_001E'], c19, key);
    old = b19.map((b: any) => ({ d: b.d, pop: d19.get(b.geoid)?.[0] || 0 }));
  } catch (e) { log.push('Growth skipped: ' + (e as Error).message); }
  for (const r of rings) {
    let pop = 0, hh = 0, agg = 0; const meds: [number, number][] = []; const wa = [0, 0, 0, 0], ww = [0, 0, 0, 0];
    for (const b of bgs) { if (b.d > r) continue; const v = data.get(b.geoid); if (!v) continue;
      const [p, h, m, a, ag, am, af, hv, own] = v; pop += Math.max(0, p); hh += Math.max(0, h); if (a > 0) agg += a; if (m > 0 && h > 0) meds.push([m, h]);
      // medians can't be summed: population- (or owner-unit-) weighted average of block-group medians
      [ag, am, af].forEach((x, i) => { if (x > 0 && p > 0) { wa[i] += x * p; ww[i] += p; } }); if (hv > 0 && own > 0) { wa[3] += hv * own; ww[3] += own; } }
    meds.sort((x, y) => x[0] - y[0]); let half = meds.reduce((s, x) => s + x[1], 0) / 2, med = 0;
    for (const [m, h] of meds) { half -= h; if (half <= 0) { med = m; break; } }
    dem['pop' + r] = num(pop); dem['hh' + r] = num(hh); dem['inc' + r] = money(hh ? agg / hh : 0); dem['med' + r] = money(med);
    if (ww[0]) dem['age' + r] = (wa[0] / ww[0]).toFixed(1); if (ww[1]) dem['ageM' + r] = (wa[1] / ww[1]).toFixed(1); if (ww[2]) dem['ageF' + r] = (wa[2] / ww[2]).toFixed(1);
    if (hh) dem['pph' + r] = (pop / hh).toFixed(2); if (ww[3]) dem['hval' + r] = money(wa[3] / ww[3]);
    const p19 = old.filter(o => o.d <= r).reduce((s, o) => s + o.pop, 0);
    if (p19 > 0) { const g = (pop / p19 - 1) * 100; dem['growth' + r] = (g >= 0 ? '+' : '') + g.toFixed(1) + '%'; }
    log.push(`${r} mi: pop ${dem['pop' + r]}, HH ${dem['hh' + r]}, avg inc ${dem['inc' + r]}${dem['growth' + r] ? ', growth ' + dem['growth' + r] : ''}`);
  }
  log.push('Daytime population is not in the free ACS; enter it by hand or use a paid demographics feed.');
  return { dem, log };
}
// ---------- co-tenancy / ring map ----------
export type MapOpts = { mode: 'cotenancy' | 'rings'; sat?: boolean; z?: number; // z may be fractional
  W?: number; H?: number; rings?: number[]; showTraffic?: boolean; siteLabel?: string };
const proj = (lat: number, lon: number, z: number) => { const n = 256 * 2 ** z, r = lat * Math.PI / 180; return [(lon + 180) / 360 * n, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n]; };
const loadImg = (src: string) => new Promise<HTMLImageElement | null>(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
export function ringZoom(lat: number, H: number, rMi: number) { for (let z = 17; z > 3; z--) { const mpp = 156543.03 * Math.cos(lat * Math.PI / 180) / 2 ** z; if (rMi * MI / mpp <= H * 0.46) return z; } return 4; }
export async function drawRetailMap(p: Property, b: Brand, o: MapOpts): Promise<string> {
  const W = o.W || 1600, H = o.H || 1100; const lat = +p.lat, lon = +p.lon;
  const rings = o.rings || [1, 3, 5];
  // fractional zoom: tiles come from the next integer level and are drawn scaled down (stays sharp)
  const zf = o.z ?? (o.mode === 'rings' ? Math.log2(0.44 * H * 156543.03 * Math.cos(lat * Math.PI / 180) / (Math.max(...rings) * MI)) : 16);
  const zt = Math.min(19, Math.ceil(zf - 1e-6)), k = 2 ** (zf - zt), T = 256 * k;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!;
  g.fillStyle = '#e5e3df'; g.fillRect(0, 0, W, H);
  const [cx0, cy0] = proj(lat, lon, zt); const cx = cx0 * k, cy = cy0 * k; const x0 = cx - W / 2, y0 = cy - H / 2; const n = 2 ** zt;
  const jobs: Promise<void>[] = [];
  for (let tx = Math.floor(x0 / T); tx <= Math.floor((x0 + W) / T); tx++) for (let ty = Math.floor(y0 / T); ty <= Math.floor((y0 + H) / T); ty++) {
    const X = ((tx % n) + n) % n;
    const url = o.sat ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zt}/${ty}/${X}` : `https://tile.openstreetmap.org/${zt}/${X}/${ty}.png`;
    jobs.push(loadImg(url).then(im => { if (im) g.drawImage(im, Math.floor(tx * T - x0), Math.floor(ty * T - y0), Math.ceil(T) + 1, Math.ceil(T) + 1); }));
  }
  await Promise.all(jobs);
  const z = zf;
  if (!o.sat) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, W, H); }
  const xy = (la: number, lo: number) => { const [x, y] = proj(la, lo, zt); return [x * k - x0, y * k - y0]; };
  const font = (w: number, s: number) => `${w} ${s}px "${b.bodyFont}", "Nunito Sans", Arial, sans-serif`;
  const rr = (x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const top = o.mode === 'cotenancy' ? H * 0.1 : 0; const boxes: number[][] = []; const hit = (a: number[]) => a[0] < 0 || a[1] < top || a[0] + a[2] > W || a[1] + a[3] > H || boxes.some(q => a[0] < q[0] + q[2] + 6 && a[0] + a[2] + 6 > q[0] && a[1] < q[1] + q[3] + 6 && a[1] + a[3] + 6 > q[1]);
  // rings
  if (o.mode === 'rings') {
    const mpp = 156543.03 * Math.cos(lat * Math.PI / 180) / 2 ** z;
    [...rings].sort((a, b2) => b2 - a).forEach(r => {
      const R = r * MI / mpp; g.beginPath(); g.arc(W / 2, H / 2, R, 0, Math.PI * 2);
      g.fillStyle = b.primary + '14'; g.fill(); g.lineWidth = 4; g.strokeStyle = b.primary; g.setLineDash([16, 10]); g.stroke(); g.setLineDash([]);
      const t = `${r} MILE${r === 1 ? '' : 'S'}`; g.font = font(800, 24); const tw = g.measureText(t).width + 24;
      rr(W / 2 - tw / 2, H / 2 - R - 17, tw, 34, 17); g.fillStyle = b.primary; g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, W / 2, H / 2 - R); g.textAlign = 'left';
      boxes.push([W / 2 - tw / 2, H / 2 - R - 17, tw, 34]);
    });
  }
  // subject star
  const star = (x: number, y: number, R: number) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? R * 0.45 : R; g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } g.closePath(); };
  const SR = o.mode === 'rings' ? 26 : 34;
  boxes.push([W / 2 - SR, H / 2 - SR, SR * 2, SR * 2]);
  // traffic
  if (o.showTraffic ?? o.mode === 'cotenancy') for (const t of (p.trafficPts || []).filter(t => t.on)) {
    const [x, y] = xy(t.lat, t.lon); if (x < 0 || y < 0 || x > W || y > H) continue;
    const txt = (t.label ? t.label + ': ' : '') + fmtVpd(t.value); g.font = font(800, 22); const tw = g.measureText(txt).width + 26;
    let bx = [x - tw / 2, y - 18, tw, 36]; for (const dy of [0, -44, 44, -88, 88]) { const cand = [x - tw / 2, y - 18 + dy, tw, 36]; if (!hit(cand)) { bx = cand; break; } }
    boxes.push(bx); rr(bx[0], bx[1], bx[2], bx[3], 6); g.fillStyle = '#c62828'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(txt, bx[0] + 13, bx[1] + 19);
  }
  // pins
  const pins = o.mode === 'rings' ? [] : (p.pois || []).filter(q => q.on);
  const logos = await Promise.all(pins.map(q => q.logo ? loadImg(q.logo) : Promise.resolve(null)));
  const placed: { q: typeof pins[0]; px: number; py: number; bx: number[]; logo: HTMLImageElement | null }[] = [];
  pins.forEach((q, i) => {
    const [px, py] = xy(q.lat, q.lon); if (px < 8 || py < 8 || px > W - 8 || py > H - 8) return;
    const logo = logos[i]; g.font = font(800, 22);
    const bw = logo ? Math.min(170, 56 * logo.width / logo.height) + 16 : g.measureText(q.name).width + 22, bh = logo ? 64 : 38;
    const dirs = [[0, -1], [1, -0.6], [-1, -0.6], [1, 0.6], [-1, 0.6], [0, 1], [1.4, 0], [-1.4, 0]];
    let bx: number[] | null = null;
    for (const L of [60, 105, 160]) { for (const [dx, dy] of dirs) { const cxp = px + dx * L, cyp = py + dy * L * 0.8; const cand = [cxp - bw / 2, cyp - bh / 2, bw, bh]; if (!hit(cand)) { bx = cand; break; } } if (bx) break; }
    if (!bx) return; boxes.push(bx); placed.push({ q, px, py, bx, logo });
  });
  for (const P of placed) { g.beginPath(); g.moveTo(P.px, P.py); g.lineTo(P.bx[0] + P.bx[2] / 2, P.bx[1] + P.bx[3] / 2); g.lineWidth = 3; g.strokeStyle = '#ffffff'; g.stroke(); g.lineWidth = 1.5; g.strokeStyle = b.secondary; g.stroke(); }
  for (const P of placed) {
    g.beginPath(); g.arc(P.px, P.py, 7, 0, Math.PI * 2); g.fillStyle = P.q.kind === 'draw' ? b.accent : b.secondary; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke();
    const [x, y, w, h] = P.bx; g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 8; g.shadowOffsetY = 2; rr(x, y, w, h, 6); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 2; g.strokeStyle = P.q.kind === 'draw' ? b.accent : b.secondary; g.stroke();
    if (P.logo) { const lw = w - 16, lh = h - 12, s = Math.min(lw / P.logo.width, lh / P.logo.height); g.drawImage(P.logo, x + (w - P.logo.width * s) / 2, y + (h - P.logo.height * s) / 2, P.logo.width * s, P.logo.height * s); }
    else { g.font = font(800, 22); g.fillStyle = b.dark; g.textBaseline = 'middle'; g.fillText(P.q.name, x + 11, y + h / 2 + 1); }
  }
  star(W / 2, H / 2, SR); g.fillStyle = b.primary; g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
  if (o.siteLabel) { g.font = font(800, 24); const tw = g.measureText(o.siteLabel).width + 24; rr(W / 2 - tw / 2, H / 2 + SR + 8, tw, 36, 18); g.fillStyle = b.primary; g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.siteLabel, W / 2, H / 2 + SR + 27); g.textAlign = 'left'; }
  g.font = font(600, 14); const attr = o.sat ? 'Imagery © Esri, Maxar, Earthstar Geographics · Data © OpenStreetMap contributors' : '© OpenStreetMap contributors';
  const aw = g.measureText(attr).width + 12; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(W - aw, H - 22, aw, 22); g.fillStyle = '#333'; g.textBaseline = 'middle'; g.fillText(attr, W - aw + 6, H - 11);
  return c.toDataURL('image/jpeg', 0.88);
}
// Friendly road names for count stations: nearest street from OpenStreetMap (Nominatim reverse, ≤1 req/s).
export async function nameRoads(pts: TrafficPt[]): Promise<TrafficPt[]> {
  const out: TrafficPt[] = [];
  for (const [i, t] of pts.entries()) {
    if (t.label && !/^[A-Z]{2}\d|^\d/.test(t.label)) { out.push(t); continue; }
    if (i) await new Promise(r => setTimeout(r, 1100));
    try {
      const j = await getJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&lat=${t.lat}&lon=${t.lon}`, undefined, 10000);
      const road = j?.address?.road || j?.name || '';
      out.push({ ...t, label: road ? shortRoad(road) : t.label });
    } catch { out.push(t); }
  }
  return out;
}
const shortRoad = (s: string) => s.replace(/\bTurnpike\b/, 'Tpke').replace(/\bExpressway\b/, 'Expy').replace(/\bParkway\b/, 'Pkwy').replace(/\bBoulevard\b/, 'Blvd').replace(/\bAvenue\b/, 'Ave').replace(/\bStreet\b/, 'St').replace(/\bRoad\b/, 'Rd').replace(/\bDrive\b/, 'Dr').replace(/^(North|South|East|West)(west|east)? /, (m) => m.split(' ')[0].replace('Northwest', 'NW').replace('Northeast', 'NE').replace('Southwest', 'SW').replace('Southeast', 'SE').replace('North', 'N').replace('South', 'S').replace('East', 'E').replace('West', 'W') + ' ');
