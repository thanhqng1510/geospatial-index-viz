import { useState, useMemo, useEffect, useCallback } from 'react'
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers'
import { getResolution, cellToLatLng } from 'h3-js'
import type { Mode } from '../../types'
import { useViewport } from '../../context/ViewportContext'
import {
  getH3CellsGuarded,
  h3sToGeoJSON,
  encodeH3,
} from '../../utils/h3'

// Colors
const H3_COLOR: [number, number, number] = [102, 194, 164]           // teal/green
const H3_SELECTED_COLOR: [number, number, number] = [255, 140, 0]    // orange highlight
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
  mode: Mode,
  crossModeAnchor: { lat: number; lng: number } | null,
  onAnchorChange: (anchor: { lat: number; lng: number } | null) => void,
) {
  const { viewport } = useViewport()
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)

  // Clear selection when leaving h3 mode
  useEffect(() => {
    if (mode !== 'h3') setSelectedCell(null)
  }, [mode])

  // Compute viewport-intersecting cells
  const cells = useMemo(() => {
    if (!viewport || mode !== 'h3') return []
    return getH3CellsGuarded(viewport, viewport.zoom)
  }, [viewport, mode])

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
    if (mode !== 'h3' || !crossModeAnchor || cells.length === 0 || selectedCell) return
    const resolution = getResolution(cells[0])
    const h3Index = encodeH3(crossModeAnchor.lat, crossModeAnchor.lng, resolution)
    if (cells.includes(h3Index)) {
      setSelectedCell({ h3Index })
    }
  }, [mode, cells]) // eslint-disable-line react-hooks/exhaustive-deps

  // GeoJSON FeatureCollection for rendering
  const geojson = useMemo(() => h3sToGeoJSON(cells), [cells])

  // Handle map click: look up which H3 cell contains the click point and toggle selection
  const onClick = useCallback(
    ({ lng, lat }: { lng: number; lat: number }) => {
      if (mode !== 'h3' || !viewport || cells.length === 0) return

      // Derive the actual rendered resolution from cells (guard may have reduced it)
      const resolution: number = getResolution(cells[0])
      const clickedIndex = encodeH3(lat, lng, resolution)

      if (!cells.includes(clickedIndex)) {
        setSelectedCell(null)
        onAnchorChange(null)
        return
      }

      setSelectedCell((prev) => {
        const next = prev?.h3Index === clickedIndex
          ? null // re-click → deselect
          : { h3Index: clickedIndex }
        onAnchorChange(next ? { lat, lng } : null)
        return next
      })
    },
    [mode, viewport, cells, onAnchorChange],
  )

  // Build the GeoJsonLayer with per-feature styling based on selection
  const layer = useMemo(() => {
    if (mode !== 'h3') return null

    return new GeoJsonLayer({
      id: 'h3-grid',
      data: geojson,
      pickable: false,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2.5,
      lineWidthScale: 1,
      getFillColor: (f) =>
        f.properties?.h3Index === selectedCell?.h3Index
          ? [...H3_SELECTED_COLOR, FILL_OPACITY]
          : [0, 0, 0, 0],
      getLineColor: (f) =>
        f.properties?.h3Index === selectedCell?.h3Index
          ? [...H3_SELECTED_COLOR, STROKE_OPACITY]
          : [...H3_COLOR, STROKE_OPACITY],
      updateTriggers: {
        getFillColor: selectedCell?.h3Index,
        getLineColor: selectedCell?.h3Index,
      },
    })
  }, [geojson, selectedCell, mode])

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
    if (mode !== 'h3') return null

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
  }, [labelData, mode])

  const layers = useMemo(() => [layer, textLayer].filter(Boolean), [layer, textLayer])

  return { layers, onClick, selectedCell }
}
