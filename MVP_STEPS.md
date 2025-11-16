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

## Phase 7: Unique Topic Mode (Optional for MVP)

### Step 7.1: Toggle Component
- [ ] Create `UniqueTopicToggle` component
- [ ] Add toggle to UI (header or controls area)
- [ ] Style toggle to match design system

### Step 7.2: Filtering Logic
- [ ] Implement logic to filter states by unique topics
- [ ] Update map when toggle is switched
- [ ] Test unique topic mode functionality

## Phase 8: Data Ingestion Script

### Step 8.1: RSS Feed Parser
- [ ] Research Google Trends RSS feed structure
- [ ] Create script to fetch RSS feed data
- [ ] Implement RSS parsing logic
- [ ] Filter for "Law and Government" category
- [ ] Handle rate limiting and errors

### Step 8.2: Data Processing
- [ ] Aggregate data by state
- [ ] Calculate relevance scores
- [ ] Sort topics by relevance
- [ ] Generate state-level JSON files
- [ ] Validate data before saving

### Step 8.3: DMA Data Processing (Future Phase)
- [ ] Research DMA boundaries and data
- [ ] Implement DMA-level data aggregation
- [ ] Generate DMA JSON files per state
- [ ] Note: Can be simplified for MVP (use state data only)

### Step 8.4: Script Automation
- [ ] Set up script to run locally for testing
- [ ] Test data ingestion with sample states
- [ ] Verify JSON output structure
- [ ] Document script usage

## Phase 9: Integration & Testing

### Step 9.1: Connect Real Data
- [ ] Replace mock data with real JSON files
- [ ] Test data loading with full state dataset
- [ ] ] Verify all states render correctly
- [ ] Test sidebar with real data

### Step 9.2: Error Handling
- [ ] Implement error boundaries
- [ ] Add loading states
- [ ] Handle missing data gracefully
- [ ] Add user-friendly error messages

### Step 9.3: Performance Optimization
- [ ] Implement React.memo() for map components
- [ ] Optimize re-renders
- [ ] Lazy load DMA data (if implemented)
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
- [ ] Test production build locally (`npm run build`)
- [ ] Verify build output (check `dist/` directory)
- [ ] Check bundle size

## Phase 12: Vercel Deployment

### Step 12.1: Vercel Account Setup
- [ ] Create Vercel account (if needed)
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login to Vercel: `vercel login`

### Step 12.2: Initial Deployment
- [ ] Connect GitHub repository to Vercel (or use CLI)
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Output directory: `build` (CRA) or `dist` (Vite)
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy to preview/production
- [ ] Test deployed application

### Step 12.3: Custom Domain (Optional)
- [ ] Configure custom domain in Vercel
- [ ] Set up DNS records
- [ ] Enable HTTPS (automatic with Vercel)

## Phase 13: Data Ingestion Automation

### Step 13.1: Vercel Serverless Function
- [ ] Create API route for data ingestion (`/api/ingest-data`)
- [ ] Move ingestion script to serverless function
- [ ] Set up authentication/authorization (server-side only)
- [ ] Test function locally

### Step 13.2: Vercel Cron Job
- [ ] Create `vercel.json` with cron configuration:
  ```json
  {
    "crons": [{
      "path": "/api/ingest-data",
      "schedule": "0 0 * * *"
    }]
  }
  ```
- [ ] Configure cron to run daily
- [ ] Test cron job execution

### Step 13.3: GitHub Actions Alternative (Optional)
- [ ] Create `.github/workflows/data-ingestion.yml`
- [ ] Set up scheduled workflow (daily)
- [ ] Configure workflow to:
  - Run ingestion script
  - Commit updated JSON files
  - Trigger Vercel redeployment
- [ ] Test workflow execution

### Step 13.4: Data Storage
- [ ] Decide on storage location:
  - Option A: Commit JSON files to repo
  - Option B: Use cloud storage (S3, Vercel Blob)
- [ ] Implement storage solution
- [ ] Update frontend to fetch from storage location
- [ ] Test data update flow

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
8. ✅ Deploy to Vercel

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

- **Data Source**: Google Trends RSS feed may have limitations. Consider alternative data sources or APIs if RSS feed doesn't provide sufficient data.
- **DMA Data**: DMA-level data can be complex. Consider implementing state-level view first, then adding DMA view in a later phase.
- **Rate Limiting**: Be mindful of Google Trends rate limits. Implement proper delays and error handling.
- **Mock Data**: Use mock data liberally during development to avoid hitting rate limits during testing.
- **Tooltip Implementation**: Tooltips display "Most Discussed in [State] - [Month Day, Year]" format with the topic name in bold. Tooltips are theme-aware and automatically update colors when switching between light and dark modes. Implementation uses CSS variables with dynamic style updates via MutationObserver to ensure tooltips created after theme changes also have correct colors.

## Troubleshooting

### Common Issues:
- **Map not rendering**: Check Leaflet CSS import and tile layer configuration
- **Data not loading**: Verify JSON file paths and CORS settings
- **Build failures**: Check for environment variables and build configuration
- **Vercel deployment issues**: Verify build command and output directory settings

---

**Current Progress**: 
- ✅ Phase 1-3: Complete (Setup & Basic UI)
- ✅ Phase 4: Complete (Data Structure & Mock Data)
- ✅ Phase 5: Complete (Data Integration & Topic Display - tooltips, sidebar, Google News links)
- ⚠️ Phase 6: Partially Complete (Tooltip enhancement done, Color coding pending)
- ❌ Phase 7-8: Pending
- ❌ Phase 9-16: Pending

**Remaining MVP Timeline**: 
- ✅ Phase 5: Complete (Sidebar & Data Integration)
- Phase 6: 0.5 days (Visualization polish - tooltips complete, color coding optional)
- Phase 8: 2-3 days (Data Ingestion Script)
- Phase 9: 1 day (Integration & Testing)
- Phase 10-12: 1-2 days (Deployment)
- Phase 13-16: 2-3 days (Automation & Launch)

**Total Remaining**: ~1-1.5 weeks (depending on experience and time availability)

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

