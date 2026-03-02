export type Mode = 'geohash' | 'h3' | 's2' | 'none'
export type Basemap = 'streets' | 'minimal'

export interface GeohashSelection {
  hash: string
}

export interface H3Selection {
  h3Index: string
}

export interface S2Selection {
  s2Token: string
}

export type Selection = GeohashSelection | H3Selection | S2Selection | null
