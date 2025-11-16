import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../ui/ThemeProvider'
import { mergeTopicDataWithGeoJSON } from '../../utils/dataUtils'
import { generateTooltipText } from '../../utils/tooltipUtils'
import './StateMap.css'

// Component to handle map clicks (for clearing selected state)
const MapClickHandler = ({ clickedLayerRef, allLayersRef, geoJsonLayerRef, styleRef, openTooltipLayerRef, isDark }) => {
  const map = useMap()

  useEffect(() => {
    const handleMapClick = (e) => {
      // Check if the click was on a state layer
      // State clicks will have their propagation stopped, so if we get here and there's a clicked state,
      // it means the click was on the map background
      // Also check if the click target is actually a state path element or tooltip
      const clickedElement = e.originalEvent.target
      const isStatePath = clickedElement.tagName === 'path' && 
                         clickedElement.closest('.leaflet-overlay-pane svg')
      const isTooltip = clickedElement.closest('.leaflet-tooltip')
      
      // Check if click hit a Leaflet layer (e.layer would be set if it did)
      // Note: State clicks stop propagation, so e.layer might not be set even for state clicks
      // But if e.layer is set, we definitely clicked on a layer, not the map background
      const clickedOnLayer = e.layer && e.layer.feature
      
      // If click was not on a state path, tooltip, or layer (clicked on map background), clear selection
      if (!isStatePath && !isTooltip && !clickedOnLayer && clickedLayerRef.current) {
        console.log('[MAP_CLICK] Clicked on map background, clearing selection')
        
        // Get all layers
        let allLayers = allLayersRef.current
        if (!allLayers || allLayers.length === 0) {
          if (geoJsonLayerRef.current && typeof geoJsonLayerRef.current.getLayers === 'function') {
            allLayers = geoJsonLayerRef.current.getLayers()
            allLayersRef.current = allLayers
          } else {
            return
          }
        }
        
        // Close ALL tooltips on all layers (both permanent and non-permanent)
        allLayers.forEach((layer) => {
          // Close any open tooltip (safe to call even if tooltip is not open)
          try {
            layer.closeTooltip()
          } catch (err) {
            // Tooltip might not be open, ignore error
          }
          
          // Unbind and rebind all tooltips as non-permanent to ensure clean state
            const layerFeature = layer.feature
            if (layerFeature) {
              const tooltipText = generateTooltipText(layerFeature, isDark)
              if (tooltipText) {
                layer.unbindTooltip()
                layer.bindTooltip(tooltipText, {
                  permanent: false,
                  direction: 'top',
                  className: 'state-tooltip',
                })
              }
            }
        })
        
        // Restore all states to normal style
        allLayers.forEach((layer) => {
          const layerFeature = layer.feature
          if (layerFeature && styleRef.current) {
            const baseStyle = styleRef.current(layerFeature)
            layer.setStyle({
              fillOpacity: baseStyle.fillOpacity,
              opacity: baseStyle.opacity,
              weight: baseStyle.weight,
              color: baseStyle.color,
            })
          }
        })
        
        // Clear clicked layer reference
        clickedLayerRef.current = null
        
        // Clear open tooltip reference
        openTooltipLayerRef.current = null
      }
    }

    map.on('click', handleMapClick)

    return () => {
      map.off('click', handleMapClick)
    }
  }, [map, clickedLayerRef, allLayersRef, geoJsonLayerRef, styleRef, openTooltipLayerRef, isDark])

  return null
}

// Separate component for rendering GeoJSON inside map context
const GeoJSONRenderer = ({ geoJSONDataRef, styleRef, onEachFeatureRef, dataReady, allLayersRef, geoJsonLayerRef }) => {
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

    // Store the GeoJSON layer itself for accessing layers later
    if (geoJsonLayerRef) {
      geoJsonLayerRef.current = geoJsonLayer
    }

    // Store all individual layers for dimming functionality
    if (allLayersRef) {
      allLayersRef.current = geoJsonLayer.getLayers()
    }

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

const StateMap = ({ statesData = null, statesTopicData = null, dataTimestamp = null, onStateClick = null, onStateHover = null }) => {
  const { isDark } = useTheme()
  const [geoJSONData, setGeoJSONData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load GeoJSON data and merge with topic data
  useEffect(() => {
    // If statesData is provided, use it
    if (statesData) {
      // Merge topic data if available
      const merged = statesTopicData
        ? mergeTopicDataWithGeoJSON(statesData, statesTopicData, dataTimestamp)
        : statesData
      setGeoJSONData(merged)
      setLoading(false)
      return
    }

    // If we already have GeoJSON data and topic data just loaded, merge them
    // Use functional update to access latest geoJSONData
    if (statesTopicData && geoJSONData) {
      setGeoJSONData((currentGeoJSON) => {
        if (currentGeoJSON && currentGeoJSON.features && currentGeoJSON.features.length > 0) {
          const firstFeature = currentGeoJSON.features[0]
          // Only re-merge if topic data is not already present
          if (!firstFeature.properties?.topTopic) {
            console.log('Re-merging GeoJSON with topic data')
            return mergeTopicDataWithGeoJSON(currentGeoJSON, statesTopicData, dataTimestamp)
          }
        }
        return currentGeoJSON
      })
      // Don't load if we're just re-merging
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
        console.log('Topic data available:', !!statesTopicData, statesTopicData?.length, 'states')
        
        // Merge topic data if available
        const merged = statesTopicData
          ? mergeTopicDataWithGeoJSON(data, statesTopicData, dataTimestamp)
          : data
        
        console.log('Merged GeoJSON:', merged.features?.length, 'features')
        // Log a sample feature to verify merge
        if (merged.features && merged.features.length > 0) {
          const sampleFeature = merged.features[0]
          console.log('Sample feature after merge:', {
            name: sampleFeature.properties?.name,
            topTopic: sampleFeature.properties?.topTopic,
            hasTopics: !!sampleFeature.properties?.topics
          })
        }
        
        setGeoJSONData(merged)
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
  }, [statesData, statesTopicData, dataTimestamp])

  // Style function for state polygons (memoized)
  const getStateStyle = useMemo(() => {
    return (feature) => {
      return {
        fillColor: isDark ? '#505050' : '#d0d0d0',
        fillOpacity: 0.8,
        color: isDark ? '#909090' : '#666666',
        weight: 1.5,
        opacity: 1,
      }
    }
  }, [isDark])

  // Ref to track currently open tooltip layer
  const openTooltipLayerRef = useRef(null)
  // Ref to store all state layers for dimming functionality
  const allLayersRef = useRef([])
  // Ref to store the GeoJSON layer itself
  const geoJsonLayerRef = useRef(null)
  // Ref to track currently hovered layer
  const hoveredLayerRef = useRef(null)
  // Ref to track clicked/selected layer
  const clickedLayerRef = useRef(null)

  // Event handlers (memoized)
  const onEachFeature = useCallback((feature, layer) => {
    // Add click handler (always attach, even if onStateClick is not provided)
    layer.on({
      click: (e) => {
        e.originalEvent.preventDefault()
        e.originalEvent.stopPropagation()
        // Stop Leaflet event propagation to prevent map click handler from firing
        L.DomEvent.stopPropagation(e)
        
        const clickedLayer = e.target
        
        // If clicking a different state, update the clicked state
        if (clickedLayerRef.current && clickedLayerRef.current !== clickedLayer) {
          // Restore previous clicked state to normal
          const prevFeature = clickedLayerRef.current.feature
          if (prevFeature && styleRef.current) {
            const baseStyle = styleRef.current(prevFeature)
            clickedLayerRef.current.setStyle({
              fillOpacity: baseStyle.fillOpacity,
              opacity: baseStyle.opacity,
              weight: baseStyle.weight,
              color: baseStyle.color,
            })
          }
        }
        
        // Apply hover styling to clicked state
        const hoverColor = isDark ? '#808080' : '#333333'
        clickedLayer.setStyle({
          fillOpacity: 0.9,
          weight: 1.5,
          color: hoverColor,
          opacity: 1,
        })
        
        // Dim all other states
        console.log('[CLICK] Clicked layer:', clickedLayer)
        console.log('[CLICK] allLayersRef.current length:', allLayersRef.current?.length)
        
        // Get all layers - try allLayersRef first, then try to get from GeoJSON layer
        let allLayers = allLayersRef.current
        if (!allLayers || allLayers.length === 0) {
          // Fallback: try to get layers from the GeoJSON layer ref
          if (geoJsonLayerRef.current && typeof geoJsonLayerRef.current.getLayers === 'function') {
            allLayers = geoJsonLayerRef.current.getLayers()
            console.log('[CLICK] Got layers from geoJsonLayerRef, count:', allLayers.length)
            // Update the ref for future use
            allLayersRef.current = allLayers
          } else {
            console.warn('[CLICK] Could not get layers from geoJsonLayerRef!')
          }
        }
        
        if (allLayers && allLayers.length > 0) {
          let dimmedCount = 0
          allLayers.forEach((otherLayer) => {
            if (otherLayer !== clickedLayer) {
              otherLayer.setStyle({
                fillOpacity: 0.15,
                opacity: 0.3,
              })
              dimmedCount++
            }
          })
          console.log('[CLICK] Dimmed', dimmedCount, 'layers')
        } else {
          console.warn('[CLICK] Could not dim layers - allLayers is empty!')
        }
        
        // Close any previously permanent tooltip and restore it to non-permanent
        // Check both clickedLayerRef and openTooltipLayerRef to ensure we catch all cases
        const prevClickedLayer = clickedLayerRef.current
        const prevOpenTooltipLayer = openTooltipLayerRef.current
        
        // Handle previous clicked state's tooltip (if switching states)
        if (prevClickedLayer && prevClickedLayer !== clickedLayer) {
          const prevFeature = prevClickedLayer.feature
          if (prevFeature) {
            const prevTooltipText = generateTooltipText(prevFeature, isDark)
            if (prevTooltipText) {
              prevClickedLayer.closeTooltip()
              // Rebind with permanent: false
              prevClickedLayer.unbindTooltip()
              prevClickedLayer.bindTooltip(prevTooltipText, {
                permanent: false,
                direction: 'top',
                className: 'state-tooltip',
              })
            }
          }
        }
        
        // Also handle openTooltipLayerRef if it's different from both the previous clicked and new clicked
        if (prevOpenTooltipLayer && 
            prevOpenTooltipLayer !== clickedLayer && 
            prevOpenTooltipLayer !== prevClickedLayer) {
          const prevFeature = prevOpenTooltipLayer.feature
          if (prevFeature) {
            const prevTooltipText = generateTooltipText(prevFeature, isDark)
            if (prevTooltipText) {
              prevOpenTooltipLayer.closeTooltip()
              prevOpenTooltipLayer.unbindTooltip()
              prevOpenTooltipLayer.bindTooltip(prevTooltipText, {
                permanent: false,
                direction: 'top',
                className: 'state-tooltip',
              })
            }
          }
        }
        
        // Clear openTooltipLayerRef before setting new one
        openTooltipLayerRef.current = null
        
        // Make clicked state's tooltip permanent
        // Use layer.feature to get the most up-to-date feature
        const clickedFeature = clickedLayer.feature || feature
        const tooltipText = generateTooltipText(clickedFeature, isDark)
        if (tooltipText) {
          // Unbind current tooltip and rebind with permanent: true
          clickedLayer.unbindTooltip()
          clickedLayer.bindTooltip(tooltipText, {
            permanent: true,
            direction: 'top',
            className: 'state-tooltip',
          })
          clickedLayer.openTooltip()
          openTooltipLayerRef.current = clickedLayer
        }
        
        // Track clicked layer
        clickedLayerRef.current = clickedLayer
        console.log('[CLICK] Set clickedLayerRef.current')
        
        // Call the click callback if provided
        if (onStateClick) {
          onStateClick(feature)
        }
      },
    })

    // Add tooltip with state name and top topic
    const tooltipText = generateTooltipText(feature, isDark)
    if (tooltipText) {
      layer.bindTooltip(tooltipText, {
        permanent: false,
        direction: 'top',
        className: 'state-tooltip',
      })
    }

    // Combined hover handlers for styling, tooltip management, and onStateHover callback
    layer.on({
      mouseover: (e) => {
        const currentLayer = e.target
        
        // Ensure allLayersRef is populated - try to get from GeoJSON layer if empty
        let allLayers = allLayersRef.current
        if (!allLayers || allLayers.length === 0) {
          if (geoJsonLayerRef.current && typeof geoJsonLayerRef.current.getLayers === 'function') {
            allLayers = geoJsonLayerRef.current.getLayers()
            allLayersRef.current = allLayers
          } else {
            return
          }
        }
        
        const hoverColor = isDark ? '#808080' : '#333333'
        
        // If hovering over the clicked state, maintain its highlighted state
        if (currentLayer === clickedLayerRef.current) {
          currentLayer.setStyle({
            fillOpacity: 0.9,
            weight: 1.5,
            color: hoverColor,
            opacity: 1,
          })
        } else {
          // First, ensure clicked state remains highlighted (if it exists)
          if (clickedLayerRef.current) {
            clickedLayerRef.current.setStyle({
              fillOpacity: 0.9,
              weight: 1.5,
              color: hoverColor,
              opacity: 1,
            })
          }
          
          // Dim all other states with greater contrast (except clicked state and current hovered)
          allLayers.forEach((otherLayer) => {
            if (otherLayer !== currentLayer && otherLayer !== clickedLayerRef.current) {
              otherLayer.setStyle({
                fillOpacity: 0.15,
                opacity: 0.3,
              })
            }
          })
          
          // Update hovered layer style with theme-aware colors
          currentLayer.setStyle({
            fillOpacity: 0.9,
            weight: 1.5,
            color: hoverColor,
            opacity: 1,
          })
        }

        // Track hovered layer
        hoveredLayerRef.current = currentLayer

        // Handle tooltips - don't interfere with permanent tooltip on clicked state
        // Use layer.feature to get the most up-to-date feature (which may have been updated with topic data)
        const currentFeature = currentLayer.feature || feature
        const tooltipText = generateTooltipText(currentFeature, isDark)
        if (tooltipText) {
          // If hovering over the clicked state, ensure its tooltip is open (it should already be permanent)
          if (currentLayer === clickedLayerRef.current) {
            // Tooltip should already be open and permanent, just ensure it's tracked
            openTooltipLayerRef.current = currentLayer
          } else {
            // Close any previously open tooltip (except the clicked state's permanent one)
            if (openTooltipLayerRef.current && 
                openTooltipLayerRef.current !== currentLayer && 
                openTooltipLayerRef.current !== clickedLayerRef.current) {
              openTooltipLayerRef.current.closeTooltip()
            }
            
            // Open this tooltip and track it
            currentLayer.openTooltip()
            openTooltipLayerRef.current = currentLayer
          }
        }

        // Call onStateHover callback if provided
        if (onStateHover) {
          onStateHover(feature, true)
        }
      },
      mouseout: (e) => {
        const currentLayer = e.target
        
        // Ensure allLayersRef is populated - try to get from GeoJSON layer if empty
        let allLayers = allLayersRef.current
        if (!allLayers || allLayers.length === 0) {
          if (geoJsonLayerRef.current && typeof geoJsonLayerRef.current.getLayers === 'function') {
            allLayers = geoJsonLayerRef.current.getLayers()
            allLayersRef.current = allLayers
          } else {
            return
          }
        }
        
        console.log('[MOUSEOUT] Current layer:', currentLayer)
        console.log('[MOUSEOUT] clickedLayerRef.current:', clickedLayerRef.current)
        
        // If there's a clicked state, maintain the dimmed state for all non-clicked states
        if (clickedLayerRef.current) {
          console.log('[MOUSEOUT] Has clicked state, maintaining dimmed state')
          const hoverColor = isDark ? '#808080' : '#333333'
          
          // If mouse leaves the clicked state itself, maintain its highlighted state
          // and keep other states dimmed
          if (currentLayer === clickedLayerRef.current) {
            // Keep clicked state highlighted
            clickedLayerRef.current.setStyle({
              fillOpacity: 0.9,
              weight: 1.5,
              color: hoverColor,
              opacity: 1,
            })
            
            // Keep all other states dimmed
            allLayers.forEach((otherLayer) => {
              if (otherLayer !== clickedLayerRef.current) {
                otherLayer.setStyle({
                  fillOpacity: 0.15,
                  opacity: 0.3,
                })
              }
            })
          }
          // If mouse leaves a non-clicked state, ensure it stays dimmed
          // and maintain clicked state's highlight
          else {
            // Ensure clicked state remains highlighted
            clickedLayerRef.current.setStyle({
              fillOpacity: 0.9,
              weight: 1.5,
              color: hoverColor,
              opacity: 1,
            })
            
            // Restore the current layer to dimmed state if it's not the clicked one
            if (currentLayer !== clickedLayerRef.current) {
              currentLayer.setStyle({
                fillOpacity: 0.15,
                opacity: 0.3,
              })
            }
          }
        } else {
          console.log('[MOUSEOUT] No clicked state, restoring all to normal')
          // No clicked state - restore all states to normal
          allLayers.forEach((otherLayer) => {
            const layerFeature = otherLayer.feature
            if (layerFeature && styleRef.current) {
              const baseStyle = styleRef.current(layerFeature)
              otherLayer.setStyle({
                fillOpacity: baseStyle.fillOpacity,
                opacity: baseStyle.opacity,
                weight: baseStyle.weight,
                color: baseStyle.color,
              })
            }
          })
        }

        // Clear hovered layer reference
        hoveredLayerRef.current = null

        // Close this tooltip when mouse leaves, but keep it open if it's the clicked state
        // Use layer.feature to get the most up-to-date feature
        const currentFeature = currentLayer.feature || feature
        const tooltipText = generateTooltipText(currentFeature, isDark)
        if (tooltipText) {
          // Don't close tooltip if this is the clicked state (it should remain permanent)
          if (currentLayer !== clickedLayerRef.current) {
            currentLayer.closeTooltip()
            if (openTooltipLayerRef.current === currentLayer) {
              openTooltipLayerRef.current = null
            }
          }
        }

        // Call onStateHover callback if provided
        if (onStateHover) {
          onStateHover(feature, false)
        }
      },
    })
  }, [onStateClick, onStateHover, isDark])

  // Update tooltip styles when theme changes
  useEffect(() => {
    // Update all tooltip styles to match current theme
    const updateTooltipStyles = () => {
      const tooltips = document.querySelectorAll('.state-tooltip')
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || (isDark ? '#1a1a1a' : '#ffffff')
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || (isDark ? '#ffffff' : '#000000')
      const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || (isDark ? '#404040' : '#e0e0e0')
      const shadow = getComputedStyle(document.documentElement).getPropertyValue('--shadow').trim() || (isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)')

      tooltips.forEach((tooltip) => {
        tooltip.style.backgroundColor = bgColor
        tooltip.style.color = textColor
        tooltip.style.borderColor = borderColor
        tooltip.style.boxShadow = `0 2px 4px ${shadow}`
        
        // Update arrow color using CSS custom property (Leaflet uses ::before pseudo-element)
        // We need to inject a style tag or update the computed style
        const styleId = 'tooltip-arrow-styles'
        let styleEl = document.getElementById(styleId)
        if (!styleEl) {
          styleEl = document.createElement('style')
          styleEl.id = styleId
          document.head.appendChild(styleEl)
        }
        styleEl.textContent = `
          .state-tooltip.leaflet-tooltip-top:before {
            border-top-color: ${bgColor} !important;
          }
          .state-tooltip.leaflet-tooltip-bottom:before {
            border-bottom-color: ${bgColor} !important;
          }
          .state-tooltip.leaflet-tooltip-left:before {
            border-left-color: ${bgColor} !important;
          }
          .state-tooltip.leaflet-tooltip-right:before {
            border-right-color: ${bgColor} !important;
          }
        `
      })
    }

    // Update immediately and set up interval to catch newly created tooltips
    updateTooltipStyles()
    const timer1 = setTimeout(updateTooltipStyles, 100)
    const timer2 = setTimeout(updateTooltipStyles, 500)

    // Also set up a MutationObserver to watch for new tooltips being added
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.classList?.contains('state-tooltip') || node.querySelector?.('.state-tooltip')) {
              shouldUpdate = true
            }
          }
        })
      })
      if (shouldUpdate) {
        updateTooltipStyles()
      }
    })
    // Observe the map container where Leaflet tooltips are typically added
    const mapContainer = document.querySelector('.leaflet-container')
    if (mapContainer) {
      observer.observe(mapContainer, {
        childList: true,
        subtree: true
      })
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      observer.disconnect()
    }
  }, [isDark])

  // Update layer feature references and rebind tooltips when merged data is available
  useEffect(() => {
    if (!geoJSONData || !geoJsonLayerRef.current || loading) {
      return
    }

    // Check if we have topic data in the merged GeoJSON
    const hasTopicData = geoJSONData.features?.some(
      (feature) => feature.properties?.topTopic
    )

    if (!hasTopicData) {
      return
    }

    console.log('Updating layer features with merged topic data')
    
    // Use a small delay to ensure layers are ready
    const timer = setTimeout(() => {
      const allLayers = geoJsonLayerRef.current?.getLayers()
      if (!allLayers || !geoJSONData.features) {
        return
      }

      // Create a map of state names to merged features for quick lookup
      const featureMap = new Map()
      geoJSONData.features.forEach((feature) => {
        const stateName = feature.properties?.name
        if (stateName) {
          featureMap.set(stateName, feature)
        }
      })

      let updatedCount = 0
      allLayers.forEach((layer) => {
        const oldFeature = layer.feature
        if (oldFeature) {
          const stateName = oldFeature.properties?.name
          // Get the updated feature from the merged data
          const updatedFeature = featureMap.get(stateName)
          
          if (updatedFeature && updatedFeature.properties?.topTopic) {
            // Update the layer's feature reference to point to the merged feature
            layer.feature = updatedFeature
            updatedCount++
            
            const tooltipText = generateTooltipText(updatedFeature, isDark)
            if (tooltipText) {
              // Don't rebind if this is the clicked state (it has a permanent tooltip)
              const isClickedState = layer === clickedLayerRef.current
              if (!isClickedState) {
                // Unbind and rebind with updated text
                layer.unbindTooltip()
                layer.bindTooltip(tooltipText, {
                  permanent: false,
                  direction: 'top',
                  className: 'state-tooltip',
                })
              } else {
                // For clicked state, update the permanent tooltip
                layer.unbindTooltip()
                layer.bindTooltip(tooltipText, {
                  permanent: true,
                  direction: 'top',
                  className: 'state-tooltip',
                })
                layer.openTooltip()
              }
            }
          }
        }
      })
      console.log('Updated', updatedCount, 'layers with topic data')
    }, 200) // Small delay to ensure layers are ready

    return () => clearTimeout(timer)
  }, [geoJSONData, loading, isDark])

  // Debug logging
  useEffect(() => {
    if (geoJSONData) {
      console.log('StateMap render - geoJSONData:', {
        hasData: !!geoJSONData,
        featureCount: geoJSONData.features?.length || 0,
        loading,
        hasTopicData: geoJSONData.features?.some(f => f.properties?.topTopic)
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

  // Restore clicked state's style after re-renders to ensure persistence
  useEffect(() => {
    // Use a small delay to ensure the layer is available
    const timer = setTimeout(() => {
      if (clickedLayerRef.current && geoJsonLayerRef.current) {
        const hoverColor = isDark ? '#808080' : '#333333'
        // Restore clicked state's highlight
        clickedLayerRef.current.setStyle({
          fillOpacity: 0.9,
          weight: 1.5,
          color: hoverColor,
          opacity: 1,
        })
        
        // Restore clicked state's permanent tooltip
        const clickedFeature = clickedLayerRef.current.feature
        if (clickedFeature) {
          const tooltipText = generateTooltipText(clickedFeature, isDark)
          if (tooltipText) {
            // Rebind with permanent: true
            clickedLayerRef.current.unbindTooltip()
            clickedLayerRef.current.bindTooltip(tooltipText, {
              permanent: true,
              direction: 'top',
              className: 'state-tooltip',
            })
            clickedLayerRef.current.openTooltip()
            openTooltipLayerRef.current = clickedLayerRef.current
          }
        }
        
        // Ensure all other states are dimmed
        const allLayers = geoJsonLayerRef.current.getLayers()
        allLayers.forEach((otherLayer) => {
          if (otherLayer !== clickedLayerRef.current) {
            otherLayer.setStyle({
              fillOpacity: 0.15,
              opacity: 0.3,
            })
          }
        })
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [isDark, geoJSONData]) // Re-run when theme changes or data changes

  if (loading) {
    return null
  }

  if (!geoJSONData || !geoJSONData.features || geoJSONData.features.length === 0) {
    console.warn('StateMap: No GeoJSON data available')
    return null
  }

  return (
    <>
      <GeoJSONRenderer
        geoJSONDataRef={geoJSONDataRef}
        styleRef={styleRef}
        onEachFeatureRef={onEachFeatureRef}
        dataReady={!!geoJSONData && geoJSONData.features?.length > 0}
        allLayersRef={allLayersRef}
        geoJsonLayerRef={geoJsonLayerRef}
      />
      <MapClickHandler
        clickedLayerRef={clickedLayerRef}
        allLayersRef={allLayersRef}
        geoJsonLayerRef={geoJsonLayerRef}
        styleRef={styleRef}
        openTooltipLayerRef={openTooltipLayerRef}
        isDark={isDark}
      />
    </>
  )
}

export default StateMap

