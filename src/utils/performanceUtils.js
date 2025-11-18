/**
 * Performance measurement utilities
 * Used to track and report performance metrics for the application
 */

/**
 * Get a summary of all performance measurements
 * @returns {Object} Performance summary with all metrics
 */
export function getPerformanceSummary() {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const measures = window.performance.getEntriesByType('measure')
  const navigation = window.performance.getEntriesByType('navigation')[0]
  
  const summary = {
    pageLoad: null,
    dataLoad: null,
    mapRender: null,
    dataToMapRender: null,
    allMeasures: {}
  }

  // Get navigation timing for page load
  if (navigation) {
    const loadTime = navigation.loadEventEnd - navigation.fetchStart
    summary.pageLoad = {
      duration: loadTime,
      durationSeconds: (loadTime / 1000).toFixed(2),
      target: 3000,
      targetSeconds: '3.0',
      passed: loadTime < 3000
    }
  }

  // Get all custom measures
  measures.forEach(measure => {
    summary.allMeasures[measure.name] = {
      duration: measure.duration,
      durationSeconds: (measure.duration / 1000).toFixed(2),
      startTime: measure.startTime,
      endTime: measure.startTime + measure.duration
    }

    // Map specific measures to summary
    if (measure.name === 'data-load') {
      summary.dataLoad = {
        duration: measure.duration,
        durationSeconds: (measure.duration / 1000).toFixed(2)
      }
    } else if (measure.name === 'map-render') {
      summary.mapRender = {
        duration: measure.duration,
        durationSeconds: (measure.duration / 1000).toFixed(2)
      }
    } else if (measure.name === 'data-to-map-render') {
      summary.dataToMapRender = {
        duration: measure.duration,
        durationSeconds: (measure.duration / 1000).toFixed(2),
        target: 2000,
        targetSeconds: '2.0',
        passed: measure.duration < 2000
      }
    }
  })

  return summary
}

/**
 * Log performance summary to console in a formatted way
 */
export function logPerformanceSummary() {
  const summary = getPerformanceSummary()
  
  if (!summary) {
    console.warn('[Performance] Performance API not available')
    return
  }

  console.log('\n' + '='.repeat(60))
  console.log('PERFORMANCE SUMMARY')
  console.log('='.repeat(60))
  
  if (summary.pageLoad) {
    const { durationSeconds, targetSeconds, passed } = summary.pageLoad
    console.log(`📄 Initial Page Load: ${durationSeconds}s (target: < ${targetSeconds}s) ${passed ? '✅ PASS' : '❌ FAIL'}`)
  }
  
  if (summary.dataLoad) {
    console.log(`📊 Data Loading: ${summary.dataLoad.durationSeconds}s`)
  }
  
  if (summary.mapRender) {
    console.log(`🗺️  Map Rendering: ${summary.mapRender.durationSeconds}s`)
  }
  
  if (summary.dataToMapRender) {
    const { durationSeconds, targetSeconds, passed } = summary.dataToMapRender
    console.log(`⚡ Map Render (after data): ${durationSeconds}s (target: < ${targetSeconds}s) ${passed ? '✅ PASS' : '❌ FAIL'}`)
  }
  
  console.log('='.repeat(60) + '\n')
  
  return summary
}

/**
 * Export performance data for external analysis
 * @returns {Object} Performance data in a structured format
 */
export function exportPerformanceData() {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const navigation = window.performance.getEntriesByType('navigation')[0]
  const measures = window.performance.getEntriesByType('measure')
  const marks = window.performance.getEntriesByType('mark')
  
  return {
    timestamp: new Date().toISOString(),
    navigation: navigation ? {
      fetchStart: navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart
    } : null,
    measures: measures.map(m => ({
      name: m.name,
      duration: m.duration,
      startTime: m.startTime
    })),
    marks: marks.map(m => ({
      name: m.name,
      startTime: m.startTime
    }))
  }
}

