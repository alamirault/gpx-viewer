# GPX Viewer - Design System

## Layout Overview

The application is a single-page viewer with no backend. Users drop a GPX file, and the app renders a map, elevation profile, and track metrics.

---

## Desktop Layout (>= 1280px)

```
+------------------------------------------------------------------+
| [GPX Viewer]                                    [FR | EN]        |
+------------------------------------------------------------------+
|                          |                                       |
|                          |  +----------------------------------+ |
|                          |  |        Metrics Panel             | |
|                          |  |  Distance | Elev+ | Elev- | Time | |
|                          |  +----------------------------------+ |
|       Map View           |                                       |
|       (60%)              |  +----------------------------------+ |
|                          |  |                                  | |
|                          |  |       Elevation Chart            | |
|                          |  |       (Recharts area)            | |
|                          |  |                                  | |
|                          |  +----------------------------------+ |
|                          |                                       |
+------------------------------------------------------------------+
```

- Left panel: 60% width, full-height Leaflet map
- Right panel: 40% width, metrics on top, elevation chart below
- Header: fixed top bar, logo left, language switcher right

## Tablet Layout (768px - 1279px)

```
+------------------------------------------+
| [GPX Viewer]                   [FR | EN] |
+------------------------------------------+
|                                          |
|              Map View                    |
|              (100%, 50vh)                |
|                                          |
+------------------------------------------+
|         Metrics Panel (grid 2x2)         |
+------------------------------------------+
|                                          |
|           Elevation Chart                |
|           (100%, 250px)                  |
|                                          |
+------------------------------------------+
```

## Mobile Layout (< 768px)

```
+------------------------------+
| [GPX Viewer]       [FR | EN] |
+------------------------------+
|                              |
|          Map View            |
|          (100%, 40vh)        |
|                              |
+------------------------------+
|    Metrics (stacked 2x2)     |
+------------------------------+
|                              |
|      Elevation Chart         |
|      (100%, 200px)           |
|                              |
+------------------------------+
```

---

## Components

### 1. Header
- Fixed top bar, height 56px
- App name/logo on the left
- Language switcher (FR/EN toggle) on the right
- Subtle bottom border shadow

### 2. DropZone
- Full-screen overlay when no file is loaded
- Centered content: icon + text + "or click to browse"
- Dashed border (2px), rounded corners (12px)
- On hover/dragover: border animates (dash-offset animation), background tints
- Accepts `.gpx` files only

### 3. MapView
- Leaflet map filling its container
- OpenStreetMap tiles
- GPX track rendered as a colored polyline
- Auto-fits bounds to track on load

### 4. ElevationChart
- Recharts AreaChart
- X-axis: distance (km)
- Y-axis: elevation (m)
- Gradient fill under the curve (primary color to transparent)
- Tooltip on hover showing elevation + distance
- Responsive container

### 5. MetricsPanel
- Grid of metric cards (2x2 on mobile, 4 columns on desktop)
- Each card: icon + label + value
- Metrics: Total Distance, Elevation Gain, Elevation Loss, Duration
- Cards have subtle border and rounded corners

### 6. LanguageSwitcher
- Simple toggle: FR | EN
- Active language highlighted
- Compact pill shape

---

## Interactions

- **File drop**: drag file onto DropZone or click to open file picker
- **Drag feedback**: border animation + background color shift
- **Chart hover**: tooltip follows cursor, corresponding point highlights on map
- **Map zoom**: standard Leaflet controls (scroll, pinch, buttons)
- **Language switch**: instant toggle, all labels re-render

---

## Color Palette

| Token              | Value     | Usage                        |
|--------------------|-----------|------------------------------|
| Primary            | #2E7D5B   | Buttons, active states, links|
| Primary Light      | #4CAF82   | Hover states, chart gradient |
| Primary Dark       | #1B5E3B   | Pressed states               |
| Background         | #F7F9F8   | Page background              |
| Surface            | #FFFFFF   | Cards, panels                |
| Text Primary       | #1A2B23   | Headings, body text          |
| Text Secondary     | #5A6B63   | Labels, captions             |
| Border             | #D4DDD8   | Card borders, dividers       |
| Accent             | #E8735A   | Elevation loss, warnings     |
| Drop Zone BG       | #EAF5F0   | Drop zone background         |

## Typography

- Font family: Inter (Google Fonts), fallback system sans-serif
- Headings: 600 weight
- Body: 400 weight
- Sizes: 14px base, scale from 12px to 24px
