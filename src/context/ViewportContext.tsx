import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'

export interface ViewportBounds {
  west: number
  south: number
  east: number
  north: number
  zoom: number
}

export interface NavigationCommand {
  lat: number
  lng: number
  zoom?: number
  timestamp: number
}

interface ViewportContextValue {
  viewport: ViewportBounds | null
  setViewport: (bounds: ViewportBounds) => void
  navigationCommand: NavigationCommand | null
  navigate: (lat: number, lng: number, zoom?: number) => void
}

const ViewportContext = createContext<ViewportContextValue>({
  viewport: null,
  setViewport: () => {},
  navigationCommand: null,
  navigate: () => {},
})

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<ViewportBounds | null>(null)
  const [navigationCommand, setNavigationCommand] = useState<NavigationCommand | null>(null)

  const navigate = useCallback((lat: number, lng: number, zoom?: number) => {
    setNavigationCommand({ lat, lng, zoom, timestamp: Date.now() })
  }, [])

  const contextValue = useMemo(() => ({
    viewport,
    setViewport,
    navigationCommand,
    navigate
  }), [viewport, setViewport, navigationCommand, navigate])

  return (
    <ViewportContext value={contextValue}>
      {children}
    </ViewportContext>
  )
}

export function useViewport(): ViewportContextValue {
  return useContext(ViewportContext)
}
