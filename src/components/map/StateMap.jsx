import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../ui/ThemeProvider'
import './StateMap.css'

// Separate component for rendering GeoJSON inside map context
const GeoJSONRenderer = ({ geoJSONDataRef, styleRef, onEachFeatureRef, dataReady }) => {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    // Don't add if layer already exists
    if (layerRef.current) {
      return
    }

    if (!geoJSONDataRef.current || !geoJSONDataRef.current.features || geoJSONDataRef.current.features.length === 0) {
      return
    }

    // Create GeoJSON layer using refs for style functions
    const geoJsonLayer = L.geoJSON(geoJSONDataRef.current, {
      style: styleRef.current,
      onEachFeature: onEachFeatureRef.current,
      pane: 'overlayPane', // Ensure it's in the overlay pane (above tiles)
      interactive: true, // Allow interaction with states
    })

    // Add to map
    geoJsonLayer.addTo(map)
    layerRef.current = geoJsonLayer
    
    // Bring layer to front so it appears above tile layer
    geoJsonLayer.bringToFront()
    
    console.log('GeoJSON layer added to map:', geoJsonLayer.getLayers().length, 'layers')
    const bounds = geoJsonLayer.getBounds()
    console.log('GeoJSON layer bounds:', bounds ? `${bounds.getSouth()} to ${bounds.getNorth()}, ${bounds.getWest()} to ${bounds.getEast()}` : 'null')
    console.log('Map zoom:', map.getZoom(), 'Center:', map.getCenter() ? `${map.getCenter().lat}, ${map.getCenter().lng}` : 'null')
    console.log('Map bounds:', map.getBounds() ? `${map.getBounds().getSouth()} to ${map.getBounds().getNorth()}, ${map.getBounds().getWest()} to ${map.getBounds().getEast()}` : 'null')
    
    // Check if layer is actually on the map
    const hasLayer = map.hasLayer(geoJsonLayer)
    console.log('Map has GeoJSON layer:', hasLayer)
    
    // Check overlay pane for SVG
    setTimeout(() => {
      const overlayPane = map.getPane('overlayPane')
      if (overlayPane) {
        const svgs = overlayPane.querySelectorAll('svg')
        console.log('SVG elements in overlayPane:', svgs.length)
        svgs.forEach((svg, i) => {
          const paths = svg.querySelectorAll('path')
          console.log(`SVG ${i}: ${paths.length} paths, viewBox: ${svg.getAttribute('viewBox')}`)
        })
      }
    }, 100)

    // Cleanup only on unmount
    return () => {
      if (layerRef.current) {
        console.log('Removing GeoJSON layer from map')
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, dataReady]) // Depend on dataReady to trigger when data becomes available

  return null
}

const StateMap = ({ statesData = null, onStateClick = null, onStateHover = null }) => {
  const { isDark } = useTheme()
  const [geoJSONData, setGeoJSONData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load GeoJSON data
  useEffect(() => {
    // If statesData is provided, use it
    if (statesData) {
      setGeoJSONData(statesData)
      setLoading(false)
      return
    }

    // Otherwise, load from file
    const loadGeoJSON = async () => {
      try {
        const response = await fetch('/data/us-states.geojson')
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON data: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        console.log('GeoJSON loaded:', data.features?.length, 'features')
        setGeoJSONData(data)
      } catch (error) {
        console.error('Error loading GeoJSON:', error)
        // Fallback to empty feature collection
        setGeoJSONData({
          type: 'FeatureCollection',
          features: []
        })
      } finally {
        setLoading(false)
      }
    }

    loadGeoJSON()
  }, [statesData])

  // Style function for state polygons (memoized)
  const getStateStyle = useMemo(() => {
    return (feature) => {
      return {
        fillColor: isDark ? '#505050' : '#d0d0d0',
        fillOpacity: 0.8,
        color: isDark ? '#909090' : '#666666',
        weight: 3,
        opacity: 1,
      }
    }
  }, [isDark])

  // Event handlers (memoized)
  const onEachFeature = useCallback((feature, layer) => {
    // Add click handler
    if (onStateClick) {
      layer.on({
        click: (e) => {
          e.originalEvent.preventDefault()
          onStateClick(feature)
        },
      })
    }

    // Add hover handlers
    if (onStateHover) {
      layer.on({
        mouseover: (e) => {
          const layer = e.target
          layer.setStyle({
            fillOpacity: 0.8,
            weight: 2,
          })
          onStateHover(feature, true)
        },
        mouseout: (e) => {
          const layer = e.target
          layer.setStyle({
            fillOpacity: 0.6,
            weight: 1,
          })
          onStateHover(feature, false)
        },
      })
    }

    // Add state name to popup/tooltip
    // Note: The GeoJSON uses 'name' property, not 'NAME'
    if (feature.properties && feature.properties.name) {
      layer.bindTooltip(feature.properties.name, {
        permanent: false,
        direction: 'top',
        className: 'state-tooltip',
      })
    }
  }, [onStateClick, onStateHover])

  // Debug logging
  useEffect(() => {
    if (geoJSONData) {
      console.log('StateMap render - geoJSONData:', {
        hasData: !!geoJSONData,
        featureCount: geoJSONData.features?.length || 0,
        loading
      })
    }
  }, [geoJSONData, loading])

  // Store style functions and data in refs to prevent re-renders
  const styleRef = useRef(getStateStyle)
  const onEachFeatureRef = useRef(onEachFeature)
  const geoJSONDataRef = useRef(geoJSONData)

  // Update refs when functions/data change
  useEffect(() => {
    styleRef.current = getStateStyle
    onEachFeatureRef.current = onEachFeature
    geoJSONDataRef.current = geoJSONData
  }, [getStateStyle, onEachFeature, geoJSONData])

  if (loading) {
    return null
  }

  if (!geoJSONData || !geoJSONData.features || geoJSONData.features.length === 0) {
    console.warn('StateMap: No GeoJSON data available')
    return null
  }

  return (
    <GeoJSONRenderer
      geoJSONDataRef={geoJSONDataRef}
      styleRef={styleRef}
      onEachFeatureRef={onEachFeatureRef}
      dataReady={!!geoJSONData && geoJSONData.features?.length > 0}
    />
  )
}

export default StateMap

