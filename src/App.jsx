import React from 'react'
import { ThemeProvider } from './components/ui/ThemeProvider'
import ThemeToggle from './components/ui/ThemeToggle'
import MapContainer from './components/map/MapContainer'
import './styles/App.css'

function App() {
  return (
    <ThemeProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-header-content">
            <div className="app-header-text">
              <h1>Political Forecast</h1>
              <p>Visualizing trending Law and Government topics across the United States</p>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="app-main">
          <MapContainer />
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App

