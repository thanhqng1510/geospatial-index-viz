import { useState, useMemo, useEffect, useCallback } from 'react'
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers'
import type { Mode } from '../../types'
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
const STROKE_OPACITY = 77   // 30% of 255
const FILL_OPACITY = 77    // 30% of 255
const TEXT_OPACITY = 180   // 70% of 255

interface SelectedCell {
  hash: string
  anchor: { lat: number; lng: number } // original click coordinates, used to re-encode on precision change
}

/**
 * Encapsulates all Geohash grid state, cell computation, styling, and click handling.
 *
 * Returns:
 * - `layers` — array of Deck.gl layers (GeoJsonLayer + TextLayer) ready to pass to <DeckGL layers>.
 *              Empty when not in geohash mode.
 * - `onClick` — pass to MapView so map clicks can select/deselect cells.
 * - `selectedCell` — the currently selected cell (hash + center), or null.
 */
export function useGeohashLayer(mode: Mode) {
  const { viewport } = useViewport()
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)

  // Clear selection when leaving geohash mode
  useEffect(() => {
    if (mode !== 'geohash') setSelectedCell(null)
  }, [mode])

  // Compute viewport-intersecting cells
  const cells = useMemo(() => {
    if (!viewport || mode !== 'geohash') return []
    return getGeohashCellsGuarded(viewport, viewport.zoom)
  }, [viewport, mode])

  // Recompute selected cell's hash when precision changes due to zoom
  useEffect(() => {
    if (cells.length === 0 || !selectedCell) return
    const newPrecision = cells[0].length
    if (newPrecision === selectedCell.hash.length) return // precision unchanged

    const newHash = encodeGeohash(selectedCell.anchor.lat, selectedCell.anchor.lng, newPrecision)
    setSelectedCell({ hash: newHash, anchor: selectedCell.anchor })
  }, [cells]) // eslint-disable-line react-hooks/exhaustive-deps

  // GeoJSON FeatureCollection for rendering
  const geojson = useMemo(() => geohashesToGeoJSON(cells), [cells])

  // Encode the clicked lngLat to a geohash and toggle selection
  const onClick = useCallback(
    ({ lng, lat }: { lng: number; lat: number }) => {
      if (mode !== 'geohash' || !viewport) return

      // Use the actual rendered precision (geohash string length = precision),
      // not the zoom-derived one — the guard may have reduced it
      const precision = cells[0]?.length ?? getGeohashPrecision(viewport.zoom)
      const clickedHash = encodeGeohash(lat, lng, precision)

      if (!cells.includes(clickedHash)) {
        setSelectedCell(null)
        return
      }

      setSelectedCell((prev) =>
        prev?.hash === clickedHash
          ? null // re-click → deselect
          : { hash: clickedHash, anchor: { lat, lng } },
      )
    },
    [mode, viewport, cells],
  )

  // Build the GeoJsonLayer with per-feature styling based on selection
  const layer = useMemo(() => {
    if (mode !== 'geohash') return null

    return new GeoJsonLayer({
      id: 'geohash-grid',
      data: geojson,
      pickable: false, // picking is done via MapLibre click + ngeohash.encode
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getFillColor: (f) =>
        f.properties?.hash === selectedCell?.hash
          ? [...GEOHASH_SELECTED_COLOR, FILL_OPACITY]
          : [0, 0, 0, 0],
      getLineColor: (f) =>
        f.properties?.hash === selectedCell?.hash
          ? [...GEOHASH_SELECTED_COLOR, STROKE_OPACITY]
          : [...GEOHASH_COLOR, STROKE_OPACITY],
      updateTriggers: {
        getFillColor: selectedCell?.hash,
        getLineColor: selectedCell?.hash,
      },
    })
  }, [geojson, selectedCell, mode])

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
    if (mode !== 'geohash') return null

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
  }, [labelData, mode])

  const layers = useMemo(
    () => [layer, textLayer].filter(Boolean),
    [layer, textLayer],
  )

  return { layers, onClick, selectedCell }
}
