import React, { useEffect } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet'
import { useTheme } from '../ui/ThemeProvider'
import 'leaflet/dist/leaflet.css'
import './MapContainer.css'

// US bounds: approximate coordinates covering all 50 states
const US_BOUNDS = [
  [18.9, -179.9], // Southwest corner
  [71.5, -66.9]   // Northeast corner
]

// Center of the US
const US_CENTER = [39.8283, -98.5795]

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

  return (
    <div className="map-container">
      <LeafletMapContainer
        center={US_CENTER}
        zoom={4}
        minZoom={3}
        maxZoom={10}
        maxBounds={US_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapThemeUpdater isDark={isDark} />
      </LeafletMapContainer>
    </div>
  )
}

export default MapContainer

