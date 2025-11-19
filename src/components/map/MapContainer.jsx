import React, { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet'
import { useTheme } from '../ui/ThemeProvider'
import StateMap from './StateMap'
import StateDetailsPanel from './StateDetailsPanel'
import { loadJSONData, getDataUrl } from '../../utils/dataUtils'
import { logPerformanceSummary } from '../../utils/performanceUtils'
import 'leaflet/dist/leaflet.css'
import './MapContainer.css'

// US bounds: approximate coordinates covering all 50 states
const US_BOUNDS = [
  [18.9, -179.9], // Southwest corner
  [71.5, -66.9]   // Northeast corner
]

// Center of the continental United States (48 states)
// Optimized to center on the continental US, excluding Alaska and Hawaii
const CONTINENTAL_US_CENTER = [39.5, -98.35] // Central Kansas area

// Component to update map theme based on current theme and handle resize
const MapThemeUpdater = ({ isDark, mapRef }) => {
  const map = useMap()

  // Store map reference for parent component
  useEffect(() => {
    if (mapRef) {
      mapRef.current = map
    }
  }, [map, mapRef])

  useEffect(() => {
    // Update map container class for theme
    const container = map.getContainer()
    if (isDark) {
      container.classList.add('dark-theme')
    } else {
      container.classList.remove('dark-theme')
    }
    // Invalidate size when theme changes
    map.invalidateSize()
  }, [map, isDark])

  // Fix map size on mobile - recalculate after mount and on resize
  useEffect(() => {
    if (!map) return

    // Fix initial render on mobile
    const fixMapSize = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }

    // Fix on mount
    fixMapSize()

    // Fix on window resize and orientation change
    window.addEventListener('resize', fixMapSize)
    window.addEventListener('orientationchange', fixMapSize)

    return () => {
      window.removeEventListener('resize', fixMapSize)
      window.removeEventListener('orientationchange', fixMapSize)
    }
  }, [map])

  return null
}

const MapContainer = () => {
  const { isDark } = useTheme()
  const [statesTopicData, setStatesTopicData] = useState(null)
  const [dataTimestamp, setDataTimestamp] = useState(null)
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [selectedState, setSelectedState] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const mapRef = useRef(null)
  
  // Debug: Log sidebar state changes
  useEffect(() => {
    console.log('[MapContainer] Sidebar state changed - isOpen:', isSidebarOpen, 'selectedState:', selectedState?.name)
  }, [isSidebarOpen, selectedState])

  // Fix map size when sidebar opens/closes on mobile
  useEffect(() => {
    if (mapRef.current) {
      // Delay to allow sidebar animation to complete
      const timer = setTimeout(() => {
        mapRef.current.invalidateSize()
      }, 450) // Slightly longer than sidebar animation (400ms)
      return () => clearTimeout(timer)
    }
  }, [isSidebarOpen])

  // Load topic data (real per-state files)
  useEffect(() => {
    const loadAllStates = async () => {
      // Performance measurement: Mark data loading start
      if (typeof window !== 'undefined' && window.performance) {
        window.performance.mark('data-load-start')
      }
      
      try {
        const stateCodes = [
          "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
          "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
          "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
          "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
          "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
          "DC"
        ]
        const results = []
        let timestamp = null

        console.log('[MapContainer] Loading topic data from individual state files')
        for (const code of stateCodes) {
          try {
            const file = await loadJSONData(`data/states/${code}.json`)
            if (!timestamp && file.timestamp) {
              timestamp = file.timestamp
            }
            if (file.states && file.states[0]) {
              results.push(file.states[0]) // push the state's data entry
            }
          } catch (err) {
            console.warn(`[MapContainer] Missing or unreadable ${code}.json`)
          }
        }

        // Performance measurement: Mark data loading end
        if (typeof window !== 'undefined' && window.performance) {
          window.performance.mark('data-load-end')
          window.performance.measure('data-load', 'data-load-start', 'data-load-end')
          const dataLoadMeasure = window.performance.getEntriesByName('data-load')[0]
          if (dataLoadMeasure) {
            console.log(`[Performance] Data loading: ${(dataLoadMeasure.duration / 1000).toFixed(2)}s`)
          }
        }

        console.log(`[MapContainer] Loaded ${results.length} states with topic data`)
        setStatesTopicData(results)
        setDataTimestamp(timestamp)
      } catch (error) {
        console.error('[MapContainer] Error loading topic data:', error)
        // Continue without topic data - map will still work
      } finally {
        setLoadingTopics(false)
      }
    }

    loadAllStates()
  }, [])

  // Handle state click - extract state data and open sidebar
  const handleStateClick = useCallback((feature) => {
    console.log('[MapContainer] handleStateClick called with:', feature)
    if (!feature || !feature.properties) {
      console.warn('[MapContainer] handleStateClick: Invalid feature, missing properties')
      return
    }

    const { name, topTopic, topics, trendingScore, category } = feature.properties
    console.log('[MapContainer] Extracted data - name:', name, 'topics:', topics?.length)

    // Find the full state data from statesTopicData if available
    // Handle DC name variations: "Washington DC" and "District of Columbia"
    let stateData = null
    if (statesTopicData && name) {
      stateData = statesTopicData.find((state) => {
        // Match exact name or handle DC name variations
        if (state.name === name) {
          return true
        }
        // Handle DC name variations
        if ((name === 'Washington DC' || name === 'District of Columbia') &&
            (state.name === 'Washington DC' || state.name === 'District of Columbia')) {
          return true
        }
        return false
      })
    }

    // Merge data: prefer stateData if found, otherwise use feature properties
    // For topics: use stateData topics if available and non-empty, otherwise use feature topics
    const stateDataTopics = Array.isArray(stateData?.topics) ? stateData.topics : []
    const featureTopics = Array.isArray(topics) ? topics : []
    // Prefer stateData topics if they exist and have items, otherwise use feature topics
    const finalTopics = (stateDataTopics.length > 0) ? stateDataTopics : featureTopics
    
    const finalStateData = {
      name: name || stateData?.name || 'Unknown State',
      topTopic: stateData?.topTopic || topTopic || '',
      topics: finalTopics,
      trendingScore: stateData?.trendingScore ?? trendingScore ?? 0,
      category: stateData?.category || category || 'Law and Government',
    }

    console.log('[MapContainer] Setting state data:', finalStateData.name, 'and opening sidebar')
    setSelectedState(finalStateData)
    setIsSidebarOpen(true)
    console.log('[MapContainer] Sidebar should be open now')
  }, [statesTopicData])

  // Handle sidebar close
  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
    // Delay clearing state to allow exit animation to complete
    setTimeout(() => {
      setSelectedState(null)
    }, 400) // Match animation duration
  }

  // Handle map background click - close sidebar
  const handleMapClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false)
      // Delay clearing state to allow exit animation to complete
      setTimeout(() => {
        setSelectedState(null)
      }, 400) // Match animation duration
    }
  }

  // Use Positron (light) for light mode, Dark Matter for dark mode
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'


  return (
    <div className="map-container">
      <LeafletMapContainer
        center={CONTINENTAL_US_CENTER}
        zoom={4}
        minZoom={3}
        maxZoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
          subdomains="abcd"
          maxZoom={19}
          key={isDark ? 'dark' : 'light'} // Force re-render when theme changes
        />
        <MapThemeUpdater isDark={isDark} mapRef={mapRef} />
        <StateMap 
          statesTopicData={statesTopicData} 
          dataTimestamp={dataTimestamp}
          onStateClick={handleStateClick}
          onMapClick={handleMapClick}
          isSidebarOpen={isSidebarOpen}
        />
      </LeafletMapContainer>
      <StateDetailsPanel
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        stateData={selectedState}
        dataTimestamp={dataTimestamp}
      />
    </div>
  )
}

export default MapContainer

