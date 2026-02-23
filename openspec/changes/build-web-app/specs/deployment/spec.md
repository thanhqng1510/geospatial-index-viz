## ADDED Requirements

### Requirement: Application builds to a static file bundle
The application SHALL be buildable to a self-contained set of static files (HTML, CSS, JS, assets) using `npm run build`. The output SHALL be servable by any static HTTP server.

#### Scenario: Build produces static output
- **WHEN** `npm run build` is executed in the project root
- **THEN** a `dist/` directory SHALL be produced containing all assets required to run the application

#### Scenario: Static files are self-contained
- **WHEN** the contents of `dist/` are served by a plain HTTP server
- **THEN** the application SHALL load and function correctly with no server-side logic required

---

### Requirement: A Dockerfile is provided for containerized deployment
The repository SHALL include a `Dockerfile` at the project root that builds and packages the application as a container image using a multi-stage build.

#### Scenario: Docker image builds successfully
- **WHEN** `docker build -t geospatial-index-viz .` is executed
- **THEN** the build SHALL complete without errors and produce a runnable image

#### Scenario: Build stage uses Node
- **WHEN** the Docker build runs
- **THEN** Stage 1 SHALL use a Node.js base image to install dependencies and run `npm run build`

#### Scenario: Serve stage uses nginx:alpine
- **WHEN** the Docker build runs
- **THEN** Stage 2 SHALL use `nginx:alpine` and copy only the `dist/` output from Stage 1

#### Scenario: Final image contains no Node.js runtime
- **WHEN** the final Docker image is inspected
- **THEN** it SHALL NOT include Node.js or npm, only nginx and the static assets

---

### Requirement: The container serves the application on port 80
The nginx server in the Docker container SHALL listen on port 80 and serve the application's static files.

#### Scenario: Application accessible on port 80
- **WHEN** the container is run with `docker run -p 8080:80 geospatial-index-viz`
- **THEN** the application SHALL be accessible at `http://localhost:8080`

---

### Requirement: An nginx configuration file is included
The repository SHALL include an `nginx.conf` file that configures nginx to serve the static application with gzip compression enabled.

#### Scenario: nginx serves static files
- **WHEN** a request is made for any application asset
- **THEN** nginx SHALL serve the corresponding file from the static bundle

#### Scenario: Gzip compression enabled
- **WHEN** a client requests assets with `Accept-Encoding: gzip`
- **THEN** nginx SHALL respond with gzip-compressed content

---

### Requirement: Self-hosted deployment requires no external services
The deployed application SHALL function without any external API keys, external services, or network connectivity beyond the tile server in Streets mode.

#### Scenario: Application loads without API keys
- **WHEN** the application is served with no environment variables or API keys configured
- **THEN** all features SHALL function correctly

#### Scenario: Minimal mode works fully offline
- **WHEN** the application is deployed on a network with no external internet access and Minimal mode is used
- **THEN** the map SHALL render using the bundled country borders GeoJSON without any external network requests
