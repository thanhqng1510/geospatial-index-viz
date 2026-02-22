import type { Basemap, Mode } from '../../types'
import './Header.css'

interface HeaderProps {
  mode: Mode
  basemap: Basemap
  onModeChange: (mode: Mode) => void
  onBasemapChange: (basemap: Basemap) => void
}

function Header({ mode, basemap, onModeChange, onBasemapChange }: HeaderProps) {
  return (
    <header className="header">
      <span className="header__title">Geospatial Index Visualizer</span>
      <div className="header__controls">
        <div className="toggle-group" role="group" aria-label="Index mode">
          <button
            className={`toggle-group__btn${mode === 'geohash' ? ' toggle-group__btn--active' : ''}`}
            onClick={() => onModeChange('geohash')}
          >
            Geohash
          </button>
          <button
            className={`toggle-group__btn${mode === 'h3' ? ' toggle-group__btn--active' : ''}`}
            onClick={() => onModeChange('h3')}
          >
            H3
          </button>
        </div>
        <div className="toggle-group" role="group" aria-label="Basemap">
          <button
            className={`toggle-group__btn${basemap === 'streets' ? ' toggle-group__btn--active' : ''}`}
            onClick={() => onBasemapChange('streets')}
          >
            Streets
          </button>
          <button
            className={`toggle-group__btn${basemap === 'minimal' ? ' toggle-group__btn--active' : ''}`}
            onClick={() => onBasemapChange('minimal')}
          >
            Minimal
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
