import { useEffect, useState } from 'react';

export type TourStep = { tab: 'property' | 'brand' | 'templates' | 'design' | 'publish'; title: string; body: string };
export const TOUR: TourStep[] = [
  { tab: 'property', title: '1 · Property record', body: 'Everything starts with one property record. Type an address and press Look up to pull the geocode, county, flood zone, map and demographics, or paste listing text and press Extract. Every flyer, brochure, microsite and email reads from this record.' },
  { tab: 'brand', title: '2 · Brand kit', body: 'Upload your logo and set your colors and fonts once. Every template picks them up automatically. You can also export/import the whole project as a JSON file here.' },
  { tab: 'templates', title: '3 · Templates', body: 'The previews below are your own property in your own brand. Pick a template (and optionally another output size) to create a document.' },
  { tab: 'design', title: '4 · Design', body: 'Click to select, drag to move, use the handles to resize and rotate. Double-click text to edit it on the canvas. Guides snap to the page and to other elements. Export PDF gives a vector PDF with selectable text.' },
  { tab: 'publish', title: '5 · Publish', body: 'Turn the same record into a one-file listing website or a ready-to-send email (HTML + banner image).' },
];

export function Welcome({ onTour, onBlank, onClose }: { onTour: () => void; onBlank: () => void; onClose: () => void }) {
  return <div className="modal-bg" onClick={onClose}><div className="modal welcome" onClick={e => e.stopPropagation()}>
    <img className="welcome-logo" src={`${import.meta.env.BASE_URL}brand/creekpe-logo.svg`} alt="Creek Price Edwards" />
    <h2>Welcome to Creek Flyer Hub</h2>
    <p>Build on-brand flyers, brochures, offering memoranda, social posts, email blasts and listing websites from a single property record.</p>
    <ol className="steps"><li><b>Listing</b> enter or look up the listing</li><li><b>Brand</b> logo, colors, fonts</li><li><b>Templates</b> pick a layout</li><li><b>Design</b> tweak and export PDF</li><li><b>Publish</b> microsite and email</li></ol>
    <p className="muted">A sample listing (<i>Riverside Business Center</i>, fictional) is loaded so you can try everything right away. Your work is saved in this browser only.</p>
    <div className="row end"><button onClick={onBlank}>Start with a blank listing</button><button onClick={onClose}>Explore the sample</button><button className="primary" onClick={onTour}>Take the 1-minute tour</button></div>
  </div></div>;
}

export function TourCard({ i, onNext, onPrev, onEnd }: { i: number; onNext: () => void; onPrev: () => void; onEnd: () => void }) {
  const s = TOUR[i];
  return <div className="tour"><div className="tour-h"><b>{s.title}</b><button className="x" onClick={onEnd} title="Close tour">✕</button></div>
    <p>{s.body}</p>
    <div className="row"><span className="muted">{i + 1} / {TOUR.length}</span><span className="grow" />
      {i > 0 && <button className="sm" onClick={onPrev}>Back</button>}
      {i < TOUR.length - 1 ? <button className="sm primary" onClick={onNext}>Next</button> : <button className="sm primary" onClick={onEnd}>Done</button>}</div></div>;
}

const SC: [string, string][] = [
  ['Click / drag', 'Select / move element'], ['Handles', 'Resize from any side or corner (Shift = keep proportions)'], ['Top knob', 'Rotate (hold Shift to snap 15°)'],
  ['Alt while dragging', 'Turn off smart-guide snapping'], ['Double-click / Enter', 'Edit text on the canvas'], ['Ctrl/⌘ + Enter, Esc', 'Finish / cancel text editing'],
  ['Arrow keys', 'Nudge 1 px (Shift = 10 px)'], ['Delete / Backspace', 'Delete element'], ['Ctrl/⌘ + D', 'Duplicate'], ['Ctrl/⌘ + C / V', 'Copy / paste'],
  ['Ctrl/⌘ + Z', 'Undo'], ['Ctrl/⌘ + Shift + Z or Ctrl + Y', 'Redo'], ['Esc', 'Deselect'], ['?', 'Show this help'],
];
export function Shortcuts({ onClose, onTour }: { onClose: () => void; onTour: () => void }) {
  return <div className="modal-bg" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}>
    <div className="row"><h2>Keyboard shortcuts</h2><span className="grow" /><button className="x" onClick={onClose}>✕</button></div>
    <table className="sc"><tbody>{SC.map(([k, v]) => <tr key={k}><td><kbd>{k}</kbd></td><td>{v}</td></tr>)}</tbody></table>
    <div className="row end"><button onClick={onTour}>Replay the tour</button><button className="primary" onClick={onClose}>Close</button></div>
  </div></div>;
}

export function useHelpKey(open: () => void) {
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return; if (e.key === '?') { e.preventDefault(); open(); } };
    window.addEventListener('keydown', kd); return () => window.removeEventListener('keydown', kd);
  }, [open]);
}
export const useWelcome = () => { const [w, setW] = useState(() => !localStorage.getItem('cfs.welcomed')); return [w, () => { localStorage.setItem('cfs.welcomed', '1'); setW(false); }] as const; };
