# Requirements

## Functional Requirements

### FR1: Data Collection
- **FR1.1**: The system must fetch trending topics from Google Trends RSS feed daily
- **FR1.2**: The system must collect data for all 50 U.S. states
- **FR1.3**: The system must collect data for all DMAs (Designated Market Areas) within each state
- **FR1.4**: The system must filter data by the "Law and Government" category
- **FR1.5**: The system must combine multiple topics from the "Law and Government" category for analysis
- **FR1.6**: The system must store collected data as JSON files (either in repo or cloud storage)

### FR2: State-Level Visualization
- **FR2.1**: The system must display an interactive map of the United States
- **FR2.2**: The system must show the #1 trending topic from Law and Government category for each state
- **FR2.3**: The system must color-code or label each state by its trending topic
- **FR2.4**: The system must update state-level data daily
- **FR2.5**: On mouseover, the system must display the #1 trending Law and Government topic for that state in a tooltip
- **FR2.6**: On click, the system must open a right-hand sidebar panel showing all Law and Government trends for that state
- **FR2.7**: Topics in the sidebar must be ordered by relevance (highest to lowest)
- **FR2.8**: Each topic in the sidebar must be clickable and link to Google News search results for that topic

### FR3: Unique Topic Mode
- **FR3.1**: The system must provide a toggle to enable/disable unique topic mode
- **FR3.2**: When enabled, the map must show only states with unique top topics
- **FR3.3**: When enabled, the system must minimize redundancy across neighboring states

### FR4: DMA-Level Visualization
- **FR4.1**: Users must be able to click on any state to zoom in
- **FR4.2**: When zoomed in, the system must display DMA-level data for the selected state
- **FR4.3**: The system must show the top trending topics from Law and Government category for each DMA
- **FR4.4**: Users must be able to navigate back to the state-level view

### FR5: Data Updates
- **FR5.1**: The system must update data at least once per day
- **FR5.2**: The system must automatically redeploy after data updates
- **FR5.3**: The system must handle data update failures gracefully

## Technical Requirements

### TR1: Frontend
- **TR1.1**: The application must be built using React
- **TR1.2**: The application must use React Leaflet for map rendering
- **TR1.3**: The application must use Plotly.js for data visualization and charting
- **TR1.4**: The application must be responsive and work on desktop and mobile devices
- **TR1.5**: The application must implement a slide-in sidebar component for state details
- **TR1.6**: The application must generate Google News search URLs for topic links

### TR2: Data Processing
- **TR2.1**: The system must include an RSS feed ingestion script
- **TR2.2**: The script must parse Google Trends RSS feed data
- **TR2.3**: The script must aggregate data by state and DMA
- **TR2.4**: The script must generate JSON files in a structured format

### TR3: Deployment
- **TR3.1**: The application must be deployed on Vercel
- **TR3.2**: The deployment must support automatic updates
- **TR3.3**: The system must use Vercel Cron Jobs or GitHub Actions for scheduled data updates

### TR4: Data Storage
- **TR4.1**: Data must be stored as static JSON files
- **TR4.2**: JSON files must be accessible to the frontend application
- **TR4.3**: Data structure must support both state-level and DMA-level queries

## Performance Requirements

### PR1: Load Time
- **PR1.1**: The initial page load must complete within 3 seconds
- **PR1.2**: Map rendering must complete within 2 seconds after data load
- **PR1.3**: State-to-DMA transition must complete within 1 second

### PR2: Data Size
- **PR2.1**: State-level JSON file must be optimized for fast loading (< 500KB)
- **PR2.2**: DMA-level JSON files must be optimized per state (< 200KB per state)

## User Experience Requirements

### UX1: Map Interaction
- **UX1.1**: Map must be zoomable and pannable
- **UX1.2**: States must be clearly clickable with visual feedback
- **UX1.3**: On hover, tooltip must display the #1 trending Law and Government topic for that state
- **UX1.4**: On click, right-hand sidebar must slide in showing all Law and Government trends for the selected state
- **UX1.5**: Sidebar must be dismissible (close button or click outside)
- **UX1.6**: Sidebar must be responsive and adapt to mobile/desktop layouts

### UX2: Navigation
- **UX2.1**: Users must be able to easily toggle between unique topic mode
- **UX2.2**: Users must be able to navigate back from DMA view to state view
- **UX2.3**: The interface must clearly indicate the current view level (state vs DMA)
- **UX2.4**: Topic links in sidebar must open Google News in a new tab/window
- **UX2.5**: Google News links must use proper search query format for the topic

### UX3: Visual Design
- **UX3.1**: The UI must be minimalistic with clean, uncluttered layouts
- **UX3.2**: Color coding must be distinct and accessible (WCAG AA compliant)
- **UX3.3**: Topic labels must be readable and not overlap excessively
- **UX3.4**: The UI must be intuitive and require minimal explanation
- **UX3.5**: The application must support both light mode and dark mode with a user-toggleable theme switcher. The theme switcher must be styled as a toggle switch (not a button), and the application must auto-detect the user's system theme preference on initial load
- **UX3.5.1**: The theme toggle switch must display monochrome line art icons (sun for light mode, moon with stars for dark mode) inside a circular knob
- **UX3.5.2**: The toggle switch must be icon-only (no text labels) for a minimalistic design
- **UX3.5.3**: The toggle switch must have smooth animations (0.3s ease transitions) when switching between themes
- **UX3.5.4**: The toggle switch must persist user's theme preference in localStorage, overriding system preference after first manual toggle
- **UX3.5.5**: The toggle switch must be responsive: compact size on desktop (60px × 32px), slightly smaller on mobile (52px × 28px)
- **UX3.5.6**: The toggle switch must be accessible with proper ARIA labels and keyboard navigation support
- **UX3.5.7**: The toggle switch track and knob must use theme-aware colors that adapt to the current theme
- **UX3.5.8**: The toggle switch must provide visual feedback on hover and active states
- **UX3.6**: The application must be fully responsive, optimized for both mobile and web (desktop) modes
- **UX3.7**: UI elements must use right angles with minimal corner rounding (border-radius ≤ 2px)
- **UX3.8**: The application must use a serif font family for all text elements

## Data Requirements

### DR1: Data Format
- **DR1.1**: State data must include: state name, top topic, topic category, timestamp, and an array of all topics with relevance scores
- **DR1.2**: Each topic in the state data array must include: topic name, relevance score, and category
- **DR1.3**: Topics must be sortable by relevance score (highest to lowest)
- **DR1.4**: DMA data must include: DMA name, state, top topic, topic category, timestamp
- **DR1.5**: All timestamps must be in ISO 8601 format

### DR2: Data Quality
- **DR2.1**: Data must be validated before storage
- **DR2.2**: Missing or invalid data must be handled gracefully
- **DR2.3**: Historical data must be preserved (optional: for future analytics)

## Security Requirements

### SR1: Access Control
- **SR1.1**: Public users must never have access to admin functions (data ingestion, deployment triggers)
- **SR1.2**: Admin functions must be restricted to server-side scripts and automated processes only
- **SR1.3**: No authentication or login features are required - the application is publicly accessible
- **SR1.4**: Admin endpoints (if any) must not be exposed to public users and must be protected by server-side access controls

### SR2: User Input Security
- **SR2.1**: The only user input is clicking on states - no text input, forms, or user-generated content
- **SR2.2**: State click events must be validated to ensure they correspond to valid state identifiers
- **SR2.3**: Invalid state selections must be handled gracefully without exposing system internals
- **SR2.4**: URL parameters (if used for state selection) must be sanitized and validated

### SR3: Data Protection
- **SR3.1**: No sensitive user data should be collected or stored
- **SR3.2**: All data in transit must be encrypted using HTTPS/TLS
- **SR3.3**: Environment variables must be used for sensitive configuration (API keys, secrets) in data ingestion scripts
- **SR3.4**: Secrets and API keys must never be committed to version control or exposed to the frontend

### SR4: External Data & Links
- **SR4.1**: RSS feed access must handle rate limiting appropriately
- **SR4.2**: External data sources (Google Trends RSS) must be validated before parsing and storage
- **SR4.3**: JSON data must be validated against schema before rendering to prevent injection attacks
- **SR4.4**: Google News links must open in new tabs with `rel="noopener noreferrer"` for security
- **SR4.5**: External links must be properly URL-encoded to prevent XSS attacks

### SR5: Content Security
- **SR5.1**: Content Security Policy (CSP) headers should be implemented to prevent XSS attacks
- **SR5.2**: Secure HTTP headers should be set (X-Frame-Options, X-Content-Type-Options)
- **SR5.3**: Third-party scripts (React Leaflet, Plotly.js) must be from trusted CDN sources or bundled locally

### SR6: Dependency Security
- **SR6.1**: Dependencies must be regularly updated to patch security vulnerabilities
- **SR6.2**: Automated dependency scanning should be implemented (e.g., npm audit, Dependabot)
- **SR6.3**: Only trusted package registries must be used

## Maintenance Requirements

### MR1: Monitoring
- **MR1.1**: Data ingestion failures must be logged
- **MR1.2**: Deployment status must be monitored
- **MR1.3**: Application errors must be tracked

### MR2: Documentation
- **MR2.1**: Code must be well-documented
- **MR2.2**: Data schema must be documented
- **MR2.3**: Deployment process must be documented

