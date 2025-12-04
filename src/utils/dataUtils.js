/**
 * Get the base URL for the application (handles GitHub Pages subdirectory)
 * @returns {string} Base URL with trailing slash
 */
export function getBaseUrl() {
  // import.meta.env.BASE_URL is set by Vite and includes the base path
  // It already has a leading slash, so we just need to ensure it ends with a slash
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  
  // Log base URL in both dev and prod to help debug production issues
  console.log('[getBaseUrl] BASE_URL:', import.meta.env.BASE_URL, 'normalized:', normalizedBase, 'window.location.pathname:', window.location.pathname)
  
  return normalizedBase
}

/**
 * Construct a full URL for a data file, respecting the base path
 * Uses relative paths to avoid base path duplication issues
 * @param {string} path - Path to the data file (e.g., 'data/states-topics.json')
 * @returns {string} URL relative to current page location
 */
export function getDataUrl(path) {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Use relative path from current page location
  // This automatically handles subdirectory deployments
  // If we're at /political-forecast/, then 'data/file.json' becomes /political-forecast/data/file.json
  // If we're at /, then 'data/file.json' becomes /data/file.json
  const currentPath = window.location.pathname
  const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1)
  const finalUrl = `${basePath}${cleanPath}`
  
  console.log('[getDataUrl] Constructed URL:', finalUrl, '(path:', cleanPath, ', currentPath:', currentPath, ', basePath:', basePath, ')')
  return finalUrl
}

/**
 * Load JSON data from a URL
 * @param {string} url - URL to fetch JSON from (can be relative or absolute)
 * @returns {Promise<Object>} Parsed JSON data
 */
export async function loadJSONData(url) {
  try {
    let fullUrl = url
    
    // If it's already a full URL (http/https), use it as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      fullUrl = url
    } else if (url.startsWith('/')) {
      // If it already starts with /, it's an absolute path - use it directly
      // This prevents double-application of base paths
      fullUrl = url
    } else {
      // Relative path - use getDataUrl to construct path from current location
      fullUrl = getDataUrl(url)
    }
    
    console.log('[loadJSONData] Fetching from:', fullUrl, '(original:', url, ')')
    const response = await fetch(fullUrl)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available')
      console.error(`[loadJSONData] Fetch failed:`, {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200)
      })
      throw new Error(`Failed to load data: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`)
    }
    
    const data = await response.json()
    console.log('[loadJSONData] Successfully loaded data from:', fullUrl)
    return data
  } catch (error) {
    console.error(`[loadJSONData] Error loading JSON from ${url}:`, error)
    throw error
  }
}

/**
 * Merge topic data with GeoJSON features
 * @param {Object} geoJSON - GeoJSON FeatureCollection
 * @param {Array} statesData - Array of state topic data
 * @param {string} timestamp - Optional timestamp from the data file
 * @returns {Object} GeoJSON with merged topic data in feature properties
 */
export function mergeTopicDataWithGeoJSON(geoJSON, statesData, timestamp = null) {
  if (!geoJSON || !geoJSON.features || !statesData) {
    console.warn('mergeTopicDataWithGeoJSON: Missing data', {
      hasGeoJSON: !!geoJSON,
      hasFeatures: !!geoJSON?.features,
      featuresCount: geoJSON?.features?.length,
      hasStatesData: !!statesData,
      statesDataCount: statesData?.length
    })
    return geoJSON
  }

  // Create a map of state name to topic data for quick lookup
  // Handle DC name variations: "Washington DC" and "District of Columbia"
  const stateDataMap = new Map()
  statesData.forEach((state) => {
    stateDataMap.set(state.name, state)
    // Also add DC with alternative name if it's DC
    if (state.name === 'District of Columbia' || state.name === 'Washington DC') {
      stateDataMap.set('District of Columbia', state)
      stateDataMap.set('Washington DC', state)
    }
  })

  let mergedCount = 0
  let notFoundCount = 0

  // Merge topic data into GeoJSON features
  const mergedFeatures = geoJSON.features.map((feature) => {
    const stateName = feature.properties?.name
    if (!stateName) {
      return feature
    }

    // Try exact match first
    let topicData = stateDataMap.get(stateName)
    
    // If not found and it's DC, try alternative name
    if (!topicData && (stateName === 'District of Columbia' || stateName === 'Washington DC')) {
      const alternativeName = stateName === 'District of Columbia' ? 'Washington DC' : 'District of Columbia'
      topicData = stateDataMap.get(alternativeName)
    }
    
    if (!topicData) {
      notFoundCount++
      // Only warn for DC as it's a known edge case
      if (stateName === 'District of Columbia' || stateName === 'Washington DC') {
        console.warn('[mergeTopicData] DC not found in topic data:', stateName)
      }
      return feature
    }

    mergedCount++
    // Merge topic data into feature properties
    return {
      ...feature,
      properties: {
        ...feature.properties,
        topTopic: topicData.topTopic,
        trendingScore: topicData.trendingScore,
        topics: topicData.topics,
        category: topicData.category,
        timestamp: timestamp, // Include timestamp for date display in tooltips
      },
    }
  })

  return {
    ...geoJSON,
    features: mergedFeatures,
  }
}

/**
 * Validate state data structure
 * @param {Object} state - State data object
 * @returns {boolean} True if valid
 */
export function validateStateData(state) {
  return (
    state &&
    typeof state.name === 'string' &&
    typeof state.code === 'string' &&
    typeof state.topTopic === 'string' &&
    Array.isArray(state.topics) &&
    state.topics.length > 0
  )
}

/**
 * Validate GeoJSON structure
 * @param {Object} geoJSON - GeoJSON object
 * @returns {boolean} True if valid
 */
export function validateGeoJSON(geoJSON) {
  return (
    geoJSON &&
    geoJSON.type === 'FeatureCollection' &&
    Array.isArray(geoJSON.features) &&
    geoJSON.features.length > 0
  )
}

/**
 * Enhanced hash function with better distribution
 * Uses multiple hash passes to reduce collisions
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function hashString(str) {
  let hash1 = 0
  let hash2 = 0
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    // First hash: djb2 algorithm
    hash1 = ((hash1 << 5) + hash1) + char
    // Second hash: sdbm algorithm
    hash2 = char + (hash2 << 6) + (hash2 << 16) - hash2
  }
  
  // Combine both hashes for better distribution
  // Use Math.abs to ensure positive result (XOR can produce negative numbers)
  const combined = Math.abs(Math.abs(hash1) ^ Math.abs(hash2))
  return combined
}

/**
 * Convert HSL to RGB and then to hex
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color code
 */
function hslToHex(h, s, l) {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Normalize topic name to handle variations intelligently
 * Handles differences like:
 * - "why are flags at half mast today" vs "why are the flags at half mast today"
 * - "donald trump and bill clinton" vs "trump and clinton"
 * Uses general rules without hardcoding specific names
 * @param {string} topicName - Raw topic name
 * @returns {string} Normalized topic name
 */
function normalizeTopicName(topicName) {
  if (!topicName || typeof topicName !== 'string') {
    return ''
  }

  let normalized = topicName
  
  // Convert to lowercase
  normalized = normalized.toLowerCase()
  
  // Remove punctuation
  normalized = normalized.replace(/[.,!?;:'"()\[\]{}]/g, '')
  
  // Normalize whitespace (multiple spaces to single space, trim)
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  // Remove titles/prefixes (president, mr, dr, etc.)
  normalized = normalized.replace(/\b(president|pres|mr|mrs|ms|dr|senator|sen|representative|rep|governor|gov)\s+/gi, '')
  
  // Remove common stop words (articles, common verbs, etc.)
  // This handles "why are flags" vs "why are the flags"
  const stopWords = /\b(a|an|the|are|is|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|may|might|can)\s+/gi
  normalized = normalized.replace(stopWords, ' ')
  
  // Normalize whitespace after stop word removal
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  // Handle name normalization: "firstname lastname" -> "lastname" when in context with "and"
  // Pattern: "X Y and Z W" -> "Y and W" (extract last names)
  // This handles "donald trump and bill clinton" -> "trump and clinton"
  const namePairPattern = /(\w+)\s+(\w+)\s+(and|&)\s+(\w+)\s+(\w+)/i
  const namePairMatch = normalized.match(namePairPattern)
  if (namePairMatch) {
    // We have "first1 last1 and first2 last2" -> "last1 and last2"
    normalized = `${namePairMatch[2]} ${namePairMatch[3]} ${namePairMatch[5]}`
  } else {
    // Check for individual name pairs when separated by "and"
    // Split by "and" or "&" to process each segment
    const segments = normalized.split(/\s+(and|&)\s+/i)
    
    if (segments.length > 1) {
      // We have multiple segments separated by "and" - likely names
      const processedSegments = segments.map((segment, index) => {
        // Keep conjunction words as-is
        if (/^(and|&)$/i.test(segment.trim())) {
          return segment.trim()
        }
        
        const words = segment.trim().split(/\s+/)
        
        // If segment has exactly 2 words and first word is short (<=7 chars),
        // treat as "firstname lastname" and extract just lastname
        // This works for names like "donald trump", "bill clinton", etc.
        if (words.length === 2 && words[0].length <= 7) {
          return words[1] // Return last name only
        }
        
        // If segment has 3+ words that all look like name parts (short words),
        // extract the last word (likely the last name)
        if (words.length >= 3) {
          const allShort = words.every(w => w.length <= 8)
          if (allShort) {
            return words[words.length - 1] // Return last word
          }
        }
        
        // Otherwise, keep the segment as-is
        return segment.trim()
      })
      
      normalized = processedSegments.join(' ')
    }
  }
  
  // Final cleanup: normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * Parse a relative time string (e.g., "9h ago", "50 minutes ago", "2 days ago")
 * and return the duration in milliseconds
 * @param {string} timeString - Relative time string (e.g., "9h ago", "50 minutes ago")
 * @returns {number} Duration in milliseconds, or null if parsing fails
 */
function parseRelativeTime(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return null
  }

  const normalized = timeString.toLowerCase().trim()
  
  // Match patterns like:
  // - "9h ago" or "9 hours ago"
  // - "50 minutes ago" or "50m ago"
  // - "2 days ago" or "2d ago"
  const patterns = [
    { regex: /(\d+)\s*(?:hours?|h)\s*ago/i, multiplier: 60 * 60 * 1000 }, // hours
    { regex: /(\d+)\s*(?:minutes?|mins?|m)\s*ago/i, multiplier: 60 * 1000 }, // minutes
    { regex: /(\d+)\s*(?:days?|d)\s*ago/i, multiplier: 24 * 60 * 60 * 1000 }, // days
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex)
    if (match) {
      const value = parseInt(match[1], 10)
      if (!isNaN(value) && value >= 0) {
        return value * pattern.multiplier
      }
    }
  }

  return null
}

/**
 * Format a duration in milliseconds as a human-readable relative time string
 * @param {number} durationMs - Duration in milliseconds
 * @returns {string} Formatted relative time (e.g., "9h ago", "50 minutes ago")
 */
function formatRelativeTime(durationMs) {
  if (durationMs < 0) {
    return 'just now'
  }

  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else {
    return 'just now'
  }
}

/**
 * Convert a "started" timestamp from being relative to data scrape time
 * to being relative to the current time
 * @param {string} started - Original "started" string (e.g., "9h ago")
 * @param {string} dataTimestamp - ISO timestamp string of when data was scraped
 * @returns {string} Updated "started" string relative to current time, or original if conversion fails
 */
export function convertStartedToCurrentTime(started, dataTimestamp) {
  if (!started || !dataTimestamp) {
    return started || 'N/A'
  }

  try {
    // Parse the data timestamp
    const dataTime = new Date(dataTimestamp)
    if (isNaN(dataTime.getTime())) {
      console.warn('[convertStartedToCurrentTime] Invalid dataTimestamp:', dataTimestamp)
      return started
    }

    // Parse the "started" relative time
    const startedDurationMs = parseRelativeTime(started)
    if (startedDurationMs === null) {
      // If we can't parse it, return the original
      return started
    }

    // Calculate when the trend actually started
    // If data was scraped at T and trend started "9h ago" from T,
    // then trend started at T - 9 hours
    const trendStartTime = new Date(dataTime.getTime() - startedDurationMs)

    // Calculate how long ago that was from now
    const now = new Date()
    const timeSinceStart = now.getTime() - trendStartTime.getTime()

    // Format as relative time
    return formatRelativeTime(timeSinceStart)
  } catch (error) {
    console.error('[convertStartedToCurrentTime] Error converting timestamp:', error)
    return started
  }
}

/**
 * Get color for a state based on the number of trending topics
 * Light theme: more topics = darker gray
 * Dark theme: more topics = brighter/lighter gray (inverted for visibility)
 * @param {number} topicCount - Number of trending topics
 * @param {boolean} isDark - Whether dark theme is active
 * @returns {string} Hex color code
 */
export function getColorByTopicCount(topicCount, isDark = false) {
  // Handle states with no topics - white for light mode, black for dark mode
  if (!topicCount || topicCount === 0) {
    return isDark ? '#000000' : '#ffffff'
  }

  // Monochrome scale: more topics = darker gray (light theme) or brighter gray (dark theme)
  // Light theme: 1 topic = light gray, 10+ topics = dark gray
  // Dark theme: 1 topic = darker gray, 10+ topics = brighter/lighter gray (inverted for visibility)
  
  if (isDark) {
    // Dark theme: brighter/lighter grays for more topics (inverted from light theme)
    // 1 topic = darker gray, 10+ topics = brighter/lighter gray
    // Increased contrast between groups: 0 (black), 1-3 (few), 4-6 (many), 7+ (TON)
    const grayValues = [
      90, // 1 topic - noticeably brighter than black for clear contrast
      100, // 2 topics - medium dark gray
      150, // 3 topics - medium gray (end of "few" group)
      180, // 4 topics - light gray (clear jump from 1-3, start of "many" group)
      200, // 5 topics - very light gray
      220, // 6 topics - almost white (end of "many" group)
      245, // 7 topics - very bright (clear jump from 6, start of "TON" group)
      250, // 8 topics - near white
      253, // 9 topics - almost white
      255, // 10+ topics - white (max brightness)
    ]
    const index = Math.min(Math.max(topicCount, 1), 10) - 1
    const gray = grayValues[index]
    const hex = gray.toString(16).padStart(2, '0')
    return `#${hex}${hex}${hex}`
  } else {
    // Light theme: darker grays for more topics
    // 1 topic = light gray, 10+ topics = dark gray
    const grayValues = [
      200, // 1 topic - light gray (was 3 topics)
      180, // 2 topics (was 4 topics)
      160, // 3 topics (was 5 topics)
      140, // 4 topics (was 6 topics)
      120, // 5 topics (was 7 topics)
      100, // 6 topics (was 8 topics)
      80,  // 7 topics (was 9 topics)
      60,  // 8 topics (was 10+ topics)
      50,  // 9 topics
      40,  // 10+ topics - dark gray
    ]
    const index = Math.min(Math.max(topicCount, 1), 10) - 1
    const gray = grayValues[index]
    const hex = gray.toString(16).padStart(2, '0')
    return `#${hex}${hex}${hex}`
  }
}

