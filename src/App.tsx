import { useState, useCallback } from 'react'
import type { SingleMode, ActiveModes, Basemap, Selection } from './types'
import Header from './components/Header/Header'
import LeftPanel from './components/LeftPanel/LeftPanel'
import MapCanvas from './components/MapCanvas/MapCanvas'
import { ViewportProvider } from './context/ViewportContext'
import './App.css'

function App() {
  const [activeModes, setActiveModes] = useState<ActiveModes>(new Set())
  const [basemap, setBasemap] = useState<Basemap>('streets')
  const [selections, setSelections] = useState<Partial<Record<SingleMode, Selection>>>({})
  const [showNeighbors, setShowNeighbors] = useState(false)

  const handleModeToggle = useCallback((mode: SingleMode) => {
    if (activeModes.has(mode)) {
      // Toggling off: remove mode and clear its selection
      setActiveModes(prev => { const next = new Set(prev); next.delete(mode); return next })
      setSelections(prev => { const next = { ...prev }; delete next[mode]; return next })
    } else {
      setActiveModes(prev => new Set(prev).add(mode))
    }
  }, [activeModes])

  const handleSelectionChange = useCallback((mode: SingleMode, selection: Selection) => {
    setSelections(prev => ({ ...prev, [mode]: selection }))
  }, [])

  return (
    <ViewportProvider>
      <div className="app">
        <Header
          activeModes={activeModes}
          basemap={basemap}
          onModeToggle={handleModeToggle}
          onBasemapChange={setBasemap}
        />
        <div className="app__body">
          <LeftPanel selections={selections} showNeighbors={showNeighbors} onShowNeighborsChange={setShowNeighbors} />
          <MapCanvas basemap={basemap} activeModes={activeModes} showNeighbors={showNeighbors} onSelectionChange={handleSelectionChange} />
        </div>
      </div>
    </ViewportProvider>
  )
}

export default App
