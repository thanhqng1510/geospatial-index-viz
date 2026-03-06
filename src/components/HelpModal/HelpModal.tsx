import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import ReactDOM from 'react-dom'
import './HelpModal.css'

export interface HelpModalHandle {
  open: () => void
}

function readHelpSeen(): boolean {
  try {
    return localStorage.getItem('helpSeen') === '1'
  } catch {
    return false
  }
}

const FEATURES = [
  {
    term: '🗺️ Index Modes',
    desc: (
      <>
        Toggle <strong>Geohash</strong>, <strong>H3</strong>, and <strong>S2</strong> independently — or enable
        all three at once to compare how each system partitions the same area. Use the mode buttons in the header.
      </>
    ),
  },
  {
    term: '🔍 Click to Inspect',
    desc: (
      <>
        Click any cell on the map to select it. The left panel shows its <strong>index ID</strong>,{' '}
        <strong>precision / resolution / level</strong>, center coordinates, bounding box, and cell size.
      </>
    ),
  },
  {
    term: '📍 Coordinate Jump',
    desc: (
      <>
        Enter a <strong>latitude</strong> and <strong>longitude</strong> in the left panel and press{' '}
        <em>Go</em> to fly the map to that location — great for exploring a specific city or point of interest.
      </>
    ),
  },
  {
    term: '🔗 Neighbor Highlight',
    desc: (
      <>
        After selecting a cell, check <strong>Show neighbors</strong> in the left panel to highlight all
        adjacent cells in that index system.
      </>
    ),
  },
  {
    term: '🌍 Basemap',
    desc: (
      <>
        Switch between <strong>Streets</strong> and <strong>Minimal</strong> basemaps in the header to
        reduce visual noise when studying cell boundaries.
      </>
    ),
  },
] as const

const HelpModal = forwardRef<HelpModalHandle>(function HelpModal(_props, ref) {
  const [isOpen, setIsOpen] = useState(() => !readHelpSeen())
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({ open: () => setIsOpen(true) }), [])

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('helpSeen', '1')
      } catch {
        // ignore unavailable storage
      }
    }
    setIsOpen(false)
  }, [dontShowAgain])

  // Focus the modal container when it opens
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus()
    }
  }, [isOpen])

  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Backdrop click closes the modal
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className="help-modal__backdrop" onClick={handleBackdropClick} aria-hidden="false">
      <div
        ref={modalRef}
        className="help-modal__container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        tabIndex={-1}
      >
        <div className="help-modal__header">
          <h2 id="help-modal-title" className="help-modal__title">
            👋 Welcome to Geospatial Index Visualizer
          </h2>
          <button
            className="help-modal__close"
            onClick={handleClose}
            aria-label="Close help"
          >
            ×
          </button>
        </div>

        <p className="help-modal__intro">
          Explore how <strong>Geohash</strong>, <strong>H3</strong>, and <strong>S2</strong> partition
          the globe into grid cells. Here's what you can do:
        </p>

        <dl className="help-modal__features">
          {FEATURES.map(({ term, desc }) => (
            <div key={term} className="help-modal__feature">
              <dt className="help-modal__feature-term">{term}</dt>
              <dd className="help-modal__feature-desc">{desc}</dd>
            </div>
          ))}
        </dl>

        <div className="help-modal__footer">
          <label className="help-modal__dont-show">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don't show again
          </label>
        </div>
      </div>
    </div>,
    document.body
  )
})

export default HelpModal
