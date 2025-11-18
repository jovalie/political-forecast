# Performance Testing Guide

This guide explains how to test and verify the performance targets for the Political Forecast application.

## Performance Targets

According to `requirements.md`:
- **PR1.1**: Initial page load must complete within **3 seconds**
- **PR1.2**: Map rendering must complete within **2 seconds** after data load

## Automated Performance Measurement

The app now includes built-in performance measurement that automatically tracks:
1. **Initial Page Load** - Time from page fetch start to load complete
2. **Data Loading** - Time to load all state JSON files
3. **Map Rendering** - Time to render the map after data is loaded

### How to View Performance Metrics

1. **Open the app** in your browser (local dev server or production)
2. **Open Browser DevTools** (F12 or Cmd+Option+I)
3. **Go to Console tab**
4. **Look for performance logs** - You'll see:
   ```
   [Performance] Initial page load: X.XXs
   [Performance] Target: < 3s | Status: ✅ PASS or ❌ FAIL
   [Performance] Data loading: X.XXs
   [Performance] Map render (after data load): X.XXs
   [Performance] Target: < 2s | Status: ✅ PASS or ❌ FAIL
   ```

5. **Full Performance Summary** - After the map renders, you'll see a formatted summary:
   ```
   ============================================================
   PERFORMANCE SUMMARY
   ============================================================
   📄 Initial Page Load: X.XXs (target: < 3.0s) ✅ PASS
   📊 Data Loading: X.XXs
   🗺️  Map Rendering: X.XXs
   ⚡ Map Render (after data): X.XXs (target: < 2.0s) ✅ PASS
   ============================================================
   ```

### Using Browser DevTools Performance Tab

For more detailed analysis:

1. **Open DevTools** → **Performance** tab
2. **Click Record** (circle icon)
3. **Reload the page** (Cmd+R or Ctrl+R)
4. **Wait for page to fully load**
5. **Stop recording**
6. **Analyze the timeline**:
   - Look for "Load" event (should be < 3s)
   - Check network requests for data files
   - Verify map rendering completes quickly

### Using Browser DevTools Network Tab

To check data file sizes and load times:

1. **Open DevTools** → **Network** tab
2. **Reload the page**
3. **Filter by "JSON"** to see only data files
4. **Check**:
   - Total number of requests (should be ~51 state files)
   - Total size of all JSON files
   - Load time for all files combined

### Manual Testing Checklist

- [ ] Test on **local dev server** (`npm run dev`)
- [ ] Test on **production** (GitHub Pages)
- [ ] Test with **slow 3G** network throttling (DevTools → Network → Throttling)
- [ ] Test with **fast 3G** network throttling
- [ ] Test with **cache disabled** (DevTools → Network → Disable cache)
- [ ] Test with **cache enabled** (normal browsing)

### Performance API Access

You can also access performance data programmatically in the browser console:

```javascript
// Get full performance summary
import { getPerformanceSummary, logPerformanceSummary } from './src/utils/performanceUtils'
logPerformanceSummary()

// Or access directly
window.performance.getEntriesByType('measure')
window.performance.getEntriesByType('navigation')
```

## Expected Results

### Good Performance
- Initial page load: **< 3 seconds**
- Map render (after data): **< 2 seconds**
- Data loading: **< 1 second** (with good network)

### Acceptable Performance
- Initial page load: **3-5 seconds**
- Map render (after data): **2-3 seconds**

### Needs Optimization
- Initial page load: **> 5 seconds**
- Map render (after data): **> 3 seconds**

## Troubleshooting

If performance is slow:

1. **Check network throttling** - Make sure you're not testing with throttling enabled
2. **Check bundle size** - Use `npm run build` and check `dist/` folder size
3. **Check data file sizes** - Ensure JSON files are optimized (< 500KB per state file)
4. **Check browser cache** - Clear cache and test again
5. **Check for blocking requests** - Look for slow API calls or large assets

## Next Steps

After testing, update `MVP_STEPS.md`:
- [x] Test performance targets (< 3s load, < 2s map render)

