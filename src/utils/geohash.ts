import ngeohash from 'ngeohash'
import type { FeatureCollection, Polygon } from 'geojson'
import type { ViewportBounds } from '../context/ViewportContext'

const MAX_CELLS = 250
const MIN_PRECISION = 1

/**
 * Maps a map zoom level to a Geohash precision value using a fixed lookup table.
 * Higher zoom levels produce finer precision, giving a natural "zoom in for more detail" feel.
 */
export function getGeohashPrecision(zoom: number): number {
  if (zoom >= 14) return 7
  if (zoom >= 12) return 6
  if (zoom >= 8) return 5
  if (zoom >= 6) return 4
  if (zoom >= 4) return 3
  return 2
}

/**
 * Returns all Geohash cell strings that intersect the given viewport bounding box
 * at the specified precision, using ngeohash's bbox enumeration.
 */
export function getGeohashCells(bounds: ViewportBounds, precision: number): string[] {
  const { south, west, north, east } = bounds
  return ngeohash.bboxes(south, west, north, east, precision)
}

/**
 * Main entry point for cell generation. Derives the starting precision from the zoom level,
 * then iteratively reduces it by one step until the cell count is ≤ 250 or precision 1
 * is reached. Prevents rendering overload when the viewport covers a large area.
 */
export function getGeohashCellsGuarded(bounds: ViewportBounds, zoom: number): string[] {
  let precision = getGeohashPrecision(zoom)

  while (precision > MIN_PRECISION) {
    const cells = getGeohashCells(bounds, precision)
    if (cells.length <= MAX_CELLS) return cells
    precision -= 1
  }

  // Return precision 1 cells regardless of count
  return getGeohashCells(bounds, MIN_PRECISION)
}

/**
 * Encodes a lat/lng point to the Geohash string at the given precision.
 * Used to identify which cell was clicked from a map click event.
 */
export function encodeGeohash(lat: number, lng: number, precision: number): string {
  return ngeohash.encode(lat, lng, precision)
}

/**
 * Returns the geographic center {lat, lng} of a Geohash cell.
 * Used to store a stable center point for selection recompute on precision change.
 */
export function getGeohashCellCenter(hash: string): { lat: number; lng: number } {
  const { latitude, longitude } = ngeohash.decode(hash)
  return { lat: latitude, lng: longitude }
}

/**
 * Converts an array of Geohash strings into a GeoJSON FeatureCollection of rectangular
 * Polygon features. Each feature stores its source hash string in `properties.hash`
 * for use in click-to-select and metadata display.
 */
export function geohashesToGeoJSON(hashes: string[]): FeatureCollection<Polygon, { hash: string }> {
  return {
    type: 'FeatureCollection',
    features: hashes.map((hash) => {
      const [minLat, minLng, maxLat, maxLng] = ngeohash.decode_bbox(hash)
      return {
        type: 'Feature',
        properties: { hash },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat],
            ],
          ],
        },
      }
    }),
  }
}
