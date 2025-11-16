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

  // If we have topic data, show formatted tooltip with date and styled topic
  if (topTopic && name) {
    const formattedDate = formatDate(timestamp)
    const dateText = formattedDate ? ` - ${formattedDate}` : ''
    
    // Return HTML with styled topic (bold and slightly larger)
    // CSS classes handle theme colors via CSS variables
    return `<div class="tooltip-content" style="text-align: center; line-height: 1.4;">
      <div class="tooltip-header">Most Discussed in ${name}${dateText}</div>
      <div class="tooltip-topic">${topTopic}</div>
    </div>`
  }

  // Fallback to just state name
  return name || ''
}

