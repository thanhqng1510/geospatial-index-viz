import { useState } from 'react'
import type { Mode, Basemap, Selection } from './types'
import Header from './components/Header/Header'
import LeftPanel from './components/LeftPanel/LeftPanel'
import MapCanvas from './components/MapCanvas/MapCanvas'
import { ViewportProvider } from './context/ViewportContext'
import './App.css'

function App() {
  const [mode, setMode] = useState<Mode>('none')
  const [basemap, setBasemap] = useState<Basemap>('streets')
  const [selection, setSelection] = useState<Selection>(null)

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
          <LeftPanel selection={selection} />
          <MapCanvas basemap={basemap} mode={mode} onSelectionChange={setSelection} />
        </div>
      </div>
    </ViewportProvider>
  )
}

export default App
