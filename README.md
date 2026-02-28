# Geospatial Index Visualizer

An interactive web app for exploring common geospatial indexing techniques — **Geohash** and **H3** — overlaid on a live map.

🔗 **Live demo:** https://thanhqng1510.github.io/geospatial-index-viz/

---

## Features

- **Index modes** — switch between Geohash, H3, or no overlay with a single click
- **Adaptive resolution** — grid precision automatically adjusts to the current zoom level; cell count is capped at 250 to keep rendering snappy
- **Click-to-inspect** — click any cell to see its index string, resolution/precision, center coordinates, bounding box (Geohash), cell size/area, and pentagon flag (H3)
- **Basemap toggle** — choose between *Streets* and *Minimal* base layers
- **Coordinate jump** — type a latitude/longitude pair and fly directly to that location

## Tech stack

| Layer | Library |
|---|---|
| UI framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Map rendering | [deck.gl](https://deck.gl/) + [MapLibre GL](https://maplibre.org/) |
| Geohash | [ngeohash](https://github.com/sunng87/node-geohash) |
| H3 hexagonal grid | [h3-js](https://github.com/uber/h3-js) |
| Geometry helpers | [@turf/distance](https://turfjs.org/) |

## Local development

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173/geospatial-index-viz/)
npm run dev

# Type-check and build for production
npm run build

# Preview the production build locally
npm run preview
```

## Deployment

The app is automatically built and deployed to GitHub Pages on every push to `main` via the [deploy workflow](.github/workflows/deploy.yml).
