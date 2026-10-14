# Creek Flyer Studio (rough draft)
In-house commercial property flyer & brochure builder. Static web app (Vite + React + TS).

- **Run locally:** `cd app && npm install && npm run dev` → http://localhost:5173  (or `npm run build` and open `dist/` via any static server)
- **Workflow:** 1) Property: type an address → Look up (Census geocoder, FEMA flood, ACS demographics, OSM map) → add photos. 2) Brand: logo, colors, font, optional free Census key. 3) Design: pick template → drag/resize/edit → Export PDF/PNG.
- **Data:** stored only in your browser (localStorage). Nothing uploaded.
- **Docs:** `docs/01-market-research.md`, `docs/02-data-sources.md`, `docs/03-hosting.md`
- Map data © OpenStreetMap contributors. Flood data: FEMA NFHL. Demographics: U.S. Census Bureau.
- UI layout patterns inspired by the open-source storytold/artcraft (MIT/Apache-2.0); no code copied.
