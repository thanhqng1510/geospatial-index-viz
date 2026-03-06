import type { Selection } from '../../types'
import CellMetadata from '../CellMetadata/CellMetadata'
import CoordinateInput from '../CoordinateInput/CoordinateInput'
import './LeftPanel.css'

interface LeftPanelProps {
  selection: Selection
  showNeighbors: boolean
  onShowNeighborsChange: (value: boolean) => void
}

function LeftPanel({ selection, showNeighbors, onShowNeighborsChange }: LeftPanelProps) {
  return (
    <aside className="left-panel">
      <section className="left-panel__coordinate-input">
        <CoordinateInput />
      </section>
      <section className="left-panel__metadata">
        <CellMetadata selection={selection} />
      </section>
      {selection !== null && (
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
