import { useState, useCallback, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import type { Basemap, Mode, Selection } from '../../types'
import { useGeohashLayer } from './useGeohashLayer'
import { useH3Layer } from './useH3Layer'
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
  mode: Mode
  onSelectionChange?: (selection: Selection) => void
}

function MapCanvas({ basemap, mode, onSelectionChange }: MapCanvasProps) {
  const [deckViewState, setDeckViewState] = useState<DeckViewState>(INITIAL_DECK_VIEW_STATE)
  
  // Shared anchor: updated whenever the active mode has a selection, used to
  // auto-select in the new mode when the user switches modes.
  const [crossModeAnchor, setCrossModeAnchor] = useState<Anchor | null>(null)

  const { layers: geohashLayers, onClick: geohashOnClick, selectedCell: geohashSelection } = useGeohashLayer(mode, crossModeAnchor, setCrossModeAnchor)
  const { layers: h3Layers, onClick: h3OnClick, selectedCell: h3Selection } = useH3Layer(mode, crossModeAnchor, setCrossModeAnchor)

  // Report active selection up to parent
  useEffect(() => {
    if (!onSelectionChange) return

    if (mode === 'geohash') {
      onSelectionChange(geohashSelection ? { hash: geohashSelection.hash } : null)
    } else if (mode === 'h3') {
      onSelectionChange(h3Selection ? { h3Index: h3Selection.h3Index } : null)
    } else {
      onSelectionChange(null)
    }
  }, [mode, geohashSelection, h3Selection, onSelectionChange])

  // Route map clicks to the active mode's handler
  const handleClick = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      geohashOnClick(lngLat)
      h3OnClick(lngLat)
    },
    [geohashOnClick, h3OnClick],
  )

  const layers = [...geohashLayers, ...h3Layers]

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
