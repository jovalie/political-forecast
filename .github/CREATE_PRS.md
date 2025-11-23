# Creating Pull Requests

## PR 1: Fix Mobile Touch Responsiveness
**Branch**: `fix/mobile-touch-responsiveness`  
**Base**: `kiran-ingestion`  
**Issue**: #1 (to be created)

### Commits to include:
- `16a117b` - Disable fitBounds on mobile to fix touch responsiveness
- `9d8fa0f` - Increase touch threshold to 30px/800ms
- `44db5b6` - Add cache-busting and improve touch sensitivity
- `bf786c6` - Improve touch sensitivity and add multiple retries
- `c1e1ef6` - Ensure touch handlers attached to all states with retry logic
- `b5eac8c` - Fix coordinate conversion for mobile state clicks
- `0c082e0` - Add visual feedback for mobile tap detection
- `825a270` - Fix mobile touch to click conversion with proper Leaflet events
- `a10aced` - Fix mobile clicks with touch-action none and debug logging
- `5448e77` - Add explicit touch handlers for mobile state clicks

### Steps:
```bash
# Create branch from kiran-ingestion
git checkout kiran-ingestion
git checkout -b fix/mobile-touch-responsiveness

# Cherry-pick or create commits (commits are already in kiran-ingestion, so we can create a new branch)
# Actually, since all commits are already in kiran-ingestion, we can create a clean branch
git checkout -b fix/mobile-touch-responsiveness main
git cherry-pick 5448e77..16a117b
# Or create a new branch and apply changes manually
```

**Note**: Since all commits are already in `kiran-ingestion`, we have two options:
1. Create PR from `kiran-ingestion` to `main` (if that's the workflow)
2. Create a new branch from `main` and cherry-pick the relevant commits

---

## PR 2: Add Cache-Busting for Data Files
**Branch**: `feature/cache-busting`  
**Base**: `kiran-ingestion`  
**Issue**: #2 (to be created)

### Commits to include:
- `44db5b6` - Add cache-busting and improve touch sensitivity (cache-busting part only)

**Note**: This commit also includes touch sensitivity improvements. We may need to split it or include it in PR 1.

---

## PR 3: Mobile UI Bug Fixes
**Branch**: `fix/mobile-ui-bugs`  
**Base**: `kiran-ingestion`  
**Issue**: #3 (to be created)

### Commits to include:
- Previous commits related to mobile UI fixes (map cutoff, theme toggle)
- These may already be in the codebase from earlier work

---

## PR 4: Dark Theme Color Improvements
**Branch**: `feature/dark-theme-improvements`  
**Base**: `kiran-ingestion`  
**Issue**: #4 (to be created)

### Commits to include:
- Commits related to dark theme color improvements
- May already be merged from friend's PR #6

---

## PR 5: Fix Started Timestamp
**Branch**: `fix/started-timestamp`  
**Base**: `kiran-ingestion`  
**Issue**: #5 (to be created)

### Commits to include:
- Commits related to timestamp fixes
- May already be merged from friend's PR #7

---

## Recommended Workflow

Since all the work is currently in `kiran-ingestion`, here's the recommended approach:

1. **Create issues first** on GitHub for each feature/bug fix
2. **Create PRs from kiran-ingestion to main** (if that's your workflow)
   - OR create feature branches from main and cherry-pick commits
3. **Test each PR** before merging
4. **Only merge working, tested code**

### Option A: PR from kiran-ingestion to main
```bash
# On GitHub, create PR: kiran-ingestion -> main
# This includes all the work
```

### Option B: Create separate feature branches
```bash
# For each feature, create a branch from main
git checkout main
git checkout -b fix/mobile-touch-responsiveness

# Cherry-pick relevant commits
git cherry-pick <commit-hash>
# Repeat for each commit

# Push and create PR
git push origin fix/mobile-touch-responsiveness
```

### Option C: Create PRs from kiran-ingestion (recommended for now)
Since you're working on `kiran-ingestion` and want to keep it organized:
1. Create issues on GitHub
2. Create PRs from `kiran-ingestion` to `main` (or your base branch)
3. Each PR should reference its issue
4. Test before merging

