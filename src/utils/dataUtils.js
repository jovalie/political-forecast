/**
 * Load JSON data from a URL
 * @param {string} url - URL to fetch JSON from
 * @returns {Promise<Object>} Parsed JSON data
 */
export async function loadJSONData(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error loading JSON from ${url}:`, error)
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
  const stateDataMap = new Map()
  statesData.forEach((state) => {
    stateDataMap.set(state.name, state)
  })

  console.log('mergeTopicDataWithGeoJSON: Created state map with', stateDataMap.size, 'states')
  console.log('Sample state names from map:', Array.from(stateDataMap.keys()).slice(0, 5))

  let mergedCount = 0
  let notFoundCount = 0

  // Merge topic data into GeoJSON features
  const mergedFeatures = geoJSON.features.map((feature) => {
    const stateName = feature.properties?.name
    if (!stateName) {
      return feature
    }

    const topicData = stateDataMap.get(stateName)
    if (!topicData) {
      notFoundCount++
      console.log('State not found in topic data:', stateName)
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

  console.log('mergeTopicDataWithGeoJSON: Merged', mergedCount, 'states,', notFoundCount, 'not found')

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

