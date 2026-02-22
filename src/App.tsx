import { useState } from 'react'
import type { Mode, Basemap } from './types'
import Header from './components/Header/Header'
import LeftPanel from './components/LeftPanel/LeftPanel'
import MapCanvas from './components/MapCanvas/MapCanvas'
import './App.css'

function App() {
  const [mode, setMode] = useState<Mode>('geohash')
  const [basemap, setBasemap] = useState<Basemap>('streets')

  return (
    <div className="app">
      <Header
        mode={mode}
        basemap={basemap}
        onModeChange={setMode}
        onBasemapChange={setBasemap}
      />
      <div className="app__body">
        <LeftPanel />
        <MapCanvas />
      </div>
    </div>
  )
}

export default App
