## ADDED Requirements

### Requirement: Sidebar panel displays metadata for the selected cell
The application SHALL display a metadata panel in the left sidebar that shows detailed information about the currently selected cell. The panel SHALL be empty (or show a placeholder prompt) when no cell is selected.

#### Scenario: No cell selected
- **WHEN** no cell is selected
- **THEN** the metadata panel SHALL display a prompt such as "Click a cell to see its details"

#### Scenario: Cell selected
- **WHEN** a cell is selected
- **THEN** the metadata panel SHALL display that cell's metadata immediately

---

### Requirement: Geohash cell metadata is displayed
When a Geohash cell is selected, the metadata panel SHALL display the following fields:
- **Hash**: the Geohash string (e.g. `u4pruydq`)
- **Precision**: integer precision level (e.g. `6`)
- **Center**: latitude and longitude of the cell center, formatted to 5 decimal places
- **Bounds**: SW and NE corner coordinates (lat/lng), each formatted to 5 decimal places
- **Cell size**: approximate width × height in human-readable units (m or km)

#### Scenario: Geohash metadata shown on selection
- **WHEN** the user clicks a Geohash cell
- **THEN** all five fields (Hash, Precision, Center, Bounds, Cell size) SHALL be shown in the sidebar

#### Scenario: Geohash string is correct
- **WHEN** a Geohash cell is selected
- **THEN** the displayed hash string SHALL be the canonical Geohash encoding of any point within that cell at the active precision

---

### Requirement: H3 cell metadata is displayed
When an H3 cell is selected, the metadata panel SHALL display the following fields:
- **H3 Index**: the full H3 cell index string (e.g. `8928308280fffff`)
- **Resolution**: integer resolution level (e.g. `5`)
- **Center**: latitude and longitude of the cell center, formatted to 5 decimal places
- **Area**: approximate cell area in human-readable units (m² or km²)
- **Pentagon**: boolean indicator — "Yes ⚠" if the cell is a pentagon, "No" otherwise

#### Scenario: H3 metadata shown on selection
- **WHEN** the user clicks an H3 cell
- **THEN** all five fields (H3 Index, Resolution, Center, Area, Pentagon) SHALL be shown in the sidebar

#### Scenario: Pentagon flag shown for pentagon cells
- **WHEN** a pentagon H3 cell is selected
- **THEN** the Pentagon field SHALL display "Yes ⚠" (with a warning indicator)

#### Scenario: Pentagon flag negative for regular hexagons
- **WHEN** a regular H3 hexagonal cell is selected
- **THEN** the Pentagon field SHALL display "No"

---

### Requirement: Selection recomputes when zoom level changes precision or resolution
When a cell is selected and the user zooms in or out such that the active precision (Geohash) or resolution (H3) changes, the application SHALL recompute the selection to the cell at the new precision/resolution that contains the geographic center of the previously selected cell. The metadata panel SHALL update to reflect the new cell.

#### Scenario: Zoom out expands selection to parent cell
- **WHEN** a cell is selected and the user zooms out causing the precision/resolution to decrease
- **THEN** the cell at the new (coarser) precision/resolution that contains the center of the previous cell SHALL become selected and the metadata panel SHALL update accordingly

#### Scenario: Zoom in narrows selection to child cell
- **WHEN** a cell is selected and the user zooms in causing the precision/resolution to increase
- **THEN** the cell at the new (finer) precision/resolution that contains the center of the previous cell SHALL become selected and the metadata panel SHALL update accordingly

#### Scenario: Recomputed cell is highlighted on the map
- **WHEN** the selection recomputes due to a zoom change
- **THEN** the newly selected cell SHALL be visually highlighted on the map in the same way as a manually clicked cell

---

### Requirement: Selection recomputes when mode changes with an active selection
If the user switches index mode (Geohash ↔ H3) while a cell is selected, the application SHALL recompute the selection to the cell in the new mode that contains the geographic center of the previously selected cell. The metadata panel SHALL update to reflect the new cell.

#### Scenario: Switch from Geohash to H3 recomputes selection
- **WHEN** the user switches to H3 mode while a Geohash cell is selected
- **THEN** the H3 cell at the current resolution containing the center of the previous Geohash cell SHALL become selected and the metadata panel SHALL display H3 metadata

#### Scenario: Switch from H3 to Geohash recomputes selection
- **WHEN** the user switches to Geohash mode while an H3 cell is selected
- **THEN** the Geohash cell at the current precision containing the center of the previous H3 cell SHALL become selected and the metadata panel SHALL display Geohash metadata

#### Scenario: No selection on mode switch with no prior selection
- **WHEN** the user switches mode while no cell is selected
- **THEN** the metadata panel SHALL remain in the empty placeholder state
