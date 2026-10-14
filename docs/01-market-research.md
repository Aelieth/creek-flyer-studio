# 01 · Market Research — incumbent CRE marketing platform
_Research date: 2026-10-13. Competitor names appear here for analysis only; never in the product._

## Sources reviewed
- Vendor homepage (buildout.com), "Showcase" marketing page (/platform/market), two self-guided interactive demo pages, July-2026 blog post on AI ingestion + "Marketing Proposal Builder".
- YouTube: CEO on-screen demo (GowerCrowd podcast, youtube.com/watch?v=iuS377P88vU).
- X search (last ~7 days): essentially no product discussion; one hit = SIOR Fall '26 sponsor list. X is not a useful signal for this category.

## What the product actually is
Positioning has moved from "flyer/OM builder" to "AI brokerage platform": CRM + marketing + data + back office on one record. Claims 50,000+ brokers. Marketing module ("Showcase") is the part Creek uses.

## Marketing feature inventory (from public pages)
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

## What Creek actually needs for v1 (80/20)
1. Property record → auto-filled flyers (sale, lease, brochure). 2. Locked brand (logo, colors, fonts). 3. Light editor for tweaks. 4. Reliable PDF export at letter size. 5. Auto data (geocode, flood, demographics, map).
Later: property web pages, listings feed on creekpe.com, email blasts, AI field extraction from LOIs/leases (cheap now with LLM APIs), comps tables.

## Inspiration repo
storytold/artcraft — Rust/TS AI art & film tool, dual **MIT / Apache-2.0** license. Porting allowed with attribution, but its domain (AI image/video, 3D) doesn't map to print layout; we borrowed UX patterns only (left asset/template rail, canvas center, inspector + layers right, keyboard nudging). No code copied.
