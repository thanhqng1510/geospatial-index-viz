import { useState, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import type { Basemap, Mode } from '../../types'
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
}

function MapCanvas({ basemap, mode }: MapCanvasProps) {
  const [deckViewState, setDeckViewState] = useState<DeckViewState>(INITIAL_DECK_VIEW_STATE)
  
  // Shared anchor: updated whenever the active mode has a selection, used to
  // auto-select in the new mode when the user switches modes.
  const [crossModeAnchor, setCrossModeAnchor] = useState<Anchor | null>(null)

  const { layers: geohashLayers, onClick: geohashOnClick } = useGeohashLayer(mode, crossModeAnchor, setCrossModeAnchor)
  const { layers: h3Layers, onClick: h3OnClick } = useH3Layer(mode, crossModeAnchor, setCrossModeAnchor)

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
