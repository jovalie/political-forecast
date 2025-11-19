# Pull Request Review

## PR 1: Fix Started Timestamp to be Relative to Current Time

### Summary
This PR fixes the "Started" time display to be relative to the current time instead of when the data was scraped.

### Changes
- **File**: `src/utils/dataUtils.js`
  - Added `parseRelativeTime()` function to parse relative time strings (e.g., "9h ago")
  - Added `formatRelativeTime()` function to format durations as relative time
  - Added `convertStartedToCurrentTime()` function that:
    1. Parses the "started" time from the data
    2. Calculates when the trend actually started based on data timestamp
    3. Recalculates how long ago that was from current time
    4. Formats it as a relative time string

- **File**: `src/components/map/TopicList.jsx`
  - Updated to accept `dataTimestamp` prop
  - Uses `convertStartedToCurrentTime()` to display updated "Started" time

### Testing Checklist
- [ ] "Started" time updates correctly when page is refreshed
- [ ] "Started" time shows correct relative time (e.g., "9h ago" becomes "10h ago" after 1 hour)
- [ ] Handles edge cases (missing data, invalid timestamps)
- [ ] Works with different time formats ("9h ago", "50 minutes ago", "2 days ago")
- [ ] No console errors

### Status
✅ **Code Review**: Looks good
⏳ **Testing**: In progress

---

## PR 2: Improve Dark Theme Colors

### Summary
This PR improves the dark theme color scheme for better visibility and contrast.

### Changes
- **File**: `src/utils/dataUtils.js`
  - Updated `getColorByTopicCount()` function:
    - **Light theme**: Unchanged (more topics = darker gray)
    - **Dark theme**: Inverted logic (more topics = brighter/lighter gray)
    - States with no topics: Black in dark mode (was dark gray)
    - Increased contrast between topic count groups in dark mode

- **File**: `src/components/map/StateMap.jsx`
  - Changed border color in dark mode from `#909090` to `#606060` (darker for better contrast)

### Color Changes (Dark Theme)
- **0 topics**: `#000000` (black) - was `#303030`
- **1-3 topics**: Dark to medium gray (90-150)
- **4-6 topics**: Light gray (180-220) - clear jump from 1-3
- **7+ topics**: Very bright/white (245-255) - clear jump from 6

### Testing Checklist
- [ ] Dark theme displays correctly
- [ ] States with more topics are brighter/lighter in dark mode
- [ ] States with no topics are black in dark mode
- [ ] Border colors are visible and have good contrast
- [ ] Light theme still works correctly
- [ ] Theme switching works smoothly
- [ ] Colors are accessible (good contrast)

### Status
✅ **Code Review**: Looks good
⏳ **Testing**: In progress

---

## Testing Instructions

### Test PR 1 (Started Timestamp)
1. Checkout the PR branch:
   ```bash
   git checkout test-fix-started-timestamp
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Test:
   - Open app in browser
   - Click on a state to open sidebar
   - Note the "Started" time for topics
   - Wait a few minutes and refresh the page
   - Check if "Started" time has updated (e.g., "9h ago" → "9h 5m ago")
   - Check console for any errors

### Test PR 2 (Dark Theme)
1. Checkout the PR branch:
   ```bash
   git checkout test-improve-dark-theme
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Test:
   - Open app in browser
   - Switch to dark theme
   - Check state colors:
     - States with 0 topics should be black
     - States with more topics should be brighter/lighter
     - Border colors should be visible
   - Switch back to light theme
   - Verify light theme still works
   - Test on mobile (responsive)

---

## Review Notes

### PR 1: Started Timestamp Fix
**Pros:**
- ✅ Solves the problem of stale "Started" times
- ✅ Well-documented code with clear function names
- ✅ Handles edge cases (missing data, invalid timestamps)
- ✅ Returns original value if conversion fails (graceful degradation)

**Potential Issues:**
- ⚠️ Need to verify it works with all time formats
- ⚠️ Need to test with old data (different timestamp formats)

**Recommendation:** ✅ **APPROVE** - Good fix, well implemented

### PR 2: Dark Theme Colors
**Pros:**
- ✅ Improves visibility in dark mode
- ✅ Better contrast between states
- ✅ Inverted logic makes sense (more topics = brighter)
- ✅ Clear grouping (few/many/TON)

**Potential Issues:**
- ⚠️ Need to verify accessibility (contrast ratios)
- ⚠️ Need to test on different screens/devices
- ⚠️ Border color change might affect visibility

**Recommendation:** ✅ **APPROVE** - Good improvement, but test accessibility

---

## Final Status

- [ ] PR 1 tested and approved
- [ ] PR 2 tested and approved
- [ ] Both PRs merged to main
- [ ] Changes deployed to production

