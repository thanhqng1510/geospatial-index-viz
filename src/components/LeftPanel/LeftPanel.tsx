import type { SingleMode, Selection } from '../../types'
import CellMetadata from '../CellMetadata/CellMetadata'
import CoordinateInput from '../CoordinateInput/CoordinateInput'
import './LeftPanel.css'

const MODE_LABELS: Record<SingleMode, string> = {
  geohash: 'Geohash',
  h3: 'H3',
  s2: 'S2',
}

const MODE_ORDER: SingleMode[] = ['geohash', 'h3', 's2']

interface LeftPanelProps {
  selections: Partial<Record<SingleMode, Selection>>
  showNeighbors: boolean
  onShowNeighborsChange: (value: boolean) => void
}

function LeftPanel({ selections, showNeighbors, onShowNeighborsChange }: LeftPanelProps) {
  const activeSelections = MODE_ORDER.filter((m) => selections[m] != null)
  const hasAnySelection = activeSelections.length > 0

  return (
    <aside className="left-panel">
      <section className="left-panel__coordinate-input">
        <CoordinateInput />
      </section>
      <section className="left-panel__metadata">
        {hasAnySelection
          ? activeSelections.map((mode) => (
              <div key={mode} className="left-panel__mode-block">
                <h3 className="left-panel__mode-label">{MODE_LABELS[mode]}</h3>
                <CellMetadata selection={selections[mode]!} />
              </div>
            ))
          : <p className="left-panel__placeholder">Click a cell on the map to see its metadata.</p>
        }
      </section>
      {hasAnySelection && (
        <section className="left-panel__neighbors">
          <label className="left-panel__neighbors-toggle">
            <input
              type="checkbox"
              checked={showNeighbors}
              onChange={(e) => onShowNeighborsChange(e.target.checked)}
            />
            Show neighbors
          </label>
        </section>
      )}
    </aside>
  )
}

export default LeftPanel
