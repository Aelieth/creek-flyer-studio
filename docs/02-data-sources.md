# 02 · CRE Data Sources & APIs
Legend: **LIVE** = wired into the app now. Cost "?" = not verified; check vendor pricing page / get quote. No prices below were invented.

## A. Free / keyless — used now
| Source | Data | Access | Auth | Status |
|---|---|---|---|---|
| US Census Geocoder `geocoding.geo.census.gov` | Address → lat/lon, normalized address, county, tract FIPS | REST; no CORS → app uses JSONP | none | **LIVE** |
| OSM Nominatim | Geocode fallback, POIs | REST, CORS | none; 1 req/s, must show attribution; heavy use → self-host | **LIVE** (fallback) |
| FEMA NFHL `hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` | Flood zone (A/AE/X…) | ArcGIS REST point query, CORS | none | **LIVE** |
| OpenStreetMap tiles | Base map image | tile.openstreetmap.org | none; low-volume only per tile policy | **LIVE** (static map compositor) |
| Census ACS 5-yr `api.census.gov` | Population, income, age, housing by tract/block group | REST, CORS | **free key now required** (tested: keyless redirects to missing_key) | **LIVE** when key pasted in Settings |

## B. Free — next to wire
| Source | Data | How to connect |
|---|---|---|
| County appraisal district / assessor GIS (e.g. DCAD, TAD, HCAD, Collin CAD) | Parcel ID, owner, land/improvement value, year built, SF, legal | Most expose ArcGIS REST FeatureServer parcels layer → point-in-polygon query by lat/lon (same pattern as FEMA). Per-county config; some only offer bulk CSV downloads. Map Creek's top 5 counties first. |
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

## C. Review later — paid / better coverage
| Vendor | What it adds | Access | Cost |
|---|---|---|---|
| Regrid | Nationwide normalized parcels + owner, one API instead of 254 TX counties | REST/tiles/bulk | ? (has paid API tiers) |
| ATTOM | Property, tax, deed, mortgage, AVM, POIs, demographics | REST, API key | ? quote |
| Reonomy (Altus) | CRE owner/LLC unmasking, debt, tenants | API, enterprise | ? quote |
| CoStar / LoopNet | Comps, listings, analytics | **No public API; license forbids scraping/redistribution.** Only use data Creek is licensed for, manually. | subscription |
| CREXi / Ten-X | Listings/syndication | partner API | ? |
| Esri ArcGIS Location Platform / Business Analyst | Polished demographics, tapestry, rings/drive-time reports, geocoding | REST, API key | ? (free tier exists, check) |
| Google Maps Platform | Geocoding, Places, Static Maps, Street View | REST, key + billing | ? (monthly free credit historically; verify) |
| Mapbox | Styled branded maps, static images, geocoding | REST, token | ? (free tier; verify) |
| Walk Score | Walk/transit/bike score | REST, key | ? (free tier for low volume; verify) |
| RentCast | Rent & sale estimates, listings (resi/multifamily) | REST, key | ? (free dev tier; verify) |
| Placer.ai | Foot traffic | enterprise | ? |
| Kalibrate / StreetLight | Traffic counts beyond DOT | enterprise | ? |
| Cotality (CoreLogic), Black Knight/ICE | Deed/mortgage/tax at scale | enterprise | ? |
| Precisely, HERE | Geocoding/parcels/POIs | API | ? |
| SiteZeus, Synergos | Retail site analytics | enterprise | ? |

## Recommendation
1. Ship on free stack (A) now. 2. Add county parcel + zoning + TxDOT AADT adapters for Creek's core counties (all ArcGIS REST = one generic adapter). 3. If coverage pain > ~5 counties, evaluate Regrid (parcels) and Esri or ATTOM (demographics/property) — get quotes. 4. Keep CoStar data manual/licensed only.
