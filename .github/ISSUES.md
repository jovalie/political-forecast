# GitHub Issues to Create

## Issue 1: Fix Mobile Touch Responsiveness for State Selection
**Priority**: High  
**Labels**: `bug`, `mobile`, `touch-events`

### Description
States are unresponsive to touch on mobile devices, especially at default zoom level. Users need to tap multiple times or zoom in before states become clickable.

### Root Cause
- Touch handlers not consistently attached to all state paths
- `fitBounds` call interfering with touch event handling
- Touch detection thresholds too strict
- Coordinate conversion issues for touch events

### Solution
- Disable `fitBounds` on mobile (interferes with touch events)
- Increase touch detection thresholds (30px movement, 800ms duration)
- Add retry logic to ensure touch handlers attach to all states
- Use state center bounds instead of touch coordinate conversion
- Let Leaflet handle touch events naturally (remove touch-action overrides)

### Files Changed
- `src/components/map/StateMap.jsx` - Touch handler attachment and detection
- `src/components/map/MapContainer.jsx` - Disabled fitBounds on mobile

### Testing
- [ ] Test on iPhone (various models)
- [ ] Test on Android devices
- [ ] Verify all states are clickable at default zoom
- [ ] Verify states work after zooming/panning
- [ ] Verify visual feedback ("Tapped: [State Name]") appears

### Related Commits
- `16a117b` - Disable fitBounds on mobile to fix touch responsiveness
- `9d8fa0f` - Increase touch threshold to 30px/800ms
- `44db5b6` - Add cache-busting and improve touch sensitivity
- `bf786c6` - Improve touch sensitivity and add multiple retries
- `c1e1ef6` - Ensure touch handlers attached to all states with retry logic
- `b5eac8c` - Fix coordinate conversion for mobile state clicks
- `0c082e0` - Add visual feedback for mobile tap detection
- `825a270` - Fix mobile touch to click conversion with proper Leaflet events

---

## Issue 2: Add Cache-Busting for Data Files
**Priority**: Medium  
**Labels**: `enhancement`, `caching`, `data-loading`

### Description
App loads stale cached data instead of fresh data from server. Users see old trending topics even after data has been updated.

### Solution
- Add cache-busting query parameters (`_t=timestamp`) to all data requests
- Add cache-control headers to fetch requests
- Ensure fresh data is always loaded

### Files Changed
- `src/utils/dataUtils.js` - Added cache-busting to `loadJSONData` function

### Testing
- [ ] Verify data files load with cache-busting parameters
- [ ] Verify fresh data is loaded on page refresh
- [ ] Test with browser cache enabled
- [ ] Test with browser cache disabled

### Related Commits
- `44db5b6` - Add cache-busting and improve touch sensitivity

---

## Issue 3: Mobile UI Bug Fixes (Map Cutoff, Theme Toggle)
**Priority**: High  
**Labels**: `bug`, `mobile`, `ui`

### Description
Multiple mobile UI issues:
1. Map cutoff on initial launch
2. Theme toggle disappears after zooming
3. Theme toggle disappears after selecting state

### Solution
- Fixed map size calculation on mount and resize
- Made header sticky on mobile
- Added proper z-index hierarchy
- Added map size recalculation when sidebar opens/closes

### Files Changed
- `src/components/map/MapContainer.jsx` - Resize handlers and map reference
- `src/components/map/MapContainer.css` - Mobile viewport fixes
- `src/styles/App.css` - Sticky header and spacing
- `src/components/ui/ThemeToggle.css` - Z-index fixes

### Testing
- [ ] Test on various mobile devices
- [ ] Verify map is properly centered on initial load
- [ ] Verify theme toggle stays visible after zoom
- [ ] Verify theme toggle stays visible after state selection

### Related Documentation
- See `MOBILE_BUG_FIXES.md` for detailed information

---

## Issue 4: Dark Theme Color Improvements
**Priority**: Low  
**Labels**: `enhancement`, `ui`, `dark-mode`

### Description
Improve dark theme colors for better visibility and contrast.

### Solution
- Inverted dark theme logic (more topics = brighter gray)
- Improved contrast between state groups
- Updated border colors for better visibility

### Files Changed
- `src/utils/dataUtils.js` - Updated `getColorByTopicCount` function
- `src/components/map/StateMap.jsx` - Updated border colors

### Testing
- [ ] Verify contrast ratios meet WCAG AA standards
- [ ] Test on different screens/devices
- [ ] Verify state groups are clearly distinguishable

### Related PRs
- PR #6: Improve Dark Theme Colors (from friend's repository)

---

## Issue 5: Fix Started Timestamp to be Relative to Current Time
**Priority**: Low  
**Labels**: `bug`, `data-display`

### Description
"Started" timestamps show time relative to when data was scraped, not relative to current time.

### Solution
- Convert "started" timestamps from scrape time to current time
- Parse relative time strings and recalculate

### Files Changed
- `src/utils/dataUtils.js` - Added `convertStartedToCurrentTime` function

### Testing
- [ ] Verify timestamps update correctly
- [ ] Test with various time formats
- [ ] Test with old data

### Related PRs
- PR #7: Fix Started Timestamp (from friend's repository)

