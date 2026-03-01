import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/geospatial-index-viz/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-deck': ['deck.gl', '@deck.gl/react', '@deck.gl/layers', '@deck.gl/geo-layers'],
          'vendor-maplibre': ['maplibre-gl'],
          'vendor-geo': ['h3-js', 'ngeohash', '@turf/distance', '@turf/helpers'],
        },
      },
    },
  },
})
