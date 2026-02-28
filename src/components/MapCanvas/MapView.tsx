import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection } from 'geojson'
import { colorizeCountries } from '../../utils/colorizeCountries'
import { useViewport } from '../../context/ViewportContext'
import type { Basemap } from '../../types'
import type { DeckViewState } from './MapCanvas'
import './MapView.css'

const STREETS_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const MINIMAL_BASE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f0ede8' } }],
}
const COUNTRIES_GEOJSON_URL = './data/countries.geojson'
const COUNTRIES_SOURCE_ID = 'countries'
const COUNTRIES_LAYER_ID = 'country-borders'
const INITIAL_CENTER: [number, number] = [0, 0]
const INITIAL_ZOOM = 2
const VIEWPORT_DEBOUNCE_MS = 250

interface MapViewProps {
  basemap: Basemap
  onDeckViewStateChange: (state: DeckViewState) => void
  onClick?: (lngLat: { lng: number; lat: number }) => void
}

function MapView({ basemap, onDeckViewStateChange, onClick }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const countriesDataRef = useRef<FeatureCollection | null>(null)
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stable ref so the click listener registered once always calls the latest callback
  const onClickRef = useRef(onClick)
  useEffect(() => { onClickRef.current = onClick }, [onClick])

  const { setViewport } = useViewport()

  // Initialize map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STREETS_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
    })

    // Sync DeckGL viewState immediately on every map move
    // Debounce viewport bounds update for grid recompute at 150ms
    map.on('move', () => {
      const center = map.getCenter()
      const zoom = map.getZoom()

      // Immediate DeckGL sync for visual alignment
      onDeckViewStateChange({
        longitude: center.lng,
        latitude: center.lat,
        zoom,
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      })

      // Debounced viewport bounds for cell recomputation
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current)
      viewportTimerRef.current = setTimeout(() => {
        const bounds = map.getBounds()
        setViewport({
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
          zoom,
        })
      }, VIEWPORT_DEBOUNCE_MS)
    })

    map.on('click', (e) => {
      onClickRef.current?.({ lng: e.lngLat.lng, lat: e.lngLat.lat })
    })

    mapRef.current = map

    return () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [setViewport, onDeckViewStateChange])

  // Switch basemap when prop changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const applyCountryLayer = async () => {
      if (!countriesDataRef.current) {
        const res = await fetch(COUNTRIES_GEOJSON_URL)
        const data = (await res.json()) as FeatureCollection
        countriesDataRef.current = colorizeCountries(data)
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
          type: 'fill',
          source: COUNTRIES_SOURCE_ID,
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.6,
            'fill-outline-color': '#555555',
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

  const { navigationCommand } = useViewport()
  useEffect(() => {
    if (!mapRef.current || !navigationCommand) return

    const map = mapRef.current
    const targetZoom = navigationCommand.zoom ?? map.getZoom()
    
    // Pan to location and trigger a pseudo-click immediately at the target center
    map.flyTo({
      center: [navigationCommand.lng, navigationCommand.lat],
      zoom: targetZoom,
      duration: 1000 // smooth transition
    })

    // The onClickRef will fire immediately. The child layers (useGeohash/useH3)
    // should be robust enough to handle a point outside the currently rendered viewport cells.
    map.once('moveend', () => {
      // simulate click at that spot
      onClickRef.current?.({ lng: navigationCommand.lng, lat: navigationCommand.lat })
    })

  }, [navigationCommand])

  return <div ref={mapContainerRef} className="map-view" />
}

export default MapView
