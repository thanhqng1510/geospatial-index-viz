import { s2, geojson as s2geojson } from 's2js'
import type { FeatureCollection, Polygon } from 'geojson'
import type { ViewportBounds } from '../context/ViewportContext'
import { slerp } from './geometry'

const MAX_CELLS = 250
const MIN_LEVEL = 1

/**
 * Maps a map zoom level to an S2 resolution level.
 * S2 levels range from 0 (entire face) to 30 (leaf). We use 1–13 for typical map use.
 */
export function getS2Level(zoom: number): number {
  if (zoom >= 14) return 13
  if (zoom >= 12) return 11
  if (zoom >= 10) return 10
  if (zoom >= 8) return 8
  if (zoom >= 6) return 6
  if (zoom >= 4) return 4
  return 2
}

/**
 * Returns all S2 cell tokens that cover the given viewport bounding box at the given level.
 * Uses geojson.RegionCoverer with fixed minLevel/maxLevel so all returned cells are at the same level.
 */
export function getS2Cells(bounds: ViewportBounds, level: number): string[] {
  const { west, south, east, north } = bounds

  const viewportPolygon = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  }

  const CELLS_BUFFER = 50
  const coverer = new s2geojson.RegionCoverer({ minLevel: level, maxLevel: level, maxCells: MAX_CELLS + CELLS_BUFFER })
  // CellUnion extends Array<CellID> — iterate directly
  const union = coverer.covering(viewportPolygon)
  return Array.from(union).map((id) => s2.cellid.toToken(id))
}

/**
 * Main entry point. Derives level from zoom, iteratively reduces if over the cell cap.
 */
export function getS2CellsGuarded(bounds: ViewportBounds, zoom: number): string[] {
  let level = getS2Level(zoom)

  while (level > MIN_LEVEL) {
    const cells = getS2Cells(bounds, level)
    if (cells.length <= MAX_CELLS) return cells
    level -= 1
  }

  return getS2Cells(bounds, MIN_LEVEL)
}

/**
 * Encodes a lat/lng point to an S2 cell token at the given level.
 */
export function encodeS2(lat: number, lng: number, level: number): string {
  const ll = s2.LatLng.fromDegrees(lat, lng)
  const cellId = s2.cellid.fromLatLng(ll)
  return s2.cellid.toToken(s2.cellid.parent(cellId, level))
}

/**
 * Returns the geographic center {lat, lng} of an S2 cell given its token.
 */
export function getS2CellCenter(token: string): { lat: number; lng: number } {
  const cellId = s2.cellid.fromToken(token)
  const ll = s2.cellid.latLng(cellId)
  // s2js LatLng stores angles in radians; convert to degrees
  return {
    lat: (ll.lat * 180) / Math.PI,
    lng: (ll.lng * 180) / Math.PI,
  }
}

/**
 * Returns the S2 level of a cell given its token.
 */
export function getS2CellLevel(token: string): number {
  return s2.cellid.level(s2.cellid.fromToken(token))
}

/**
 * Returns the approximate area of an S2 cell in square meters.
 */
export function getS2CellAreaSqM(token: string): number {
  const cellId = s2.cellid.fromToken(token)
  const cell = s2.Cell.fromCellID(cellId)
  // approxArea() returns steradians; Earth's surface area ≈ 5.1e14 m²; 4π steradians total
  const steradians = cell.approxArea()
  const EARTH_SURFACE_AREA_SQ_M = 5.1e14
  return (steradians / (4 * Math.PI)) * EARTH_SURFACE_AREA_SQ_M
}

/**
 * Converts an array of S2 tokens into a GeoJSON FeatureCollection of Polygon features.
 * Each feature stores `properties.s2Token` and `properties.center` (lngLat degrees) for labeling.
 * Densifies edges and handles antimeridian wrapping by "unwrapping" longitudes
 * so the polygon forms a continuous path.
 */
export function s2sToGeoJSON(tokens: string[]): FeatureCollection<Polygon, { s2Token: string; center: [number, number] }> {
  return {
    type: 'FeatureCollection',
    features: tokens.map((s2Token) => {
      const cellId = s2.cellid.fromToken(s2Token)
      const cell = s2.Cell.fromCellID(cellId)
      const center = getS2CellCenter(s2Token)

      // Get 4 vertices (CCW: lower-left, lower-right, upper-right, upper-left)
      const vertices = [0, 1, 2, 3].map((k) => cell.vertex(k))
      
      const rawCoords: [number, number][] = []
      const segmentsPerEdge = 64 // Ultra-smooth for Level 0 world-scale faces

      for (let i = 0; i < 4; i++) {
        const start = vertices[i]
        const end = vertices[(i + 1) % 4]
        
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
        properties: { s2Token, center: [center.lng, center.lat] },
        geometry: {
          type: 'Polygon',
          coordinates: [unwrappedCoords],
        },
      }
    }),
  }
}
