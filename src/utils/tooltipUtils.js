/**
 * Generate tooltip text for a state feature
 * @param {Object} feature - GeoJSON feature with properties
 * @returns {string} Tooltip text to display
 */
export function generateTooltipText(feature) {
  if (!feature || !feature.properties) {
    return ''
  }

  const { name, topTopic } = feature.properties

  // If we have topic data, show the top topic
  if (topTopic) {
    return `${name}: ${topTopic}`
  }

  // Fallback to just state name
  return name || ''
}

