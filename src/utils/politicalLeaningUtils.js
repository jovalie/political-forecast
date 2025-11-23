/**
 * Political Leaning Classification Utility
 * 
 * Classifies news topics on a political spectrum scale:
 * - -100 to -50: Far Left / Left Wing
 * - -50 to -10: Left Leaning
 * - -10 to +10: Centrist
 * - +10 to +50: Right Leaning
 * - +50 to +100: Far Right / Right Wing
 * - undefined: Not political / Cannot be determined
 */

// Keywords and phrases that indicate left-leaning political positions
const LEFT_KEYWORDS = [
  // Progressive policies
  'progressive', 'democratic socialist', 'socialist', 'bernie sanders', 'aoc', 'alexandria ocasio-cortez',
  'medicare for all', 'green new deal', 'climate change', 'renewable energy', 'environmental protection',
  'lgbtq rights', 'lgbt rights', 'transgender rights', 'marriage equality', 'pride',
  'minimum wage increase', 'living wage', 'union', 'labor rights', 'workers rights',
  'affordable housing', 'housing crisis', 'student debt', 'student loan forgiveness',
  'gun control', 'gun reform', 'assault weapons ban', 'background checks',
  'immigration reform', 'dreamers', 'daca', 'pathway to citizenship',
  'voting rights', 'voter suppression', 'gerrymandering', 'democracy reform',
  'police reform', 'defund police', 'police accountability', 'criminal justice reform',
  'reproductive rights', 'abortion rights', 'planned parenthood', 'roe v wade',
  'racial justice', 'black lives matter', 'systemic racism', 'equity',
  'wealth tax', 'tax the rich', 'income inequality', 'corporate tax',
  'public option', 'universal healthcare', 'single payer', 'healthcare reform',
  'free college', 'public education', 'education funding',
  'net neutrality', 'privacy rights', 'data protection',
  'warren', 'sanders', 'ocasio-cortez', 'pressley', 'tlaib', 'omar'
]

// Keywords and phrases that indicate right-leaning political positions
const RIGHT_KEYWORDS = [
  // Conservative policies
  'conservative', 'republican', 'trump', 'desantis', 'pence', 'mcconnell', 'cruz', 'hawley',
  'tax cuts', 'tax reduction', 'corporate tax cut', 'tax reform',
  'second amendment', 'gun rights', 'concealed carry', 'stand your ground',
  'border security', 'border wall', 'illegal immigration', 'immigration enforcement',
  'pro life', 'pro-life', 'abortion ban', 'right to life', 'unborn',
  'religious freedom', 'religious liberty', 'christian values', 'traditional values',
  'school choice', 'vouchers', 'charter schools', 'homeschooling',
  'deregulation', 'regulatory reform', 'small government', 'limited government',
  'free market', 'capitalism', 'free enterprise', 'economic freedom',
  'military spending', 'defense budget', 'veterans', 'support our troops',
  'law and order', 'tough on crime', 'death penalty', 'capital punishment',
  'voter id', 'voter identification', 'election integrity', 'voter fraud',
  'energy independence', 'oil drilling', 'fracking', 'coal', 'fossil fuels',
  'states rights', 'federalism', 'constitutional rights',
  'family values', 'traditional marriage', 'pro-family',
  'welfare reform', 'work requirements', 'welfare to work',
  'supreme court', 'judicial appointments', 'originalism', 'textualism',
  'cancel culture', 'woke', 'critical race theory', 'crt'
]

// Keywords that indicate centrist or bipartisan positions
const CENTRIST_KEYWORDS = [
  'bipartisan', 'compromise', 'moderate', 'centrist', 'independent',
  'infrastructure', 'roads', 'bridges', 'transportation',
  'cybersecurity', 'national security', 'homeland security',
  'trade agreement', 'trade deal', 'nafta', 'usmca',
  'budget', 'debt ceiling', 'government shutdown', 'appropriations'
]

// Keywords that are explicitly non-political
const NON_POLITICAL_KEYWORDS = [
  'weather', 'sports', 'entertainment', 'music', 'movie', 'tv show',
  'recipe', 'cooking', 'food', 'restaurant', 'shopping', 'sale',
  'technology', 'gadget', 'app', 'software', 'game', 'video game',
  'health', 'fitness', 'exercise', 'diet', 'medical', 'disease',
  'science', 'research', 'study', 'discovery', 'space', 'astronomy'
]

/**
 * Calculate political leaning score for a topic
 * @param {string} topicName - The topic name to classify
 * @returns {number|undefined} - Score from -100 to +100, or undefined if not political
 */
export function classifyPoliticalLeaning(topicName) {
  if (!topicName || typeof topicName !== 'string') {
    return undefined
  }

  const normalized = topicName.toLowerCase().trim()

  // Check for non-political keywords first
  if (NON_POLITICAL_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return undefined
  }

  let leftScore = 0
  let rightScore = 0
  let centristScore = 0

  // Score left-leaning keywords
  LEFT_KEYWORDS.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    if (normalized.includes(keywordLower)) {
      // Longer/more specific matches get higher scores
      const weight = keyword.split(' ').length * 3
      leftScore += weight
    }
  })

  // Score right-leaning keywords
  RIGHT_KEYWORDS.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    if (normalized.includes(keywordLower)) {
      const weight = keyword.split(' ').length * 3
      rightScore += weight
    }
  })

  // Score centrist keywords
  CENTRIST_KEYWORDS.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    if (normalized.includes(keywordLower)) {
      const weight = keyword.split(' ').length * 2
      centristScore += weight
    }
  })

  // If no political keywords found, return undefined
  if (leftScore === 0 && rightScore === 0 && centristScore === 0) {
    return undefined
  }

  // Calculate final score
  // Negative = left, positive = right
  // So: leftScore should make score negative, rightScore should make score positive
  const netScore = rightScore - leftScore  // Inverted: right is positive, left is negative
  
  // Centrist keywords pull score toward center
  const centristModifier = Math.min(centristScore * 0.3, Math.abs(netScore))
  
  let finalScore = netScore > 0 
    ? netScore - centristModifier 
    : netScore + centristModifier

  // Normalize to -100 to +100 range
  // Scale based on total score to get more nuanced results
  const totalScore = leftScore + rightScore + centristScore
  if (totalScore > 0) {
    // Scale to make scores more meaningful, but don't over-scale
    const scaleFactor = Math.min(100 / totalScore, 1)
    finalScore = finalScore * scaleFactor
  }

  // Cap at ±100
  if (finalScore > 100) finalScore = 100
  if (finalScore < -100) finalScore = -100

  // Round to nearest integer
  return Math.round(finalScore)
}

/**
 * Get political leaning label from score
 * @param {number|undefined} score - Political leaning score
 * @returns {string} - Human-readable label
 */
export function getPoliticalLeaningLabel(score) {
  if (score === undefined || score === null) {
    return 'Non-political'
  }

  if (score <= -50) return 'Far Left'
  if (score <= -10) return 'Left Leaning'
  if (score <= 10) return 'Centrist'
  if (score <= 50) return 'Right Leaning'
  return 'Far Right'
}

/**
 * Get political leaning category for styling
 * @param {number|undefined} score - Political leaning score
 * @returns {string} - CSS class category
 */
export function getPoliticalLeaningCategory(score) {
  if (score === undefined || score === null) {
    return 'non-political'
  }

  if (score <= -50) return 'far-left'
  if (score <= -10) return 'left-leaning'
  if (score <= 10) return 'centrist'
  if (score <= 50) return 'right-leaning'
  return 'far-right'
}

/**
 * Get color for political leaning visualization
 * @param {number|undefined} score - Political leaning score
 * @param {boolean} isDark - Whether dark theme is active
 * @returns {string} - CSS color value
 */
export function getPoliticalLeaningColor(score, isDark = false) {
  if (score === undefined || score === null) {
    return isDark ? '#666666' : '#999999'
  }

  // Blue gradient for left, red gradient for right
  // More saturated = more extreme
  const absScore = Math.abs(score)
  const intensity = Math.min(absScore / 100, 1)

  if (score < 0) {
    // Left: Blue shades
    const r = Math.round(50 + (intensity * 100))
    const g = Math.round(100 + (intensity * 50))
    const b = Math.round(200 + (intensity * 55))
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Right: Red shades
    const r = Math.round(200 + (intensity * 55))
    const g = Math.round(50 + (intensity * 50))
    const b = Math.round(50 + (intensity * 50))
    return `rgb(${r}, ${g}, ${b})`
  }
}

