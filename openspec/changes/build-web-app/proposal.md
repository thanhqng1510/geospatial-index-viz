## Why

There is no good, self-hostable, interactive tool for visualizing and understanding geospatial index systems like Geohash and H3. Developers and learners working with these systems benefit greatly from seeing how cells tile the globe, how precision/resolution changes with zoom, and what metadata a given coordinate maps to.

## What Changes

- Introduce a full React + Vite web application as the primary deliverable of this repository
- Add an interactive world map (MapLibre GL + Deck.gl overlay) displaying geospatial index grids
- Support two index modes: **Geohash** and **H3**
- Implement zoom-driven automatic precision/resolution selection for both modes
- Add a coordinate input (lat/lng) that highlights the containing cell and displays its metadata in a sidebar panel
- Provide two basemap modes: **Streets** (OpenFreeMap `liberty` style) and **Minimal** (blank canvas with Natural Earth country borders)

## Capabilities

### New Capabilities

- `map-view`: Interactive world map canvas using MapLibre GL (Pattern A: Deck.gl as WebGL overlay); manages viewport state, zoom level, basemap toggling, and hosts all geospatial layers
- `geohash-grid`: Geohash cell grid rendering; computes viewport-visible cells at zoom-driven precision levels (1–8), renders filled low-opacity polygons via Deck.gl GeoJsonLayer, supports click-to-select
- `h3-grid`: H3 cell grid rendering; computes viewport-visible hexagonal cells at zoom-driven resolution levels (0–9), renders filled low-opacity polygons via Deck.gl GeoJsonLayer, supports click-to-select
- `cell-metadata`: Sidebar panel displaying metadata for the clicked/selected cell; shows Geohash string + precision + center + bounds + cell size OR H3 index + resolution + center + area + isPentagon flag
- `coordinate-input`: Lat/lng input form (submit on Enter); computes containing cell in active mode, pans/zooms map to it, selects it and populates the metadata panel
- `basemap-toggle`: UI control to switch between Streets (OpenFreeMap liberty) and Minimal (blank canvas + Natural Earth country borders GeoJSON) basemap modes

### Modified Capabilities

_(none — this is a greenfield project)_

## Impact

- **New dependencies**: `react`, `react-dom`, `maplibre-gl`, `deck.gl`, `@deck.gl/react`, `@deck.gl/layers`, `h3-js`, `ngeohash` (or `geohash-js`), `vite`, `@vitejs/plugin-react`
- **New dev dependencies**: `typescript`, `@types/react`, `@types/react-dom`
- **Static assets**: Natural Earth countries GeoJSON (~500KB, bundled)
- **Existing files**: `package.json` will be replaced/restructured for the Vite + React app; existing utility deps may be removed
