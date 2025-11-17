import React, { useEffect, useState } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet'
import { useTheme } from '../ui/ThemeProvider'
import StateMap from './StateMap'
import StateDetailsPanel from './StateDetailsPanel'
import { loadJSONData } from '../../utils/dataUtils'
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

// Component to update map theme based on current theme
const MapThemeUpdater = ({ isDark }) => {
  const map = useMap()

  useEffect(() => {
    // Update map container class for theme
    const container = map.getContainer()
    if (isDark) {
      container.classList.add('dark-theme')
    } else {
      container.classList.remove('dark-theme')
    }
  }, [map, isDark])

  return null
}

const MapContainer = () => {
  const { isDark } = useTheme()
  const [statesTopicData, setStatesTopicData] = useState(null)
  const [dataTimestamp, setDataTimestamp] = useState(null)
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [selectedState, setSelectedState] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Load topic data
  useEffect(() => {
    const loadTopicData = async () => {
      try {
        // Try to load real data first, fall back to mock data
        let data = null
        try {
          data = await loadJSONData('/data/states-topics.json')
        } catch (error) {
          console.log('Real data not found, using mock data:', error.message)
          data = await loadJSONData('/data/mock-states-topics.json')
        }
        
        if (data && data.states) {
          setStatesTopicData(data.states)
          setDataTimestamp(data.timestamp)
        }
      } catch (error) {
        console.error('Error loading topic data:', error)
        // Continue without topic data - map will still work
      } finally {
        setLoadingTopics(false)
      }
    }

    loadTopicData()
  }, [])

  // Handle state click - extract state data and open sidebar
  const handleStateClick = (feature) => {
    if (!feature || !feature.properties) {
      return
    }

    const { name, topTopic, topics, trendingScore, category } = feature.properties

    // Find the full state data from statesTopicData if available
    let stateData = null
    if (statesTopicData && name) {
      stateData = statesTopicData.find((state) => state.name === name)
    }

    // Use merged data from feature if state data not found, or merge both
    const finalStateData = {
      name: name || 'Unknown State',
      topTopic: topTopic || stateData?.topTopic || '',
      topics: topics || stateData?.topics || [],
      trendingScore: trendingScore || stateData?.trendingScore || 0,
      category: category || stateData?.category || 'Law and Government',
    }

    setSelectedState(finalStateData)
    setIsSidebarOpen(true)
  }

  // Handle DC click - same as state click
  const handleDCClick = (feature) => {
    handleStateClick(feature)
  }

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
        <MapThemeUpdater isDark={isDark} />
        <StateMap 
          statesTopicData={statesTopicData} 
          dataTimestamp={dataTimestamp}
          onStateClick={handleStateClick}
          onDCClick={handleDCClick}
          onMapClick={handleMapClick}
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

