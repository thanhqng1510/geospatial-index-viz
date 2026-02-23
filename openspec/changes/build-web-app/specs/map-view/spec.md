## ADDED Requirements

### Requirement: World map renders on load
The application SHALL display a full-screen interactive world map on initial load, centered at latitude 0°, longitude 0° with a zoom level showing the entire globe.

#### Scenario: Initial map render
- **WHEN** the user opens the application
- **THEN** a world map is displayed centered at 0°N 0°E at global zoom

#### Scenario: Map fills available canvas
- **WHEN** the application layout is rendered
- **THEN** the map canvas SHALL occupy all space to the right of the left panel and below the header, with no blank areas

---

### Requirement: Map supports pan and zoom interaction
The map SHALL allow the user to pan (click-drag) and zoom (scroll wheel, pinch, or double-click) freely across the globe.

#### Scenario: Pan interaction
- **WHEN** the user clicks and drags on the map
- **THEN** the map viewport moves in the direction of the drag

#### Scenario: Zoom in via scroll
- **WHEN** the user scrolls up on the map
- **THEN** the map zoom level increases and the view magnifies around the cursor position

#### Scenario: Zoom out via scroll
- **WHEN** the user scrolls down on the map
- **THEN** the map zoom level decreases and the view zooms out

---

### Requirement: Map viewport state is accessible to grid layers
The map SHALL expose its current bounding box (west, south, east, north) and zoom level to the geospatial grid rendering layers whenever the viewport changes.

#### Scenario: Viewport change triggers grid recompute
- **WHEN** the user pans or zooms the map
- **THEN** the active grid layer SHALL receive updated viewport bounds and recompute visible cells

#### Scenario: Zoom level exposed to precision mapping
- **WHEN** the map zoom level changes
- **THEN** the current zoom level SHALL be available for the zoom-to-precision/resolution lookup

---

### Requirement: Deck.gl overlay is synchronized with the map viewport
A Deck.gl WebGL canvas SHALL be rendered on top of the MapLibre GL map, sharing the same viewport (center, zoom, pitch, bearing) at all times.

#### Scenario: Overlay alignment on pan
- **WHEN** the map is panned
- **THEN** the Deck.gl overlay SHALL move in exact synchrony so cells remain aligned with the basemap

#### Scenario: Overlay alignment on zoom
- **WHEN** the map is zoomed
- **THEN** the Deck.gl overlay SHALL scale in exact synchrony with the basemap
