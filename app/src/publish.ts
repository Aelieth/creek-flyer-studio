// Listing microsite (single self-contained HTML file) and email-ready HTML.
import type { Brand, Property } from './types';
import { context } from './compile';
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const facts = (p: Property): [string, string][] => ([['Sale Price', p.price], ['Lease Rate', p.leaseRate && p.leaseRate + (p.leaseType ? ` (${p.leaseType})` : '')], ['Available', p.availableSf], ['Building', p.buildingSf], ['Lot', p.lotAcres],
  ['Year Built', p.yearBuilt], ['Zoning', p.zoning], ['Parking', p.parking], ['Clear Height', p.clearHeight], ['Traffic', p.traffic], ['Flood Zone', p.floodZone], ['County', p.county]] as [string, string][]).filter(([, v]) => v);
export function micrositeHtml(p: Property, b: Brand, flyerPdfDataUrl?: string): string {
  const c = context(p, b); const hero = p.photos[0] || p.aerial || '';
  const hl = p.highlights.split('\n').filter(Boolean).map(h => `<li>${esc(h)}</li>`).join('');
  const gal = p.photos.slice(1, 13).map(src => `<a href="${src}" target="_blank"><img src="${src}" alt=""></a>`).join('');
  const suites = p.suites.length ? `<h2>Availability</h2><table class="t"><tr><th>Suite</th><th>Size</th><th>Rate</th><th>Status</th><th>Notes</th></tr>${p.suites.map(s => `<tr><td>${esc(s.suite)}</td><td>${esc(s.sf)}</td><td>${esc(s.rate)}</td><td>${esc(s.status)}</td><td>${esc(s.notes)}</td></tr>`).join('')}</table>` : '';
  const brokers = p.brokers.filter(x => x.name).map(x => `<div class="br"><b>${esc(x.name)}</b>${x.title ? `<span>${esc(x.title)}</span>` : ''}<a href="mailto:${esc(x.email)}">${esc(x.email)}</a><a href="tel:${esc(x.phone.replace(/[^\d+]/g, ''))}">${esc(x.phone)}</a></div>`).join('');
  const osm = p.lat ? `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=16/${p.lat}/${p.lon}` : `https://www.openstreetmap.org/search?query=${encodeURIComponent(c.fullAddress)}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.name)} | ${esc(b.company)}</title>
<meta name="description" content="${esc(c.forLabel + ': ' + p.name + ', ' + c.fullAddress)}"><meta property="og:title" content="${esc(p.name)}">
<style>:root{--p:${b.primary};--s:${b.secondary};--l:${b.light}}*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;color:#222;line-height:1.55}
header{display:flex;justify-content:space-between;align-items:center;padding:14px 5vw;background:#fff;border-bottom:4px solid var(--p)}header img{max-height:46px}header .co{font-weight:700;color:var(--p);letter-spacing:.12em;text-transform:uppercase}
.hero{position:relative;min-height:56vh;background:#333 url('${hero}') center/cover;display:flex;align-items:flex-end}.hero .band{background:rgba(0,0,0,.0);width:100%;padding:0}
.hero .box{background:var(--p);color:#fff;padding:22px 5vw;width:100%}.hero h1{margin:0;font-size:clamp(26px,4vw,44px);letter-spacing:.02em}.hero p{margin:4px 0 0;opacity:.9}.tag{display:inline-block;background:#fff;color:var(--p);font-weight:700;padding:3px 10px;border-radius:3px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}
main{max-width:1150px;margin:0 auto;padding:30px 5vw;display:grid;grid-template-columns:2fr 1fr;gap:40px}h2{color:var(--s);text-transform:uppercase;letter-spacing:.1em;font-size:16px;border-bottom:3px solid var(--l);padding-bottom:6px}
.facts{background:#f5f8f7;border-radius:6px;padding:6px 18px}.facts div{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--l)}.facts b{color:var(--s)}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.gal img{width:100%;height:150px;object-fit:cover;border-radius:4px}
.t{width:100%;border-collapse:collapse}.t th{background:var(--s);color:#fff;text-align:left;padding:8px}.t td{padding:8px;border-bottom:1px solid #e3e8e6}
.br{display:flex;flex-direction:column;margin-bottom:14px;border-left:3px solid var(--p);padding-left:12px}.br span{color:#666;font-size:14px}.br a{color:var(--s)}
.btn{display:inline-block;background:var(--p);color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;margin:6px 6px 0 0}.map img{width:100%;border-radius:6px}
footer{background:var(--s);color:#cfd8e3;padding:20px 5vw;font-size:12px}@media(max-width:800px){main{grid-template-columns:1fr}}</style></head><body>
<header>${b.logo ? `<img src="${b.logo}" alt="${esc(b.company)}">` : `<span class="co">${esc(b.company)}</span>`}<span>${esc(b.phone)}</span></header>
<section class="hero"><div class="box"><span class="tag">${esc(c.forLabel)}</span><h1>${esc(p.name)}</h1><p>${esc(c.fullAddress)}</p></div></section>
<main><div><h2>Overview</h2><p>${esc(p.description)}</p>${p.locationDescription ? `<h2>Location</h2><p>${esc(p.locationDescription)}</p>` : ''}${hl ? `<h2>Highlights</h2><ul>${hl}</ul>` : ''}${suites}
${gal ? `<h2>Photos</h2><div class="gal">${gal}</div>` : ''}${p.mapImg ? `<h2>Map</h2><a class="map" href="${osm}" target="_blank"><img src="${p.mapImg}" alt="Map"></a>` : `<p><a class="btn" href="${osm}" target="_blank">View map</a></p>`}</div>
<aside><h2>Property Facts</h2><div class="facts">${facts(p).map(([k, v]) => `<div><b>${k}</b><span>${esc(v)}</span></div>`).join('')}</div>
${flyerPdfDataUrl ? `<p><a class="btn" download="${esc(p.name)}.pdf" href="${flyerPdfDataUrl}">Download flyer (PDF)</a></p>` : ''}<h2>Contact</h2>${brokers}</aside></main>
<footer>${esc(b.disclaimer)}<br>© ${new Date().getFullYear()} ${esc(b.company)} · Map data © OpenStreetMap contributors</footer></body></html>`;
}
// Table-based, inline-styled email (works in Outlook). Images must be hosted for most clients: pass imageBase to rewrite photo URLs.
export function emailHtml(p: Property, b: Brand, bannerUrl: string): string {
  const c = context(p, b);
  const row = ([k, v]: [string, string]) => `<tr><td style="padding:6px 0;border-bottom:1px solid ${b.light};font:bold 13px Arial,sans-serif;color:${b.secondary}">${k}</td><td align="right" style="padding:6px 0;border-bottom:1px solid ${b.light};font:13px Arial,sans-serif;color:#222">${esc(v)}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#eef1f4"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f4"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px">
<tr><td><img src="${bannerUrl}" width="600" alt="${esc(p.name)}" style="display:block;width:100%;height:auto;border:0"></td></tr>
<tr><td style="padding:24px 28px 8px;font:bold 22px Arial,sans-serif;color:${b.primary}">${esc(p.name)}</td></tr>
<tr><td style="padding:0 28px 12px;font:14px Arial,sans-serif;color:#555">${esc(c.fullAddress)} · <b>${esc(c.forLabel)}</b></td></tr>
<tr><td style="padding:0 28px 12px;font:14px/1.5 Arial,sans-serif;color:#222">${esc(p.description)}</td></tr>
<tr><td style="padding:0 28px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${facts(p).slice(0, 7).map(row).join('')}</table></td></tr>
<tr><td style="padding:0 28px 24px">${p.brokers.filter(x => x.name).map(x => `<p style="margin:0 0 10px;font:13px Arial,sans-serif;color:#222"><b style="color:${b.secondary}">${esc(x.name)}</b><br>${esc(x.phone)} · <a href="mailto:${esc(x.email)}" style="color:${b.primary}">${esc(x.email)}</a></p>`).join('')}</td></tr>
<tr><td style="background:${b.secondary};padding:14px 28px;font:11px Arial,sans-serif;color:#cfd8e3">${esc(b.company)} · ${esc(b.website)}<br>${esc(b.disclaimer)}</td></tr>
</table></td></tr></table></body></html>`;
}
