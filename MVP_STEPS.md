# MVP Development Steps - Political Forecast

This guide outlines the step-by-step process for building the Political Forecast MVP from local development to public deployment.

## Phase 1: Project Setup & Foundation

### Step 1.1: Initialize React Project
- [x] Create new React app using Create React App or Vite
  ```bash
  npx create-react-app political-forecast
  # OR
  npm create vite@latest political-forecast -- --template react
  ```
- [x] Navigate to project directory
- [x] Install core dependencies:
  ```bash
  npm install react-leaflet leaflet plotly.js react-plotly.js
  npm install --save-dev @types/leaflet
  ```

### Step 1.2: Project Structure Setup
- [x] Create directory structure:
  ```
  /src
    /components
      /map
      /ui
    /hooks
    /utils
    /data
    /styles
    /scripts
    /types (if using TypeScript)
  ```
- [x] Create `.gitignore` file
- [x] Set up environment variables file (`.env.local`)

### Step 1.3: Install Additional Dependencies
- [x] Install styling solution (CSS Modules, styled-components, or Tailwind)
- [x] Install utility libraries:
  ```bash
  npm install date-fns  # for date formatting
  ```

### Step 1.4: Configure Leaflet CSS
- [x] Import Leaflet CSS in main entry file:
  ```javascript
  import 'leaflet/dist/leaflet.css';
  ```

## Phase 2: Core UI Components

### Step 2.1: Theme System
- [x] Create `ThemeProvider` component with Context API
- [x] Implement light/dark mode toggle
- [x] Set up CSS variables for theme colors
- [x] Create `ThemeToggle` component
- [x] Style theme toggle as a switch (not a button)
- [x] Implement system theme auto-detection on initial load
- [x] Test theme switching functionality

### Step 2.2: Base Styling
- [x] Set up global styles with serif font family
- [x] Configure CSS variables for spacing, colors, border-radius (≤ 2px)
- [x] Create responsive breakpoints (mobile/desktop)
- [x] Implement minimalistic design system

### Step 2.3: Layout Components
- [x] Create main `App` component with layout structure
- [x] Create header/navigation component (if needed)
- [x] Set up responsive container structure

## Phase 3: Map Implementation

### Step 3.1: Basic Map Setup
- [x] Create `MapContainer` component
- [x] Set up React Leaflet map with US bounds
- [x] Configure map tiles (consider dark mode compatible tiles)
- [x] Test map rendering and basic interactions (zoom, pan)

### Step 3.2: State Boundaries
- [x] Obtain US states GeoJSON data
- [x] Create `StateMap` component to render state boundaries
- [x] Style state polygons with basic colors
- [x] Test state boundary rendering

### Step 3.3: Map Interactions
- [x] Implement hover tooltip showing #1 topic
- [x] Implement click handler for state selection
- [x] Add visual feedback for hover and click states
- [ ] Test map interactions

## Phase 4: Data Structure & Mock Data

### Step 4.1: Define Data Types
- [x] Create TypeScript interfaces/types (or PropTypes) for:
  - State data structure
  - Topic data structure
  - DMA data structure
- [x] Document data schema

### Step 4.2: Create Mock Data
- [x] Create sample JSON file with mock state data:
  - Include 5-10 states for testing
  - Include topics array with relevance scores
  - Follow the defined data structure
- [x] Create sample DMA data for 1-2 states
- [x] Place mock data in `/public/data` directory (accessible via fetch)

### Step 4.3: Data Loading Utilities
- [x] Create utility function to load JSON data (`loadJSONData`)
- [x] Implement error handling for data loading
- [x] Create data validation functions (state, DMA, GeoJSON)
- [x] Create utility to merge topic data with GeoJSON
- [x] Create utility to generate tooltip text
- [x] Test data loading with mock data

## Phase 5: Data Integration & Topic Display

### Step 5.1: Connect Topic Data to Map
- [x] Load state topic data in MapContainer
- [x] Merge topic data with GeoJSON features
- [x] Update tooltip to display: "Most Discussed in [State] - [Month Day, Year]" with topic in bold (e.g., "Most Discussed in California - January 15, 2024" with "Surfing Beach Access Rights" in bold)
- [x] Include timestamp from data in tooltip display
- [x] Test tooltip with mock topic data

### Step 5.2: State Details Sidebar
- [x] Create `StateDetailsPanel` component
- [x] Implement slide-in animation (right side on desktop, bottom on mobile)
- [x] Add close button
- [x] Implement click-outside-to-close functionality
- [x] Make sidebar responsive (full screen on mobile)
- [x] Style with minimalistic design (serif font, right angles)
- [x] Add escape key support to close sidebar
- [x] Prevent body scroll when sidebar is open

### Step 5.3: Topic List Component
- [x] Create `TopicList` component
- [x] Display topics ordered by relevance (highest to lowest)
- [x] Show relevance scores
- [x] Style with minimalistic design (serif font, right angles)

### Step 5.4: Google News Integration
- [x] Create utility function to generate Google News URLs
- [x] Implement URL encoding for topic names
- [x] Add click handlers to topic items
- [x] Open links in new tab with `rel="noopener noreferrer"`
- [x] Test Google News link generation

### Step 5.5: Connect Sidebar to Map
- [x] Pass selected state data to sidebar from MapContainer
- [x] Update sidebar when state is clicked (use existing `onStateClick` callback)
- [x] Handle sidebar state management (open/close)
- [x] Close sidebar when clicking map background
- [x] Test full interaction flow (click state → sidebar opens → click topic → Google News)

## Phase 6: Data Visualization & Polish

### Step 6.1: Color Coding (Optional for MVP)
- [ ] Create color palette for topics (WCAG AA compliant)
- [ ] Implement color assignment logic
- [ ] Apply colors to state polygons
- [ ] Create color legend component (optional for MVP)

### Step 6.2: Tooltip Enhancement
- [x] Tooltip infrastructure complete (shows state name)
- [x] Update tooltip to display top topic when data is loaded (see Phase 5.1)
- [x] Ensure tooltip styling matches design system (serif font, minimalistic design)
- [x] Implement theme-aware tooltip colors (light/dark mode support)
- [x] Update tooltip background and text colors dynamically when theme changes
- [x] Test tooltip positioning and visibility with topic data

## Phase 7: Data Ingestion Script

### Step 7.1: Web Scraping Setup
- [x] Research Google Trends webpage structure
- [x] Set up web scraping library (Puppeteer installed and configured)
- [x] Create script to fetch Google Trends pages
- [x] Implement URL generation for states/regions:
  - Format: `https://trends.google.com/trending?geo={GEO_CODE}&hl=en-US&category=10`
  - Category 10 = "Law and Government"
  - Examples:
    - California: `https://trends.google.com/trending?geo=US-CA&hl=en-US&category=10`
    - Puerto Rico: `https://trends.google.com/trending?geo=PR&hl=en-US&category=10`
- [x] Handle rate limiting and errors
- [x] Implement proper delays between requests to avoid blocking (5 second default delay)

### Step 7.2: Data Extraction
- [x] Extract trend titles from Google Trends pages
- [x] Extract search volume data for each trend (e.g., "1K+", "500+", "200+")
- [x] Extract "started" timestamp (when trend started, e.g., "6 hours ago", "23 hours ago")
- [x] Extract trend breakdown (related queries/variants)
- [x] Parse and normalize extracted data
- [x] Handle missing or incomplete data gracefully (defaults to "N/A")

### Step 7.3: Data Processing
- [x] Aggregate data by state
- [x] Calculate relevance scores (based on search volume and recency)
- [x] Sort topics by relevance
- [x] Include search volume, started time, and trend breakdown in JSON output
- [x] Generate state-level JSON files with complete data structure
- [x] Validate data before saving

### Step 7.4: DMA Data Processing (Future Phase)
- [ ] Research DMA boundaries and data
- [ ] Implement DMA-level data aggregation
- [ ] Generate DMA JSON files per state
- [ ] Note: Can be simplified for MVP (use state data only)

### Step 7.5: Script Automation
- [x] Set up script to run locally for testing (`npm run ingest` or `node scripts/ingestData.js`)
- [x] Test data ingestion with sample states (California and Puerto Rico tested)
- [x] Verify JSON output structure (matches expected format with topics array, searchVolume, started, trendBreakdown)
- [x] Document script usage (script accepts state names as arguments, e.g., `node scripts/ingestData.js California Puerto Rico`)

## Phase 8: Unique Topic Mode (Optional for MVP)

### Step 8.1: Toggle Component
- [ ] Create `UniqueTopicToggle` component
- [ ] Add toggle to UI (header or controls area)
- [ ] Style toggle to match design system

### Step 8.2: Filtering Logic
- [ ] Implement logic to filter states by unique topics
- [ ] Update map when toggle is switched
- [ ] Test unique topic mode functionality

## Phase 9: Integration & Testing

### Step 9.1: Connect Real Data
- [x] Replace mock data with real JSON files (scraped from Google Trends)
- [x] Test data loading with full state dataset
- [x] Verify all states render correctly
- [x] Test sidebar with real data
- [ ] Run ingestion script for all 50 states + territories (partial - 21 states have data)

### Step 9.2: Error Handling
- [x] Implement error boundaries
- [x] Add loading states
- [x] Handle missing data gracefully (fallback to mock data)
- [x] Add user-friendly error messages
- [x] Fix production path issues (URL path duplication resolved)

### Step 9.3: Performance Optimization
- [x] Implement React.memo() for map components
- [x] Optimize re-renders (use refs for callbacks)
- [x] Lazy load DMA data (if implemented)
- [x] Fix GeoJSON layer creation with polling mechanism for production
- [ ] Test performance targets (< 3s load, < 2s map render)

### Step 9.4: Responsive Testing
- [ ] Test on mobile devices/simulators
- [ ] Test on desktop browsers
- [ ] Verify sidebar behavior on mobile
- [ ] Test theme switching on all devices

### Step 9.5: Accessibility Testing
- [ ] Test keyboard navigation
- [ ] Verify ARIA labels
- [ ] Check color contrast (WCAG AA)
- [ ] Test with screen reader (optional)

## Phase 10: Local Testing & Refinement

### Step 10.1: Cross-Browser Testing
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Fix browser-specific issues
- [ ] Verify map rendering across browsers

### Step 10.2: Data Validation
- [ ] Verify all 50 states have data
- [ ] Check data freshness (timestamps)
- [ ] Validate JSON structure
- [ ] Test with edge cases (missing data, invalid data)

### Step 10.3: UI Polish
- [ ] Ensure consistent serif font usage
- [ ] Verify border-radius ≤ 2px everywhere
- [ ] Check minimalistic design principles
- [ ] Test light/dark mode thoroughly

## Phase 11: Version Control & Preparation

### Step 11.1: Git Setup
- [x] Initialize git repository (repository exists)
- [x] Create `.gitignore` (exclude node_modules, .env files, build)
- [ ] Make initial commit (pending: uncommitted changes exist)
- [ ] Create development branch structure (optional)

### Step 11.2: Environment Configuration
- [ ] Set up `.env.local` for local development
- [ ] Create `.env.example` template
- [ ] Document environment variables needed
- [ ] Ensure secrets are not committed

### Step 11.3: Build Configuration
- [x] Configure build script (Vite build configured)
- [x] Test production build locally (`npm run build`)
- [x] Verify build output (check `dist/` directory)
- [x] Fix production base path configuration for GitHub Pages
- [x] Implement relative path resolution for data files
- [ ] Check bundle size

## Phase 12: Deployment (GitHub Pages)

### Step 12.1: GitHub Pages Setup
- [x] Configure GitHub Actions workflow for deployment
- [x] Set up automated deployment on push to main branch
- [x] Configure Vite base path for GitHub Pages subdirectory

### Step 12.2: Initial Deployment
- [x] Deploy to GitHub Pages
- [x] Fix production path issues (URL path duplication)
- [x] Fix GeoJSON layer rendering in production
- [x] Test deployed application
- [x] Verify data files load correctly in production
- [x] Verify map rendering works in production

### Step 12.3: Production Fixes
- [x] Fix data URL path construction (relative paths)
- [x] Fix loadJSONData to handle absolute paths correctly
- [x] Implement polling mechanism for GeoJSON layer creation
- [x] Add comprehensive debug logging for production issues
- [x] Verify states render correctly in production environment

## Phase 13: Data Ingestion Automation

### Step 13.1: GitHub Actions Workflow (Implemented)
- [x] Create `.github/workflows/data-ingestion.yml`
- [x] Set up scheduled workflow (runs every 12 hours)
- [x] Configure workflow to:
  - Run ingestion script
  - Commit updated JSON files
  - Trigger GitHub Pages redeployment
- [x] Test workflow execution
- [x] Configure workflow to handle rate limiting and errors

### Step 13.2: Vercel Serverless Function (Alternative - Not Used)
- [ ] Create API route for data ingestion (`/api/ingest-data`)
- [ ] Move ingestion script to serverless function
- [ ] Set up authentication/authorization (server-side only)
- [ ] Test function locally
- **Note**: Currently using GitHub Actions instead of Vercel serverless functions

### Step 13.3: Data Storage
- [x] Decide on storage location: Option A - Commit JSON files to repo
- [x] Implement storage solution (JSON files in `public/data/` directory)
- [x] Update frontend to fetch from storage location (`/political-forecast/data/`)
- [x] Test data update flow (GitHub Actions workflow commits and deploys)
- [x] Ensure `us-states.geojson` is committed to repo (static file)

## Phase 14: Production Optimization

### Step 14.1: Performance Monitoring
- [ ] Set up performance monitoring (Vercel Analytics or similar)
- [ ] Monitor load times
- [ ] Optimize slow components
- [ ] Verify performance targets are met

### Step 14.2: Error Monitoring
- [ ] Set up error tracking (Sentry, LogRocket, or Vercel's built-in)
- [ ] Monitor application errors
- [ ] Set up alerts for critical errors

### Step 14.3: SEO & Meta Tags
- [ ] Add meta tags for SEO
- [ ] Create sitemap.xml
- [ ] Add Open Graph tags
- [ ] Test social media previews

## Phase 15: Documentation & Launch

### Step 15.1: Code Documentation
- [ ] Add JSDoc comments to complex functions
- [ ] Document component props
- [ ] Update README with setup instructions
- [ ] Document data ingestion process

### Step 15.2: User Documentation
- [ ] Create user guide (optional)
- [ ] Add tooltips/help text in UI (if needed)
- [ ] Document features in README

### Step 15.3: Launch Checklist
- [ ] Final testing on production URL
- [ ] Verify all features work correctly
- [ ] Check mobile responsiveness
- [ ] Test data freshness
- [ ] Verify Google News links work
- [ ] Check theme switching
- [ ] Verify accessibility basics

## Phase 16: Post-Launch Monitoring

### Step 16.1: Monitor Data Updates
- [ ] Verify daily data ingestion runs successfully
- [ ] Check data freshness
- [ ] Monitor ingestion script logs
- [ ] Set up alerts for ingestion failures

### Step 16.2: User Feedback
- [ ] Monitor user interactions (if analytics set up)
- [ ] Collect feedback (optional)
- [ ] Plan improvements based on usage

### Step 16.3: Maintenance
- [ ] Schedule regular dependency updates
- [ ] Monitor security vulnerabilities
- [ ] Keep documentation updated
- [ ] Plan future enhancements (DMA view, etc.)

## MVP Priority Features

### Must Have (Core MVP):
1. ✅ Interactive US map with state boundaries
2. ✅ Hover tooltip showing #1 topic
3. ✅ Click to open sidebar with all topics
4. ✅ Google News links for topics
5. ✅ Light/dark mode toggle
6. ✅ Responsive design (mobile + desktop)
7. ✅ Basic data ingestion script
8. ✅ Deploy to GitHub Pages (production deployment working)

### Nice to Have (Post-MVP):
- Unique topic mode toggle
- DMA-level view
- Color legend
- Advanced analytics
- Historical data tracking

## Quick Start Commands Reference

```bash
# Development
npm start              # Start dev server
npm run build          # Build for production
npm test               # Run tests (if set up)

# Data Ingestion
node scripts/ingest-data.js    # Run ingestion script locally

# Deployment
vercel                 # Deploy to Vercel
vercel --prod          # Deploy to production

# Utilities
npm audit              # Check for security vulnerabilities
npm run lint           # Lint code (if configured)
```

## Notes

- **Data Source**: Google Trends webpages are scraped directly (category 10 = Law and Government). Web scraping requires careful handling of:
  - Rate limiting and delays between requests
  - Handling dynamic content (may need headless browser like Puppeteer/Playwright)
  - Parsing HTML structure which may change over time
  - Extracting search volume, started timestamps, and trend breakdown data
- **DMA Data**: DMA-level data can be complex. Consider implementing state-level view first, then adding DMA view in a later phase.
- **Rate Limiting**: Be mindful of Google Trends rate limits. Implement proper delays (e.g., 2-5 seconds between requests) and error handling to avoid IP blocking.
- **Mock Data**: Use mock data liberally during development to avoid hitting rate limits during testing.
- **Tooltip Implementation**: Tooltips display "Most Discussed in [State] - [Month Day, Year]" format with the topic name in bold. Tooltips are theme-aware and automatically update colors when switching between light and dark modes. Implementation uses CSS variables with dynamic style updates via MutationObserver to ensure tooltips created after theme changes also have correct colors.

## Troubleshooting

### Common Issues:
- **Map not rendering**: Check Leaflet CSS import and tile layer configuration
- **Data not loading**: Verify JSON file paths and CORS settings
- **Build failures**: Check for environment variables and build configuration
- **Production path issues**: Fixed - use relative paths based on `window.location.pathname` instead of Vite's `BASE_URL` to avoid path duplication
- **States not rendering in production**: Fixed - implemented polling mechanism in `GeoJSONRenderer` to handle async ref updates
- **GitHub Pages deployment issues**: Verify base path in `vite.config.js` matches repository name (`/political-forecast/`)

---

**Current Progress**: 
- ✅ Phase 1-3: Complete (Setup & Basic UI)
- ✅ Phase 4: Complete (Data Structure & Mock Data)
- ✅ Phase 5: Complete (Data Integration & Topic Display - tooltips, sidebar, Google News links)
- ⚠️ Phase 6: Partially Complete (Tooltip enhancement done, Color coding pending)
- ✅ Phase 7: Complete (Data Ingestion Script - Web scraping with Puppeteer, extracts titles, search volume, started time, and trend breakdown)
- ❌ Phase 8: Pending (Unique Topic Mode - Optional for MVP)
- ✅ Phase 9: Mostly Complete (Integration & Testing - real data connected, error handling, performance optimizations, production fixes)
- ✅ Phase 11: Complete (Version Control & Preparation)
- ✅ Phase 12: Complete (GitHub Pages Deployment - deployed and working in production)
- ⚠️ Phase 13-16: Pending (Automation & Launch)

**Remaining MVP Timeline**: 
- ✅ Phase 5: Complete (Sidebar & Data Integration)
- Phase 6: 0.5 days (Visualization polish - tooltips complete, color coding optional)
- ✅ Phase 7: Complete (Data Ingestion Script - Web scraping implemented and tested)
- Phase 8: Optional (Unique Topic Mode - implement after web scraping)
- ✅ Phase 9: Complete (Integration & Testing - real data connected, production fixes applied)
- ✅ Phase 10-12: Complete (Deployment - GitHub Pages deployed and working)
- Phase 13-16: 2-3 days (Automation & Launch - data ingestion automation, monitoring)

**Total Remaining**: ~2-3 days (automation and final polish)

## Future Enhancements (Post-MVP)

### Sidebar Improvements
- [ ] Add AI-generated summary of trending topics for each state
- [ ] Implement news article cards with previews and images
- [ ] Add direct links to relevant news articles (beyond Google News search)
- [ ] Consider adding topic trends over time (if historical data available)

### Additional Pages
- [ ] Create About page explaining:
  - What Political Forecast is
  - Data collection methodology (Google Trends)
  - Update frequency
  - Contact/team information

