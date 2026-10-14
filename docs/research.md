# Market research — incumbent CRE marketing platforms
_Research date: 2026-10-13. Vendors are deliberately not named. Only public marketing pages were reviewed for feature ideas; no code, templates or assets were copied._

## Sources reviewed
- Leading vendor's public homepage, marketing-module page, two self-guided demo pages and a 2026 blog post on AI ingestion and a proposal builder.
- A public video interview with an on-screen product demo.
- X search (last ~7 days): essentially no product discussion; one hit = SIOR Fall '26 sponsor list. X is not a useful signal for this category.

## What the product actually is
Positioning has moved from "flyer/OM builder" to "AI brokerage platform": CRM + marketing + data + back office on one record. Large installed base. The marketing module is the part we are replacing.

## Feature inventory (from public pages)
| Area | Features |
|---|---|
| Single data entry | One property record feeds every document, website, email; linked fields auto-update docs when data changes |
| Documents | OMs, BOVs, proposals, brochures, flyers, pitch decks |
| Templates | Pre-built + vendor-built custom brand templates (tier includes "3 custom page templates, 1 additional document template style"); page library to add/reorder pages; insert external PDFs |
| Editor | Drag-and-drop, color changes, photo shading; "Canva-like" with data-bound elements; save pages to template library |
| Maps / data | Branded Google maps, comps, plans/graphs/charts/tables, demographics |
| AI | Upload listing docs → extract fields (claims 30 min → 2 min); AI description writer; prompt-to-page "proposal builder" |
| Distribution | Listing landing pages/websites, active/closed listings showcase on broker site, email blasts, syndication network, document vault/CA, investor matching |
| Reporting | Client activity reports |

## What we need (80/20)
1. Property record → auto-filled flyers (sale, lease, brochure). 2. Locked brand (logo, colors, fonts). 3. Light editor for tweaks. 4. Reliable PDF export at letter size. 5. Auto data (geocode, flood, demographics, map).
Later: listings feed on the company site, email blasts, AI field extraction from LOIs/leases (cheap now with LLM APIs), comps tables.

## Inspiration repo
storytold/artcraft — Rust/TS AI art & film tool, dual **MIT / Apache-2.0** license. Porting allowed with attribution, but its domain (AI image/video, 3D) doesn't map to print layout; we borrowed UX patterns only (left asset/template rail, canvas center, inspector + layers right, keyboard nudging). No code copied.

## How each idea is implemented here (original code)
| Idea | Our version |
|---|---|
| One record → every document | `Property` record; tokens `{{field}}` bound in every template, microsite and email |
| Page library | `PAGES` in templates.ts; *Insert page* in Design tab; any page fits any size |
| Listing website | Publish → self-contained microsite HTML (optionally embeds the flyer PDF) |
| Comps table | `comps[]` on the record + table element `source: 'comps'` |
| Branded maps | OSM static map compositor, muted/gray mode, brand-colored pin |
| AI field extraction | Paste text → rule-based extractor (extract.ts) with preview/apply; LLM hook on roadmap |
| Email blast | Publish → 600px table-layout HTML + banner JPG |
