import { useEffect, useMemo, useState } from 'react';
import type { Brand, El, Property } from './types';
import { compilePage, type Prim } from './compile';
import { getProcessed, processImage } from './images';
const tf = (p: Prim) => p.xf.rot ? `rotate(${p.xf.rot} ${p.xf.cx} ${p.xf.cy})` : undefined;
export function SvgPage({ els, p, b, w, h, scale, editing, onOverflow }: { els: El[]; p: Property; b: Brand; w: number; h: number; scale: number; editing: boolean; onOverflow?: (ids: string[]) => void }) {
  const comp = useMemo(() => compilePage(els, p, b, editing), [els, p, b, editing]);
  const [, bump] = useState(0);
  useEffect(() => { let live = true; comp.imgs.forEach(r => { if (!getProcessed(r.key)) processImage(r).then(() => live && bump(x => x + 1)).catch(() => {}); }); return () => { live = false; }; }, [comp]);
  useEffect(() => { onOverflow?.(comp.overflow); }, [comp]); // eslint-disable-line
  return <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', background: '#fff' }}>
    {comp.prims.map((q, i) => {
      const o = q.xf.opacity < 1 ? q.xf.opacity : undefined;
      if (q.k === 'rect') return <rect key={i} x={q.x} y={q.y} width={Math.max(0, q.w)} height={Math.max(0, q.h)} rx={q.r} fill={q.fill || 'none'} stroke={q.stroke} strokeWidth={q.sw} opacity={o} transform={tf(q)} />;
      if (q.k === 'text') return <text key={i} x={q.x} y={q.y} fontFamily={`"${q.font}"`} fontWeight={q.weight} fontSize={q.size} fill={q.color} letterSpacing={q.ls || undefined} fontStyle={q.italic ? 'italic' : undefined} opacity={o} transform={tf(q)} style={{ whiteSpace: 'pre' }}>{q.str}</text>;
      if (q.k === 'img') { const pr = getProcessed(q.key); return pr ? <image key={i} href={pr.url} x={q.x} y={q.y} width={q.w} height={q.h} preserveAspectRatio="none" opacity={o} transform={tf(q)} /> : <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill="#eef0f3" transform={tf(q)} />; }
      return <g key={i} transform={tf(q)} opacity={o}><rect x={q.x} y={q.y} width={q.w} height={q.h} fill="#e4e8ee" stroke="#a9b3c1" strokeDasharray="6 4" />
        <text x={q.x + q.w / 2} y={q.y + q.h / 2} textAnchor="middle" dominantBaseline="middle" fontFamily="Open Sans" fontSize={Math.min(16, Math.max(9, q.w / 16))} fill="#6b7684">{q.label}</text></g>;
    })}
  </svg>;
}
