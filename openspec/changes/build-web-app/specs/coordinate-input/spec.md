## ADDED Requirements

### Requirement: User can enter latitude and longitude to locate a cell
The left panel SHALL contain a coordinate input form with two numeric fields (latitude and longitude) and a submit action. Submitting the form SHALL pan and zoom the map to the cell containing the entered coordinate, select that cell, and populate the metadata panel.

#### Scenario: Submit via Enter key
- **WHEN** the user fills in both lat and lng fields and presses Enter in either field
- **THEN** the form SHALL submit

#### Scenario: Submit via Go button
- **WHEN** the user fills in both lat and lng fields and clicks the submit button
- **THEN** the form SHALL submit

#### Scenario: Successful coordinate lookup
- **WHEN** a valid lat/lng is submitted
- **THEN** the map SHALL pan and zoom to center on the cell containing that coordinate, the cell SHALL be selected, and its metadata SHALL appear in the sidebar

---

### Requirement: Coordinate input accepts valid lat/lng ranges only
The latitude field SHALL accept values in the range −90 to 90 inclusive. The longitude field SHALL accept values in the range −180 to 180 inclusive. Submission with out-of-range values SHALL be prevented.

#### Scenario: Valid latitude accepted
- **WHEN** the user enters a latitude between −90 and 90
- **THEN** the value SHALL be accepted and the form may be submitted

#### Scenario: Invalid latitude rejected
- **WHEN** the user enters a latitude outside −90 to 90
- **THEN** the form SHALL NOT submit and an inline validation error SHALL be displayed

#### Scenario: Valid longitude accepted
- **WHEN** the user enters a longitude between −180 and 180
- **THEN** the value SHALL be accepted and the form may be submitted

#### Scenario: Invalid longitude rejected
- **WHEN** the user enters a longitude outside −180 to 180
- **THEN** the form SHALL NOT submit and an inline validation error SHALL be displayed

---

### Requirement: Coordinate lookup respects the active index mode
The cell identified by the coordinate lookup SHALL be computed using the currently active index mode (Geohash or H3) at the current zoom-driven precision/resolution.

#### Scenario: Geohash mode lookup
- **WHEN** Geohash mode is active and a coordinate is submitted
- **THEN** the Geohash cell containing that coordinate at the current precision SHALL be selected

#### Scenario: H3 mode lookup
- **WHEN** H3 mode is active and a coordinate is submitted
- **THEN** the H3 cell containing that coordinate at the current resolution SHALL be selected

---

### Requirement: Coordinate input fields are clearable
The user SHALL be able to clear the coordinate input fields. Clearing both fields SHALL reset the form to its initial state without affecting the current map viewport or selection.

#### Scenario: Fields cleared
- **WHEN** the user clears both lat and lng fields
- **THEN** the form SHALL show empty inputs and no validation errors

#### Scenario: Partial input does not auto-submit
- **WHEN** only one of the two fields contains a value
- **THEN** the form SHALL NOT submit and no map navigation SHALL occur
