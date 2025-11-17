import puppeteer from 'puppeteer'

/**
 * Generate Google Trends URL for a state/region
 * @param {string} geoCode - Geo code (e.g., 'US-CA', 'PR')
 * @returns {string} Google Trends URL
 */
export function getTrendsUrl(geoCode) {
  return `https://trends.google.com/trending?geo=${geoCode}&hl=en-US&category=10`
}

/**
 * Extract trends data from Google Trends page
 * @param {puppeteer.Page} page - Puppeteer page object
 * @returns {Promise<Array>} Array of trend objects
 */
async function extractTrendsFromPage(page) {
  // Wait for content to load - Google Trends uses dynamic content
  try {
    // Wait for any content that indicates trends are loaded
    await page.waitForSelector('body', { timeout: 15000 })
    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Scroll page to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.warn('Page load timeout, proceeding anyway...')
  }

  // Extract trends using JavaScript evaluation in the browser context
  const result = await page.evaluate(() => {
    const trendsData = []
    const debugInfo = {
      tableCount: 0,
      rowCount: 0,
      sampleRows: [],
      processedRows: [],
      skippedRows: []
    }
    
    // Method 0: Look for table rows with role="row" containing trend data
    // Google Trends uses a table structure with cells containing the data
    const tableRows = Array.from(document.querySelectorAll('[role="row"], table tbody tr, table tr'))
      .filter(row => {
        // Skip header rows (th elements or columnheader role)
        if (row.querySelector('th') || 
            row.getAttribute('role') === 'rowheader' ||
            row.querySelector('[role="columnheader"]')) {
          return false
        }
        // Check if row has cells with trend data
        const cells = Array.from(row.querySelectorAll('[role="cell"], td'))
        if (cells.length < 3) return false
        
        // Check if second cell contains volume indicators (1K+, 500+, etc.)
        const cell2Text = cells[1] ? cells[1].textContent.trim() : ''
        if (!cell2Text) return false
        
        // Must have volume indicators to be a valid trend row
        // Look for patterns like "1K+ searches", "500+ searches", etc.
        // Not just any occurrence of "searches" (which might be in UI text)
        const hasVolume = /\d+[KMB]?\+.*searches/.test(cell2Text) || 
                         /searches.*\d+[KMB]?\+/.test(cell2Text) ||
                         /\d+[KMB]?\+/.test(cell2Text)
        if (!hasVolume) return false
        
        // Filter out UI text - check if it's clearly a header/UI element
        const cell2Lower = cell2Text.toLowerCase()
        const isUI = cell2Lower.includes('trend breakdown') ||
                     cell2Lower.includes('search trends') ||
                     cell2Lower.includes('sort by') ||
                     (cell2Lower.includes('started') && !cell2Lower.includes('ago')) ||
                     (cell2Lower.includes('search volume') && !cell2Lower.includes('searches')) ||
                     cell2Lower === 'trend breakdown' ||
                     cell2Lower.trim() === 'trend breakdown'
        
        return !isUI
      })
    
    if (tableRows.length > 0) {
      debugInfo.tableCount = 1
      debugInfo.rowCount = tableRows.length
      
      tableRows.forEach((row, index) => {
        try {
          const cells = Array.from(row.querySelectorAll('[role="cell"], td'))
          if (cells.length < 3) return
          
          // Cell 1 (index 0): Checkbox - skip
          // Cell 2 (index 1): Contains title, volume, and time info
          // Cell 3 (index 2): Search volume with percentage
          // Cell 4 (index 3): Started time
          // Cell 5 (index 4): Trend breakdown
          
          const cell2Text = cells[1] ? cells[1].textContent.trim() : ''
          const cell3Text = cells[2] ? cells[2].textContent.trim() : ''
          const cell4Text = cells[3] ? cells[3].textContent.trim() : ''
          const cell5Text = cells[4] ? cells[4].textContent.trim() : ''
          
          // Extract title from cell 2 - format: "venezuelan military 1K+ searches · timelapse Lasted 4 hr · 6h ago"
          // Title is everything before the first number+volume pattern
          let title = ''
          const titleMatch = cell2Text.match(/^([a-zA-Z][a-zA-Z\s]+?)(?=\d+[KMB]?\+)/)
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim()
          } else {
            // Fallback: extract first words before volume
            const words = cell2Text.split(/\s+/)
            const titleWords = []
            for (const word of words) {
              if (/\d/.test(word) || /[KMB]\+/.test(word) || 
                  ['searches', 'timelapse', 'Lasted', 'ago', 'hr'].includes(word.toLowerCase())) {
                break
              }
              if (word.length > 0) {
                titleWords.push(word)
                if (titleWords.length >= 6) break
              }
            }
            title = titleWords.join(' ').trim()
          }
          
          // Clean up title
          title = title.replace(/[·\s\-_]+$/, '').trim()
          
          // Filter out UI elements - be very strict
          const titleLower = title.toLowerCase().trim()
          const uiKeywords = ['trend breakdown', 'search trends', 'sort by', 'trend status', 
                             'select', 'filter', 'more action', 'explore', 'search it',
                             'started', 'search volume', 'rows per page', 'showing']
          if (uiKeywords.some(keyword => titleLower.includes(keyword))) {
            debugInfo.skippedRows.push({ index, reason: 'UI element', title: title })
            return
          }
          
          // Also check if title is exactly a UI phrase (case-insensitive)
          const exactUI = ['trend breakdown', 'search trends', 'sort by', 'trend status']
          if (exactUI.some(phrase => titleLower === phrase.toLowerCase())) {
            debugInfo.skippedRows.push({ index, reason: 'exact UI match', title: title })
            return
          }
          
          if (!title || title.length < 2 || title.length > 100) {
            debugInfo.skippedRows.push({ index, reason: 'invalid title', title: title || '(empty)' })
            return
          }
          
          // Extract search volume from cell 2 or cell 3
          // Cell 2 format: "venezuelan military 1K+ searches"
          // Cell 3 format: "1K + arrow_upward 500%"
          // Exclude years (4-digit numbers starting with 20xx) from matching
          let searchVolume = 'N/A'
          // Pattern: 1-3 digits (not starting with 20 to avoid years) followed by optional K/M/B and +
          // Look for patterns like "1K+", "500+", "200+" but not "2025" or "2025200+"
          const volumeMatch2 = cell2Text.match(/\b([1-9]\d{0,2}[KMB]?\+?)(?:\s*searches|arrow|%|$)/i)
          const volumeMatch3 = cell3Text.match(/\b([1-9]\d{0,2}[KMB]?\+?)(?:\s*arrow|%|$)/i)
          
          // Filter out matches that start with "20" (years) or are too long (likely concatenated)
          if (volumeMatch2 && volumeMatch2[1] && !volumeMatch2[1].startsWith('20') && volumeMatch2[1].length <= 5) {
            searchVolume = volumeMatch2[1]
          } else if (volumeMatch3 && volumeMatch3[1] && !volumeMatch3[1].startsWith('20') && volumeMatch3[1].length <= 5) {
            searchVolume = volumeMatch3[1]
          }
          
          // Extract percentage increase from all cells (Google Trends structure may vary)
          // Format: "+500%", "500%", "arrow_upward 500%", "↑ 500%", "1,000%", "1000%", etc.
          // Handle multi-digit percentages (up to 6 digits like 100000%)
          let percentageIncrease = null
          
          // Check all cells for percentage (cell 2, 3, 4, etc.)
          const allCellTexts = [cell2Text, cell3Text, cell4Text, cell5Text].filter(t => t && t.length > 0)
          
          // Also check the entire row text for percentage
          const rowText = row.textContent.trim()
          allCellTexts.push(rowText)
          
          for (const cellText of allCellTexts) {
            // Try multiple patterns to catch different formats
            // Pattern 1: "+500%" or "+1000%" or "+1,000%" (with plus sign, with or without comma)
            let percentageMatch = cellText.match(/\+([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
            
            // Pattern 2: After arrow indicators (various formats)
            if (!percentageMatch) {
              percentageMatch = cellText.match(/(?:arrow[_\s]*upward|arrow[_\s]*down|↑|↓|up|down|trending[_\s]*up|trending[_\s]*down)[\s]*[+\-]?([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
            }
            
            // Pattern 3: Standalone percentage with word boundaries (with or without comma)
            if (!percentageMatch) {
              percentageMatch = cellText.match(/(?:^|\s|>|&lt;)([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%(?:\s|$|&lt;|>)/i)
            }
            
            // Pattern 4: Any percentage in the cell (more permissive, with or without comma)
            if (!percentageMatch) {
              percentageMatch = cellText.match(/\b([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%\b/i)
            }
            
            // Pattern 5: Percentage without word boundaries (catch edge cases)
            if (!percentageMatch) {
              percentageMatch = cellText.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
            }
            
            if (percentageMatch) {
              // Extract the number (could be in match[1] or match[2] depending on pattern)
              let matchedNumber = percentageMatch[2] || percentageMatch[1]
              
              // Remove commas if present
              if (matchedNumber) {
                matchedNumber = matchedNumber.replace(/,/g, '')
              }
              
              // Validate it's a proper number (not "000", must be "0" or start with 1-9)
              if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                  (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                percentageIncrease = matchedNumber + '%'
                break // Found it, stop looking
              }
            }
          }
          
          // Also check aria-labels and data attributes for percentage
          if (!percentageIncrease) {
            const rowElement = row
            if (rowElement) {
              // Check aria-label
              const ariaLabel = rowElement.getAttribute('aria-label') || ''
              const ariaMatch = ariaLabel.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
              if (ariaMatch) {
                let matchedNumber = ariaMatch[2] || ariaMatch[1]
                if (matchedNumber) {
                  matchedNumber = matchedNumber.replace(/,/g, '')
                  if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                      (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                    percentageIncrease = matchedNumber + '%'
                  }
                }
              }
              
              // Check data attributes
              if (!percentageIncrease) {
                const dataAttrs = Array.from(rowElement.attributes)
                  .filter(attr => attr.name.startsWith('data-'))
                  .map(attr => attr.value)
                  .join(' ')
                const dataMatch = dataAttrs.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
                if (dataMatch) {
                  let matchedNumber = dataMatch[2] || dataMatch[1]
                  if (matchedNumber) {
                    matchedNumber = matchedNumber.replace(/,/g, '')
                    if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                        (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                      percentageIncrease = matchedNumber + '%'
                    }
                  }
                }
              }
              
              // Check all child elements for percentage in their text or attributes
              if (!percentageIncrease) {
                const allElements = rowElement.querySelectorAll('*')
                for (const el of allElements) {
                  const elText = el.textContent || ''
                  const elMatch = elText.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
                  if (elMatch) {
                    let matchedNumber = elMatch[2] || elMatch[1]
                    if (matchedNumber) {
                      matchedNumber = matchedNumber.replace(/,/g, '')
                      if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                          (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                        percentageIncrease = matchedNumber + '%'
                        break
                      }
                    }
                  }
                  
                  // Also check element attributes
                  if (!percentageIncrease) {
                    const elAriaLabel = el.getAttribute('aria-label') || ''
                    const elAriaMatch = elAriaLabel.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
                    if (elAriaMatch) {
                      let matchedNumber = elAriaMatch[2] || elAriaMatch[1]
                      if (matchedNumber) {
                        matchedNumber = matchedNumber.replace(/,/g, '')
                        if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                            (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                          percentageIncrease = matchedNumber + '%'
                          break
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Extract started time from cell 2 or cell 4
          // Cell 2 format: "6h ago" or "6 hour ago"
          // Cell 4 format: "6 hour ago timelapse Lasted 4 hr"
          let started = 'N/A'
          const timeMatches = [
            cell2Text.match(/(\d+\s*hours?\s*ago|\d+h\s*ago|\d+\s*days?\s*ago|\d+\s*minutes?\s*ago)/i),
            cell4Text.match(/(\d+\s*hours?\s*ago|\d+h\s*ago|\d+\s*days?\s*ago|\d+\s*minutes?\s*ago)/i)
          ].filter(m => m !== null)
          
          if (timeMatches.length > 0) {
            started = timeMatches[0][0]
          }
          
          // Extract trend breakdown from cell 5
          // Format: "venezuela venezuela Search term query_stat Explore"
          // Sometimes text is concatenated like "venezuelavenezuelaSearch"
          let trendBreakdown = null
          if (cell5Text) {
            // First, try to split on whitespace
            let breakdownWords = cell5Text.split(/\s+/)
            
            // If no spaces found, try to split on word boundaries (capital letters or common separators)
            if (breakdownWords.length === 1 && breakdownWords[0].length > 10) {
              const text = breakdownWords[0]
              // Try splitting on capital letters (e.g., "venezuelaVenezuelaSearch" -> ["venezuela", "Venezuela", "Search"])
              breakdownWords = text.split(/(?=[A-Z])/).filter(w => w.length > 0)
              // If that didn't work, try splitting on common word boundaries
              if (breakdownWords.length === 1) {
                breakdownWords = text.split(/(?=[A-Z])|(?<=[a-z])(?=[A-Z])/).filter(w => w.length > 0)
              }
            }
            
            // Filter out UI words and invalid entries
            breakdownWords = breakdownWords
              .map(w => w.trim())
              .filter(w => {
                const word = w.replace(/[^a-zA-Z]/g, '') // Remove non-alphabetic chars for comparison
                return word.length > 2 && 
                       word.length < 30 &&
                       !['Search', 'term', 'query', 'stat', 'Explore', 'more', 'action', 
                         'query_stat', 'Explore', 'more_vert', 'More', 'action', 'termquery',
                         'Searchterm', 'querystat'].includes(word) &&
                       !word.toLowerCase().includes('search') &&
                       !word.toLowerCase().includes('query') &&
                       /^[a-zA-Z]+$/.test(word) // Only alphabetic words
              })
            
            if (breakdownWords.length > 0) {
              // Get the first valid word (sometimes it's repeated like "venezuela venezuela")
              const candidate = breakdownWords[0].trim().replace(/[^a-zA-Z]/g, '')
              if (candidate.length > 2 && candidate.length < 30 && 
                  candidate.toLowerCase() !== title.toLowerCase()) {
                trendBreakdown = candidate
              }
            }
          }
          
          // Find link to trend details
          const linkElement = row.querySelector('a[href*="/trending"]')
          const linkUrl = linkElement ? linkElement.href : null
          
          trendsData.push({
            title: title,
            searchVolume: searchVolume,
            started: started,
            trendBreakdown: trendBreakdown,
            percentageIncrease: percentageIncrease,
            link: linkUrl || null,
            index: trendsData.length
          })
          
          debugInfo.processedRows.push({
            index,
            title,
            searchVolume,
            started,
            trendBreakdown,
            percentageIncrease: percentageIncrease || null
          })
        } catch (error) {
          debugInfo.skippedRows.push({ index, reason: 'extraction error', error: error.message })
        }
      })
      
      // Final validation: filter out any UI elements that slipped through
      const validTrends = trendsData.filter(trend => {
        const titleLower = trend.title.toLowerCase().trim()
        const uiKeywords = ['trend breakdown', 'search trends', 'sort by', 'trend status', 
                           'select', 'filter', 'more action', 'explore', 'search it',
                           'started', 'search volume', 'rows per page', 'showing']
        const isUI = uiKeywords.some(keyword => titleLower.includes(keyword))
        const hasValidData = trend.searchVolume !== 'N/A' && trend.started !== 'N/A'
        return !isUI && hasValidData
      })
      
      if (validTrends.length > 0) {
        return {
          trends: validTrends,
          debugInfo: debugInfo
        }
      }
    }
    
    // Method 0: Look for embedded JSON data in script tags (skip for now to prioritize table extraction)
    // This can be re-enabled later if needed
    
    // Filter out UI/navigation elements
    const uiKeywords = ['sign in', 'sign out', 'menu', 'search', 'trending now', 'explore', 'home', 
                       'close', 'back', 'next', 'previous', 'more', 'less', 'show', 'hide',
                       'trending_up', 'trending_down', 'arrow', 'icon', 'button', 'trend status',
                       'select country', 'select', 'filter', 'sort', 'view', 'settings', 'options']
    
    const isUIElement = (text) => {
      if (!text || text.length < 3 || text.length > 100) return true
      if (/^[^a-zA-Z]/.test(text)) return true // Starts with non-letter
      
      const lower = text.toLowerCase()
      // Check for UI keywords
      if (uiKeywords.some(keyword => lower.includes(keyword))) return true
      
      // Don't filter out valid trend titles just because they're lowercase
      // Many trends are lowercase (e.g., "oj simpson", "ifc", "caltrans")
      // Only filter if it's a single short word that matches UI patterns
      const words = text.split(/\s+/)
      if (words.length === 1 && text.length < 4) {
        // Very short single words might be UI
        return ['the', 'and', 'or', 'but', 'for', 'with', 'from'].includes(lower)
      }
      
      return false
    }
    
    // Google Trends uses various structures - try multiple approaches
    // Method 1: Look for article elements (common in modern Google Trends)
    const articles = document.querySelectorAll('article, [role="article"]')
    if (articles.length > 0) {
      articles.forEach((article, index) => {
        try {
          // Find title - could be in h2, h3, a, or div
          const titleEl = article.querySelector('h2, h3, h4, a[href*="/trending"], .trend-title, [data-title]')
          const title = titleEl ? titleEl.textContent.trim() : null
          
          if (!title || title.length === 0 || isUIElement(title)) return
          
          // Find search volume - often in spans or divs with specific classes
          // Look for elements containing volume indicators
          const volumeEl = Array.from(article.querySelectorAll('[data-volume], .search-volume, .volume, span, div'))
            .find(el => {
              const text = el.textContent.trim()
              return text.match(/^\d+[KMB]?\+?$/) || text.includes('+') || text.toLowerCase().includes('volume')
            })
          const searchVolume = volumeEl ? volumeEl.textContent.trim() : null
          
          // Find "started" time - often contains "ago", "hour", "day"
          const startedEl = Array.from(article.querySelectorAll('span, div, time')).find(el => {
            const text = el.textContent.toLowerCase()
            return text.includes('ago') || text.includes('hour') || text.includes('day') || text.includes('started')
          })
          const started = startedEl ? startedEl.textContent.trim() : null
          
          // Find link
          const linkEl = article.querySelector('a[href*="/trending"]')
          const link = linkEl ? linkEl.href : null
          
          trendsData.push({
            title,
            searchVolume: searchVolume || 'N/A',
            started: started || 'N/A',
            trendBreakdown: null,
            link: link || null,
            index
          })
        } catch (error) {
          console.error(`Error extracting article ${index}:`, error)
        }
      })
      
      if (trendsData.length > 0) {
        return trendsData
      }
    }
    
    // Method 2: Look for table structure with specific Google Trends format
    // Google Trends uses a table with columns: Trends, Search volume, Started, Trend breakdown
    // Also check for div-based table layouts
    let tables = Array.from(document.querySelectorAll('table'))
    
    // Also look for div-based table structures (Google sometimes uses these)
    const divTables = Array.from(document.querySelectorAll('[role="table"], .table, [data-table]'))
    divTables.forEach(div => {
      // Check if it has table-like structure
      const rows = div.querySelectorAll('[role="row"], .row, tr, > div')
      if (rows.length > 1) {
        tables.push(div)
      }
    })
    
    if (tables.length > 0) {
      tables.forEach((table, tableIndex) => {
        // Skip tables in navigation/header areas
        if (table.closest('header, nav, [role="banner"], [role="navigation"]')) {
          return
        }
        
        // Check if this table has the Google Trends structure
        const headers = Array.from(table.querySelectorAll('th, thead td, thead th'))
        const headerText = headers.map(h => h.textContent.toLowerCase()).join(' ')
        const isTrendsTable = headerText.includes('trend') && 
                              (headerText.includes('volume') || headerText.includes('started'))
        
        // Get rows - handle both table and div-based structures
        let rows = Array.from(table.querySelectorAll('tbody tr, tr'))
        if (rows.length === 0) {
          // Try div-based rows
          rows = Array.from(table.querySelectorAll('[role="row"], .row, > div'))
        }
        
        // Debug: Collect table info
        if (tableIndex === 0 && rows.length > 0) {
          debugInfo.tableCount++
          debugInfo.rowCount += rows.length
          // Collect info for all rows (or at least first 10)
          rows.slice(0, 10).forEach((row, idx) => {
            const cells = Array.from(row.querySelectorAll('td, th, [role="cell"]'))
            if (cells.length === 0) {
              cells = Array.from(row.children).filter(el => 
                el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE'
              )
            }
            const rowText = row.textContent.trim().substring(0, 150)
            debugInfo.sampleRows.push({
              index: idx,
              cellCount: cells.length,
              text: rowText || '(empty)',
              isHeader: row.querySelector('th') !== null,
              hasVolume: /(\d+[KMB]?\+?)/.test(rowText),
              hasTime: /(\d+\s*(hour|day|minute)s?\s*ago)/i.test(rowText)
            })
          })
        }
        rows.forEach((row, index) => {
          try {
            const isHeader = row.querySelector('th') !== null || 
                            (headers.length > 0 && index === 0 && isTrendsTable)
            if (isHeader) return

            // Extract data from row text directly - Google Trends concatenates all cell text
            // Row text format: "venezuelan military1K+ searches·timelapseLasted 4 hr·5h ago1K+..."
            const rowText = row.textContent.trim()
            
            // Skip empty rows or very short rows
            if (!rowText || rowText.length < 10) {
              if (index >= 2 && index <= 5) {
                debugInfo.skippedRows.push({ index, reason: 'too short', length: rowText ? rowText.length : 0 })
              }
              return
            }
            
            // Skip UI rows (header text, navigation, etc.) - but be less aggressive
            // Only skip if it's clearly UI, not just because it's lowercase
            const lowerText = rowText.toLowerCase()
            const isClearlyUI = lowerText.includes('sign in') || 
                               lowerText.includes('trend breakdown') ||
                               lowerText.includes('search trends') ||
                               lowerText.includes('sort by') ||
                               (rowText.length < 20 && isUIElement(rowText))
            
            if (isClearlyUI) {
              if (index >= 2 && index <= 5) {
                debugInfo.skippedRows.push({ index, reason: 'UI element', text: rowText.substring(0, 50) })
              }
              return
            }
            
            // Extract title - first part before volume indicators
            // Pattern examples: "venezuelan military1K+", "ifc1K+", "oj simpson200+"
            let title = ''
            
            // Try to extract title by finding text before first number+K/M/B pattern
            // Handle patterns like "venezuelan military1K+", "ifc1K+", "oj simpson200+"
            // Try multiple patterns to be more robust
            let titleMatch = rowText.match(/^([a-zA-Z][a-zA-Z\s]+?)(?=\d+[KMB]?\+)/)
            
            if (!titleMatch) {
              // Try pattern without requiring space after title (for "ifc1K+")
              titleMatch = rowText.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)*?)(?=\d+[KMB]?\+)/)
            }
            
            if (!titleMatch) {
              // Try extracting first words before any number
              titleMatch = rowText.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)*?)(?=\d)/)
            }
            
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].trim()
            } else {
              // Fallback: extract first words until we hit a number or volume indicator
              const words = rowText.split(/\s+/)
              const titleWords = []
              for (const word of words) {
                // Stop at numbers, volume indicators, or UI terms
                if (/\d/.test(word) || 
                    /[KMB]\+/.test(word) || 
                    ['searches', 'arrow', 'timelapse', 'Lasted', 'ago', 'hr'].includes(word.toLowerCase())) {
                  break
                }
                if (word.length > 0) {
                  titleWords.push(word)
                  if (titleWords.length >= 6) break // Limit to 6 words max
                }
              }
              title = titleWords.join(' ').trim()
            }
            
            // Clean up title - remove any trailing numbers or special chars
            title = title.replace(/[·\s\-_]+$/, '').trim()
            title = title.replace(/^[\s☑✓✔✗✘○●◯◉]+/, '').trim()
            
            // If title still contains numbers at the end, extract just the text part
            if (title && /\d/.test(title)) {
              const textOnly = title.match(/^([a-zA-Z\s]+)/)
              if (textOnly && textOnly[1]) {
                title = textOnly[1].trim()
              }
            }
            
            // Validate title - be less strict for now
            if (!title || title.length < 2) {
              if (index >= 2 && index <= 5) {
                debugInfo.skippedRows.push({ index, reason: 'no title or too short', title: title || '(empty)' })
              }
              return
            }
            
            if (title.length > 100 || title === '...') {
              if (index >= 2 && index <= 5) {
                debugInfo.skippedRows.push({ index, reason: 'title too long or ellipsis', title: title.substring(0, 50) })
              }
              return
            }
            
            // Only check isUIElement for very obvious UI terms
            const titleLower = title.toLowerCase()
            if (titleLower.includes('trend breakdown') || 
                titleLower.includes('search trends') ||
                titleLower.includes('sort by')) {
              if (index >= 2 && index <= 5) {
                debugInfo.skippedRows.push({ index, reason: 'UI keyword in title', title: title })
              }
              return
            }

            // Extract search volume - look for patterns like "1K+", "500+", "200+"
            // Exclude years (4-digit numbers starting with 20xx) and large numbers that might be years
            let searchVolume = 'N/A'
            // Pattern: 1-3 digits followed by optional K/M/B and +, but exclude if it starts with 20 (year)
            const volumeMatch = rowText.match(/\b([1-9]\d{0,2}[KMB]?\+?)(?:\s*searches|arrow|%|$)/i)
            if (volumeMatch && volumeMatch[1] && !volumeMatch[1].includes('%') && !volumeMatch[1].startsWith('20')) {
              searchVolume = volumeMatch[1]
            }

            // Extract percentage increase - look for patterns like "+500%", "500%", "1000%", "1,000%", "10000%"
            // Handle multi-digit percentages (up to 6 digits like 100000%)
            // Check multiple patterns to catch different Google Trends formats
            let percentageIncrease = null
            
            // Pattern 1: "+500%" or "+1000%" or "+1,000%" (with plus sign prefix, with or without comma)
            let percentageMatch = rowText.match(/\+([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
            
            // Pattern 2: After arrow indicators (various formats)
            if (!percentageMatch) {
              percentageMatch = rowText.match(/(?:arrow[_\s]*upward|arrow[_\s]*down|↑|↓|up|down|trending[_\s]*up|trending[_\s]*down)[\s]*[+\-]?([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
            }
            
            // Pattern 3: Standalone percentage with word boundaries (with or without comma)
            if (!percentageMatch) {
              percentageMatch = rowText.match(/(?:^|\s|>|&lt;)([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%(?:\s|$|&lt;|>)/i)
            }
            
            // Pattern 4: Any percentage in the row text (more permissive, with or without comma)
            if (!percentageMatch) {
              percentageMatch = rowText.match(/\b([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%\b/i)
            }
            
            // Pattern 5: Percentage without word boundaries (catch edge cases)
            if (!percentageMatch) {
              percentageMatch = rowText.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
            }
            
            if (percentageMatch) {
              // Extract the number (could be in match[1] or match[2] depending on pattern)
              let matchedNumber = percentageMatch[2] || percentageMatch[1]
              
              // Remove commas if present
              if (matchedNumber) {
                matchedNumber = matchedNumber.replace(/,/g, '')
              }
              
              // Validate it's a proper number (not "000", must be "0" or start with 1-9)
              if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                  (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                percentageIncrease = matchedNumber + '%'
              }
            }
            
            // Also check aria-labels and data attributes for percentage
            if (!percentageIncrease) {
              const rowElement = row
              if (rowElement) {
                // Check aria-label
                const ariaLabel = rowElement.getAttribute('aria-label') || ''
                const ariaMatch = ariaLabel.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
                if (ariaMatch) {
                  let matchedNumber = ariaMatch[2] || ariaMatch[1]
                  if (matchedNumber) {
                    matchedNumber = matchedNumber.replace(/,/g, '')
                    if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                        (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                      percentageIncrease = matchedNumber + '%'
                    }
                  }
                }
                
                // Check data attributes
                if (!percentageIncrease) {
                  const dataAttrs = Array.from(rowElement.attributes)
                    .filter(attr => attr.name.startsWith('data-'))
                    .map(attr => attr.value)
                    .join(' ')
                  const dataMatch = dataAttrs.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
                  if (dataMatch) {
                    let matchedNumber = dataMatch[2] || dataMatch[1]
                    if (matchedNumber) {
                      matchedNumber = matchedNumber.replace(/,/g, '')
                      if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                          (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                        percentageIncrease = matchedNumber + '%'
                      }
                    }
                  }
                }
                
                // Check all child elements for percentage in their text or attributes
                if (!percentageIncrease) {
                  const allElements = rowElement.querySelectorAll('*')
                  for (const el of allElements) {
                    const elText = el.textContent || ''
                    const elMatch = elText.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
                    if (elMatch) {
                      let matchedNumber = elMatch[2] || elMatch[1]
                      if (matchedNumber) {
                        matchedNumber = matchedNumber.replace(/,/g, '')
                        if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                            (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                          percentageIncrease = matchedNumber + '%'
                          break
                        }
                      }
                    }
                    
                    // Also check element attributes
                    if (!percentageIncrease) {
                      const elAriaLabel = el.getAttribute('aria-label') || ''
                      const elAriaMatch = elAriaLabel.match(/([+\-]?)([1-9]\d{0,5}(?:,\d{3})*|0)%/i)
                      if (elAriaMatch) {
                        let matchedNumber = elAriaMatch[2] || elAriaMatch[1]
                        if (matchedNumber) {
                          matchedNumber = matchedNumber.replace(/,/g, '')
                          if (matchedNumber && matchedNumber !== '000' && matchedNumber !== '0000' && matchedNumber !== '00000' && matchedNumber !== '000000' && 
                              (matchedNumber === '0' || /^[1-9]/.test(matchedNumber))) {
                            percentageIncrease = matchedNumber + '%'
                            break
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            // Extract started time - look for "X hours ago", "Xh ago", "X days ago"
            let started = 'N/A'
            const timeMatches = [
              rowText.match(/(\d+\s*hours?\s*ago)/i),
              rowText.match(/(\d+h\s*ago)/i),
              rowText.match(/(\d+\s*days?\s*ago)/i),
              rowText.match(/(\d+\s*minutes?\s*ago)/i)
            ].filter(m => m !== null)
            
            if (timeMatches.length > 0) {
              started = timeMatches[0][0]
            }

            // Extract trend breakdown - look for related terms in the row text
            // Usually appears after time info, like "venezuela" in "venezuelan military...venezuela"
            let trendBreakdown = null
            const breakdownMatch = rowText.match(/(?:ago|hr)[^0-9a-z]*([a-z]{3,}(?:\s+[a-z]+)?)(?:Search|query|more|arrow|checklist|E)/i)
            if (breakdownMatch && breakdownMatch[1]) {
              const candidate = breakdownMatch[1].trim().toLowerCase()
              // Make sure it's not the same as the title and is a valid word
              if (candidate.length > 2 && 
                  candidate.length < 30 && 
                  candidate !== title.toLowerCase() &&
                  !isUIElement(candidate)) {
                trendBreakdown = breakdownMatch[1].trim()
              }
            }

            // Try to find link to trend details
            const linkElement = row.querySelector('a[href*="/trending"]')
            const linkUrl = linkElement ? linkElement.href : null

            // Debug: Log extraction for first few trend rows (after all extraction is complete)
            if (index >= 2 && index <= 5) {
              debugInfo.processedRows.push({
                index,
                rowTextStart: rowText.substring(0, 60),
                extractedTitle: title,
                titleLength: title ? title.length : 0,
                isValid: title && title.length >= 2 && title.length <= 100 && !isUIElement(title) && title !== '...',
                searchVolume: searchVolume,
                started: started,
                percentageIncrease: percentageIncrease || null,
                trendBreakdown: trendBreakdown || null
              })
            }

            // Add trend to results
            trendsData.push({
              title: title,
              searchVolume: searchVolume,
              started: started,
              trendBreakdown: trendBreakdown,
              percentageIncrease: percentageIncrease,
              link: linkUrl || null,
              index: trendsData.length
            })
          } catch (error) {
            // Silently continue on error - don't break the whole extraction
          }
        })
      })
      
      if (trendsData.length > 0) {
        return {
          trends: trendsData,
          debugInfo: debugInfo
        }
      }
    }
    
    // Method 3: Look for any links to trending topics (but exclude navigation)
    const allLinks = Array.from(document.querySelectorAll('a[href*="/trending"]'))
    const trendingLinks = allLinks
      .filter(link => {
        const text = link.textContent.trim()
        // Filter out UI elements and ensure reasonable title
        return text.length > 3 && 
               text.length < 200 && 
               !isUIElement(text) &&
               // Exclude links in header/nav areas
               !link.closest('header, nav, [role="banner"], [role="navigation"]')
      })
      .slice(0, 25) // Limit to top 25
    
    if (trendingLinks.length > 0) {
      trendingLinks.forEach((link, index) => {
        const title = link.textContent.trim()
        if (title && title.length > 0 && !isUIElement(title)) {
          // Try to find related info in parent or sibling elements
          const parent = link.closest('div, article, li, tr')
          let searchVolume = null
          let started = null
          
          if (parent) {
            // Look for volume indicators
            const volumeMatch = parent.textContent.match(/(\d+[KMB]?\+?)/)
            if (volumeMatch) {
              searchVolume = volumeMatch[1]
            }
            
            // Look for time indicators
            const timeMatch = parent.textContent.match(/(\d+\s*(hour|day|minute)s?\s*ago|started\s+\d+)/i)
            if (timeMatch) {
              started = timeMatch[0]
            }
          }
          
          trendsData.push({
            title,
            searchVolume: searchVolume || 'N/A',
            started: started || 'N/A',
            trendBreakdown: null,
            link: link.href || null,
            index
          })
        }
      })
      
      if (trendsData.length > 0) {
        return {
          trends: trendsData,
          debugInfo: debugInfo
        }
      }
    }
    
    // Method 4: Fallback - extract any text that looks like a trend title
    // Look for headings or prominent text (but exclude UI)
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .filter(h => {
        const text = h.textContent.trim()
        return text.length > 5 && 
               text.length < 100 && 
               !isUIElement(text) &&
               !text.toLowerCase().includes('trending') && 
               !text.toLowerCase().includes('google') &&
               !h.closest('header, nav, [role="banner"], [role="navigation"]')
      })
      .slice(0, 20)
    
    if (headings.length > 0) {
      headings.forEach((heading, index) => {
        const title = heading.textContent.trim()
        if (title && !isUIElement(title)) {
          trendsData.push({
            title,
            searchVolume: 'N/A',
            started: 'N/A',
            trendBreakdown: null,
            link: null,
            index
          })
        }
      })
    }
    
    // If we got here, no trends were found in tables
    // Return empty results with debug info
    return {
      trends: trendsData,
      debugInfo: debugInfo
    }
  })

  return result
}

/**
 * Scrape Google Trends page for a given geo code
 * @param {string} geoCode - Geo code (e.g., 'US-CA', 'PR')
 * @param {Object} options - Scraping options
 * @param {number} options.timeout - Page load timeout in ms (default: 30000)
 * @param {boolean} options.headless - Run in headless mode (default: true)
 * @returns {Promise<Array>} Array of trend objects
 */
export async function scrapeGoogleTrends(geoCode, options = {}) {
  const { timeout = 30000, headless = true } = options
  
  const url = getTrendsUrl(geoCode)
  console.log(`  Scraping: ${url}`)

  let browser = null
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    // Intercept network responses to capture API data
    const apiData = []
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('trends') || url.includes('api') || url.includes('json')) {
        try {
          const contentType = response.headers()['content-type'] || ''
          if (contentType.includes('json') || url.includes('.json')) {
            const text = await response.text()
            if (text && (text.includes('trend') || text.includes('search') || text.includes('volume'))) {
              try {
                const data = JSON.parse(text)
                apiData.push({ url, data })
              } catch (e) {
                // Not JSON
              }
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    })

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: timeout
    })

    // Wait for the trends table to load
    try {
      await page.waitForSelector('table tbody tr, table tr, [role="table"] tbody tr', { timeout: 10000 })
      console.log('  Trends table found')
    } catch (error) {
      console.log('  Waiting for trends table...')
    }
    
    // Wait a bit more for dynamic content to fully render
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Extract trends with debug info
    const extractionResult = await extractTrendsFromPage(page)
    let trends = extractionResult.trends || []
    const debugInfo = extractionResult.debugInfo || {}
    
    if (debugInfo.tableCount > 0) {
      console.log(`  Found ${debugInfo.tableCount} tables, ${debugInfo.rowCount} total rows`)
      if (debugInfo.sampleRows && debugInfo.sampleRows.length > 0) {
        // Find rows that look like trends
        const trendLikeRows = debugInfo.sampleRows.filter(r => 
          r.hasVolume || r.hasTime || (r.text && r.text.length > 20 && !r.isHeader)
        )
        console.log(`  Rows that look like trends: ${trendLikeRows.length}`)
      }
      if (debugInfo.processedRows && debugInfo.processedRows.length > 0) {
        console.log(`  Extraction attempts:`, JSON.stringify(debugInfo.processedRows.slice(0, 5), null, 2))
      }
      if (debugInfo.skippedRows && debugInfo.skippedRows.length > 0) {
        console.log(`  Skipped rows:`, JSON.stringify(debugInfo.skippedRows.slice(0, 5), null, 2))
      }
    }
    
    // Log API responses for debugging
    if (apiData.length > 0) {
      console.log(`  Intercepted ${apiData.length} API responses`)
    }
    
    // If no trends found from DOM, try extracting from API responses
    if (trends.length === 0 && apiData.length > 0) {
      console.log(`  No trends from DOM, trying to extract from ${apiData.length} API responses...`)
      for (const { data } of apiData) {
        const findTrends = (obj) => {
          if (typeof obj !== 'object' || obj === null) return []
          const found = []
          
          if (Array.isArray(obj)) {
            obj.forEach(item => {
              if (typeof item === 'object' && item !== null) {
                if (item.title || item.name || item.query || item.text) {
                  const title = item.title || item.name || item.query || item.text
                  if (title && typeof title === 'string' && title.length > 3 && title.length < 200) {
                    // Extract percentage increase from various possible fields
                    let percentageIncrease = null
                    if (item.percentageIncrease || item.percentage || item.increase || item.change) {
                      const pct = item.percentageIncrease || item.percentage || item.increase || item.change
                      // Handle both string and number formats
                      if (typeof pct === 'number') {
                        percentageIncrease = pct.toString() + '%'
                      } else if (typeof pct === 'string') {
                        // Remove any existing % sign and add it back
                        const cleaned = pct.replace(/%/g, '').trim()
                        if (cleaned && /^\d+$/.test(cleaned)) {
                          percentageIncrease = cleaned + '%'
                        } else if (pct.includes('%')) {
                          percentageIncrease = pct
                        }
                      }
                    }
                    
                    found.push({
                      title: title,
                      searchVolume: item.volume || item.searchVolume || item.count || 'N/A',
                      started: item.started || item.time || item.timestamp || 'N/A',
                      trendBreakdown: item.breakdown || item.related || null,
                      percentageIncrease: percentageIncrease,
                      link: item.url || item.link || null,
                      index: found.length
                    })
                  }
                }
                found.push(...findTrends(item))
              }
            })
          } else {
            Object.values(obj).forEach(value => {
              found.push(...findTrends(value))
            })
          }
          
          return found
        }
        
        const apiTrends = findTrends(data)
        if (apiTrends.length > 0) {
          trends = apiTrends
          break
        }
      }
    }
    
    // Debug: Check page content and look for blocking/login messages
    const pageInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase()
      const hasBlocking = bodyText.includes('sign in') || 
                         bodyText.includes('verify you') ||
                         bodyText.includes('captcha') ||
                         bodyText.includes('access denied') ||
                         bodyText.includes('blocked')
      
      // Look for any text that might be a trend (multi-word phrases that aren't UI)
      const allText = document.body.innerText
      const sentences = allText.split(/[.!?\n]/).filter(s => s.trim().length > 10 && s.trim().length < 200)
      
      return {
        title: document.title,
        url: window.location.href,
        hasBlocking,
        articleCount: document.querySelectorAll('article').length,
        linkCount: document.querySelectorAll('a[href*="/trending"]').length,
        tableCount: document.querySelectorAll('table').length,
        bodyTextPreview: document.body.innerText.substring(0, 1000),
        potentialTrends: sentences.slice(0, 10)
      }
    })
    
    if (trends.length === 0) {
      console.log('  No trends found. Page info:')
      console.log(`    Title: ${pageInfo.title}`)
      console.log(`    Has blocking/login: ${pageInfo.hasBlocking}`)
      console.log(`    Articles: ${pageInfo.articleCount}, Links: ${pageInfo.linkCount}, Tables: ${pageInfo.tableCount}`)
      if (pageInfo.hasBlocking) {
        console.log('  ⚠️  Page appears to be blocked or requires login')
      }
    }
    
    // If still no trends and page isn't blocked, try extracting from visible text
    if (trends.length === 0 && !pageInfo.hasBlocking) {
      console.log('  Attempting to extract trends from visible text...')
      const textTrends = await page.evaluate(() => {
        const trends = []
        // Look for text that might be trends (multi-word, not in nav/header)
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const parent = node.parentElement
              if (!parent) return NodeFilter.FILTER_REJECT
              // Skip UI areas
              if (parent.closest('header, nav, [role="banner"], [role="navigation"], button, input')) {
                return NodeFilter.FILTER_REJECT
              }
              const text = node.textContent.trim()
              // Look for text that could be a trend (3-10 words, starts with capital)
              if (text.length > 10 && text.length < 150 && /^[A-Z]/.test(text)) {
                const words = text.split(/\s+/)
                if (words.length >= 2 && words.length <= 10) {
                  return NodeFilter.FILTER_ACCEPT
                }
              }
              return NodeFilter.FILTER_REJECT
            }
          }
        )
        
        const seen = new Set()
        let node
        while ((node = walker.nextNode())) {
          const text = node.textContent.trim()
          if (!seen.has(text) && text.length > 10) {
            seen.add(text)
            trends.push({
              title: text,
              searchVolume: 'N/A',
              started: 'N/A',
              trendBreakdown: null,
              link: null,
              index: trends.length
            })
            if (trends.length >= 20) break
          }
        }
        return trends
      })
      
      if (textTrends.length > 0) {
        console.log(`  Found ${textTrends.length} potential trends from text extraction`)
        trends = textTrends
      }
    }

    // Final validation: filter out any UI elements that slipped through
    const validTrends = trends.filter(trend => {
      const titleLower = (trend.title || '').toLowerCase().trim()
      const uiKeywords = ['trend breakdown', 'search trends', 'sort by', 'trend status', 
                         'select', 'filter', 'more action', 'explore', 'search it',
                         'started', 'search volume', 'rows per page', 'showing']
      const isUI = uiKeywords.some(keyword => titleLower.includes(keyword))
      const hasValidData = trend.searchVolume !== 'N/A' && trend.started !== 'N/A'
      return !isUI && hasValidData && titleLower.length > 0
    })

    await browser.close()
    return validTrends

  } catch (error) {
    if (browser) {
      await browser.close()
    }
    throw new Error(`Failed to scrape Google Trends for ${geoCode}: ${error.message}`)
  }
}

/**
 * Calculate relevance score based on search volume, recency, and percentage increase
 * @param {string} searchVolume - Search volume text
 * @param {string} started - Started time text
 * @param {string|null} percentageIncrease - Percentage increase (e.g., "1000%", "500%")
 * @returns {number} Relevance score (0-100)
 */
export function calculateRelevanceScore(searchVolume, started, percentageIncrease = null) {
  let score = 50 // Base score

  // Boost score based on search volume indicators
  if (searchVolume) {
    const volumeLower = searchVolume.toLowerCase()
    if (volumeLower.includes('+') || volumeLower.includes('high') || volumeLower.includes('very')) {
      score += 30
    } else if (volumeLower.includes('medium') || volumeLower.includes('moderate')) {
      score += 15
    }
  }

  // Boost score based on recency (more recent = higher score)
  if (started) {
    const startedLower = started.toLowerCase()
    if (startedLower.includes('hour') || startedLower.includes('now')) {
      score += 20
    } else if (startedLower.includes('day')) {
      score += 10
    }
  }

  // Boost score based on percentage increase (higher increase = higher score)
  if (percentageIncrease) {
    // Extract numeric value from percentage string (e.g., "1000%" -> 1000)
    const pctMatch = percentageIncrease.toString().match(/(\d+)/)
    if (pctMatch) {
      const pctValue = parseInt(pctMatch[1], 10)
      if (pctValue >= 10000) {
        score += 30 // Very high increase (10000%+)
      } else if (pctValue >= 1000) {
        score += 25 // High increase (1000-9999%)
      } else if (pctValue >= 500) {
        score += 20 // Medium-high increase (500-999%)
      } else if (pctValue >= 200) {
        score += 15 // Medium increase (200-499%)
      } else if (pctValue >= 100) {
        score += 10 // Low-medium increase (100-199%)
      } else if (pctValue >= 50) {
        score += 5 // Low increase (50-99%)
      }
    }
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * Format trend data for output
 * @param {Array} trends - Raw trends from scraper
 * @returns {Array} Formatted topics array
 */
export function formatTrendsForOutput(trends) {
  return trends.map(trend => {
    const relevanceScore = calculateRelevanceScore(trend.searchVolume, trend.started, trend.percentageIncrease)
    
    return {
      name: trend.title,
      relevanceScore: relevanceScore,
      category: 'Law and Government',
      searchVolume: trend.searchVolume,
      started: trend.started,
      trendBreakdown: trend.trendBreakdown,
      percentageIncrease: trend.percentageIncrease || null,
      link: trend.link
    }
  }).sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance descending
}

