import React from 'react'
import { useTheme } from './ThemeProvider'
import './ThemeToggle.css'

// Sun icon SVG (monochrome line art)
const SunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="theme-icon-svg"
  >
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="8" y1="1" x2="8" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="14" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="2" y1="8" x2="1" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13.07" y1="2.93" x2="12.36" y2="3.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3.64" y1="12.36" x2="2.93" y2="13.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13.07" y1="13.07" x2="12.36" y2="12.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3.64" y1="3.64" x2="2.93" y2="2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// Moon icon SVG (monochrome line art with stars)
const MoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="theme-icon-svg"
  >
    <path
      d="M6 2C6 5.5 8.5 8 12 8C11.5 10.5 9.5 12.5 7 13C4.5 13.5 2 11.5 2 9C2 6.5 3.5 4 6 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="11" cy="4" r="0.5" fill="currentColor" />
    <circle cx="13" cy="6" r="0.5" fill="currentColor" />
  </svg>
)

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <label className="theme-toggle-switch" aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <input
        type="checkbox"
        checked={isDark}
        onChange={toggleTheme}
        className="theme-toggle-input"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      />
      <span className="theme-toggle-slider">
        <span className="theme-toggle-knob">
          <span className="theme-toggle-icon">
            {isDark ? <MoonIcon /> : <SunIcon />}
          </span>
        </span>
      </span>
    </label>
  )
}

export default ThemeToggle

