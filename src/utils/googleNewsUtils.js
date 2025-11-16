/**
 * Generate Google News search URL for a topic
 * @param {string} topic - Topic name to search for
 * @returns {string} Google News search URL
 */
export function generateGoogleNewsUrl(topic) {
  if (!topic || typeof topic !== 'string') {
    return ''
  }

  // URL encode the topic name
  const encodedTopic = encodeURIComponent(topic)
  
  // Google News search URL format
  return `https://news.google.com/search?q=${encodedTopic}`
}

