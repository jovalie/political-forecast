# Mobile Bug Fixes - November 19, 2025

This document tracks mobile UI bugs that were identified and fixed.

## Bugs Fixed

### Bug 1: Map Cutoff on Initial Launch
**Issue**: Map was cut off on the sides when first loading on mobile devices.

**Root Cause**: 
- Map container wasn't properly calculating its size on initial render
- Viewport width wasn't constrained properly on mobile
- No resize handlers to recalculate map size

**Fix**:
- Added map size recalculation on mount in `MapThemeUpdater` component
- Added resize and orientation change event listeners
- Fixed viewport width with `width: 100vw; max-width: 100vw;` on mobile
- Added `touch-action: pan-x pan-y` for proper mobile touch handling

**Files Changed**:
- `src/components/map/MapContainer.jsx` - Added resize handlers and map reference
- `src/components/map/MapContainer.css` - Fixed mobile viewport width

**Code Changes**:
```javascript
// MapThemeUpdater now handles resize events
useEffect(() => {
  const fixMapSize = () => {
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }
  fixMapSize()
  window.addEventListener('resize', fixMapSize)
  window.addEventListener('orientationchange', fixMapSize)
  return () => {
    window.removeEventListener('resize', fixMapSize)
    window.removeEventListener('orientationchange', fixMapSize)
  }
}, [map])
```

```css
@media (max-width: 768px) {
  .map-container {
    overflow: hidden;
    width: 100vw;
    max-width: 100vw;
  }
  .map-container .leaflet-container {
    touch-action: pan-x pan-y;
  }
}
```

---

### Bug 2: Theme Toggle Disappears After Zoom
**Issue**: Theme toggle would disappear or become inaccessible after zooming the map on mobile.

**Root Cause**: 
- Theme toggle didn't have proper z-index to stay above map controls
- Header wasn't sticky, so it could scroll out of view
- Map controls could overlay the toggle

**Fix**:
- Added `z-index: 1001` to theme toggle to keep it above map controls
- Made header `position: sticky; top: 0` on mobile to keep it visible
- Ensured proper z-index hierarchy: toggle (1001) > header (1000) > map (1)

**Files Changed**:
- `src/styles/App.css` - Made header sticky on mobile
- `src/components/ui/ThemeToggle.css` - Added z-index

**Code Changes**:
```css
/* App.css - Mobile header */
@media (max-width: 768px) {
  .app-header {
    position: sticky;
    top: 0;
    z-index: 1000;
  }
}

/* ThemeToggle.css */
.theme-toggle-switch {
  z-index: 1001; /* Above header and map */
}

@media (max-width: 768px) {
  .theme-toggle-switch {
    position: relative;
    z-index: 1001; /* Keep toggle above map and sidebar */
  }
}
```

---

### Bug 3: Theme Toggle Disappears After Selecting State
**Issue**: Theme toggle would get pushed upward and become inaccessible after opening the sidebar on mobile.

**Root Cause**: 
- Header wasn't sticky, so when sidebar opened, the header could scroll out of view
- No proper z-index layering between header, toggle, and sidebar
- Map size changes when sidebar opens could cause layout shifts

**Fix**:
- Made header `position: sticky; top: 0` on mobile to keep it fixed at top
- Added higher z-index to ensure toggle stays above sidebar (z-index: 1001)
- Added map size recalculation when sidebar opens/closes to prevent layout shifts
- Reserved space for toggle in header text (`max-width: calc(100% - 60px)`)

**Files Changed**:
- `src/styles/App.css` - Sticky header positioning and space reservation
- `src/components/map/MapContainer.jsx` - Map size recalculation on sidebar change
- `src/components/ui/ThemeToggle.css` - Z-index adjustments

**Code Changes**:
```javascript
// MapContainer.jsx - Recalculate map size when sidebar opens/closes
useEffect(() => {
  if (mapRef.current) {
    const timer = setTimeout(() => {
      mapRef.current.invalidateSize()
    }, 450) // After sidebar animation completes
    return () => clearTimeout(timer)
  }
}, [isSidebarOpen])
```

```css
/* App.css - Reserve space for toggle */
.app-header-text {
  max-width: calc(100% - 60px); /* Reserve space for toggle */
}
```

---

## Z-Index Hierarchy

To prevent future z-index conflicts, here's the established hierarchy:

1. **Theme Toggle**: `z-index: 1001` (highest - always visible)
2. **Header**: `z-index: 1000` (sticky, stays at top)
3. **Sidebar Overlay**: `z-index: 1000` (same as header)
4. **Sidebar Panel**: `z-index: 1001` (above overlay, but toggle still accessible)
5. **Map**: `z-index: 1` (lowest - background)

## Testing

All fixes have been tested on:
- ✅ iPhone SE (375px)
- ✅ iPhone 12/13/14 (390px)
- ✅ iPhone 14 Pro Max (430px)
- ✅ Browser DevTools mobile emulation

## Status

**All mobile bugs fixed and deployed** ✅

- [x] Map cutoff on initial launch - FIXED
- [x] Theme toggle disappears after zoom - FIXED
- [x] Theme toggle disappears after selecting state - FIXED

## Related Files

- `src/styles/App.css` - Header and layout styles
- `src/components/ui/ThemeToggle.css` - Theme toggle styles
- `src/components/map/MapContainer.jsx` - Map container and resize logic
- `src/components/map/MapContainer.css` - Map container styles

