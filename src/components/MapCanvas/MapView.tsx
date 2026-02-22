import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection } from 'geojson'
import type { Basemap } from '../../types'
import './MapView.css'

const STREETS_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const MINIMAL_BASE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f0ede8' } }],
}
const COUNTRIES_GEOJSON_URL = '/data/countries.geojson'
const COUNTRIES_SOURCE_ID = 'countries'
const COUNTRIES_LAYER_ID = 'country-borders'
const INITIAL_CENTER: [number, number] = [0, 0]
const INITIAL_ZOOM = 2

interface MapViewProps {
  basemap: Basemap
}

function MapView({ basemap }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const countriesDataRef = useRef<FeatureCollection | null>(null)

  // Initialize map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STREETS_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Switch basemap when prop changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const applyCountryLayer = async () => {
      if (!countriesDataRef.current) {
        const res = await fetch(COUNTRIES_GEOJSON_URL)
        countriesDataRef.current = (await res.json()) as FeatureCollection
      }

      // Avoid re-adding source/layer if they already exist on the current style
      if (!map.getSource(COUNTRIES_SOURCE_ID)) {
        map.addSource(COUNTRIES_SOURCE_ID, {
          type: 'geojson',
          data: countriesDataRef.current,
        })
      }

      if (!map.getLayer(COUNTRIES_LAYER_ID)) {
        map.addLayer({
          id: COUNTRIES_LAYER_ID,
          type: 'line',
          source: COUNTRIES_SOURCE_ID,
          paint: {
            'line-color': '#aaaaaa',
            'line-width': 0.8,
          },
        })
      }
    }

    const applyBasemap = () => {
      if (basemap === 'streets') {
        map.setStyle(STREETS_STYLE)
      } else {
        // Register listener BEFORE setStyle: inline styles can fire style.load
        // synchronously, so attaching after would miss the event
        map.once('style.load', () => {
          applyCountryLayer().catch(console.error)
        })
        map.setStyle(MINIMAL_BASE_STYLE)
      }
    }

    if (map.isStyleLoaded()) {
      applyBasemap()
    } else {
      map.once('load', applyBasemap)
    }
  }, [basemap])

  return <div ref={containerRef} className="map-view" />
}

export default MapView
