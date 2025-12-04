# Next Steps: Creating Issues and Pull Requests

## Current Status
✅ All code changes are in `kiran-ingestion` branch  
✅ Issue templates created in `.github/ISSUES.md`  
✅ PR template created in `.github/PR_TEMPLATE.md`  
✅ PR creation guide in `.github/CREATE_PRS.md`

## Step 1: Create GitHub Issues

Go to your GitHub repository and create issues using the templates in `.github/ISSUES.md`:

### Issue #1: Fix Mobile Touch Responsiveness
- Copy content from `.github/ISSUES.md` → Issue 1
- Labels: `bug`, `mobile`, `touch-events`
- Priority: High

### Issue #2: Add Cache-Busting for Data Files
- Copy content from `.github/ISSUES.md` → Issue 2
- Labels: `enhancement`, `caching`, `data-loading`
- Priority: Medium

### Issue #3: Mobile UI Bug Fixes
- Copy content from `.github/ISSUES.md` → Issue 3
- Labels: `bug`, `mobile`, `ui`
- Priority: High

### Issue #4: Dark Theme Color Improvements
- Copy content from `.github/ISSUES.md` → Issue 4
- Labels: `enhancement`, `ui`, `dark-mode`
- Priority: Low

### Issue #5: Fix Started Timestamp
- Copy content from `.github/ISSUES.md` → Issue 5
- Labels: `bug`, `data-display`
- Priority: Low

## Step 2: Create Pull Requests

### Option A: Create PRs from kiran-ingestion to main (Recommended)

Since all your work is in `kiran-ingestion`, you can create PRs directly:

1. **PR #1: Fix Mobile Touch Responsiveness**
   - Base: `main`
   - Compare: `kiran-ingestion`
   - Title: "Fix Mobile Touch Responsiveness for State Selection"
   - Description: Use template from Issue #1
   - Reference: Closes #1

2. **PR #2: Add Cache-Busting**
   - Base: `main`
   - Compare: `kiran-ingestion` (or create a separate branch)
   - Title: "Add Cache-Busting for Data Files"
   - Description: Use template from Issue #2
   - Reference: Closes #2

**Note**: Since all commits are in `kiran-ingestion`, you may want to:
- Create one comprehensive PR with all fixes, OR
- Create separate feature branches from `main` and cherry-pick specific commits

### Option B: Create Feature Branches (More Organized)

For better organization, create separate branches:

```bash
# 1. Mobile Touch Responsiveness
git checkout main
git checkout -b fix/mobile-touch-responsiveness
git cherry-pick 5448e77 825a270 a10aced 0c082e0 b5eac8c c1e1ef6 bf786c6 9d8fa0f 16a117b
git push origin fix/mobile-touch-responsiveness
# Then create PR: fix/mobile-touch-responsiveness -> main

# 2. Cache-Busting (extract from commit 44db5b6)
git checkout main
git checkout -b feature/cache-busting
# Manually apply cache-busting changes from 44db5b6
git push origin feature/cache-busting
# Then create PR: feature/cache-busting -> main
```

## Step 3: Testing Before PRs

Before creating PRs, ensure:
- [ ] Code works on desktop
- [ ] Code works on mobile (iPhone)
- [ ] Code works on mobile (Android)
- [ ] No console errors
- [ ] No linting errors
- [ ] All features tested

## Step 4: PR Review Checklist

For each PR, ensure:
- [ ] PR description references the issue
- [ ] All tests pass
- [ ] Code follows project style
- [ ] No breaking changes (or clearly documented)
- [ ] Screenshots included (if UI changes)

## Recommended Approach

**For now, since you're actively working on `kiran-ingestion`:**

1. **Create issues first** (copy from `.github/ISSUES.md`)
2. **Create one comprehensive PR** from `kiran-ingestion` to `main` with all fixes
   - Title: "Mobile Touch Responsiveness and Cache-Busting Fixes"
   - Reference all issues: Closes #1, Closes #2, etc.
3. **Test thoroughly** before merging
4. **After merging**, create separate feature branches for future work

This keeps things organized while you're actively developing.

## Current Commits in kiran-ingestion

Recent commits that should be included in PRs:
- `4e189bc` - Add PR creation guide
- `d88465f` - Add issue templates and PR template
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

