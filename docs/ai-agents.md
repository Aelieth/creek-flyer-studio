# Planned AI agents (design notes; not implemented)

Two automations are planned. Both are designed to **fill the same data the manual tools already produce**, so
agent output can be reviewed and corrected in the normal UI and nothing about rendering changes.

## Server-side key (required)
Model API calls must run on a small backend (for example an AWS Lambda behind API Gateway, or an Azure Function).
The browser sends the photo or the listing location; the function holds the API key in a secret store, calls the model and
returns JSON. **Never ship the key in the static site** (GitHub Pages/Amplify bundles are public). Add per-user auth
(O365 sign-in) and a request size limit, and log usage.

## 1. Automatic suite outlining on photos
**Manual tool today:** Listing → Property → photo → ✎. Click corners to draw polygons; saved as `PhotoAnn` on the property.

**Interface (agent → app)**, normalized image coordinates, `0..1`, origin top-left:
```json
{
  "polys": [[[0.18, 0.44], [0.46, 0.41], [0.47, 0.76], [0.21, 0.78]]],
  "labels": ["Suite 2305"],
  "color": "#ffeb00", "width": 4, "fill": 0,
  "source": "agent"
}
```
- `polys`: one array of `[x, y]` points per shape (≥3 points, implicitly closed).
- `labels`: optional, same order as `polys` (for review; not drawn yet).
- The app keeps the original photo (`orig`) and bakes the outlines into the displayed image, so the user can open the
  editor, adjust points and re-save. Request: `{ image: <jpeg base64 or URL>, hints: { suites: [{ suite, sf, notes }] } }`.

## 2. Automatic aerial retailer maps
**Manual tool today:** Listing → Location → “Retail co-tenancy map”: pull nearby places from OpenStreetMap, toggle/rename
pins, upload a logo per pin, draw the map (satellite or street) with callout boxes on leader lines and a subject star.

**Interface (agent → app)**, one entry per pin (`Poi` in `app/src/types.ts`):
```json
[
  { "name": "Walmart Supercenter", "category": "big-box", "lat": 35.6081, "lon": -97.5512,
    "logo": "https://…/logo.png", "priority": 1, "on": true, "kind": "anchor", "source": "agent",
    "note": "0.6 mi; anchor of adjacent center" }
]
```
- `priority`: 1 = must show; larger numbers are dropped first when callouts would overlap.
- `kind`: `draw` | `anchor` | `retail` | `custom` (styles the pin). `category` is free text for filtering.
- `logo`: only logos the company has the right to use (licensed, or supplied by the tenant/landlord). The agent should
  return `logo: null` rather than guess.
- Selection criteria (radius, categories, max pins, which anchors matter for this property type) are **TBD** and will
  be passed as the request: `{ lat, lon, propType, radiusMi, maxPins, include: [...], exclude: [...] }`.

The app then draws the map exactly as it does for manual pins (`drawRetailMap` in `app/src/retail.ts`).
