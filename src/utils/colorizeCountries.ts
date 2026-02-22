import type { FeatureCollection } from 'geojson'

const COLOR_PALETTE = [
  '#e6f2ff', '#cce5ff', '#b3d9ff', '#99ccff', '#80bfff',
  '#66b3ff', '#4da6ff', '#3399ff', '#1a8cff', '#0080ff',
  '#ffe6e6', '#ffcccc', '#ffb3b3', '#ff9999', '#ff8080',
  '#ff6666', '#ff4d4d', '#ff3333', '#ff1a1a', '#ff0000',
  '#e6ffe6', '#ccffcc', '#b3ffb3', '#99ff99', '#80ff80',
  '#66ff66', '#4dff4d', '#33ff33', '#1aff1a', '#00ff00',
  '#ffffcc', '#ffff99', '#ffff66', '#ffff33', '#ffff00',
  '#ffe6cc', '#ffcc99', '#ffb266', '#ff9933', '#ff8000',
  '#e6e6ff', '#ccccff', '#b3b3ff', '#9999ff', '#8080ff',
  '#e6f0ff', '#d4e8ff', '#c2dfff', '#b0d7ff', '#9eceff',
]

function hashStringToColor(str: string): string {
  // 32-bit hash function: converts string to consistent numeric value
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    // Bitwise AND forces result into 32-bit signed integer range for consistency
    hash = hash & hash
  }
  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length
  return COLOR_PALETTE[colorIndex]
}

export function colorizeCountries(data: FeatureCollection): FeatureCollection {
  data.features.forEach((feature) => {
    const name = (feature.properties?.ADMIN || feature.properties?.NAME || 'unknown') as string
    feature.properties!.color = hashStringToColor(name)
  })
  return data
}
