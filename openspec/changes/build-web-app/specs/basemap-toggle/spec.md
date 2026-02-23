## ADDED Requirements

### Requirement: Two basemap modes are available: Streets and Minimal
The application SHALL provide a toggle control in the header to switch between two basemap modes: **Streets** and **Minimal**. Streets SHALL be the default mode on load.

#### Scenario: Streets mode is default
- **WHEN** the application first loads
- **THEN** the Streets basemap SHALL be active

#### Scenario: Toggle switches to Minimal
- **WHEN** the user clicks the Minimal option in the basemap toggle
- **THEN** the basemap SHALL switch to Minimal mode

#### Scenario: Toggle switches back to Streets
- **WHEN** the user clicks the Streets option while Minimal is active
- **THEN** the basemap SHALL switch to Streets mode

---

### Requirement: Streets mode uses OpenFreeMap liberty tile style
In Streets mode, the map basemap SHALL be rendered using the MapLibre GL style at `https://tiles.openfreemap.org/styles/liberty`. No API key is required.

#### Scenario: Streets tile layer loads
- **WHEN** Streets mode is active
- **THEN** the map SHALL display the OpenFreeMap liberty style with streets, labels, and geographic features

---

### Requirement: Minimal mode uses a plain canvas with country borders
In Minimal mode, the tile layer SHALL be removed and replaced with:
- A plain background color (`#f0ede8` for light)
- Country border polygons rendered as stroke-only (no fill) using a Natural Earth countries GeoJSON layer

The Natural Earth GeoJSON SHALL be lazy-loaded the first time Minimal mode is activated.

#### Scenario: Minimal mode renders plain background
- **WHEN** the user switches to Minimal mode
- **THEN** the tile-based map layer SHALL be hidden and the background SHALL be a plain color

#### Scenario: Country borders visible in Minimal mode
- **WHEN** Minimal mode is active
- **THEN** country outlines SHALL be rendered as strokes on the plain background

#### Scenario: Country borders GeoJSON lazy-loaded
- **WHEN** the user activates Minimal mode for the first time in a session
- **THEN** the country borders GeoJSON SHALL be fetched and cached; subsequent switches to Minimal SHALL use the cached data

#### Scenario: Geospatial cells are visible against minimal background
- **WHEN** Minimal mode is active and cells are rendered
- **THEN** cell fill and stroke colors SHALL provide sufficient contrast against the plain background

---

### Requirement: Basemap switch does not affect active cell selection or viewport
Switching basemap mode SHALL preserve the current map viewport (center and zoom), active index mode, and any selected cell.

#### Scenario: Selection preserved on basemap switch
- **WHEN** the user switches basemap mode while a cell is selected
- **THEN** the selected cell SHALL remain selected and metadata SHALL remain visible

#### Scenario: Viewport preserved on basemap switch
- **WHEN** the user switches basemap mode
- **THEN** the map center and zoom level SHALL remain unchanged
