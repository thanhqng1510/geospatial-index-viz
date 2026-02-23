## Context

The repository is currently a blank slate with only scaffolding/tooling dependencies. The goal is to build a self-hostable React web application that visualizes Geohash and H3 geospatial index grids on an interactive world map. All computation runs in the browser (no backend required), making the deployment story simple: serve static files.

Key constraints:
- No external API keys (tile provider must be free and keyless)
- Must work self-hosted and in a Docker container
- All geospatial computation must be client-side

## Goals / Non-Goals

**Goals:**
- Interactive world map with Geohash and H3 grid overlays
- Zoom-driven automatic precision/resolution for both index modes
- Click-to-inspect cell metadata in a sidebar panel
- Lat/lng coordinate input that jumps to and highlights the relevant cell
- Two basemap modes: Streets and Minimal
- Docker deployment with nginx
- Clean, performant rendering that only draws cells visible in the current viewport

**Non-Goals:**
- Backend or server-side geospatial computation
- Multi-cell comparison or selection
- URL-shareable state
- Mobile-first or touch-optimized UX (desktop-first)
- Support for other index systems beyond Geohash and H3 in v1

## Decisions

### 1. MapLibre GL + Deck.gl (Pattern A: separate overlay canvas)

**Decision**: Use MapLibre GL as the basemap renderer and Deck.gl as an independent WebGL overlay on top, syncing viewport state between them.

**Rationale**: MapLibre GL is the leading open-source WebGL map library with no API key requirement. Deck.gl's `GeoJsonLayer` is purpose-built for high-performance polygon rendering at scale, which is critical when rendering thousands of geospatial cells. Pattern A (two separate canvases, shared viewport) is simpler to set up than Pattern B (Deck.gl as a MapLibre layer) and sufficient for this use case since we don't require z-ordering between cells and map labels.

**Alternatives considered**:
- _React Leaflet_: Simpler API but Canvas-based, not WebGL. Degrades at higher cell counts and deeper zoom levels.
- _Deck.gl MapboxLayer (Pattern B)_: Tighter integration but more complex setup; benefit (label z-ordering) is unnecessary here.

---

### 2. All computation client-side (no backend)

**Decision**: Use `ngeohash` (Geohash) and `h3-js` (H3) directly in the browser. No API server.

**Rationale**: Both libraries are pure JavaScript. Cell boundary computation is fast enough client-side even for thousands of cells. Eliminating a backend simplifies deployment dramatically — the Docker container is just nginx serving static assets.

**Alternatives considered**:
- _Node.js API_: Would add latency, complexity, and a stateful container. No benefit given the computation is trivial in JS.

---

### 3. Viewport-aware cell generation

**Decision**: On every map move/zoom event, compute only the cells that intersect the current viewport bounding box. Never compute the global set of cells.

**Rationale**: At Geohash precision 6, the globe contains ~16M cells. At H3 resolution 7, ~98M cells. Rendering globally is not feasible. Viewport culling keeps rendered cell counts manageable (target: <1,000 cells visible at any time).

**Implementation approach**:
- Extract `[west, south, east, north]` bounds from MapLibre's `getBounds()`
- For Geohash: use `ngeohash.bboxes(s, w, n, e, precision)` to enumerate intersecting cells
- For H3: use `h3.polygonToCells()` on the viewport polygon at the target resolution
- Debounce regeneration on map move (e.g., 150ms) to avoid jank

---

### 4. Zoom-to-precision/resolution mapping

**Decision**: Automatically select Geohash precision and H3 resolution from the current map zoom level using a fixed lookup table.

| Map zoom | Geohash precision | H3 resolution |
|---|---|---|
| 1–3 | 2 | 1 |
| 4–5 | 3 | 2 |
| 6–7 | 4 | 3 |
| 8–9 | 5 | 4 |
| 10–11 | 6 | 5 |
| 12–13 | 6 | 6 |
| 14+ | 7 | 7 |

**Rationale**: Manual precision selection adds UI complexity and is confusing to learners. Automatic mapping gives a natural "zoom in to see finer cells" experience. The table is tuned to keep visible cell count below the target threshold.

---

### 5. Tile layers: OpenFreeMap (Streets) + custom Minimal basemap

**Decision**:
- **Streets mode**: MapLibre styled with `https://tiles.openfreemap.org/styles/liberty` (no API key, free)
- **Minimal mode**: Plain background color (`#f0ede8`) via a MapLibre inline style spec, with country borders added as a native MapLibre GeoJSON source + `line` layer. No tile server required for Minimal mode.

**Rendering split**:
- **MapLibre**: all basemap rendering — tile layers (Streets) and country borders (Minimal)
- **Deck.gl**: geospatial cell overlays only — Geohash and H3 `GeoJsonLayer`s

**Rationale**: MapLibre natively handles GeoJSON sources and line layers with no extra dependencies. Keeping all map-level rendering in MapLibre and all cell rendering in Deck.gl gives a clear separation of concerns. Deck.gl is reserved for high-performance cell polygon rendering where its WebGL advantage matters.

**Alternatives considered**:
- _Country borders via Deck.gl GeoJsonLayer_: Consistent API but unnecessary — MapLibre handles static GeoJSON layers efficiently and it avoids coupling the border visibility to Deck.gl being initialized.
- _CSS filter grayscale on Streets_: Simpler but visually muddy; cells don't pop.
- _Separate minimal style URL_: Requires another tile server; adds a second external dependency.

---

### 6. Cell rendering: filled polygons, low opacity

**Decision**: Render cells as filled GeoJSON polygons using `GeoJsonLayer` with:
- Fill: index-mode color at 25–30% opacity
- Stroke: same color at 80% opacity
- Selected cell: fill opacity raised to 60%, distinct highlight color

**Rationale**: Fill + stroke gives spatial awareness (you can see the cell extent) while keeping the basemap readable underneath. Low fill opacity is the standard approach for overlay grids in cartography tools.

---

### 7. Application layout

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [Geohash | H3]  mode toggle    [Streets | Minimal]  │
├─────────────────┬────────────────────────────────────────────┤
│  Left Panel     │  Map Canvas                                │
│  (300px fixed)  │                                            │
│                 │  MapLibre GL (basemap)                     │
│  Lat: [_____]  │  + Deck.gl overlay (cells)                 │
│  Lng: [_____]  │                                            │
│  [Go]           │                                            │
│  ─────────      │                                            │
│  Cell Info:     │                                            │
│  (metadata      │                                            │
│  panel)         │                                            │
│                 │                                            │
└─────────────────┴────────────────────────────────────────────┘
```

**Decision**: Fixed-width left panel (300px), full-height map canvas. Header bar holds the two toggle controls. This keeps the map as the primary element.

---

### 8. Deployment: multi-stage Docker build

**Decision**:
```
Stage 1 (node:20-alpine):  npm install && npm run build  → /app/dist
Stage 2 (nginx:alpine):    COPY dist/ /usr/share/nginx/html
                           COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**nginx.conf**: Serves static files, `try_files $uri /index.html` for SPA routing (not strictly needed yet but future-safe), gzip enabled.

**Rationale**: Multi-stage keeps the final image small (nginx:alpine ~10MB). No Node.js runtime in the production image.

## Risks / Trade-offs

- **H3 cell generation performance at high resolutions**: At resolution 7+ with a large viewport, `polygonToCells` can be slow. → Mitigation: cap resolution at 7 for viewport-wide generation; debounce on map move.
- **ngeohash `bboxes` at high precision**: At precision 8+, the bounding box can contain hundreds of thousands of cells, causing UI freeze. → Mitigation: enforce a max-cells guard (~1,000) and clamp precision in the zoom table.
- **Natural Earth GeoJSON bundle size**: ~500KB adds to initial load. → Mitigation: lazy-load only when Minimal mode is first activated; gzip reduces to ~120KB over wire.
- **Deck.gl + MapLibre version compatibility**: These libraries have tight version coupling. → Mitigation: pin exact dependency versions that have known compatibility; document versions explicitly.

## Open Questions

_(none — all design decisions resolved during exploration)_
