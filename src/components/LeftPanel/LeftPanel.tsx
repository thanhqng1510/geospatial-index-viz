import type { Selection } from '../../types'
import CellMetadata from '../CellMetadata/CellMetadata'
import CoordinateInput from '../CoordinateInput/CoordinateInput'
import './LeftPanel.css'

interface LeftPanelProps {
  selection: Selection
}

function LeftPanel({ selection }: LeftPanelProps) {
  return (
    <aside className="left-panel">
      <section className="left-panel__coordinate-input">
        <CoordinateInput />
      </section>
      <section className="left-panel__metadata">
        <CellMetadata selection={selection} />
      </section>
    </aside>
  )
}

export default LeftPanel
