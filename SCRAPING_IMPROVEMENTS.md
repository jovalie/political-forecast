# Scraping Improvements for Google Trends Data Ingestion

This document outlines potential improvements to make the scraping more robust, efficient, and accurate.

## Current Implementation Analysis

### What's Working Well ✅
- Uses Puppeteer for browser automation
- Category filtering (category=10 for Law & Government)
- Keyword-based secondary filtering
- Concurrency control (5 concurrent requests)
- Rate limiting with delays
- Multiple extraction methods (DOM + API responses)
- Error handling and retries
- Debug logging

### Current Limitations ⚠️
1. **Fixed timeouts** - Uses hardcoded delays (5s, 2s, 3s) that may be too long or too short
2. **DOM dependency** - Relies heavily on DOM structure which can change
3. **Limited API extraction** - API response parsing is basic
4. **No caching** - Re-scrapes even if data hasn't changed
5. **No retry logic** - Fails immediately on errors
6. **Anti-bot detection** - May get blocked by Google
7. **Single extraction method** - Only tries one approach at a time

## Improvement Suggestions

### 1. **Smarter Waiting Strategies** (High Impact)

**Current Issue**: Uses fixed timeouts that may be too long or too short

**Improvement**:
```javascript
// Instead of fixed delays, wait for specific elements
async function waitForTrendsTable(page, maxWait = 15000) {
  try {
    // Wait for table to appear
    await page.waitForSelector('[role="row"]:not([role="rowheader"])', { 
      timeout: maxWait,
      visible: true 
    })
    
    // Wait for at least 3 rows (indicating data loaded)
    await page.waitForFunction(
      () => document.querySelectorAll('[role="row"]:not([role="rowheader"])').length >= 3,
      { timeout: maxWait }
    )
    
    return true
  } catch (error) {
    return false
  }
}
```

**Benefits**:
- Faster when content loads quickly
- More reliable when content loads slowly
- Reduces unnecessary waiting

### 2. **Better API Response Extraction** (High Impact)

**Current Issue**: Basic API response parsing, may miss data

**Improvement**:
```javascript
// Intercept and parse Google Trends API responses more thoroughly
page.on('response', async (response) => {
  const url = response.url()
  
  // Look for specific Google Trends API endpoints
  if (url.includes('trends.google.com/api') || 
      url.includes('trends/explore') ||
      url.includes('trends/trending')) {
    
    try {
      const data = await response.json()
      
      // Google Trends API structure (may vary)
      // Look for: default.timelineData, default.relatedQueries, etc.
      if (data.default && data.default.timelineData) {
        // Extract trends from timeline data
        const trends = extractFromTimelineData(data.default.timelineData)
        if (trends.length > 0) {
          apiTrends.push(...trends)
        }
      }
      
      // Also check for widget data
      if (data.widgets) {
        data.widgets.forEach(widget => {
          if (widget.token && widget.request) {
            // This is a widget request, can fetch more data
          }
        })
      }
    } catch (e) {
      // Not JSON or parsing failed
    }
  }
})
```

**Benefits**:
- More reliable data extraction
- Less dependent on DOM changes
- Can get more detailed data (timeline, related queries)

### 3. **Retry Logic with Exponential Backoff** (Medium Impact)

**Current Issue**: Fails immediately on errors

**Improvement**:
```javascript
async function scrapeWithRetry(geoCode, options = {}, maxRetries = 3) {
  let lastError = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await scrapeGoogleTrends(geoCode, options)
    } catch (error) {
      lastError = error
      
      // Check if it's a retryable error
      if (error.message.includes('timeout') || 
          error.message.includes('network') ||
          error.message.includes('blocked')) {
        
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000
        console.log(`  Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Rotate user agent on retry
        options.userAgent = getRandomUserAgent()
      } else {
        // Non-retryable error, fail immediately
        throw error
      }
    }
  }
  
  throw lastError
}
```

**Benefits**:
- Handles temporary network issues
- Recovers from rate limiting
- More resilient to transient failures

### 4. **Caching System** (Medium Impact)

**Current Issue**: Re-scrapes even if data hasn't changed

**Improvement**:
```javascript
// Cache scraped data with timestamps
const CACHE_DIR = path.join(__dirname, '..', '.cache', 'trends')
const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 hours

async function getCachedTrends(geoCode) {
  const cacheFile = path.join(CACHE_DIR, `${geoCode}.json`)
  
  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
    const age = Date.now() - cached.timestamp
    
    if (age < CACHE_DURATION) {
      console.log(`  Using cached data (${Math.round(age / 1000 / 60)}min old)`)
      return cached.trends
    }
  }
  
  return null
}

async function cacheTrends(geoCode, trends) {
  const cacheFile = path.join(CACHE_DIR, `${geoCode}.json`)
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
  fs.writeFileSync(cacheFile, JSON.stringify({
    timestamp: Date.now(),
    trends: trends
  }))
}
```

**Benefits**:
- Faster during development/testing
- Reduces load on Google Trends
- Can work offline with cached data

### 5. **Better Anti-Bot Detection Avoidance** (High Impact)

**Current Issue**: May get blocked by Google

**Improvements**:
```javascript
// Rotate user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
]

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// Add realistic browser behavior
async function addRealisticBehavior(page) {
  // Random mouse movements
  await page.mouse.move(
    Math.random() * 1920,
    Math.random() * 1080
  )
  
  // Random scroll
  await page.evaluate(() => {
    window.scrollBy(0, Math.random() * 200)
  })
  
  // Random delay (human-like)
  await new Promise(resolve => 
    setTimeout(resolve, 500 + Math.random() * 1000)
  )
}

// Use stealth plugin
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import puppeteerExtra from 'puppeteer-extra'

const puppeteer = puppeteerExtra.use(StealthPlugin())
```

**Benefits**:
- Less likely to be detected as a bot
- More reliable scraping
- Can handle more requests before blocking

### 6. **Multiple Extraction Methods in Parallel** (Medium Impact)

**Current Issue**: Tries one method at a time

**Improvement**:
```javascript
// Try multiple extraction methods simultaneously
async function extractTrendsMultipleMethods(page) {
  const [domTrends, apiTrends, screenshotTrends] = await Promise.allSettled([
    extractFromDOM(page),
    extractFromAPIResponses(page),
    extractFromScreenshotOCR(page) // Last resort
  ])
  
  // Combine and deduplicate
  const allTrends = [
    ...(domTrends.status === 'fulfilled' ? domTrends.value : []),
    ...(apiTrends.status === 'fulfilled' ? apiTrends.value : []),
    ...(screenshotTrends.status === 'fulfilled' ? screenshotTrends.value : [])
  ]
  
  return deduplicateTrends(allTrends)
}
```

**Benefits**:
- More reliable - if one method fails, others may work
- Can combine data from multiple sources
- Better coverage of edge cases

### 7. **Better Error Detection and Handling** (Medium Impact)

**Current Issue**: May not detect when Google blocks or shows CAPTCHA

**Improvement**:
```javascript
async function detectBlocking(page) {
  const blockingIndicators = await page.evaluate(() => {
    const bodyText = document.body.innerText.toLowerCase()
    const hasCaptcha = document.querySelector('iframe[src*="recaptcha"]') !== null
    const hasSignIn = bodyText.includes('sign in') || bodyText.includes('sign-in')
    const hasVerify = bodyText.includes('verify') || bodyText.includes('verify you')
    const hasBlocked = bodyText.includes('blocked') || bodyText.includes('access denied')
    const hasRateLimit = bodyText.includes('too many requests') || bodyText.includes('rate limit')
    
    return {
      isBlocked: hasCaptcha || hasSignIn || hasVerify || hasBlocked || hasRateLimit,
      reason: hasCaptcha ? 'captcha' : 
              hasSignIn ? 'sign-in' : 
              hasVerify ? 'verification' : 
              hasBlocked ? 'blocked' : 
              hasRateLimit ? 'rate-limit' : 'unknown'
    }
  })
  
  return blockingIndicators
}
```

**Benefits**:
- Early detection of blocking
- Can adjust strategy (wait longer, use different approach)
- Better error messages

### 8. **Improved Relevance Scoring** (Low Impact, High Value)

**Current Issue**: Basic relevance scoring

**Improvement**:
```javascript
function calculateRelevanceScore(trend, geoCode) {
  let score = 0
  
  // Base score from search volume
  const volume = parseVolume(trend.searchVolume)
  score += Math.min(volume / 1000, 50) // Max 50 points
  
  // Recency bonus (more recent = higher score)
  const recency = parseRecency(trend.started)
  score += Math.max(0, 30 - recency) // Max 30 points
  
  // Percentage increase bonus
  const pctIncrease = parsePercentage(trend.percentageIncrease)
  score += Math.min(pctIncrease / 20, 20) // Max 20 points
  
  // Law/Government keyword bonus
  const keywordScore = countLawKeywords(trend.title)
  score += keywordScore * 2 // 2 points per keyword match
  
  // Geographic relevance (if trend mentions state/region)
  if (isGeographicallyRelevant(trend.title, geoCode)) {
    score += 10
  }
  
  return Math.min(score, 100) // Cap at 100
}
```

**Benefits**:
- Better topic ranking
- More relevant topics shown first
- Better user experience

### 9. **Progressive Enhancement Strategy** (High Impact)

**Current Issue**: All-or-nothing approach

**Improvement**:
```javascript
async function scrapeWithFallback(geoCode) {
  // Try best method first
  try {
    return await scrapeViaAPI(geoCode)
  } catch (error) {
    console.log('  API method failed, trying DOM extraction...')
  }
  
  // Fallback to DOM
  try {
    return await scrapeViaDOM(geoCode)
  } catch (error) {
    console.log('  DOM method failed, trying basic extraction...')
  }
  
  // Last resort: basic extraction
  try {
    return await scrapeViaBasic(geoCode)
  } catch (error) {
    console.error('  All methods failed')
    return []
  }
}
```

**Benefits**:
- More resilient
- Always tries to get some data
- Graceful degradation

### 10. **Better Filtering and Deduplication** (Medium Impact)

**Current Issue**: May get duplicate or irrelevant topics

**Improvement**:
```javascript
function deduplicateAndFilter(trends) {
  const seen = new Set()
  const filtered = []
  
  for (const trend of trends) {
    // Normalize title for comparison
    const normalized = normalizeTitle(trend.title)
    
    // Skip if we've seen this before
    if (seen.has(normalized)) {
      continue
    }
    
    // Check relevance
    if (!isLawAndGovernmentRelevant(trend.title)) {
      continue
    }
    
    // Check quality
    if (trend.title.length < 3 || trend.title.length > 200) {
      continue
    }
    
    seen.add(normalized)
    filtered.push(trend)
  }
  
  return filtered
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
}
```

**Benefits**:
- Cleaner data
- No duplicates
- Better quality topics

## Implementation Priority

### High Priority (Do First)
1. ✅ **Smarter Waiting Strategies** - Faster and more reliable
2. ✅ **Better API Response Extraction** - More data, less DOM dependency
3. ✅ **Anti-Bot Detection Avoidance** - Prevents blocking
4. ✅ **Progressive Enhancement Strategy** - More resilient

### Medium Priority (Do Next)
5. ✅ **Retry Logic with Exponential Backoff** - Handles failures better
6. ✅ **Caching System** - Faster development/testing
7. ✅ **Better Error Detection** - Better debugging
8. ✅ **Better Filtering and Deduplication** - Cleaner data

### Low Priority (Nice to Have)
9. ✅ **Multiple Extraction Methods in Parallel** - Edge case coverage
10. ✅ **Improved Relevance Scoring** - Better ranking

## Quick Wins (Easy to Implement)

1. **Add retry logic** - ~30 minutes
2. **Improve waiting strategies** - ~1 hour
3. **Better error detection** - ~30 minutes
4. **Add caching** - ~1 hour

## Testing Improvements

After implementing improvements, test:
- [ ] Success rate (should be > 90%)
- [ ] Average scraping time per state (should be < 30s)
- [ ] Data quality (should have 5-10 topics per state)
- [ ] Blocking rate (should be < 5%)
- [ ] Cache hit rate (should be > 50% on re-runs)

## Notes

- **Google Trends API**: There's no official public API, so scraping is necessary
- **Rate Limiting**: Be respectful - current 5 concurrent requests is good
- **Legal**: Scraping public data is generally legal, but check Google's ToS
- **Maintenance**: Google may change their structure, so monitor for breakages

