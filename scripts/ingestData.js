import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { scrapeGoogleTrends, formatTrendsForOutput } from './webScraper.js'
import { STATE_CODES, STATE_ABBREVIATIONS } from './stateCodes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Output directory for generated JSON files
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data')

/**
 * Delay function for rate limiting
 * @param {number} ms - Milliseconds to delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Process a batch of promises with concurrency limit
 * @param {Array} items - Array of items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} concurrency - Maximum number of concurrent operations
 * @returns {Promise<Array>} Array of results
 */
async function processBatch(items, processor, concurrency = 5) {
  const results = []
  const executing = new Set()
  
  for (const item of items) {
    const promise = (async () => {
      try {
        return await processor(item)
      } finally {
        executing.delete(promise)
      }
    })()
    
    results.push(promise)
    executing.add(promise)
    
    if (executing.size >= concurrency) {
      await Promise.race(executing)
    }
  }
  
  // Wait for all remaining promises to complete
  await Promise.all(executing)
  
  return Promise.all(results)
}

/**
 * Process Google Trends page for a single state using web scraping
 * @param {string} stateName - Full state name
 * @param {Object} options - Scraping options
 * @returns {Promise<Object|null>} State data object or null if failed
 */
async function processState(stateName, options = {}) {

  const geoCode = STATE_CODES[stateName]
  const stateCode = STATE_ABBREVIATIONS[stateName]

  if (!geoCode || !stateCode) {
    console.warn(`No code mapping found for state: ${stateName}`)
    return null
  }

  try {
    console.log(`\nProcessing ${stateName} (${stateCode})...`)
    
    // Scrape Google Trends page
    const trends = await scrapeGoogleTrends(geoCode, options)
    
    if (!trends || trends.length === 0) {
      console.warn(`  No trends found for ${stateName}`)
      return null
    }

    console.log(`  Found ${trends.length} trends`)

    // Format trends for output (already filtered to Law and Government via category=10)
    const formattedTopics = formatTrendsForOutput(trends)
    
    if (formattedTopics.length === 0) {
      console.warn(`  No valid topics extracted for ${stateName}`)
      return null
    }

    // Get top topic
    const topTopic = formattedTopics[0]

    // Create state data object (maintain compatibility with existing structure)
    const stateData = {
      name: stateName,
      code: stateCode,
      topTopic: topTopic.name,
      category: 'Law and Government',
      trendingScore: topTopic.relevanceScore,
      topics: formattedTopics.map(topic => ({
        name: topic.name,
        relevanceScore: topic.relevanceScore,
        category: topic.category,
        // Include additional data if available
        ...(topic.searchVolume && { searchVolume: topic.searchVolume }),
        ...(topic.started && { started: topic.started }),
        ...(topic.trendBreakdown && { trendBreakdown: topic.trendBreakdown }),
        ...(topic.percentageIncrease && { percentageIncrease: topic.percentageIncrease })
      }))
    }

    console.log(`  ✓ Top topic: "${topTopic.name}" (score: ${topTopic.relevanceScore})`)
    if (topTopic.searchVolume) {
      console.log(`    Search volume: ${topTopic.searchVolume}`)
    }
    if (topTopic.started) {
      console.log(`    Started: ${topTopic.started}`)
    }
    
    return stateData

  } catch (error) {
    console.error(`Error processing ${stateName}:`, error.message)
    return null
  }
}

/**
 * Generate timestamp in ISO 8601 format
 * @returns {string} ISO timestamp
 */
function generateTimestamp() {
  return new Date().toISOString()
}

/**
 * Validate state data before saving
 * @param {Object} stateData - State data object
 * @returns {boolean} True if valid
 */
function validateStateData(stateData) {
  return (
    stateData &&
    typeof stateData.name === 'string' &&
    typeof stateData.code === 'string' &&
    typeof stateData.topTopic === 'string' &&
    Array.isArray(stateData.topics) &&
    stateData.topics.length > 0
  )
}

/**
 * Validate that all 50 US states and Puerto Rico are included
 * @param {Array<string>} stateNames - Array of state names to validate
 * @returns {boolean} True if all 50 states and Puerto Rico are present
 */
function validateAllStatesIncluded(stateNames) {
  const requiredStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
    'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming', 'Puerto Rico'
  ]
  
  const stateSet = new Set(stateNames)
  const missing = requiredStates.filter(state => !stateSet.has(state))
  
  if (missing.length > 0) {
    console.warn(`⚠ Missing states/territories: ${missing.join(', ')}`)
    return false
  }
  
  return true
}

/**
 * Main ingestion function
 * @param {Array<string>} stateNames - Optional array of state names to process (default: all states)
 * @param {number} concurrency - Maximum number of concurrent requests (default: 5)
 * @param {Object} options - Scraping options
 */
async function ingestData(stateNames = null, concurrency = 5, options = {}) {
  console.log('Starting Google Trends web scraping data ingestion...\n')

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`Created output directory: ${OUTPUT_DIR}`)
  }

  // Get list of states to process (default: all 50 states + Puerto Rico)
  const statesToProcess = stateNames || Object.keys(STATE_CODES)
  const totalStates = statesToProcess.length
  
  // Validate that all 50 states and Puerto Rico are included
  if (!stateNames) {
    const isValid = validateAllStatesIncluded(statesToProcess)
    if (isValid) {
      console.log(`✓ Verified: All 50 US states and Puerto Rico are included`)
    }
  }
  
  console.log(`Processing ${totalStates} states/territories with concurrency: ${concurrency}...`)

  const results = {
    success: [],
    failed: [],
    skipped: []
  }

  // Track progress
  let completed = 0
  const startTime = Date.now()

  // Process states in parallel batches
  const processStateWithTracking = async (stateName) => {
    const stateData = await processState(stateName, options)
    completed++
    
    const progress = ((completed / totalStates) * 100).toFixed(1)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const avgTime = (elapsed / completed).toFixed(1)
    const remaining = ((totalStates - completed) * avgTime).toFixed(0)
    
    console.log(`Progress: ${completed}/${totalStates} (${progress}%) | Elapsed: ${elapsed}s | Est. remaining: ${remaining}s`)

    if (stateData) {
      if (validateStateData(stateData)) {
        results.success.push(stateData)
      } else {
        console.warn(`  ⚠ Invalid data structure for ${stateName}, skipping`)
        results.skipped.push(stateName)
      }
    } else {
      results.failed.push(stateName)
    }
    
    return stateData
  }

  // Process all states with concurrency limit
  await processBatch(statesToProcess, processStateWithTracking, concurrency)

  // Generate output JSON
  const timestamp = generateTimestamp()
  const outputPath = path.join(OUTPUT_DIR, 'states-topics.json')
  
  // Read existing data if file exists
  let existingData = null
  if (fs.existsSync(outputPath)) {
    try {
      const existingContent = fs.readFileSync(outputPath, 'utf8')
      existingData = JSON.parse(existingContent)
      console.log(`\nFound existing data with ${existingData.states?.length || 0} states`)
    } catch (error) {
      console.warn(`  ⚠ Error reading existing file: ${error.message}`)
      console.warn(`  Will create new file instead`)
    }
  }

  // Merge new states with existing states
  let mergedStates = []
  if (existingData && Array.isArray(existingData.states)) {
    // Create a map of existing states by name for quick lookup
    const existingStatesMap = new Map()
    existingData.states.forEach(state => {
      existingStatesMap.set(state.name, state)
    })

    // Update existing states or add new ones
    results.success.forEach(newState => {
      existingStatesMap.set(newState.name, newState)
    })

    // Convert map back to array
    mergedStates = Array.from(existingStatesMap.values())
    
    console.log(`  Merged ${results.success.length} new/updated states with ${existingData.states.length} existing states`)
    console.log(`  Total states in output: ${mergedStates.length}`)
  } else {
    // No existing data, use only new states
    mergedStates = results.success
    console.log(`  Creating new file with ${mergedStates.length} states`)
  }

  const outputData = {
    timestamp: timestamp,
    states: mergedStates
  }

  // Write to file
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8')

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('Ingestion Summary:')
  console.log('='.repeat(60))
  console.log(`Total states processed: ${totalStates}`)
  console.log(`✓ Successfully processed: ${results.success.length}`)
  console.log(`✗ Failed: ${results.failed.length}`)
  console.log(`⚠ Skipped: ${results.skipped.length}`)
  console.log(`\nOutput file: ${outputPath}`)
  console.log(`Timestamp: ${timestamp}`)

  if (results.failed.length > 0) {
    console.log(`\nFailed states: ${results.failed.join(', ')}`)
  }

  if (results.skipped.length > 0) {
    console.log(`\nSkipped states: ${results.skipped.join(', ')}`)
  }

  return outputData
}

// Run if called directly (ES module pattern)
// Check if this file is being run directly (not imported)
const isMainModule = process.argv[1] && 
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
   process.argv[1].endsWith('ingestData.js'))

if (isMainModule) {
  // Check for command line arguments
  // Join args to handle multi-word state names like "Puerto Rico"
  const args = process.argv.slice(2)
  // Try to match state names - if we have partial matches, combine them
  let stateNames = null
  if (args.length > 0) {
    stateNames = []
    let i = 0
    while (i < args.length) {
      let stateName = args[i]
      // Check if this might be part of a multi-word state name
      if (i < args.length - 1 && !STATE_CODES[stateName] && STATE_CODES[`${stateName} ${args[i + 1]}`]) {
        stateName = `${stateName} ${args[i + 1]}`
        i += 2
      } else {
        i += 1
      }
      stateNames.push(stateName)
    }
  }
  const concurrency = parseInt(process.env.CONCURRENCY || '5', 10)

  ingestData(stateNames, concurrency)
    .then(() => {
      console.log('\n✓ Data ingestion completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n✗ Data ingestion failed:', error)
      process.exit(1)
    })
}

export { ingestData, processState }

