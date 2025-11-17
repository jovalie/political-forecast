/**
 * Convert text to title case (capitalize first letter of each word)
 * @param {string} text - Text to convert to title case
 * @returns {string} Text in title case
 */
export function toTitleCase(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .toLowerCase()
    .split(' ')
    .map((word) => {
      // Capitalize first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Format date from ISO string to "Month Day, Year" format
 * @param {string} isoString - ISO 8601 date string (e.g., "2024-01-15T00:00:00Z")
 * @returns {string} Formatted date (e.g., "January 15, 2024")
 */
function formatDate(isoString) {
  if (!isoString) {
    return ''
  }

  try {
    const date = new Date(isoString)
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

/**
 * Generate tooltip HTML for a state feature
 * @param {Object} feature - GeoJSON feature with properties
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {string} Tooltip HTML to display
 */
export function generateTooltipText(feature, isDark = false) {
  if (!feature || !feature.properties) {
    return ''
  }

  const { name, topTopic, timestamp } = feature.properties

  // Always show a tooltip - if we have topic data, show formatted tooltip with date and styled topic
  if (topTopic && name) {
    const formattedDate = formatDate(timestamp)
    const dateText = formattedDate ? ` - ${formattedDate}` : ''
    const titleCasedTopic = toTitleCase(topTopic)
    
    // Return HTML with styled topic (bold and slightly larger)
    // CSS classes handle theme colors via CSS variables
    return `<div class="tooltip-content" style="text-align: center; line-height: 1.4;">
      <div class="tooltip-header">Most Discussed in ${name}${dateText}</div>
      <div class="tooltip-topic">${titleCasedTopic}</div>
    </div>`
  }

  // Fallback: show state name with a message indicating no data available
  if (name) {
    return `<div class="tooltip-content" style="text-align: center; line-height: 1.4;">
      <div class="tooltip-header">${name}</div>
      <div class="tooltip-topic" style="font-size: 0.9em; opacity: 0.8;">No trending data available</div>
    </div>`
  }

  return ''
}

