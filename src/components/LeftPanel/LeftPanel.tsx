import type { Selection } from '../../types'
import CellMetadata from '../CellMetadata/CellMetadata'
import './LeftPanel.css'

interface LeftPanelProps {
  selection: Selection
}

function LeftPanel({ selection }: LeftPanelProps) {
  return (
    <aside className="left-panel">
      <section className="left-panel__coordinate-input">
        {/* CoordinateInput component — implemented in Task 9 */}
        <p className="left-panel__placeholder">Coordinate input coming soon</p>
      </section>
      <section className="left-panel__metadata">
        <CellMetadata selection={selection} />
      </section>
    </aside>
  )
}

export default LeftPanel
