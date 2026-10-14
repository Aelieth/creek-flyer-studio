# Data connectors

How the app pulls live data, and what else could be plugged in.

## How the lookup works (lookup.ts)
1. Census Geocoder (JSONP) → lat/lon, matched address, county, tract. Falls back to Nominatim.
2. FEMA NFHL point query → flood zone.
3. If a Census key is set (Brand tab): ACS 5-yr tract stats → population, households, median income, median age.
4. OSM tiles composited on a canvas → static map JPG (optional muted style, brand pin), saved into the record.

All calls run in the browser; no secrets. To add a connector: write an `async (lat, lon) => Partial<Property>` function in lookup.ts and merge its result in `lookupAddress`. Paid keys must go through a server proxy (see deployment.md), never in the bundle.

## Catalog
Legend: **LIVE** = wired into the app now. Cost "?" = not verified; check vendor pricing page / get quote. No prices below were invented.

## A. Free / keyless — used now
| Source | Data | Access | Auth | Status |
|---|---|---|---|---|
| US Census Geocoder `geocoding.geo.census.gov` | Address → lat/lon, normalized address, county, tract FIPS | REST; no CORS → app uses JSONP | none | **LIVE** |
| OSM Nominatim | Geocode fallback, POIs | REST, CORS | none; 1 req/s, must show attribution; heavy use → self-host | **LIVE** (fallback) |
| FEMA NFHL `hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` | Flood zone (A/AE/X…) | ArcGIS REST point query, CORS | none | **LIVE** |
| OpenStreetMap tiles | Base map image | tile.openstreetmap.org | none; low-volume only per tile policy | **LIVE** (static map compositor) |
| Census ACS 5-yr `api.census.gov` | Population, income, age, housing by tract/block group | REST, CORS | **free key now required** (tested: keyless redirects to missing_key) | **LIVE** when key pasted in the Brand tab |

## B. Free — next to wire
| Source | Data | How to connect |
|---|---|---|
| County appraisal district / assessor GIS (e.g. DCAD, TAD, HCAD, Collin CAD) | Parcel ID, owner, land/improvement value, year built, SF, legal | Most expose ArcGIS REST FeatureServer parcels layer → point-in-polygon query by lat/lon (same pattern as FEMA). Per-county config; some only offer bulk CSV downloads. Map our top 5 counties first. |
| City zoning GIS (Dallas, Fort Worth, etc.) | Zoning district | ArcGIS REST point query |
| TxDOT AADT (open data portal / ArcGIS) | Traffic counts — big for retail flyers | ArcGIS REST nearest-point query |
| BLS (QCEW, LAUS) | Employment, unemployment by county/MSA | REST v2, free key |
| Census CBP / LEHD (OnTheMap) | Business counts, daytime workers | REST / bulk |
| OSM Overpass API | Nearby amenities, anchors, highways | REST, free, rate-limited |
| HUD USPS crosswalk, HUD FMR | ZIP↔tract, fair market rents | REST, free token |
| FRED | Rates/CPI for OM market pages | REST, free key |
| EPA EJScreen / Envirofacts | Environmental flags | REST |
| USGS / NLCD, NWI wetlands | Land/environment | ArcGIS REST |
| Microsoft Building Footprints | Building outlines | bulk GeoJSON (ODbL) |

## B2. Retail tools (live in the app)
- **Nearby retailers & draws:** OpenStreetMap Overpass (`maps.mail.ru` mirror first, then `overpass-api.de`, `overpass.private.coffee`). Anchors, malls, hospitals, colleges, cinemas and every branded shop/restaurant within 1.25 mi; ranked by type, brand and distance; top 12 switched on. Each pin can be renamed, toggled, re-typed or given an uploaded logo. Custom pins take lat/lon. Data © OpenStreetMap contributors (ODbL).
- **Traffic counts:** ODOT `AADT_Network` FeatureServer (services6.arcgis.com/RBtoEUQ2lmN0K3GY, CORS, no key) for Oklahoma; TxDOT `TxDOT_AADT_Annuals_(Public_View)` (services.arcgis.com/KTcxiTD9dsQw4r7Z) for Texas. Nearest distinct counts within 1 mi; road names are typed by the user (state route IDs aren't friendly names).
- **Ring demographics:** TIGERweb `tigerWMS_ACS2023` layer 10 (block groups, point+distance query) → ACS 2023 5-yr `B01003_001E, B11001_001E, B19013_001E, B19025_001E` per county → sum block groups whose internal point lies inside each ring. Avg HH income = aggregate income / households; median = household-weighted median of block-group medians (estimate). Growth = vs ACS 2019 on the 2010-geography block groups (`tigerWMS_ACS2019`). Needs the free Census key.
- **Map compositor:** canvas, OSM or Esri World Imagery tiles at fractional zoom, subject star + label, callout pins with collision avoidance, traffic badges, 1/3/5-mile rings. Saved as image sources `retailMap` and `ringMap`.

## C. Review later — paid / better coverage
| Vendor | What it adds | Access | Cost |
|---|---|---|---|
| Regrid | Nationwide normalized parcels + owner, one API instead of 254 TX counties | REST/tiles/bulk | ? (has paid API tiers) |
| ATTOM | Property, tax, deed, mortgage, AVM, POIs, demographics | REST, API key | ? quote |
| Reonomy (Altus) | CRE owner/LLC unmasking, debt, tenants | API, enterprise | ? quote |
| Commercial listing/comps databases | Comps, listings, analytics | Usually no public API; licenses forbid scraping/redistribution. Enter licensed data manually. | subscription |
| Esri ArcGIS Location Platform / Business Analyst | Polished demographics, tapestry, rings/drive-time reports, geocoding | REST, API key | ? (free tier exists, check) |
| Google Maps Platform | Geocoding, Places, Static Maps, Street View | REST, key + billing | ? (monthly free credit historically; verify) |
| Mapbox | Styled branded maps, static images, geocoding | REST, token | ? (free tier; verify) |
| Walk Score | Walk/transit/bike score | REST, key | ? (free tier for low volume; verify) |
| RentCast | Rent & sale estimates, listings (resi/multifamily) | REST, key | ? (free dev tier; verify) |
| Placer.ai | Foot traffic / visits for co-tenants, true trade areas, daytime population | enterprise | ? |
| Esri World Imagery (licensed use) | The satellite basemap in the retail map is Esri World Imagery tiles with attribution; confirm terms (or use an ArcGIS Location Platform key / another licensed imagery source) before wide distribution | tiles | ? |
| Daytime population / workplace data | Not in free ACS at ring level; Esri, Placer.ai, or LEHD LODES (free, but block-level processing) | varies | ? |
| Logo service | Auto-fetch co-tenant logos instead of manual upload (trademark use is the broker's call) | REST | ? |
| Kalibrate / StreetLight | Traffic counts beyond DOT | enterprise | ? |
| Cotality (CoreLogic), Black Knight/ICE | Deed/mortgage/tax at scale | enterprise | ? |
| Precisely, HERE | Geocoding/parcels/POIs | API | ? |
| SiteZeus, Synergos | Retail site analytics | enterprise | ? |

## Recommendation
1. Ship on free stack (A) now. 2. Add county parcel + zoning + TxDOT AADT adapters for our core counties (all ArcGIS REST = one generic adapter). 3. If coverage pain > ~5 counties, evaluate Regrid (parcels) and Esri or ATTOM (demographics/property) — get quotes. 4. Keep subscription-database data manual/licensed only.
