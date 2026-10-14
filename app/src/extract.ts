// Rule-based field extraction from pasted listing text (LOIs, emails, old flyers, listing sites).
// Runs fully in the browser; no data leaves the machine. Returns only fields it is confident about.
import type { Property } from './types';
const money = String.raw`\$\s?[\d,]+(?:\.\d+)?(?:\s?(?:M|MM|K|million))?`;
const pick = (t: string, re: RegExp, g = 1) => { const m = re.exec(t); return m ? m[g].trim().replace(/\s+/g, ' ') : ''; };
export function extractFields(raw: string): Partial<Property> {
  const t = raw.replace(/\r/g, ''); const flat = t.replace(/\n+/g, ' ');
  const out: Partial<Property> = {};
  const set = (k: keyof Property, v: string) => { if (v) (out as any)[k] = v; };
  set('price', pick(flat, new RegExp(String.raw`(?:sale\s+price|asking\s+price|list(?:ing)?\s+price|price)\s*[:\-]?\s*(${money})`, 'i')) || pick(flat, new RegExp(String.raw`(${money})\s*(?:asking|sale price)`, 'i')));
  set('leaseRate', pick(flat, new RegExp(String.raw`(?:lease\s+rate|rental\s+rate|rent|asking\s+rate)\s*[:\-]?\s*(${money}\s*(?:\/\s?|per\s)?(?:SF|sq\.?\s?ft\.?|square\s+foot)?\s*(?:\/\s?|per\s)?(?:yr|year|mo|month|annually)?(?:\s*\(?\s*(?:NNN|MG|FS|Full Service|Gross|Modified Gross)\s*\)?)?)`, 'i'))
    || pick(flat, new RegExp(String.raw`(${money}\s*\/\s?(?:SF|sf)\s*\/?\s*(?:yr|year)?(?:\s*(?:NNN|MG|FS))?)`, 'i')));
  set('leaseType', pick(flat, /\b(NNN|Triple Net|Full Service|Modified Gross|Gross Lease|Absolute Net)\b/i));
  set('buildingSf', pick(flat, /(?:building\s+(?:size|sf|area)|total\s+(?:building\s+)?sf|gross\s+building\s+area|rentable\s+area|net\s+rentable\s+area|gla)\s*[:\-]?\s*±?\s*([\d,]{3,}\s*(?:SF|RSF|sq\.?\s?ft\.?|square\s+feet))/i)
    || pick(flat, /±?\s*([\d,]{4,}\s*(?:SF|RSF|sq\.?\s?ft\.?|square\s+feet))/i));
  set('availableSf', pick(flat, /(?:available(?:\s+space|\s+sf)?|space\s+available)\s*[:\-]?\s*±?\s*([\d,]+(?:\s*[-–]\s*[\d,]+)?\s*(?:SF|RSF|sq\.?\s?ft\.?|square\s+feet))/i));
  set('officeSf', pick(flat, /office\s+(?:sf|space|area)\s*[:\-]?\s*±?\s*([\d,]+\s*(?:SF|sq\.?\s?ft\.?))/i));
  set('lotAcres', pick(flat, /(?:lot\s+size|land\s+(?:area|size)|site\s+size|acreage)?\s*[:\-]?\s*±?\s*([\d,]*\.?\d+\s*(?:acres?|AC))\b/i));
  set('yearBuilt', pick(flat, /(?:year\s+built|built\s+in|constructed(?:\s+in)?)\s*[:\-]?\s*((?:19|20)\d{2})/i));
  set('zoning', pick(flat, /zon(?:ing|ed)\s*[:\-]?\s*([A-Z]{1,3}-?\d{0,2}[A-Z]?(?:\s*\([^)]{0,30}\))?)/));
  set('parking', pick(flat, /parking\s*[:\-]?\s*([^.;\n]{2,40}?(?:spaces|stalls|\/\s?1,?000(?:\s?SF)?|ratio)[^.;]{0,15})/i));
  set('clearHeight', pick(flat, /clear\s+height\s*[:\-]?\s*([\d'’"″\s\-–]{2,12}(?:ft|feet)?)/i));
  set('capRate', pick(flat, /cap(?:italization)?\s+rate\s*[:\-]?\s*([\d.]+\s?%)/i));
  set('noi', pick(flat, new RegExp(String.raw`(?:NOI|net\s+operating\s+income)\s*[:\-]?\s*(${money})`, 'i')));
  set('traffic', pick(flat, /([\d,]{4,}\s*(?:VPD|vehicles per day|cars per day|AADT))/i));
  set('yearBuilt', out.yearBuilt || '');
  const addr = /(\d{2,6}\s+(?:[NSEW]\.?\s+)?[A-Z0-9][\w.']*(?:\s+[A-Z0-9][\w.']*){0,4}\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Pkwy|Parkway|Hwy|Highway|Ln|Lane|Way|Ct|Court|Pl|Place|Expressway|Expwy|Fwy)\.?(?:\s+(?:Suite|Ste\.?|#)\s*\w+)?)(?:,?\s+([A-Z][a-zA-Z.\s]{2,30}?),\s*([A-Z]{2})\s+(\d{5}))?/;
  const m = addr.exec(flat);
  if (m) { set('address', m[1]); if (m[2]) { set('city', m[2].trim()); set('state', m[3]); set('zip', m[4]); } }
  else { const c = /([A-Z][a-zA-Z.\s]{2,30}),\s*([A-Z]{2})\s+(\d{5})/.exec(flat); if (c) { set('city', c[1].trim()); set('state', c[2]); set('zip', c[3]); } }
  const types: [RegExp, string][] = [[/medical office|MOB\b/i, 'Medical Office'], [/industrial|warehouse|distribution|manufactur/i, 'Industrial'], [/flex space|flex\b/i, 'Flex'], [/retail|shopping center|strip center/i, 'Retail'],
    [/multifamily|apartment/i, 'Multifamily'], [/\bland\b|acreage|pad site/i, 'Land'], [/hotel|hospitality/i, 'Hospitality'], [/office/i, 'Office']];
  for (const [re, v] of types) if (re.test(flat)) { out.propType = v; break; }
  if (/for\s+lease|lease\s+rate|for\s+rent/i.test(flat) && /for\s+sale|sale\s+price|asking\s+price/i.test(flat)) out.listing = 'Sale or Lease';
  else if (/for\s+lease|lease\s+rate|for\s+rent|\/sf\/yr/i.test(flat)) out.listing = 'Lease'; else if (/for\s+sale|sale\s+price|asking\s+price|cap rate/i.test(flat)) out.listing = 'Sale';
  const bullets = t.split('\n').map(l => l.trim()).filter(l => /^[-•*▪●◦]\s+/.test(l)).map(l => l.replace(/^[-•*▪●◦]\s+/, ''));
  if (bullets.length) out.highlights = bullets.slice(0, 8).join('\n');
  const paras = t.split(/\n\s*\n/).map(p => p.replace(/\n/g, ' ').trim()).filter(p => p.length > 120 && !/^[-•*]/.test(p) && (p.match(/\./g) || []).length >= 2);
  if (paras.length) out.description = paras.sort((a, b) => b.length - a.length)[0].slice(0, 900);
  const em = [...flat.matchAll(/([A-Z][a-z]+\s+[A-Z][a-z]+)[^@]{0,60}?([\w.+-]+@[\w-]+\.[\w.]+)/g)];
  if (em.length) out.brokers = em.slice(0, 3).map(x => ({ name: x[1], title: '', email: x[2], phone: pick(flat.slice(flat.indexOf(x[2])), /(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/), mobile: '' }));
  return out;
}
