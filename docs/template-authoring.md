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

## Layout helpers
- `flow: 'brokers', flowIdx: n, flowGap: 20` on elements makes columns sit side by side; each column starts `flowGap` px after the widest visible line of the previous one (used for broker contacts; hidden columns collapse).
- Tables: `rowGap` adds a spacer (with rule) after each non-suite row. If a table is taller than its box it automatically drops the gaps, then tightens row height, so it never runs into the footer.

- `flowEnd: 7` on a rect inside a flow column pins it 7 px right of that column's widest line (the vertical rule between broker contacts in the Signature footer).
- Vertical stacks: `stack: 'left', stackIdx: n` orders blocks top to bottom. A block with `stackGrow: true` (a table or text) is measured, and everything later in the stack moves up or down by the difference from its box height. When a grow block is hidden (`showIf` empty) its slot plus `stackGap` collapses. `stackMax` is the lowest y the stack may reach; past it, table rows tighten first, then stacked text shrinks (not below 9.5 px).
- Text: `indent` sets the hanging indent for `•` bullet lines, and `paraGap` adds space between paragraphs. Long hyphenated words can break after a hyphen.
- Context helpers: `{{subtitle}}` (the property's subtitle, or the full address), `{{salePrice}}`, `{{leaseRateIf}}` and `{{leaseTypeIf}}` (blank when they don't apply to the listing type).

## Text that always fits
Set `autoFit: true` on a text element and it shrinks until it fits its box (down to `minSize`). The editor outlines any remaining overflow in red, and export warns about it.

## Checklist for a new template
1. Add page function(s) to `PAGES` and a `TEMPLATES` entry.
2. `npm run dev`. Check it in the gallery with the sample property and with an empty property.
3. Export the PDF; make sure no red overflow outlines appear.
4. Use only original artwork, OFL/open fonts and CC0 images. Never copy another vendor's layout files or assets.
