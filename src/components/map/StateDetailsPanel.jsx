import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../ui/ThemeProvider'
import TopicList from './TopicList'
import { toTitleCase } from '../../utils/tooltipUtils'
import './StateDetailsPanel.css'

const StateDetailsPanel = ({ isOpen, onClose, stateData, dataTimestamp }) => {
  const { isDark } = useTheme()
  const panelRef = useRef(null)
  const overlayRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      // Close if clicking on overlay or its children (but not on the panel itself)
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        overlayRef.current &&
        (overlayRef.current === event.target || overlayRef.current.contains(event.target))
      ) {
        onClose()
      }
    }

    // Add event listener with a small delay to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Get header height to position sidebar below it
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('.app-header')
      if (header) {
        setHeaderHeight(header.offsetHeight)
      }
    }

    updateHeaderHeight()
    window.addEventListener('resize', updateHeaderHeight)

    return () => {
      window.removeEventListener('resize', updateHeaderHeight)
    }
  }, [])

  // Handle enter/exit animations
  useEffect(() => {
    if (isOpen && stateData) {
      // Show element first
      setIsVisible(true)
      // Small delay to ensure element is in DOM before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true)
        })
      })
    } else if (!isOpen && isVisible) {
      // Start exit animation - keep element visible during animation
      setShouldAnimate(false)
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 400) // Match transition duration (0.4s = 400ms)
      return () => clearTimeout(timer)
    }
  }, [isOpen, stateData, isVisible])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Don't render if no state data, but keep rendering during exit animation
  if (!stateData) {
    return null
  }

  // Keep element in DOM during exit animation even if isOpen is false
  if (!isVisible) {
    return null
  }

  const { name, topics = [], topTopic, trendingScore } = stateData

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`state-details-overlay ${shouldAnimate ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
        style={{ 
          top: `${headerHeight}px`, 
          height: `calc(100vh - ${headerHeight}px)`
        }}
      />

      {/* Sidebar Panel */}
      <aside
        ref={panelRef}
        className={`state-details-panel ${shouldAnimate ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="state-details-title"
        style={{ 
          top: `${headerHeight}px`, 
          height: `calc(100vh - ${headerHeight}px)`
        }}
      >
        {/* Header */}
        <header className="state-details-header">
          <h2 id="state-details-title" className="state-details-title">
            {name}
          </h2>
          {topTopic && (
            <p className="state-details-subtitle">
              Most Searched: <strong>{toTitleCase(topTopic)}</strong>
            </p>
          )}
          <button
            className="state-details-close"
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClose()
              }
            }}
            aria-label="Close state details panel"
            aria-describedby="state-details-title"
          >
            ×
          </button>
        </header>

        {/* Content */}
        <div className="state-details-content">
          {topics && topics.length > 0 ? (
            <>
              <div className="state-details-section-header">
                <h3 className="state-details-section-title">Trending Topics</h3>
                {dataTimestamp && (
                  <span className="state-details-updated">
                    Updated {new Date(dataTimestamp).toLocaleString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}
                  </span>
                )}
              </div>
              <TopicList topics={topics} stateName={name} dataTimestamp={dataTimestamp} />
            </>
          ) : (
            <div className="state-details-empty">
              <p>No topic data available for this state.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default StateDetailsPanel

