// Small shared form controls.
import type { Brand } from './types';
export function Field({ label, v, on, area, rows, wide, ph, type }: { label: string; v: string; on: (s: string) => void; area?: boolean; rows?: number; wide?: number; ph?: string; type?: string }) {
  return <label className="field" style={wide ? { gridColumn: `span ${wide}` } : undefined}><span>{label}</span>
    {area ? <textarea value={v} placeholder={ph} onChange={e => on(e.target.value)} rows={rows || 4} /> : <input type={type || 'text'} value={v} placeholder={ph} onChange={e => on(e.target.value)} />}</label>;
}
export function Num({ label, v, on, step = 1, min, max, w = 64 }: { label: string; v: number | undefined; on: (n: number) => void; step?: number; min?: number; max?: number; w?: number }) {
  return <label className="num"><span>{label}</span><input type="number" step={step} min={min} max={max} style={{ width: w }} value={v === undefined ? '' : Math.round(v * 100) / 100} onChange={e => on(+e.target.value)} /></label>;
}
export const BRAND_COLORS = ['$primary', '$secondary', '$accent', '$dark', '$light'] as const;
export function ColorPick({ label, v, b, on, none }: { label: string; v?: string; b: Brand; on: (c: string | undefined) => void; none?: boolean }) {
  const cur = v?.startsWith('$') ? (b as any)[v.slice(1)] : v || '#ffffff';
  return <div className="field"><span>{label}</span><div className="row">
    {BRAND_COLORS.map(t => <button key={t} title={'Brand ' + t.slice(1)} className={'sw' + (v === t ? ' on' : '')} style={{ background: (b as any)[t.slice(1)] }} onClick={() => on(t)} />)}
    <button className={'sw' + (v === '#ffffff' ? ' on' : '')} style={{ background: '#fff' }} onClick={() => on('#ffffff')} title="White" />
    <button className={'sw' + (v === '#000000' ? ' on' : '')} style={{ background: '#000' }} onClick={() => on('#000000')} title="Black" />
    <input type="color" value={/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#ffffff'} onChange={e => on(e.target.value)} />
    {none && <button className="sm" onClick={() => on(undefined)}>none</button>}</div></div>;
}
