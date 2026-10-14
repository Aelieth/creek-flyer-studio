import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
export async function exportPages(nodes: HTMLElement[], name: string, kind: 'pdf' | 'png') {
  const imgs: string[] = [];
  for (const n of nodes) imgs.push(await toPng(n, { pixelRatio: 2.5, cacheBust: false, backgroundColor: '#ffffff' }));
  const safe = name.replace(/[^\w-]+/g, '_') || 'flyer';
  if (kind === 'png') { imgs.forEach((d, k) => dl(d, `${safe}${imgs.length > 1 ? '_p' + (k + 1) : ''}.png`)); return; }
  const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait', compress: true });
  imgs.forEach((d, k) => { if (k) pdf.addPage(); pdf.addImage(d, 'PNG', 0, 0, 8.5, 11, undefined, 'FAST'); });
  pdf.save(safe + '.pdf');
}
function dl(href: string, file: string) { const a = document.createElement('a'); a.href = href; a.download = file; a.click(); }
