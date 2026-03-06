import { useState, useCallback, useEffect, useMemo } from 'react'
import DeckGL from '@deck.gl/react'
import type { Basemap, ActiveModes, SingleMode, Selection } from '../../types'
import { useGeohashLayer } from './useGeohashLayer'
import { useH3Layer } from './useH3Layer'
import { useS2Layer } from './useS2Layer'
import MapView from './MapView'
import './MapCanvas.css'

export interface DeckViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

export interface Anchor {
  lat: number
  lng: number
}

const INITIAL_DECK_VIEW_STATE: DeckViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 2,
  pitch: 0,
  bearing: 0,
}

interface MapCanvasProps {
  basemap: Basemap
  activeModes: ActiveModes
  showNeighbors: boolean
  onSelectionChange?: (mode: SingleMode, selection: Selection) => void
}

function MapCanvas({ basemap, activeModes, showNeighbors, onSelectionChange }: MapCanvasProps) {
  const [deckViewState, setDeckViewState] = useState<DeckViewState>(INITIAL_DECK_VIEW_STATE)

  // Shared anchor: updated whenever the active mode has a selection, used to
  // auto-select in the new mode when the user switches modes.
  const [crossModeAnchor, setCrossModeAnchor] = useState<Anchor | null>(null)

  const { layers: geohashLayers, onClick: geohashOnClick, selectedCell: geohashSelection } = useGeohashLayer(activeModes.has('geohash'), crossModeAnchor, setCrossModeAnchor, showNeighbors)
  const { layers: h3Layers, onClick: h3OnClick, selectedCell: h3Selection } = useH3Layer(activeModes.has('h3'), crossModeAnchor, setCrossModeAnchor, showNeighbors)
  const { layers: s2Layers, onClick: s2OnClick, selectedCell: s2Selection } = useS2Layer(activeModes.has('s2'), crossModeAnchor, setCrossModeAnchor, showNeighbors)

  // Report per-mode selections to parent independently
  useEffect(() => {
    onSelectionChange?.('geohash', geohashSelection ? { hash: geohashSelection.hash } : null)
  }, [geohashSelection, onSelectionChange])

  useEffect(() => {
    onSelectionChange?.('h3', h3Selection ? { h3Index: h3Selection.h3Index } : null)
  }, [h3Selection, onSelectionChange])

  useEffect(() => {
    onSelectionChange?.('s2', s2Selection ? { s2Token: s2Selection.s2Token } : null)
  }, [s2Selection, onSelectionChange])

  // Route map clicks to the active mode's handler
  const handleClick = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      geohashOnClick(lngLat)
      h3OnClick(lngLat)
      s2OnClick(lngLat)
    },
    [geohashOnClick, h3OnClick, s2OnClick],
  )

  const layers = useMemo(
    () => [...geohashLayers, ...h3Layers, ...s2Layers],
    [geohashLayers, h3Layers, s2Layers],
  )

  return (
    <div className="map-canvas">
      <MapView basemap={basemap} onDeckViewStateChange={setDeckViewState} onClick={handleClick} />
      <DeckGL
        style={{ position: 'absolute', inset: '0', pointerEvents: 'none' }}
        viewState={deckViewState}
        controller={false}
        layers={layers}
      />
    </div>
  )
}

export default MapCanvas
