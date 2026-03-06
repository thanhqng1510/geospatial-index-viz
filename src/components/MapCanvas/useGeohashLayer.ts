import { useState, useMemo, useEffect, useCallback } from 'react'
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers'
import { useViewport } from '../../context/ViewportContext'
import {
  getGeohashCellsGuarded,
  getGeohashPrecision,
  geohashesToGeoJSON,
  encodeGeohash,
} from '../../utils/geohash'
import ngeohash from 'ngeohash'

// Colors
const GEOHASH_COLOR: [number, number, number] = [28, 163, 236]        // blue
const GEOHASH_SELECTED_COLOR: [number, number, number] = [255, 140, 0] // orange highlight
const NEIGHBOR_COLOR: [number, number, number] = [100, 200, 180]       // muted teal
const STROKE_OPACITY = 77   // 30% of 255
const FILL_OPACITY = 77    // 30% of 255
const TEXT_OPACITY = 180   // 70% of 255

interface SelectedCell {
  hash: string
}

/**
 * Encapsulates all Geohash grid state, cell computation, styling, and click handling.
 *
 * @param crossModeAnchor - When the user switches from H3 mode with a selection, this holds
 *   the previous selection's anchor so Geohash can auto-select the containing cell.
 * @param onAnchorChange - Called whenever the anchor point changes so MapCanvas can share
 *   it with the H3 hook for future cross-mode switches.
 *
 * Returns:
 * - `layers` — array of Deck.gl layers (GeoJsonLayer + TextLayer) ready to pass to <DeckGL layers>.
 *              Empty when not in geohash mode.
 * - `onClick` — pass to MapView so map clicks can select/deselect cells.
 * - `selectedCell` — the currently selected cell (hash + center), or null.
 */
export function useGeohashLayer(
  isActive: boolean,
  crossModeAnchor: { lat: number; lng: number } | null,
  onAnchorChange: (anchor: { lat: number; lng: number } | null) => void,
  showNeighbors: boolean,
) {
  const { viewport } = useViewport()
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)

  // Clear selection when leaving geohash mode
  useEffect(() => {
    if (!isActive) setSelectedCell(null)
  }, [isActive])

  // Compute viewport-intersecting cells
  const cells = useMemo(() => {
    if (!viewport || !isActive) return []
    return getGeohashCellsGuarded(viewport, viewport.zoom)
  }, [viewport, isActive])

  // Recompute selected cell's hash when precision changes due to zoom
  useEffect(() => {
    if (cells.length === 0 || !selectedCell || !crossModeAnchor) return

    const newPrecision = cells[0].length
    if (newPrecision === selectedCell.hash.length) return // precision unchanged

    const newHash = encodeGeohash(crossModeAnchor.lat, crossModeAnchor.lng, newPrecision)
    setSelectedCell({ hash: newHash })
  }, [cells]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select from cross-mode anchor when entering geohash mode with cells ready
  useEffect(() => {
    if (!isActive || !crossModeAnchor || cells.length === 0 || selectedCell) return
    const precision = cells[0].length
    const hash = encodeGeohash(crossModeAnchor.lat, crossModeAnchor.lng, precision)
    setSelectedCell({ hash })
  }, [cells, isActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // GeoJSON FeatureCollection for rendering
  const geojson = useMemo(() => geohashesToGeoJSON(cells), [cells])

  // Encode the clicked lngLat to a geohash and toggle selection
  const onClick = useCallback(
    ({ lng, lat }: { lng: number; lat: number }) => {
      if (!isActive || !viewport || cells.length === 0) return

      // Use the actual rendered precision (geohash string length = precision),
      // not the zoom-derived one — the guard may have reduced it
      const precision = cells[0]?.length ?? getGeohashPrecision(viewport.zoom)
      const clickedHash = encodeGeohash(lat, lng, precision)

      setSelectedCell((prev) => {
        const next = prev?.hash === clickedHash
          ? null // re-click → deselect
          : { hash: clickedHash }
        onAnchorChange(next ? { lat, lng } : null)
        return next
      })
    },
    [isActive, viewport, cells, onAnchorChange],
  )

  // Grid layer: static colors — does not depend on selectedCell, so clicking never re-uploads geometry
  const layer = useMemo(() => {
    if (!isActive) return null

    return new GeoJsonLayer({
      id: 'geohash-grid',
      data: geojson,
      pickable: false, // picking is done via MapLibre click + ngeohash.encode
      stroked: true,
      filled: false,
      lineWidthMinPixels: 2.5,
      lineWidthScale: 1,
      getLineColor: [...GEOHASH_COLOR, STROKE_OPACITY] as [number, number, number, number],
    })
  }, [geojson, isActive])

  // Selection layer: single-feature layer rebuilt cheaply on click
  const selectionLayer = useMemo(() => {
    if (!isActive || !selectedCell) return null

    return new GeoJsonLayer({
      id: 'geohash-selection',
      data: geohashesToGeoJSON([selectedCell.hash]),
      pickable: false,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2.5,
      lineWidthScale: 1,
      getFillColor: [...GEOHASH_SELECTED_COLOR, FILL_OPACITY] as [number, number, number, number],
      getLineColor: [...GEOHASH_SELECTED_COLOR, STROKE_OPACITY] as [number, number, number, number],
    })
  }, [isActive, selectedCell])

  // Build label data: top-left (NW) corner of each cell bounding box
  const labelData = useMemo(
    () =>
      cells.map((hash) => {
        const [, minLng, maxLat] = ngeohash.decode_bbox(hash)
        // Slight inset so text sits just inside the cell border
        return { position: [minLng + 0.001, maxLat - 0.001] as [number, number], text: hash }
      }),
    [cells],
  )

  const textLayer = useMemo(() => {
    if (!isActive) return null

    return new TextLayer({
      id: 'geohash-labels',
      data: labelData,
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getSize: 15,
      getColor: [...GEOHASH_COLOR, TEXT_OPACITY],
      getTextAnchor: 'start',
      getAlignmentBaseline: 'top',
      fontFamily: 'monospace',
      pickable: false,
    })
  }, [labelData, isActive])

  // Neighbor layer: ring-1 neighbors of the selected cell
  const neighborLayer = useMemo(() => {
    if (!isActive || !showNeighbors || !selectedCell) return null

    const raw = ngeohash.neighbors(selectedCell.hash)
    const neighborHashes = [...new Set(Object.values(raw) as string[])]
    const neighborGeoJSON = geohashesToGeoJSON(neighborHashes)

    return new GeoJsonLayer({
      id: 'geohash-neighbors',
      data: neighborGeoJSON,
      pickable: false,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2.5,
      lineWidthScale: 1,
      getFillColor: [...NEIGHBOR_COLOR, FILL_OPACITY] as [number, number, number, number],
      getLineColor: [...NEIGHBOR_COLOR, STROKE_OPACITY] as [number, number, number, number],
    })
  }, [isActive, showNeighbors, selectedCell])

  const layers = useMemo(
    () => [layer, neighborLayer, selectionLayer, textLayer].filter(Boolean),
    [layer, neighborLayer, selectionLayer, textLayer],
  )

  return { layers, onClick, selectedCell }
}
