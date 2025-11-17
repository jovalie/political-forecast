import Parser from 'rss-parser'

const parser = new Parser({
  customFields: {
    item: [
      ['ht:approx_traffic', 'approxTraffic'],
      ['ht:news_item', 'newsItems', { keepArray: true }],
      ['ht:picture', 'picture'],
      ['ht:picture_source', 'pictureSource']
    ]
  }
})

/**
 * Fetch and parse RSS feed from Google Trends
 * @param {string} url - RSS feed URL
 * @returns {Promise<Object>} Parsed RSS feed data
 */
export async function fetchRSSFeed(url) {
  try {
    console.log(`Fetching RSS feed: ${url}`)
    const feed = await parser.parseURL(url)
    return feed
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error.message)
    throw error
  }
}

/**
 * Extract topics from RSS feed items
 * @param {Array} items - RSS feed items
 * @returns {Array} Array of topic objects with name, traffic, and relevance
 */
export function extractTopics(items) {
  if (!items || !Array.isArray(items)) {
    return []
  }

  const topics = items.map((item, index) => {
    const title = item.title || ''
    const approxTraffic = item.approxTraffic || '0+'
    
    // Parse traffic number (e.g., "200+", "5000+", "1000+")
    const trafficMatch = approxTraffic.match(/(\d+)/)
    const trafficValue = trafficMatch ? parseInt(trafficMatch[1], 10) : 0
    
    // Calculate relevance score based on traffic and position
    // Higher traffic and earlier position = higher relevance
    // Position weight: first item gets 100, second gets 90, etc.
    const positionWeight = Math.max(0, 100 - (index * 10))
    // Traffic weight: normalize to 0-100 scale (assuming max ~10000+)
    const trafficWeight = Math.min(100, (trafficValue / 100) * 10)
    // Combined relevance score
    const relevanceScore = Math.round((positionWeight * 0.6) + (trafficWeight * 0.4))
    
    return {
      name: title,
      traffic: approxTraffic,
      trafficValue: trafficValue,
      relevanceScore: Math.max(1, Math.min(100, relevanceScore)), // Clamp between 1-100
      category: 'Law and Government', // All topics from RSS are treated as Law and Government
      newsItems: item.newsItems || []
    }
  })

  return topics
}

/**
 * Filter topics for Law and Government relevance
 * This is a simple keyword-based filter since RSS doesn't provide categories
 * @param {Array} topics - Array of topic objects
 * @returns {Array} Filtered topics
 */
export function filterLawAndGovernmentTopics(topics) {
  // Keywords that suggest Law and Government topics
  const lawKeywords = [
    'law', 'legal', 'legislation', 'bill', 'act', 'regulation', 'policy',
    'government', 'congress', 'senate', 'house', 'representative', 'senator',
    'election', 'vote', 'voting', 'ballot', 'campaign', 'candidate',
    'court', 'judge', 'judicial', 'supreme court', 'lawsuit', 'trial',
    'rights', 'amendment', 'constitution', 'federal', 'state', 'local',
    'tax', 'budget', 'spending', 'appropriation', 'executive order',
    'president', 'governor', 'mayor', 'officer', 'police', 'sheriff',
    'immigration', 'border', 'security', 'defense', 'military',
    'healthcare', 'medicare', 'medicaid', 'social security',
    'education', 'school', 'university', 'student loan',
    'environment', 'climate', 'epa', 'energy', 'oil', 'gas',
    'infrastructure', 'transportation', 'highway', 'bridge',
    'housing', 'zoning', 'planning', 'development',
    'business', 'corporate', 'trade', 'tariff', 'economy',
    'crime', 'justice', 'prison', 'sentencing',
    'freedom', 'liberty', 'democracy', 'republic'
  ]

  // Filter topics that contain law/government keywords
  const filtered = topics.filter(topic => {
    const titleLower = topic.name.toLowerCase()
    return lawKeywords.some(keyword => titleLower.includes(keyword))
  })

  // If no topics match keywords, return top 5 topics anyway
  // (Google Trends may have relevant topics that don't match keywords)
  if (filtered.length === 0 && topics.length > 0) {
    return topics.slice(0, 5)
  }

  // Return top 10 filtered topics, sorted by relevance
  return filtered
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10)
}

