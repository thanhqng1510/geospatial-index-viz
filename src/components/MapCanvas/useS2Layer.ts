import { useState, useMemo, useEffect, useCallback } from 'react'
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers'
import type { Mode } from '../../types'
import { useViewport } from '../../context/ViewportContext'
import {
  getS2CellsGuarded,
  getS2Level,
  s2sToGeoJSON,
  encodeS2,
} from '../../utils/s2'

// Colors
const S2_COLOR: [number, number, number] = [220, 80, 160]          // pink/rose
const S2_SELECTED_COLOR: [number, number, number] = [255, 140, 0]  // orange highlight
const STROKE_OPACITY = 77   // 30% of 255
const FILL_OPACITY = 77     // 30% of 255
const TEXT_OPACITY = 180    // 70% of 255

interface SelectedCell {
  s2Token: string
}

/**
 * Encapsulates all S2 grid state, cell computation, styling, and click handling.
 * Mirrors the pattern of useGeohashLayer and useH3Layer.
 *
 * @param crossModeAnchor - Anchor point from another mode's selection, so S2 can auto-select
 *   the containing cell when the user switches into S2 mode.
 * @param onAnchorChange - Propagates anchor changes back to MapCanvas for cross-mode sharing.
 */
export function useS2Layer(
  mode: Mode,
  crossModeAnchor: { lat: number; lng: number } | null,
  onAnchorChange: (anchor: { lat: number; lng: number } | null) => void,
) {
  const { viewport } = useViewport()
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)

  // Clear selection when leaving s2 mode
  useEffect(() => {
    if (mode !== 's2') setSelectedCell(null)
  }, [mode])

  // Compute viewport-intersecting cells
  const cells = useMemo(() => {
    if (!viewport || mode !== 's2') return []
    return getS2CellsGuarded(viewport, viewport.zoom)
  }, [viewport, mode])

  // Recompute selected cell token when level changes due to zoom
  useEffect(() => {
    if (cells.length === 0 || !selectedCell || !crossModeAnchor) return

    const currentLevel = getS2Level(viewport?.zoom ?? 2)
    const newToken = encodeS2(crossModeAnchor.lat, crossModeAnchor.lng, currentLevel)
    if (newToken === selectedCell.s2Token) return

    setSelectedCell({ s2Token: newToken })
  }, [cells]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select from cross-mode anchor when entering S2 mode with cells ready
  useEffect(() => {
    if (mode !== 's2' || !crossModeAnchor || cells.length === 0 || selectedCell) return
    const level = getS2Level(viewport?.zoom ?? 2)
    const s2Token = encodeS2(crossModeAnchor.lat, crossModeAnchor.lng, level)
    setSelectedCell({ s2Token })
  }, [mode, cells]) // eslint-disable-line react-hooks/exhaustive-deps

  // GeoJSON FeatureCollection for rendering
  const geojson = useMemo(() => s2sToGeoJSON(cells), [cells])

  // Encode the clicked lngLat to an S2 token and toggle selection
  const onClick = useCallback(
    ({ lng, lat }: { lng: number; lat: number }) => {
      if (mode !== 's2' || !viewport || cells.length === 0) return

      const level = getS2Level(viewport.zoom)
      const clickedToken = encodeS2(lat, lng, level)

      setSelectedCell((prev) => {
        const next = prev?.s2Token === clickedToken
          ? null  // re-click → deselect
          : { s2Token: clickedToken }
        onAnchorChange(next ? { lat, lng } : null)
        return next
      })
    },
    [mode, viewport, cells, onAnchorChange],
  )

  // GeoJsonLayer with per-feature styling
  const layer = useMemo(() => {
    if (mode !== 's2') return null

    return new GeoJsonLayer({
      id: 's2-grid',
      data: geojson,
      pickable: false,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2.5,
      lineWidthScale: 1,
      getFillColor: (f) =>
        f.properties?.s2Token === selectedCell?.s2Token
          ? [...S2_SELECTED_COLOR, FILL_OPACITY]
          : [0, 0, 0, 0],
      getLineColor: (f) =>
        f.properties?.s2Token === selectedCell?.s2Token
          ? [...S2_SELECTED_COLOR, STROKE_OPACITY]
          : [...S2_COLOR, STROKE_OPACITY],
      updateTriggers: {
        getFillColor: selectedCell?.s2Token,
        getLineColor: selectedCell?.s2Token,
      },
    })
  }, [geojson, selectedCell, mode])

  // Label at the center of each cell
  const labelData = useMemo(
    () =>
      cells.map((s2Token) => {
        const feat = geojson.features.find((f) => f.properties.s2Token === s2Token)
        if (!feat) return { position: [0, 0] as [number, number], text: s2Token }
        return { position: feat.properties.center as [number, number], text: s2Token }
      }),
    [cells, geojson],
  )

  const textLayer = useMemo(() => {
    if (mode !== 's2') return null

    return new TextLayer({
      id: 's2-labels',
      data: labelData,
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getSize: 12,
      getColor: [...S2_COLOR, TEXT_OPACITY],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: 'monospace',
      pickable: false,
    })
  }, [labelData, mode])

  const layers = useMemo(() => [layer, textLayer].filter(Boolean), [layer, textLayer])

  return { layers, onClick, selectedCell }
}
