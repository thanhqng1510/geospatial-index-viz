import { useState } from 'react'
import { useViewport } from '../../context/ViewportContext'
import './CoordinateInput.css'

function CoordinateInput() {
  const [latStr, setLatStr] = useState('')
  const [lngStr, setLngStr] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const { navigate } = useViewport()

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!latStr.trim() || !lngStr.trim()) {
      setError(null)
      return
    }

    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90')
      return
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180')
      return
    }

    setError(null)
    navigate(lat, lng, 12) // Use zoom 12 as a reasonable detail level when jumping to a coordinate
  }

  const handleClear = () => {
    setLatStr('')
    setLngStr('')
    setError(null)
  }

  return (
    <div className="coordinate-input">
      <h3 className="coordinate-input__title">Go to Coordinate</h3>
      <form onSubmit={handleSubmit} className="coordinate-input__form">
        <label className="coordinate-input__label">
          Lat:
          <input
            type="number"
            step="any"
            value={latStr}
            onChange={(e) => {
              setLatStr(e.target.value)
              setError(null)
            }}
            placeholder="e.g. 37.7749"
            className="coordinate-input__field"
          />
        </label>
        <label className="coordinate-input__label">
          Lng:
          <input
            type="number"
            step="any"
            value={lngStr}
            onChange={(e) => {
              setLngStr(e.target.value)
              setError(null)
            }}
            placeholder="e.g. -122.4194"
            className="coordinate-input__field"
          />
        </label>
        <div className="coordinate-input__actions">
          <button type="button" className="coordinate-input__btn" onClick={handleClear}>Clear</button>
          <button type="submit" className="coordinate-input__btn coordinate-input__btn--primary">Go</button>
        </div>
      </form>
      {error && <p className="coordinate-input__error">{error}</p>}
    </div>
  )
}

export default CoordinateInput
