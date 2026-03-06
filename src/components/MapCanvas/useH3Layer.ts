import { useState, useMemo, useEffect, useCallback } from 'react'
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers'
import { getResolution, cellToLatLng, gridDisk } from 'h3-js'
import { useViewport } from '../../context/ViewportContext'
import {
  getH3CellsGuarded,
  h3sToGeoJSON,
  encodeH3,
} from '../../utils/h3'

// Colors
const H3_COLOR: [number, number, number] = [102, 194, 164]           // teal/green
const H3_SELECTED_COLOR: [number, number, number] = [255, 140, 0]    // orange highlight
const NEIGHBOR_COLOR: [number, number, number] = [100, 200, 180]     // muted teal
const STROKE_OPACITY = 77   // 30% of 255
const FILL_OPACITY = 77    // 30% of 255
const TEXT_OPACITY = 180   // 70% of 255

interface SelectedCell {
  h3Index: string
}

/**
 * Encapsulates all H3 grid state, cell computation, styling, and click handling.
 *
 * @param crossModeAnchor - When the user switches from Geohash mode with a selection, this holds
 *   the previous selection's anchor so H3 can auto-select the containing cell.
 * @param onAnchorChange - Called whenever the anchor point changes so MapCanvas can share
 *   it with the Geohash hook for future cross-mode switches.
 *
 * Returns:
 * - `layers` — array of Deck.gl layers (GeoJsonLayer + TextLayer) ready to pass to <DeckGL layers>.
 *              Empty when not in h3 mode.
 * - `onClick` — pass to MapView so map clicks can select/deselect cells.
 * - `selectedCell` — the currently selected cell (h3Index + center), or null.
 */
export function useH3Layer(
  isActive: boolean,
  crossModeAnchor: { lat: number; lng: number } | null,
  onAnchorChange: (anchor: { lat: number; lng: number } | null) => void,
  showNeighbors: boolean,
) {
  const { viewport } = useViewport()
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)

  // Clear selection when leaving h3 mode
  useEffect(() => {
    if (!isActive) setSelectedCell(null)
  }, [isActive])

  // Compute viewport-intersecting cells
  const cells = useMemo(() => {
    if (!viewport || !isActive) return []
    return getH3CellsGuarded(viewport, viewport.zoom)
  }, [viewport, isActive])

  // Recompute selected cell's H3 index when resolution changes due to zoom
  useEffect(() => {
    if (cells.length === 0 || !selectedCell || !crossModeAnchor) return

    const currentResolution = getResolution(cells[0])
    const newH3Index = encodeH3(crossModeAnchor.lat, crossModeAnchor.lng, currentResolution)
    if (newH3Index === selectedCell.h3Index) return // resolution unchanged

    setSelectedCell({ h3Index: newH3Index })
  }, [cells]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select from cross-mode anchor when entering H3 mode with cells ready
  useEffect(() => {
    if (!isActive || !crossModeAnchor || cells.length === 0 || selectedCell) return
    const resolution = getResolution(cells[0])
    const h3Index = encodeH3(crossModeAnchor.lat, crossModeAnchor.lng, resolution)
    setSelectedCell({ h3Index })
  }, [cells, isActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // GeoJSON FeatureCollection for rendering
  const geojson = useMemo(() => h3sToGeoJSON(cells), [cells])

  // Handle map click: look up which H3 cell contains the click point and toggle selection
  const onClick = useCallback(
    ({ lng, lat }: { lng: number; lat: number }) => {
      if (!isActive || !viewport || cells.length === 0) return

      // Derive the actual rendered resolution from cells (guard may have reduced it)
      const resolution: number = cells[0] ? getResolution(cells[0]) : 4 // fallback to a default
      const clickedIndex = encodeH3(lat, lng, resolution)

      setSelectedCell((prev) => {
        const next = prev?.h3Index === clickedIndex
          ? null // re-click → deselect
          : { h3Index: clickedIndex }
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
      id: 'h3-grid',
      data: geojson,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthMinPixels: 2.5,
      lineWidthScale: 1,
      getLineColor: [...H3_COLOR, STROKE_OPACITY] as [number, number, number, number],
    })
  }, [geojson, isActive])

  // Selection layer: single-feature layer rebuilt cheaply on click
  const selectionLayer = useMemo(() => {
    if (!isActive || !selectedCell) return null

    return new GeoJsonLayer({
      id: 'h3-selection',
      data: h3sToGeoJSON([selectedCell.h3Index]),
      pickable: false,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2.5,
      lineWidthScale: 1,
      getFillColor: [...H3_SELECTED_COLOR, FILL_OPACITY] as [number, number, number, number],
      getLineColor: [...H3_SELECTED_COLOR, STROKE_OPACITY] as [number, number, number, number],
    })
  }, [isActive, selectedCell])

  // Build label data: center of each H3 cell
  const labelData = useMemo(
    () =>
      cells.map((h3Index) => {
        const [lat, lng] = cellToLatLng(h3Index)
        return { position: [lng, lat] as [number, number], text: h3Index }
      }),
    [cells],
  )

  const textLayer = useMemo(() => {
    if (!isActive) return null

    return new TextLayer({
      id: 'h3-labels',
      data: labelData,
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getSize: 12,
      getColor: [...H3_COLOR, TEXT_OPACITY],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: 'monospace',
      pickable: false,
    })
  }, [labelData, isActive])

  // Neighbor layer: ring-1 neighbors of the selected cell (gridDisk minus center)
  const neighborLayer = useMemo(() => {
    if (!isActive || !showNeighbors || !selectedCell) return null

    const disk = gridDisk(selectedCell.h3Index, 1)
    const neighborIndexes = disk.filter((idx) => idx !== selectedCell.h3Index)
    const neighborGeoJSON = h3sToGeoJSON(neighborIndexes)

    return new GeoJsonLayer({
      id: 'h3-neighbors',
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

  const layers = useMemo(() => [layer, neighborLayer, selectionLayer, textLayer].filter(Boolean), [layer, neighborLayer, selectionLayer, textLayer])

  return { layers, onClick, selectedCell }
}
