# Troubleshooting: Data Ingestion Not Updating

## Issue
Trending topics haven't changed from yesterday - automated scraping isn't updating the data.

## Possible Causes

### 1. Scheduled Workflows Not Enabled
GitHub Actions scheduled workflows (cron) are **disabled by default** for forks and may need to be enabled in repository settings.

**Check:**
- Go to repository Settings → Actions → General
- Under "Workflow permissions", ensure "Read and write permissions" is selected
- Under "Actions", ensure "Allow all actions and reusable workflows" is enabled

### 2. Workflow Running But Failing
The workflow might be running but failing silently or timing out.

**Check:**
- Go to repository → Actions tab
- Look for recent runs of "Data Ingestion Pipeline"
- Check if runs are:
  - ✅ Successful (green)
  - ❌ Failing (red)
  - ⏸️ Cancelled (yellow)
  - ⏳ In progress

### 3. Workflow Running But No Changes Detected
The workflow might be running successfully but:
- Scraping is returning the same data (no actual changes)
- Script is failing silently and not generating new data
- Only checking `states-topics.json` but not individual state files

**Current workflow only checks:**
```yaml
if [ -n "$(git status --porcelain public/data/states-topics.json)" ]; then
```

**But the app loads from:**
- `public/data/states/{CODE}.json` (individual state files)

**This is a mismatch!** The workflow only commits if `states-topics.json` changes, but the app uses individual state files.

### 4. Workflow Not Committing Individual State Files
The workflow needs to:
1. Generate individual state files (`public/data/states/{CODE}.json`)
2. Check for changes in those files
3. Commit all changed files

## Solutions

### Solution 1: Enable Scheduled Workflows (If Disabled)
1. Go to repository Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Save changes

### Solution 2: Manually Trigger Workflow
1. Go to repository → Actions tab
2. Select "Data Ingestion Pipeline" workflow
3. Click "Run workflow" button
4. Select branch (main)
5. Click "Run workflow"

### Solution 3: Fix Workflow to Commit Individual State Files
The workflow needs to be updated to:
- Check for changes in `public/data/states/*.json` files
- Commit all changed state files, not just `states-topics.json`

### Solution 4: Check Workflow Logs
1. Go to repository → Actions tab
2. Click on latest "Data Ingestion Pipeline" run
3. Check logs for:
   - Errors during scraping
   - Timeout issues
   - Permission errors
   - Network errors

## Quick Fix: Update Workflow

The workflow should check for changes in individual state files:

```yaml
- name: Check for data changes
  id: check-changes
  run: |
    # Check for changes in states-topics.json
    if [ -n "$(git status --porcelain public/data/states-topics.json)" ]; then
      echo "has_changes=true" >> $GITHUB_OUTPUT
      echo "Data file has been updated"
    fi
    
    # Check for changes in individual state files
    if [ -n "$(git status --porcelain public/data/states/*.json)" ]; then
      echo "has_changes=true" >> $GITHUB_OUTPUT
      echo "Individual state files have been updated"
    fi
    
    if [ "${{ steps.check-changes.outputs.has_changes }}" != "true" ]; then
      echo "has_changes=false" >> $GITHUB_OUTPUT
      echo "No changes to data files"
    fi

- name: Commit and push changes
  if: steps.check-changes.outputs.has_changes == 'true'
  run: |
    git add public/data/states-topics.json public/data/states/*.json
    git commit -m "Update trending topics data"
    git push origin main
```

## Testing Locally

Test if the ingestion script works:

```bash
# Test with a few states
npm run ingest:sample

# Check if files are generated
ls -la public/data/states/*.json

# Check timestamps
cat public/data/states/CA.json | jq '.timestamp'
```

## Next Steps

1. ✅ Check if scheduled workflows are enabled
2. ✅ Check Actions tab for recent runs
3. ✅ Update workflow to commit individual state files
4. ✅ Test ingestion script locally
5. ✅ Manually trigger workflow to test

