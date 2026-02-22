import './LeftPanel.css'

function LeftPanel() {
  return (
    <aside className="left-panel">
      <section className="left-panel__coordinate-input">
        {/* CoordinateInput component — implemented in Task 9 */}
        <p className="left-panel__placeholder">Coordinate input coming soon</p>
      </section>
      <section className="left-panel__metadata">
        {/* CellMetadata component — implemented in Task 8 */}
        <p className="left-panel__placeholder">Click a cell to see its details</p>
      </section>
    </aside>
  )
}

export default LeftPanel
