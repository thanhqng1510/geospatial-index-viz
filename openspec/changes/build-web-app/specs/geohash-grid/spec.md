## ADDED Requirements

### Requirement: Geohash cells are rendered for the current viewport
When Geohash mode is active, the application SHALL render filled polygon cells for all Geohash cells that intersect the current map viewport bounding box.

#### Scenario: Cells appear on map in Geohash mode
- **WHEN** the user activates Geohash mode
- **THEN** Geohash cell polygons SHALL be visible on the map overlaying the basemap

#### Scenario: Cells update on map move
- **WHEN** the user pans the map in Geohash mode
- **THEN** cells for the new viewport SHALL be rendered and cells outside the viewport SHALL be removed

#### Scenario: No cells rendered outside Geohash mode
- **WHEN** the active mode is H3
- **THEN** no Geohash cells SHALL be rendered on the map

---

### Requirement: Geohash precision is determined automatically by zoom level
The application SHALL select Geohash precision using a fixed zoom-to-precision lookup table. The user SHALL NOT need to manually select precision.

#### Scenario: Precision 2 at low zoom
- **WHEN** the map zoom level is between 1 and 3
- **THEN** Geohash precision 2 SHALL be used

#### Scenario: Precision 3 at zoom 4–5
- **WHEN** the map zoom level is between 4 and 5
- **THEN** Geohash precision 3 SHALL be used

#### Scenario: Precision 4 at zoom 6–7
- **WHEN** the map zoom level is between 6 and 7
- **THEN** Geohash precision 4 SHALL be used

#### Scenario: Precision 5 at zoom 8–9
- **WHEN** the map zoom level is between 8 and 9
- **THEN** Geohash precision 5 SHALL be used

#### Scenario: Precision 6 at zoom 10–13
- **WHEN** the map zoom level is between 10 and 13
- **THEN** Geohash precision 6 SHALL be used

#### Scenario: Precision 7 at zoom 14 and above
- **WHEN** the map zoom level is 14 or higher
- **THEN** Geohash precision 7 SHALL be used

---

### Requirement: Precision auto-adjusts to keep rendered cell count near 1,000
The application SHALL use a best-effort strategy to keep the number of rendered Geohash cells at or below 1,000. If the zoom-driven precision would produce more than 1,000 cells in the current viewport, the application SHALL automatically reduce precision by one step at a time until the estimated cell count is ≤1,000 or the minimum precision (1) is reached. No error or prompt SHALL be shown to the user.

#### Scenario: Zoom-driven precision stays within limit
- **WHEN** the zoom-driven precision produces ≤1,000 cells in the viewport
- **THEN** the zoom-driven precision SHALL be used as-is and all cells SHALL be rendered

#### Scenario: Zoom-driven precision exceeds limit — auto-reduce
- **WHEN** the zoom-driven precision would produce >1,000 cells in the viewport
- **THEN** the application SHALL silently reduce precision by one step and re-estimate, repeating until the count is ≤1,000 or minimum precision is reached

#### Scenario: Minimum precision reached
- **WHEN** even precision 1 would produce >1,000 cells (e.g. highly zoomed-out world view)
- **THEN** precision 1 SHALL be used and the resulting cells SHALL be rendered regardless of count

---

### Requirement: Geohash cells are styled as stroke-only by default, filled when selected
Unselected Geohash cells SHALL be rendered with a visible stroke and no fill. Selected cells SHALL additionally show a semi-transparent fill.

#### Scenario: Default cell appearance
- **WHEN** a Geohash cell is rendered in its default (unselected) state
- **THEN** it SHALL have no fill and a stroke at 60% opacity

#### Scenario: Selected cell appearance
- **WHEN** a Geohash cell is selected by the user
- **THEN** it SHALL have a fill at 30% opacity and a stroke at 60% opacity, using a distinct highlight color

---

### Requirement: Geohash cells are selectable by click
The user SHALL be able to click on any rendered Geohash cell to select it. Only one cell may be selected at a time.

#### Scenario: Click selects a cell
- **WHEN** the user clicks on a rendered Geohash cell
- **THEN** that cell SHALL become the selected cell and its metadata SHALL be shown in the sidebar

#### Scenario: Clicking a new cell replaces selection
- **WHEN** the user clicks on a different Geohash cell while one is already selected
- **THEN** the previous selection SHALL be cleared and the new cell SHALL become selected

#### Scenario: Clicking the selected cell deselects it
- **WHEN** the user clicks on the currently selected Geohash cell
- **THEN** the cell SHALL be deselected and the metadata panel SHALL return to the empty placeholder

#### Scenario: Selection recomputes on precision change from zoom
- **WHEN** a Geohash cell is selected and the user zooms such that the active precision changes
- **THEN** the Geohash cell at the new precision containing the geographic center of the previously selected cell SHALL become the selected cell
