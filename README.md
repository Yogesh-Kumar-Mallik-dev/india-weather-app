# 🇮🇳 Mausam Bharat - Detailed Indian Weather & AQI Portal

A modern, high-performance weather web application specifically designed for India with **separated Frontend and Backend**, built with **Next.js** using **pure Client Components (No React Server Components)**, powered completely by **Secretless Open APIs** (zero API keys or credentials needed).

---

## 🌟 Key Highlights

- **Frontend & Backend Decoupled**:
  - `frontend/`: Next.js Client Application (Pages Router, React hooks, Tailwind CSS, Lucide icons, Recharts interactive graphs, Leaflet rain radar maps).
  - `backend/`: Dedicated Node.js Express API service with in-memory cache, CPCB NAQI calculator, IMD weather warnings generator, and batch multi-city aggregators.
- **Zero Server Components**: All rendering, state management, and API querying happen client-side using React 18 hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- **100% Secretless APIs**:
  - [Open-Meteo Weather API](https://open-meteo.com/): Current conditions, 48-hour hourly forecasts, 14-day daily forecasts, UV index, soil/surface pressure.
  - [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api): PM2.5, PM10, $NO_2$, $SO_2$, $CO$, $O_3$, dust.
  - [RainViewer Weather Maps API](https://www.rainviewer.com/api.html): Real-time live precipitation radar tile overlays across India.
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api): Indian city and district search with coordinates resolution.
- **India-Centric Meteorological Intelligence**:
  - **Indian NAQI (CPCB)**: Real-time calculation based on Central Pollution Control Board breakpoints with health impacts and N95/indoor advisories.
  - **IMD Warnings**: Real-time evaluation of Heatwaves / *Loo* ($\ge 40^\circ\text{C}$ / $\ge 45^\circ\text{C}$), Heavy Monsoon Downpour ($\ge 64.5\text{ mm}$), Severe AQI, Dense Fog (*Kohra*), and High Wind Squalls.
  - **Live Rain & Cloud Radar**: Interactive Leaflet map with animated RainViewer radar frames over the subcontinent.
  - **All-India Regional Explorer**: Real-time snapshot of 12 major metro hubs across North, South, West, East, Central, and Northeast regions.
  - **Dual City Comparison**: Side-by-side comparison of any two Indian cities (e.g., Delhi vs Mumbai, Bengaluru vs Chennai).
  - **Units Toggle**: Instant switching between Celsius (°C) and Fahrenheit (°F), plus km/h, m/s, and mph.

---

## 📁 Project Structure

```
india-weather-app/
├── backend/
│   ├── src/
│   │   ├── config.js               # Port, timeouts, API endpoints
│   │   ├── server.js               # Express application entrypoint
│   │   ├── routes/
│   │   │   └── weatherRoutes.js    # /api/weather, /api/cities, /api/india/overview, /api/radar
│   │   ├── services/
│   │   │   ├── weatherService.js   # Open-Meteo weather & air quality aggregation
│   │   │   └── rainViewerService.js# RainViewer radar tiles metadata & frame sequencer
│   │   ├── utils/
│   │   │   ├── aqiCalculator.js    # CPCB Indian National AQI calculation
│   │   │   └── weatherCodes.js     # WMO codes mapped to Indian weather descriptions
│   │   └── data/
│   │       └── indianCities.js     # Curated major Indian cities, states, and coordinates
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── _app.jsx            # Application wrapper
│   │   │   ├── _document.jsx       # HTML structure, fonts, meta
│   │   │   └── index.jsx           # Main client-side weather dashboard (No RSC)
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header with city search, GPS detect, °C/°F toggle
│   │   │   ├── WeatherHero.jsx     # Current weather card with feels-like & sun cycle
│   │   │   ├── WeatherAlerts.jsx   # IMD warnings banner (Heatwave, Rain, Fog, AQI)
│   │   │   ├── AqiCard.jsx         # Indian NAQI gauge & pollutant breakdown
│   │   │   ├── KeyMetricsGrid.jsx  # UV index, pressure, cloud cover, precipitation
│   │   │   ├── HourlyForecast.jsx  # 48h interactive Recharts curves (Temp/Rain/Wind)
│   │   │   ├── DailyForecast.jsx   # 14-day extended outlook with range bars
│   │   │   ├── RainRadarMap.jsx    # Interactive Leaflet + RainViewer radar map
│   │   │   ├── IndiaOverviewGrid.jsx # All-India regional metro explorer
│   │   │   ├── CityComparison.jsx  # Side-by-side comparison between 2 Indian cities
│   │   │   └── WeatherIcon.jsx     # Dynamic weather icons
│   │   ├── utils/
│   │   │   └── formatters.js       # Formatting helpers
│   │   └── styles/
│   │       └── globals.css         # Tailwind & glassmorphism theme
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── next.config.mjs
│   └── package.json
│
├── run-dev.js                      # Root script to run both backend and frontend together
├── package.json                    # Root monorepo scripts
└── README.md
```

---

## 🚀 Quick Start

### 1. Run Both Frontend and Backend Concurrently
From the root directory (`/home/yogesh/india-weather-app`):
```bash
npm run dev
```

This will launch:
- **Backend**: `http://localhost:5000`
- **Frontend**: `http://localhost:3000`

### 2. Run Independently

#### Backend:
```bash
cd backend
npm run dev
```
Health Check: `http://localhost:5000/api/health`

#### Frontend:
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend health status and mode |
| `GET` | `/api/weather?city=Delhi&lat=28.61&lon=77.20` | Detailed weather, CPCB AQI, alerts, 48h hourly & 14d daily |
| `GET` | `/api/cities/search?q=mumbai` | Search any city/district in India with autocomplete |
| `GET` | `/api/india/overview` | Live conditions across 12 major Indian regional hubs |
| `GET` | `/api/radar` | RainViewer live radar metadata and tile URL patterns |
| `GET` | `/api/cities/popular` | Curated list of all major Indian states and cities |
