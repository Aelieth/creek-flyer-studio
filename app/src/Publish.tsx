import { useState } from 'react';
import type { Brand, Doc, Property } from './types';
import { emailHtml, micrositeHtml } from './publish';
import { buildPdf, renderPng, safeName } from './pdf';
import { download } from './store';
import { TEMPLATES, makeDocPages, sizeOf } from './templates';
export function Publish({ p, b, docs }: { p: Property; b: Brand; docs: Doc[] }) {
  const mine = docs.filter(d => d.propertyId === p.id);
  const [flyer, setFlyer] = useState(mine[0]?.id || ''); const [busy, setBusy] = useState('');
  const site = async () => { setBusy('Building microsite…'); try { const d = docs.find(x => x.id === flyer); let pdfUrl: string | undefined;
    if (d) { const pdf = await buildPdf(d, p, b); pdfUrl = pdf.output('datauristring'); }
    download(micrositeHtml(p, b, pdfUrl), safeName(p.name) + '-site.html', 'text/html'); } finally { setBusy(''); } };
  const email = async () => { setBusy('Rendering email…'); try {
    const t = TEMPLATES.find(x => x.id === 'email')!; const sz = sizeOf(t.size); const pg = makeDocPages(t, sz)[0];
    const banner = await renderPng(pg.els, p, b, sz.w, sz.h, 1, 'jpeg');
    download(emailHtml(p, b, banner), safeName(p.name) + '-email.html', 'text/html');
    download(await (await fetch(banner)).blob(), safeName(p.name) + '-email-banner.jpg'); } finally { setBusy(''); } };
  return <div className="page-form">
    <section className="card"><h2>Listing microsite <small>one self-contained HTML file</small></h2>
      <p>Hero, facts, description, highlights, suites, photo gallery, map, broker contacts and a flyer download button. Upload the file to S3/creekpe.com or attach it to an email; it works offline.</p>
      <div className="row"><span>Attach flyer:</span><select value={flyer} onChange={e => setFlyer(e.target.value)}><option value="">(none)</option>{mine.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <button className="primary" disabled={!!busy} onClick={site}>Download microsite</button></div></section>
    <section className="card"><h2>Email blast <small>Outlook-safe HTML</small></h2>
      <p>Table-based 600 px email with banner image, description, key facts and broker contacts. Downloads the HTML plus the banner image. For mass sending, host the banner (S3/website) and replace the embedded image URL — many mail clients block embedded images.</p>
      <button className="primary" disabled={!!busy} onClick={email}>Download email</button></section>
    {busy && <p className="muted">{busy}</p>}
  </div>;
}
