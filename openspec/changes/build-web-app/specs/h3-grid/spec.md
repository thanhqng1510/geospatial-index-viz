## ADDED Requirements

### Requirement: H3 cells are rendered for the current viewport
When H3 mode is active, the application SHALL render filled hexagonal polygon cells for all H3 cells that intersect the current map viewport bounding box.

#### Scenario: Cells appear on map in H3 mode
- **WHEN** the user activates H3 mode
- **THEN** H3 cell polygons SHALL be visible on the map overlaying the basemap

#### Scenario: Cells update on map move
- **WHEN** the user pans the map in H3 mode
- **THEN** cells for the new viewport SHALL be rendered and cells outside the viewport SHALL be removed

#### Scenario: No cells rendered outside H3 mode
- **WHEN** the active mode is Geohash
- **THEN** no H3 cells SHALL be rendered on the map

---

### Requirement: H3 resolution is determined automatically by zoom level
The application SHALL select H3 resolution using a fixed zoom-to-resolution lookup table. The user SHALL NOT need to manually select resolution.

#### Scenario: Resolution 1 at low zoom
- **WHEN** the map zoom level is between 1 and 3
- **THEN** H3 resolution 1 SHALL be used

#### Scenario: Resolution 2 at zoom 4–5
- **WHEN** the map zoom level is between 4 and 5
- **THEN** H3 resolution 2 SHALL be used

#### Scenario: Resolution 3 at zoom 6–7
- **WHEN** the map zoom level is between 6 and 7
- **THEN** H3 resolution 3 SHALL be used

#### Scenario: Resolution 4 at zoom 8–9
- **WHEN** the map zoom level is between 8 and 9
- **THEN** H3 resolution 4 SHALL be used

#### Scenario: Resolution 5 at zoom 10–11
- **WHEN** the map zoom level is between 10 and 11
- **THEN** H3 resolution 5 SHALL be used

#### Scenario: Resolution 6 at zoom 12–13
- **WHEN** the map zoom level is between 12 and 13
- **THEN** H3 resolution 6 SHALL be used

#### Scenario: Resolution 7 at zoom 14 and above
- **WHEN** the map zoom level is 14 or higher
- **THEN** H3 resolution 7 SHALL be used

---

### Requirement: Resolution auto-adjusts to keep rendered cell count near 1,000
The application SHALL use a best-effort strategy to keep the number of rendered H3 cells at or below 1,000. If the zoom-driven resolution would produce more than 1,000 cells in the current viewport, the application SHALL automatically reduce resolution by one step at a time until the estimated cell count is ≤1,000 or the minimum resolution (0) is reached. No error or prompt SHALL be shown to the user.

#### Scenario: Zoom-driven resolution stays within limit
- **WHEN** the zoom-driven resolution produces ≤1,000 cells in the viewport
- **THEN** the zoom-driven resolution SHALL be used as-is and all cells SHALL be rendered

#### Scenario: Zoom-driven resolution exceeds limit — auto-reduce
- **WHEN** the zoom-driven resolution would produce >1,000 cells in the viewport
- **THEN** the application SHALL silently reduce resolution by one step and re-estimate, repeating until the count is ≤1,000 or minimum resolution is reached

#### Scenario: Minimum resolution reached
- **WHEN** even resolution 0 would produce >1,000 cells
- **THEN** resolution 0 SHALL be used and the resulting cells SHALL be rendered regardless of count

---

### Requirement: H3 cells are styled as stroke-only by default, filled when selected
Unselected H3 cells SHALL be rendered with a visible stroke and no fill. Selected cells SHALL additionally show a semi-transparent fill.

#### Scenario: Default cell appearance
- **WHEN** an H3 cell is rendered in its default (unselected) state
- **THEN** it SHALL have no fill and a stroke at 60% opacity

#### Scenario: Selected cell appearance
- **WHEN** an H3 cell is selected by the user
- **THEN** it SHALL have a fill at 30% opacity and a stroke at 60% opacity, using a distinct highlight color

---

### Requirement: H3 cells are selectable by click
The user SHALL be able to click on any rendered H3 cell to select it. Only one cell may be selected at a time.

#### Scenario: Click selects a cell
- **WHEN** the user clicks on a rendered H3 cell
- **THEN** that cell SHALL become the selected cell and its metadata SHALL be shown in the sidebar

#### Scenario: Clicking a new cell replaces selection
- **WHEN** the user clicks on a different H3 cell while one is already selected
- **THEN** the previous selection SHALL be cleared and the new cell SHALL become selected

#### Scenario: Clicking the selected cell deselects it
- **WHEN** the user clicks on the currently selected H3 cell
- **THEN** the cell SHALL be deselected and the metadata panel SHALL return to the empty placeholder

#### Scenario: Selection recomputes on resolution change from zoom
- **WHEN** an H3 cell is selected and the user zooms such that the active resolution changes
- **THEN** the H3 cell at the new resolution containing the geographic center of the previously selected cell SHALL become the selected cell
- **WHEN** an H3 cell is selected and the user zooms such that the active resolution changes
- **THEN** the H3 cell at the new resolution containing the geographic center of the previously selected cell SHALL become the selected cell

---

### Requirement: Pentagon cells are rendered correctly
H3 pentagon cells (12 per resolution level) SHALL be rendered as 5-sided polygons and treated identically to hexagons for selection and metadata purposes.

#### Scenario: Pentagon renders as 5-sided polygon
- **WHEN** a pentagon H3 cell is within the viewport
- **THEN** it SHALL be rendered as a 5-vertex polygon, visually distinct in shape from hexagons
