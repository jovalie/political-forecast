/**
 * Add political leaning classifications to existing data file
 * Run with: node scripts/add-political-leaning-to-existing-data.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Inline classification function (same as in webScraper.js)
function classifyPoliticalLeaning(topicName) {
  if (!topicName || typeof topicName !== 'string') {
    return undefined
  }

  const normalized = topicName.toLowerCase().trim()

  const LEFT_KEYWORDS = [
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
    'warren', 'sanders', 'ocasio-cortez', 'pressley', 'tlaib', 'omar'
  ]

  const RIGHT_KEYWORDS = [
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

  const CENTRIST_KEYWORDS = [
    'bipartisan', 'compromise', 'moderate', 'centrist', 'independent',
    'infrastructure', 'roads', 'bridges', 'transportation',
    'cybersecurity', 'national security', 'homeland security',
    'trade agreement', 'trade deal', 'nafta', 'usmca',
    'budget', 'debt ceiling', 'government shutdown', 'appropriations'
  ]

  const NON_POLITICAL_KEYWORDS = [
    'weather', 'sports', 'entertainment', 'music', 'movie', 'tv show',
    'recipe', 'cooking', 'food', 'restaurant', 'shopping', 'sale',
    'technology', 'gadget', 'app', 'software', 'game', 'video game',
    'health', 'fitness', 'exercise', 'diet', 'medical', 'disease',
    'science', 'research', 'study', 'discovery', 'space', 'astronomy'
  ]

  if (NON_POLITICAL_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return undefined
  }

  let leftScore = 0
  let rightScore = 0
  let centristScore = 0

  LEFT_KEYWORDS.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    if (normalized.includes(keywordLower)) {
      const weight = keyword.split(' ').length * 3
      leftScore += weight
    }
  })

  RIGHT_KEYWORDS.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    if (normalized.includes(keywordLower)) {
      const weight = keyword.split(' ').length * 3
      rightScore += weight
    }
  })

  CENTRIST_KEYWORDS.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    if (normalized.includes(keywordLower)) {
      const weight = keyword.split(' ').length * 2
      centristScore += weight
    }
  })

  if (leftScore === 0 && rightScore === 0 && centristScore === 0) {
    return undefined
  }

  const netScore = rightScore - leftScore
  const centristModifier = Math.min(centristScore * 0.3, Math.abs(netScore))
  
  let finalScore = netScore > 0 
    ? netScore - centristModifier 
    : netScore + centristModifier

  const totalScore = leftScore + rightScore + centristScore
  if (totalScore > 0) {
    const scaleFactor = Math.min(100 / totalScore, 1)
    finalScore = finalScore * scaleFactor
  }

  if (finalScore > 100) finalScore = 100
  if (finalScore < -100) finalScore = -100

  return Math.round(finalScore)
}

// Read existing data
const dataPath = path.join(__dirname, '..', 'public', 'data', 'states-topics.json')

console.log('Reading existing data...')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

let totalTopics = 0
let classifiedTopics = 0

// Add political leaning to all topics
data.states.forEach(state => {
  if (state.topics && Array.isArray(state.topics)) {
    state.topics.forEach(topic => {
      totalTopics++
      if (topic.politicalLeaning === undefined || topic.politicalLeaning === null) {
        const leaning = classifyPoliticalLeaning(topic.name)
        if (leaning !== undefined) {
          topic.politicalLeaning = leaning
          classifiedTopics++
        }
      } else {
        classifiedTopics++
      }
    })
  }
})

// Write updated data
console.log(`\nClassifying topics...`)
console.log(`Total topics: ${totalTopics}`)
console.log(`Classified topics: ${classifiedTopics}`)

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
console.log(`\n✓ Updated ${dataPath} with political leaning classifications`)

// Also update individual state files
const statesDir = path.join(__dirname, '..', 'public', 'data', 'states')
if (fs.existsSync(statesDir)) {
  console.log('\nUpdating individual state files...')
  const stateFiles = fs.readdirSync(statesDir).filter(f => f.endsWith('.json'))
  
  stateFiles.forEach(file => {
    const filePath = path.join(statesDir, file)
    const stateData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    if (stateData.states && Array.isArray(stateData.states) && stateData.states.length > 0) {
      const state = stateData.states[0]
      if (state.topics && Array.isArray(state.topics)) {
        state.topics.forEach(topic => {
          if (topic.politicalLeaning === undefined || topic.politicalLeaning === null) {
            const leaning = classifyPoliticalLeaning(topic.name)
            if (leaning !== undefined) {
              topic.politicalLeaning = leaning
            }
          }
        })
      }
      
      fs.writeFileSync(filePath, JSON.stringify(stateData, null, 2), 'utf8')
    }
  })
  
  console.log(`✓ Updated ${stateFiles.length} individual state files`)
}

console.log('\n✓ All done! Political leaning has been added to existing data.')

