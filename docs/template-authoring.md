# Template authoring

Templates are plain TypeScript data in `app/src/templates.ts`. No designer tool is required, and anything you build in the editor can be saved as a page.

## Pages and templates
- A **page** is `(w, h) => Element[]` registered in `PAGES` with an id, name, native size and tags.
- A **template** is a name, size, tags and a list of page ids in `TEMPLATES`.
- Any page can be dropped into any size; `fitEls` scales it uniformly, centers it, and stretches full-bleed shapes.

## Element helpers
```ts
T(x, y, w, h, text, style)   // text box
R(x, y, w, h, fill)          // rectangle
I(x, y, w, h, src, opts)     // image: 'photo:0', 'aerial', 'map', 'sitePlan', 'logo', 'icon:car' …
TB(x, y, w, rows, opts)      // table; rows are strings with cells separated by |
```
Common props: `rot`, `opacity`, `locked`, `showIf: 'field'` (hide when the field is empty).

## Data tokens
`{{field}}` with filters chained by `|`:
| Filter | Effect |
|---|---|
| upper | UPPERCASE |
| bullets / dash | one bullet per line (hanging indent) |
| pre:X / post:X | prefix/suffix only when the value is non-empty |
| or:X | fallback text |

A line whose tokens are all empty is removed, so optional facts disappear cleanly. Colors may be brand tokens: `$primary`, `$secondary`, `$accent`, `$dark`, `$light`.

Tables: a row `@suites` expands to one row per available suite; `source: 'comps'` or `'suites'` binds the whole table to the record's arrays.

## Text that always fits
Set `autoFit: true` on a text element and it shrinks until it fits its box (down to `minSize`). The editor outlines any remaining overflow in red, and export warns about it.

## Checklist for a new template
1. Add page function(s) to `PAGES` and a `TEMPLATES` entry.
2. `npm run dev`. Check it in the gallery with the sample property and with an empty property.
3. Export the PDF; make sure no red overflow outlines appear.
4. Use only original artwork, OFL/open fonts and CC0 images. Never copy another vendor's layout files or assets.
