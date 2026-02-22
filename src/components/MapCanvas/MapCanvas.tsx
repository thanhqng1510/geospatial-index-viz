import { useState } from 'react'
import DeckGL from '@deck.gl/react'
import type { Basemap } from '../../types'
import MapView from './MapView'
import './MapCanvas.css'

export interface DeckViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
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
}

function MapCanvas({ basemap }: MapCanvasProps) {
  const [deckViewState, setDeckViewState] = useState<DeckViewState>(INITIAL_DECK_VIEW_STATE)

  return (
    <div className="map-canvas">
      <MapView basemap={basemap} onDeckViewStateChange={setDeckViewState} />
      <DeckGL
        style={{ position: 'absolute', inset: '0', pointerEvents: 'none' }}
        viewState={deckViewState}
        controller={false}
        layers={[]}
      />
    </div>
  )
}

export default MapCanvas
