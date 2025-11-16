import React, { useEffect } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet'
import { useTheme } from '../ui/ThemeProvider'
import StateMap from './StateMap'
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
        <StateMap />
      </LeafletMapContainer>
    </div>
  )
}

export default MapContainer

