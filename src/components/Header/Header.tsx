import type { Basemap, SingleMode, ActiveModes } from '../../types'
import './Header.css'

interface HeaderProps {
  activeModes: ActiveModes
  basemap: Basemap
  onModeToggle: (mode: SingleMode) => void
  onBasemapChange: (basemap: Basemap) => void
}

function Header({ activeModes, basemap, onModeToggle, onBasemapChange }: HeaderProps) {
  return (
    <header className="header">
      <span className="header__title">Geospatial Index Visualizer</span>
      <div className="header__controls">
        <div className="toggle-group" role="group" aria-label="Index mode">
          <button
            className={`toggle-group__btn${activeModes.has('geohash') ? ' toggle-group__btn--active' : ''}`}
            onClick={() => onModeToggle('geohash')}
          >
            Geohash
          </button>
          <button
            className={`toggle-group__btn${activeModes.has('h3') ? ' toggle-group__btn--active' : ''}`}
            onClick={() => onModeToggle('h3')}
          >
            H3
          </button>
          <button
            className={`toggle-group__btn${activeModes.has('s2') ? ' toggle-group__btn--active' : ''}`}
            onClick={() => onModeToggle('s2')}
          >
            S2
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
