export type Mode = 'geohash' | 'h3' | 'none'
export type Basemap = 'streets' | 'minimal'

export interface GeohashSelection {
  hash: string
}

export interface H3Selection {
  h3Index: string
}

export type Selection = GeohashSelection | H3Selection | null
