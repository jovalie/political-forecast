/**
 * Test script for political leaning classification
 * Run with: node scripts/test-political-leaning.js
 */

import { 
  classifyPoliticalLeaning, 
  getPoliticalLeaningLabel, 
  getPoliticalLeaningCategory 
} from '../src/utils/politicalLeaningUtils.js'

const testTopics = [
  // Left-leaning examples
  'bernie sanders medicare for all',
  'green new deal climate change',
  'lgbtq rights marriage equality',
  'gun control background checks',
  'black lives matter racial justice',
  'student loan forgiveness',
  'minimum wage increase',
  
  // Right-leaning examples
  'trump border wall',
  'second amendment gun rights',
  'pro life abortion ban',
  'tax cuts corporate tax',
  'law and order tough on crime',
  'voter id election integrity',
  'religious freedom traditional values',
  
  // Centrist examples
  'bipartisan infrastructure bill',
  'budget compromise',
  'national security cybersecurity',
  'trade agreement',
  
  // Non-political examples
  'weather forecast',
  'sports game',
  'movie release',
  'recipe cooking',
  'technology gadget',
  
  // Ambiguous/neutral
  'supreme court decision',
  'congressional hearing',
  'election results',
  'voting rights act'
]

console.log('Testing Political Leaning Classification\n')
console.log('='.repeat(80))

testTopics.forEach(topic => {
  const score = classifyPoliticalLeaning(topic)
  const label = score !== undefined ? getPoliticalLeaningLabel(score) : 'Non-political'
  const category = score !== undefined ? getPoliticalLeaningCategory(score) : 'non-political'
  
  const scoreDisplay = score !== undefined ? `${score > 0 ? '+' : ''}${score}` : 'N/A'
  
  console.log(`Topic: "${topic}"`)
  console.log(`  Score: ${scoreDisplay} | Label: ${label} | Category: ${category}`)
  console.log('')
})

console.log('='.repeat(80))
console.log('\nClassification complete!')

