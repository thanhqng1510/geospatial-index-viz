import * as h3 from 'h3-js'
import { s2 } from 's2js'
import type { FeatureCollection, Polygon } from 'geojson'
import type { ViewportBounds } from '../context/ViewportContext'
import { slerp } from './geometry'

const MAX_CELLS = 250
const MIN_RESOLUTION = 0

/**
 * Maps a map zoom level to an H3 resolution value using a fixed lookup table.
 * Higher zoom levels produce finer resolution, giving a natural "zoom in for more detail" feel.
 */
export function getH3Resolution(zoom: number): number {
  if (zoom >= 14) return 7
  if (zoom >= 12) return 6
  if (zoom >= 10) return 5
  if (zoom >= 8) return 4
  if (zoom >= 6) return 3
  if (zoom >= 4) return 2
  return 1
}

/**
 * Returns all H3 index strings that intersect the given viewport bounding box
 * at the specified resolution, using h3.polygonToCells() on the viewport polygon.
 */
export function getH3Cells(bounds: ViewportBounds, resolution: number): string[] {
  const { west, south, east, north } = bounds
  // h3-js v4: polygonToCells expects number[][] of [lat, lng] pairs for the outer boundary
  const outerBoundary: number[][] = [
    [north, west],
    [north, east],
    [south, east],
    [south, west],
    [north, west],
  ]
  return h3.polygonToCells(outerBoundary, resolution)
}

/**
 * Main entry point for H3 cell generation. Derives the starting resolution from the zoom level,
 * then iteratively reduces it by one step until the cell count is ≤ 250 or resolution 0
 * is reached. Prevents rendering overload when the viewport covers a large area.
 */
export function getH3CellsGuarded(bounds: ViewportBounds, zoom: number): string[] {
  let resolution = getH3Resolution(zoom)

  while (resolution > MIN_RESOLUTION) {
    const cells = getH3Cells(bounds, resolution)
    if (cells.length <= MAX_CELLS) return cells
    resolution -= 1
  }

  // Return resolution 0 cells regardless of count
  return getH3Cells(bounds, MIN_RESOLUTION)
}

/**
 * Encodes a lat/lng point to the H3 index string at the given resolution.
 * Used to recompute which cell contains the anchor point when resolution changes.
 */
export function encodeH3(lat: number, lng: number, resolution: number): string {
  return h3.latLngToCell(lat, lng, resolution)
}

/**
 * Returns the geographic center [lat, lng] of an H3 cell.
 */
export function getH3CellCenter(h3Index: string): { lat: number; lng: number } {
  const [lat, lng] = h3.cellToLatLng(h3Index)
  return { lat, lng }
}

/**
 * Converts an array of H3 index strings into a GeoJSON FeatureCollection of hexagonal
 * Polygon features. Each feature stores its source H3 index in `properties.h3Index`
 * for use in click-to-select and metadata display.
 * Densifies edges and handles antimeridian wrapping to prevent "ghost lines".
 */
export function h3sToGeoJSON(
  h3Indexes: string[],
): FeatureCollection<Polygon, { h3Index: string }> {
  return {
    type: 'FeatureCollection',
    features: h3Indexes.map((h3Index) => {
      // cellToBoundary returns [lat, lng][] — convert to GeoJSON [lng, lat][]
      const boundary = h3.cellToBoundary(h3Index)

      const rawCoords: [number, number][] = []
      const segmentsPerEdge = 8 // Sufficient for H3 resolution 0-2 curvature

      for (let i = 0; i < boundary.length; i++) {
        const [lat1, lng1] = boundary[i]
        const [lat2, lng2] = boundary[(i + 1) % boundary.length]

        const start = s2.Point.fromLatLng(s2.LatLng.fromDegrees(lat1, lng1))
        const end = s2.Point.fromLatLng(s2.LatLng.fromDegrees(lat2, lng2))

        for (let step = 0; step < segmentsPerEdge; step++) {
          rawCoords.push(slerp(start, end, step / segmentsPerEdge))
        }
      }
      // Add the first point again to close
      rawCoords.push(rawCoords[0])

      // Robust "unwrapping": ensure each point is within 180° of the previous one.
      const unwrappedCoords: [number, number][] = []
      if (rawCoords.length > 0) {
        unwrappedCoords.push(rawCoords[0])
        for (let i = 1; i < rawCoords.length; i++) {
          let [lng, lat] = rawCoords[i]
          const prevLng = unwrappedCoords[i - 1][0]

          while (lng - prevLng > 180) lng -= 360
          while (lng - prevLng < -180) lng += 360

          unwrappedCoords.push([lng, lat])
        }
      }

      return {
        type: 'Feature',
        properties: { h3Index },
        geometry: {
          type: 'Polygon',
          coordinates: [unwrappedCoords],
        },
      }
    }),
  }
}
