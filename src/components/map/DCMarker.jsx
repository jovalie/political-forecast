import React, { useEffect, useRef, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { generateTooltipText } from '../../utils/tooltipUtils'
import { getColorByTopicCount } from '../../utils/dataUtils'

// Washington DC coordinates
const DC_COORDINATES = [38.9072, -77.0369]

// Create a custom star icon
const createStarIcon = (isDark, topicCount) => {
  const color = getColorByTopicCount(topicCount, isDark)
  const borderColor = isDark ? '#909090' : '#666666'
  
  // Create SVG star icon
  const starSvg = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" 
            fill="${color}" 
            stroke="${borderColor}" 
            stroke-width="1.5" 
            stroke-linejoin="round"/>
    </svg>
  `
  
  return L.divIcon({
    html: starSvg,
    className: 'dc-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

const DCMarker = ({ 
  dcData = null, 
  dataTimestamp = null,
  onDCClick = null,
  clickedLayerRef,
  allLayersRef,
  openTooltipLayerRef,
  isDark,
  onMapClick
}) => {
  const map = useMap()
  const markerRef = useRef(null)
  const layerRef = useRef(null)

  // Create a feature-like object for DC to work with existing tooltip system
  const createDCFeature = useCallback(() => {
    if (!dcData) {
      return {
        type: 'Feature',
        properties: {
          name: 'Washington DC',
          topTopic: null,
          topics: [],
          timestamp: dataTimestamp,
        },
        geometry: {
          type: 'Point',
          coordinates: [DC_COORDINATES[1], DC_COORDINATES[0]],
        },
      }
    }

    return {
      type: 'Feature',
      properties: {
        name: 'Washington DC',
        topTopic: dcData.topTopic || null,
        topics: dcData.topics || [],
        trendingScore: dcData.trendingScore || 0,
        category: dcData.category || 'Law and Government',
        timestamp: dataTimestamp,
      },
      geometry: {
        type: 'Point',
        coordinates: [DC_COORDINATES[1], DC_COORDINATES[0]],
      },
    }
  }, [dcData, dataTimestamp])

  // Initialize marker
  useEffect(() => {
    if (markerRef.current) {
      return // Already created
    }

    const dcFeature = createDCFeature()
    const topicCount = dcFeature.properties?.topics?.length || 0
    const icon = createStarIcon(isDark, topicCount)

    // Create marker
    const marker = L.marker(DC_COORDINATES, {
      icon: icon,
      interactive: true,
      pane: 'overlayPane',
    })

    // Store feature on marker for tooltip generation
    marker.feature = dcFeature
    marker.isDC = true // Flag to identify DC marker

    // Add tooltip
    const tooltipText = generateTooltipText(dcFeature, isDark)
    if (tooltipText) {
      marker.bindTooltip(tooltipText, {
        permanent: false,
        direction: 'top',
        className: 'state-tooltip',
      })
    }

    // Add click handler
    marker.on('click', (e) => {
      e.originalEvent.preventDefault()
      e.originalEvent.stopPropagation()
      L.DomEvent.stopPropagation(e)

      const clickedMarker = e.target

      // If clicking a different state/marker, update the clicked one
      if (clickedLayerRef.current && clickedLayerRef.current !== clickedMarker) {
        // Restore previous clicked state/marker to normal
        const prevFeature = clickedLayerRef.current.feature
        if (prevFeature) {
          if (clickedLayerRef.current.isDC) {
            // DC marker - restore icon
            const prevTopicCount = prevFeature.properties?.topics?.length || 0
            const prevIcon = createStarIcon(isDark, prevTopicCount)
            clickedLayerRef.current.setIcon(prevIcon)
          } else {
            // State - restore style
            // This will be handled by StateMap's click handler
          }
        }
      }

      // Highlight clicked marker with darker border
      const clickedTopicCount = clickedMarker.feature?.properties?.topics?.length || 0
      const hoverColor = isDark ? '#808080' : '#333333'
      const clickedColor = getColorByTopicCount(clickedTopicCount, isDark)
      // Update border color for hover state
      const hoverSvg = `
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" 
                fill="${clickedColor}" 
                stroke="${hoverColor}" 
                stroke-width="2" 
                stroke-linejoin="round"/>
        </svg>
      `
      const hoverIconObj = L.divIcon({
        html: hoverSvg,
        className: 'dc-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      })
      clickedMarker.setIcon(hoverIconObj)

      // Dim all states
      if (allLayersRef.current && allLayersRef.current.length > 0) {
        allLayersRef.current.forEach((layer) => {
          if (layer !== clickedMarker && !layer.isDC) {
            layer.setStyle({
              fillOpacity: 0.15,
              opacity: 0.3,
            })
          }
        })
      }

      // Close any previously permanent tooltip
      const prevClickedLayer = clickedLayerRef.current
      if (prevClickedLayer && prevClickedLayer !== clickedMarker) {
        const prevFeature = prevClickedLayer.feature
        if (prevFeature) {
          const prevTooltipText = generateTooltipText(prevFeature, isDark)
          if (prevTooltipText) {
            prevClickedLayer.closeTooltip()
            prevClickedLayer.unbindTooltip()
            prevClickedLayer.bindTooltip(prevTooltipText, {
              permanent: false,
              direction: 'top',
              className: 'state-tooltip',
            })
          }
        }
      }

      // Make clicked marker's tooltip permanent
      const clickedFeature = clickedMarker.feature || dcFeature
      const tooltipText = generateTooltipText(clickedFeature, isDark)
      if (tooltipText) {
        clickedMarker.unbindTooltip()
        clickedMarker.bindTooltip(tooltipText, {
          permanent: true,
          direction: 'top',
          className: 'state-tooltip',
        })
        clickedMarker.openTooltip()
        openTooltipLayerRef.current = clickedMarker
      }

      // Track clicked marker
      clickedLayerRef.current = clickedMarker

      // Call the click callback if provided
      if (onDCClick) {
        onDCClick(dcFeature)
      }
    })

    // Add hover handlers
    marker.on({
      mouseover: (e) => {
        const currentMarker = e.target

        // Dim all states if there's a clicked state/marker
        if (clickedLayerRef.current && clickedLayerRef.current !== currentMarker) {
          // Maintain clicked state/marker's highlight
          if (clickedLayerRef.current.isDC) {
            // DC marker - keep highlighted icon
            const clickedTopicCount = clickedLayerRef.current.feature?.properties?.topics?.length || 0
            const hoverColor = isDark ? '#808080' : '#333333'
            const clickedColor = getColorByTopicCount(clickedTopicCount, isDark)
            const hoverSvg = `
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" 
                      fill="${clickedColor}" 
                      stroke="${hoverColor}" 
                      stroke-width="2" 
                      stroke-linejoin="round"/>
              </svg>
            `
            const hoverIconObj = L.divIcon({
              html: hoverSvg,
              className: 'dc-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12],
            })
            clickedLayerRef.current.setIcon(hoverIconObj)
          }
        }

        // Highlight hovered marker
        const hoverTopicCount = currentMarker.feature?.properties?.topics?.length || 0
        const hoverColor = isDark ? '#808080' : '#333333'
        const hoverFillColor = getColorByTopicCount(hoverTopicCount, isDark)
        const hoverSvg = `
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" 
                  fill="${hoverFillColor}" 
                  stroke="${hoverColor}" 
                  stroke-width="2" 
                  stroke-linejoin="round"/>
          </svg>
        `
        const hoverIconObj = L.divIcon({
          html: hoverSvg,
          className: 'dc-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        })
        currentMarker.setIcon(hoverIconObj)

        // Dim all states when hovering DC
        if (allLayersRef.current && allLayersRef.current.length > 0) {
          allLayersRef.current.forEach((layer) => {
            if (layer !== currentMarker && !layer.isDC) {
              layer.setStyle({
                fillOpacity: 0.15,
                opacity: 0.3,
              })
            }
          })
        }

        // Handle tooltip
        const currentFeature = currentMarker.feature || dcFeature
        const tooltipText = generateTooltipText(currentFeature, isDark)
        if (tooltipText) {
          if (currentMarker === clickedLayerRef.current) {
            // Tooltip should already be open and permanent
            openTooltipLayerRef.current = currentMarker
          } else {
            // Close any previously open tooltip (except the clicked one)
            if (openTooltipLayerRef.current && 
                openTooltipLayerRef.current !== currentMarker && 
                openTooltipLayerRef.current !== clickedLayerRef.current) {
              openTooltipLayerRef.current.closeTooltip()
            }
            
            // Open this tooltip
            currentMarker.openTooltip()
            openTooltipLayerRef.current = currentMarker
          }
        }
      },
      mouseout: (e) => {
        const currentMarker = e.target

        // If there's a clicked marker, maintain its highlighted state
        if (clickedLayerRef.current) {
          if (clickedLayerRef.current === currentMarker) {
            // Keep clicked marker highlighted
            const clickedTopicCount = clickedLayerRef.current.feature?.properties?.topics?.length || 0
            const hoverColor = isDark ? '#808080' : '#333333'
            const clickedColor = getColorByTopicCount(clickedTopicCount, isDark)
            const hoverSvg = `
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" 
                      fill="${clickedColor}" 
                      stroke="${hoverColor}" 
                      stroke-width="2" 
                      stroke-linejoin="round"/>
              </svg>
            `
            const hoverIconObj = L.divIcon({
              html: hoverSvg,
              className: 'dc-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12],
            })
            clickedLayerRef.current.setIcon(hoverIconObj)
          } else {
            // Restore hovered marker to normal (if not clicked)
            if (currentMarker !== clickedLayerRef.current) {
              const normalTopicCount = currentMarker.feature?.properties?.topics?.length || 0
              const normalIcon = createStarIcon(isDark, normalTopicCount)
              currentMarker.setIcon(normalIcon)
            }
          }
        } else {
          // No clicked marker - restore to normal
          const normalTopicCount = currentMarker.feature?.properties?.topics?.length || 0
          const normalIcon = createStarIcon(isDark, normalTopicCount)
          currentMarker.setIcon(normalIcon)
        }

        // Restore all states to normal if no clicked state/marker
        if (!clickedLayerRef.current && allLayersRef.current && allLayersRef.current.length > 0) {
          // This will be handled by StateMap's mouseout handler
        }

        // Close tooltip when mouse leaves (unless it's the clicked marker)
        if (currentMarker !== clickedLayerRef.current) {
          currentMarker.closeTooltip()
          if (openTooltipLayerRef.current === currentMarker) {
            openTooltipLayerRef.current = null
          }
        }
      },
    })

    // Add to map
    marker.addTo(map)
    markerRef.current = marker
    layerRef.current = marker

    // Add to allLayersRef for dimming functionality
    if (allLayersRef.current) {
      allLayersRef.current.push(marker)
    } else {
      allLayersRef.current = [marker]
    }

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
        layerRef.current = null
        // Remove from allLayersRef
        if (allLayersRef.current) {
          allLayersRef.current = allLayersRef.current.filter(l => l !== marker)
        }
      }
    }
  }, [map, isDark, dcData, dataTimestamp, createDCFeature, onDCClick, clickedLayerRef, allLayersRef, openTooltipLayerRef])

  // Update icon when theme or data changes
  useEffect(() => {
    if (!markerRef.current) return

    const dcFeature = createDCFeature()
    const topicCount = dcFeature.properties?.topics?.length || 0
    
    // Only update if not clicked (clicked markers have special styling)
    if (markerRef.current !== clickedLayerRef.current) {
      const icon = createStarIcon(isDark, topicCount)
      markerRef.current.setIcon(icon)
    }

    // Update feature reference
    markerRef.current.feature = dcFeature

    // Update tooltip
    const tooltipText = generateTooltipText(dcFeature, isDark)
    if (tooltipText) {
      const isClicked = markerRef.current === clickedLayerRef.current
      markerRef.current.unbindTooltip()
      markerRef.current.bindTooltip(tooltipText, {
        permanent: isClicked,
        direction: 'top',
        className: 'state-tooltip',
      })
      if (isClicked) {
        markerRef.current.openTooltip()
      }
    }
  }, [isDark, dcData, dataTimestamp, createDCFeature, clickedLayerRef])

  return null
}

export default DCMarker

