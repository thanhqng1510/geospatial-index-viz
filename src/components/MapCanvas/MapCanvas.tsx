import type { Basemap } from '../../types'
import MapView from './MapView'
import './MapCanvas.css'

interface MapCanvasProps {
  basemap: Basemap
}

function MapCanvas({ basemap }: MapCanvasProps) {
  return (
    <div className="map-canvas">
      <MapView basemap={basemap} />
    </div>
  )
}

export default MapCanvas
