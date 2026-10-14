# Architecture

Static single-page app (Vite + React 19 + TypeScript). No server; state lives in the browser (IndexedDB).

```
Property record ─┐
Brand kit ───────┼─► compilePage() ─► primitives (rect | text | img) ─┬─► SvgPage   (live preview, thumbnails)
Doc (pages/els) ─┘     compile.ts      text already laid out           ├─► buildPdf  (vector PDF, jsPDF + embedded TTF)
                                                                       └─► renderPng (canvas → PNG/JPEG)
```

One layout engine feeds all three outputs, so the preview, the PDF and the PNG match.

## Modules (app/src)
| File | Role |
|---|---|
| types.ts | Property, Brand, Element (text/rect/image/table), Doc, output SIZES |
| store.ts | Default sample data, load/save to IndexedDB (`cfs.state.v2`), file helpers |
| compile.ts | Token resolution `{{field\|filter}}`, `showIf`, text measurement/wrap/justify/bullets/auto-fit, table expansion (`@suites`, `source: comps`), image requests |
| fonts.ts | Font registry with ascent/descent metrics, loads OFL fonts (stored as base64) |
| images.ts | Pre-processes photos on canvas (crop focus, zoom, radius, grayscale, tint) at 2×, cached |
| SvgPage.tsx | SVG renderer + overflow detection |
| pdf.ts | Vector PDF (selectable text, rotation, opacity), PNG/JPEG renderer |
| templates.ts | Page library (`PAGES`), document templates (`TEMPLATES`), `fitEls` resizing |
| lookup.ts | Address → geocode, flood, demographics, static map |
| extract.ts | Paste-text → field extraction |
| publish.ts / Publish.tsx | Microsite HTML and email HTML generators |
| Editor.tsx | Canvas editor: select, move, 8-way resize, rotate, smart guides, inline text edit, undo/redo, inspector, layers, pages |
| PropertyTab / BrandTab / Gallery | Data entry, brand kit + project import/export, template gallery |

## Coordinates and units
Pages are in CSS px at 96 dpi (Letter = 816×1056). PDF export scales by 0.75 to points. Text sizes are px; letter-spacing is 1/100 em.

## Persistence
The entire state `{properties, brand, docs}` is one JSON blob. *Export project JSON* / *Import* in the Brand tab moves it between machines. A shared backend is on the roadmap.
