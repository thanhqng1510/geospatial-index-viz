import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface ViewportBounds {
  west: number
  south: number
  east: number
  north: number
  zoom: number
}

interface ViewportContextValue {
  viewport: ViewportBounds | null
  setViewport: (bounds: ViewportBounds) => void
}

const ViewportContext = createContext<ViewportContextValue>({
  viewport: null,
  setViewport: () => {},
})

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<ViewportBounds | null>(null)

  return (
    <ViewportContext value={{ viewport, setViewport }}>
      {children}
    </ViewportContext>
  )
}

export function useViewport(): ViewportContextValue {
  return useContext(ViewportContext)
}
