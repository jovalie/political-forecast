/**
 * State code mapping for US states and territories
 * Maps state names to Google Trends geo codes
 */
export const STATE_CODES = {
  'Alabama': 'US-AL',
  'Alaska': 'US-AK',
  'Arizona': 'US-AZ',
  'Arkansas': 'US-AR',
  'California': 'US-CA',
  'Colorado': 'US-CO',
  'Connecticut': 'US-CT',
  'Delaware': 'US-DE',
  'Florida': 'US-FL',
  'Georgia': 'US-GA',
  'Hawaii': 'US-HI',
  'Idaho': 'US-ID',
  'Illinois': 'US-IL',
  'Indiana': 'US-IN',
  'Iowa': 'US-IA',
  'Kansas': 'US-KS',
  'Kentucky': 'US-KY',
  'Louisiana': 'US-LA',
  'Maine': 'US-ME',
  'Maryland': 'US-MD',
  'Massachusetts': 'US-MA',
  'Michigan': 'US-MI',
  'Minnesota': 'US-MN',
  'Mississippi': 'US-MS',
  'Missouri': 'US-MO',
  'Montana': 'US-MT',
  'Nebraska': 'US-NE',
  'Nevada': 'US-NV',
  'New Hampshire': 'US-NH',
  'New Jersey': 'US-NJ',
  'New Mexico': 'US-NM',
  'New York': 'US-NY',
  'North Carolina': 'US-NC',
  'North Dakota': 'US-ND',
  'Ohio': 'US-OH',
  'Oklahoma': 'US-OK',
  'Oregon': 'US-OR',
  'Pennsylvania': 'US-PA',
  'Rhode Island': 'US-RI',
  'South Carolina': 'US-SC',
  'South Dakota': 'US-SD',
  'Tennessee': 'US-TN',
  'Texas': 'US-TX',
  'Utah': 'US-UT',
  'Vermont': 'US-VT',
  'Virginia': 'US-VA',
  'Washington': 'US-WA',
  'West Virginia': 'US-WV',
  'Wisconsin': 'US-WI',
  'Wyoming': 'US-WY',
  'Puerto Rico': 'PR',
  'District of Columbia': '511'
}

/**
 * Get state abbreviation from full state name
 */
export const STATE_ABBREVIATIONS = {
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY',
  'Puerto Rico': 'PR',
  'District of Columbia': 'DC'
}

/**
 * Get Google Trends RSS URL for a state
 * @param {string} stateName - Full state name
 * @returns {string|null} RSS feed URL or null if state not found
 */
export function getRSSUrl(stateName) {
  const geoCode = STATE_CODES[stateName]
  if (!geoCode) {
    return null
  }
  return `https://trends.google.com/trending/rss?geo=${geoCode}`
}

