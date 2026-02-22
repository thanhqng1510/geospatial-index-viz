import { useState } from 'react'
import type { Mode, Basemap } from './types'
import Header from './components/Header/Header'
import LeftPanel from './components/LeftPanel/LeftPanel'
import MapCanvas from './components/MapCanvas/MapCanvas'
import { ViewportProvider } from './context/ViewportContext'
import './App.css'

function App() {
  const [mode, setMode] = useState<Mode>('none')
  const [basemap, setBasemap] = useState<Basemap>('streets')

  return (
    <ViewportProvider>
      <div className="app">
        <Header
          mode={mode}
          basemap={basemap}
          onModeChange={setMode}
          onBasemapChange={setBasemap}
        />
        <div className="app__body">
          <LeftPanel />
          <MapCanvas basemap={basemap} mode={mode} />
        </div>
      </div>
    </ViewportProvider>
  )
}

export default App
