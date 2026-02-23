## 1. Project Scaffolding

- [x] 1.1 Replace existing `package.json` with a Vite + React + TypeScript project configuration
- [x] 1.2 Initialize Vite project structure: `src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig.json`
- [x] 1.3 Install runtime dependencies: `maplibre-gl`, `deck.gl`, `@deck.gl/react`, `@deck.gl/layers`, `@deck.gl/geo-layers`, `h3-js`, `ngeohash`
- [x] 1.4 Install dev dependencies: `typescript`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`
- [x] 1.5 Add `npm run dev` (Vite dev server) and `npm run build` scripts
- [x] 1.6 Download Natural Earth countries GeoJSON and place in `public/data/countries.geojson`

## 2. Application Layout

- [x] 2.1 Create root `App` component with three layout regions: header bar, left panel (300px fixed), map canvas (fills remaining space)
- [x] 2.2 Implement header bar with mode toggle (`Geohash` / `H3`) and basemap toggle (`Streets` / `Minimal`)
- [x] 2.3 Implement left panel shell with coordinate input section at top and metadata panel section below
- [x] 2.4 Add global CSS: full-height layout, no overflow, map fills canvas area

## 3. Map View

- [x] 3.1 Implement `MapView` component using `maplibre-gl` initialized at center `[0, 0]`, zoom `2`
- [x] 3.2 Wire Streets basemap style to `https://tiles.openfreemap.org/styles/liberty`
- [x] 3.3 Implement Minimal basemap mode: plain `#f0ede8` background with no tile layer
- [x] 3.4 Mount Deck.gl `DeckGL` component as absolute overlay on top of MapLibre canvas, syncing `viewState` (center, zoom, pitch, bearing) bidirectionally
- [x] 3.5 Expose viewport bounding box (`west`, `south`, `east`, `north`) and zoom level via state/context for grid layers to consume
- [x] 3.6 Debounce viewport change events at 150ms before triggering cell recompute

## 4. Basemap Toggle

- [x] 4.1 Implement basemap toggle control in header; wire to `basemap` state (`streets` | `minimal`)
- [x] 4.2 On switch to Minimal: hide MapLibre tile layer, set background color to `#f0ede8`
- [x] 4.3 Lazy-load `countries.geojson` on first switch to Minimal; add as MapLibre GeoJSON source and cache for subsequent switches
- [x] 4.4 Render country borders as a MapLibre `line` layer (stroke only, no fill) when Minimal mode is active; remove when switching to Streets
- [x] 4.5 On switch to Streets: restore MapLibre tile layer, remove country borders layer
- [x] 4.6 Verify that switching basemap preserves current viewport center, zoom, active mode, and selected cell

## 5. Geohash Grid

- [x] 5.1 Implement `getGeohashPrecision(zoom: number): number` using the zoom-to-precision lookup table from design.md
- [x] 5.2 Implement `getGeohashCells(bounds, precision): string[]` using `ngeohash.bboxes()` for viewport-intersecting cells
- [x] 5.3 Implement best-effort cell count guard: if result exceeds 250, reduce precision by 1 and retry; stop at precision 1
- [x] 5.4 Convert geohash strings to GeoJSON `FeatureCollection` of rectangular `Polygon` features (each storing its hash string as a feature property)
- [x] 5.5 Render cells via Deck.gl `GeoJsonLayer` with `pickable: false`; unselected style: no fill, stroke at 30% opacity
- [x] 5.6 Apply selected cell style: fill at 30% opacity + stroke at 30% opacity in highlight color
- [x] 5.7 Handle cell click: select clicked cell (store hash + lng/lat); re-click selected cell deselects it
- [x] 5.8 On precision change from zoom: recompute selected cell using stored center point at new precision
- [x] 5.9 Clear Geohash grid and selection when mode switches to H3

## 6. H3 Grid

- [x] 6.1 Implement `getH3Resolution(zoom: number): number` using the zoom-to-resolution lookup table from design.md
- [x] 6.2 Implement `getH3Cells(bounds, resolution): string[]` using `h3.polygonToCells()` on the viewport polygon
- [x] 6.3 Implement best-effort cell count guard: if result exceeds 250, reduce resolution by 1 and retry; stop at resolution 0
- [x] 6.4 Convert H3 index strings to GeoJSON `FeatureCollection` of `Polygon` features using `h3.cellToBoundary()` (each storing its H3 index as a feature property)
- [x] 6.5 Render cells via Deck.gl `GeoJsonLayer` with `pickable: false`; unselected style: no fill, stroke at 30% opacity
- [x] 6.6 Apply selected cell style: fill at 30% opacity + stroke at 30% opacity in highlight color
- [x] 6.7 Handle cell click: select clicked cell (store H3 index + lng/lat via `h3.cellToLatLng()`); re-click selected cell deselects it
- [x] 6.8 On resolution change from zoom: recompute selected cell using stored center point at new resolution via `h3.latLngToCell()`
- [x] 6.9 Clear H3 grid and selection when mode switches to Geohash

## 7. Mode Toggle & Cross-Mode Selection

- [x] 7.1 Implement mode toggle in header; wire to `mode` state (`geohash` | `h3`)
- [x] 7.2 On mode switch with active selection: recompute selected cell in new mode using stored center point; update metadata panel
- [x] 7.3 On mode switch with no selection: leave metadata panel in empty placeholder state

## 8. Cell Metadata Panel

- [ ] 8.1 Implement metadata panel component in left panel; show placeholder "Click a cell to see its details" when no cell is selected
- [ ] 8.2 For selected Geohash cell, display: Hash string, Precision, Center (5 decimal places), Bounds SW+NE (5 decimal places), Cell size (width × height in m or km)
- [ ] 8.3 Compute Geohash cell size from bounding box dimensions using haversine or approximation
- [ ] 8.4 For selected H3 cell, display: H3 Index, Resolution, Center (5 decimal places), Area (m² or km²), Pentagon indicator ("Yes ⚠" or "No")
- [ ] 8.5 Compute H3 cell area using `h3.cellArea()` and format in human-readable units
- [ ] 8.6 Detect pentagon cells using `h3.isPentagon()` and render warning indicator
- [ ] 8.7 Metadata panel updates reactively whenever selected cell changes (zoom recompute, mode switch, or click)

## 9. Coordinate Input

- [ ] 9.1 Implement coordinate input form in left panel with lat and lng numeric fields and a "Go" button
- [ ] 9.2 Submit form on Enter key in either field or on "Go" button click
- [ ] 9.3 Validate: lat must be −90 to 90, lng must be −180 to 180; show inline error if out of range
- [ ] 9.4 Prevent submission if either field is empty; do not show errors for empty fields
- [ ] 9.5 On valid submit: compute containing cell in active mode at current precision/resolution; store center point
- [ ] 9.6 Pan and zoom map to center on the cell; select the cell and populate metadata panel
