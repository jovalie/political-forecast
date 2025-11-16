# Political Forecast

Political Forecast is a dynamic web application that visualizes the most popular political topics across the United States, updated daily using Google Trends data. Unlike Google Trends' native map, this app compares multiple political topics per category, showing which subject is trending the most in each state and allowing exploration down to the DMA (Designated Market Area) level.

## Features

- **Top Trending Political Topic Map**: See the #1 political topic for each state, refreshed daily using Google Trends – Law and Government.

- **Category-based Analysis**: Maps are generated per specified category (e.g., "Law and Government"), combining multiple topics from that category, not just for single keywords.

- **Unique Topic Mode**: Toggle to ensure each map shows only states with unique top topics, minimizing redundancy.

- **Interactive State Details**: Hover over any state to see its #1 trending Law and Government topic. Click on a state to open a right-hand sidebar showing all Law and Government trends for that state, ordered by relevance.

- **Google News Integration**: Click on any topic in the state details sidebar to view Google News search results for that topic.

- **Daily Updates**: Designed to encourage daily visits as topics shift over time.

- **Vercel Deployment**: Simple, fast deployment and automatic updates via Vercel for instant distribution and scalability.

## Technologies Used

| Component | Tool/Library | Purpose |
|-----------|--------------|---------|
| Frontend | React App | UI scaffolding and rendering |
| Data Ingestion | RSS Feed Ingestor | Fetches from Google Trends RSS |
| Map | React Leaflet | Interactive, performant maps |
| Visualization | Plotly.js | Data overlays & charting |
| Hosting | Vercel | Dynamic/static site deployment |

## How It Works

1. The app uses a script to fetch top trending topics from the Google Trends RSS feed daily for each U.S. state and DMA, pulling from the "Law and Government" category and combining multiple topics, then stores these results as static JSON files within the repo or a cloud storage bucket.

2. For each state, the app determines the top trending political topic from the backend-generated data.

3. An interactive map is rendered with React Leaflet, color-coding or labeling each state by its trending topic.

4. Users can hover over states to see the #1 trending topic, and click on states to view a right-hand sidebar with all Law and Government trends for that state, ordered by relevance.

5. Clicking on any topic in the sidebar opens Google News search results for that topic in a new tab.

6. Users can toggle to a unique-topic view, minimizing repetition across neighboring states.

7. The ingestion script runs daily (recommended: Vercel Cron Jobs or GitHub Actions), updating the JSON source data and redeploying the site to push changes live automatically.

