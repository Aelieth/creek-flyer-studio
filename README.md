# Creek Flyer Studio

An in-house builder for commercial real-estate marketing: flyers, brochures, offering memoranda, social posts, email blasts and listing microsites. Each one is generated from a single property record and a brand kit.

**Live demo:** https://aelieth.github.io/creek-flyer-studio/. Sample data is fictional; your data stays in your browser.

## Features
- **One property record** feeds every document, the microsite and the email
- **Address lookup** auto-fills geocode, county, flood zone, demographics (free Census key) and a branded map
- **Paste-to-extract:** paste listing text or an email and it extracts price, SF, rate, zoning, highlights and brokers
- **14 templates / 18 library pages:** sale, lease, multi-tenant availability, land, retail aerial, OM (cover, investment summary, comps, demographics), 11×17 brochure, social, email banner
- **Sizes:** Letter portrait/landscape, Tabloid, A4, Social 1080, Email 1200×600. Any page refits to any size
- **Editor:** drag, 8-way resize, rotate, smart guides, inline text editing, auto-fit text, image crop/zoom/tint, layers, undo/redo, page reorder
- **Onboarding:** welcome screen, 5-step guided tour, `?` opens keyboard-shortcut help
- **Export:** vector PDF with selectable text (~0.2–1.2 MB), PNG/JPEG, microsite HTML, email HTML, project JSON

## Quick start
```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in app/dist
```

## Repo layout
```
app/        Vite + React + TS source (src/), public assets (fonts/demo as base64)
docs/       architecture, template authoring, data connectors, deployment, research
```

## Adding templates
See [docs/template-authoring.md](docs/template-authoring.md). Templates are typed data with `{{field}}` tokens; pages refit to any size.

## Data sources
Free/keyless today: Census Geocoder, FEMA flood, OSM/Nominatim, and Census ACS (free key). Paid options are under "Review later" in [docs/data-connectors.md](docs/data-connectors.md).

## Hosting
GitHub Pages for the demo. For production, AWS Amplify or Azure Static Web Apps behind Office 365 sign-in. See [docs/deployment.md](docs/deployment.md).

## Roadmap
1. Shared backend (records, templates, brand lock) with O365 sign-in
2. County parcel/zoning and DOT traffic-count connectors
3. LLM-assisted extraction and description writing (server-side key)
4. Save custom pages to the library; brand-locked fields
5. Listings feed for the company website; email send integration

## Content policy
Only original code, OFL fonts and CC0 images are used. The project never copies another vendor's code, templates or assets, and never uses competitor names. Proprietary reference material stays out of this repo.
