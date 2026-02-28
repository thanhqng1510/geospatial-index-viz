import { useMemo } from 'react'
import type { Selection } from '../../types'
import { getGeohashCellCenter } from '../../utils/geohash'
import ngeohash from 'ngeohash'
import { cellArea, cellToLatLng, getResolution, isPentagon, UNITS } from 'h3-js'
import distance from '@turf/distance'
import { point } from '@turf/helpers'
import './CellMetadata.css'

interface CellMetadataProps {
  selection: Selection
}

function formatNumber(num: number, decimals: number = 5): string {
  return num.toFixed(decimals)
}

function formatArea(sqMeters: number): string {
  if (sqMeters >= 1_000_000) {
    return `${(sqMeters / 1_000_000).toFixed(2)} km²`
  }
  return `${sqMeters.toFixed(2)} m²`
}

function formatDistance(meters: number): string {
  if (meters >= 1_000) {
    return `${(meters / 1_000).toFixed(2)} km`
  }
  return `${meters.toFixed(2)} m`
}

function GeohashMetadata({ hash }: { hash: string }) {
  const metadata = useMemo(() => {
    const center = getGeohashCellCenter(hash)
    const [minLat, minLng, maxLat, maxLng] = ngeohash.decode_bbox(hash)
    
    // Calculate width (constant lat) and height (constant lng)
    const widthKm = distance(
      point([minLng, center.lat]), 
      point([maxLng, center.lat]), 
      { units: 'kilometers' }
    )
    const heightKm = distance(
      point([center.lng, minLat]), 
      point([center.lng, maxLat]), 
      { units: 'kilometers' }
    )

    const widthStr = formatDistance(widthKm * 1000)
    const heightStr = formatDistance(heightKm * 1000)

    return {
      precision: hash.length,
      center: `${formatNumber(center.lat)}, ${formatNumber(center.lng)}`,
      boundsSW: `${formatNumber(minLat)}, ${formatNumber(minLng)}`,
      boundsNE: `${formatNumber(maxLat)}, ${formatNumber(maxLng)}`,
      size: `${widthStr} × ${heightStr}`
    }
  }, [hash])

  return (
    <dl className="metadata-list">
      <dt>Hash</dt><dd><code>{hash}</code></dd>
      <dt>Precision</dt><dd>{metadata.precision}</dd>
      <dt>Center</dt><dd>{metadata.center}</dd>
      <dt>Bounds (SW)</dt><dd>{metadata.boundsSW}</dd>
      <dt>Bounds (NE)</dt><dd>{metadata.boundsNE}</dd>
      <dt>Cell size</dt><dd>{metadata.size}</dd>
    </dl>
  )
}

function H3Metadata({ h3Index }: { h3Index: string }) {
  const metadata = useMemo(() => {
    const resolution = getResolution(h3Index)
    const [lat, lng] = cellToLatLng(h3Index)
    const areaSqM = cellArea(h3Index, UNITS.m2)
    const pentagon = isPentagon(h3Index)

    return {
      resolution,
      center: `${formatNumber(lat)}, ${formatNumber(lng)}`,
      area: formatArea(areaSqM),
      pentagon: pentagon ? 'Yes ⚠' : 'No'
    }
  }, [h3Index])

  return (
    <dl className="metadata-list">
      <dt>H3 Index</dt><dd><code>{h3Index}</code></dd>
      <dt>Resolution</dt><dd>{metadata.resolution}</dd>
      <dt>Center</dt><dd>{metadata.center}</dd>
      <dt>Area</dt><dd>{metadata.area}</dd>
      <dt>
        <abbr className="info-label" title="12 base cells in H3 are pentagons. This warning appears when a selected cell is one of those pentagons, which may cause distortions in certain calculations.">
          Pentagon
        </abbr>
      </dt>
      <dd className={metadata.pentagon === 'Yes ⚠' ? 'warning' : ''}>
        {metadata.pentagon}
      </dd>
    </dl>
  )
}

function CellMetadata({ selection }: CellMetadataProps) {
  if (!selection) {
    return <p className="left-panel__placeholder">Click a cell to see its details</p>
  }

  const isGeohash = 'hash' in selection

  return (
    <div className="cell-metadata">
      <h3 className="cell-metadata__title">
        {isGeohash ? 'Geohash Cell' : 'H3 Cell'}
      </h3>
      {isGeohash ? (
        <GeohashMetadata hash={selection.hash} />
      ) : (
        <H3Metadata h3Index={selection.h3Index} />
      )}
    </div>
  )
}

export default CellMetadata
