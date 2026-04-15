# 📡 HAM Radio Dashboard

A customizable dashboard for ham radio operators. Display live radar images, satellite feeds, weather data, propagation maps, and more — all in one browser window.

> **Originally a single HTML page app** — this project has been modernized to React + TypeScript while keeping the same easy configuration format. Your existing `config.js` or `config.json` files still work!

![Dashboard Sample](examples/dashboard_sample.png)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running the Dashboard](#running-the-dashboard)
- [Configuration](#configuration)
  - [Config File Formats](#config-file-formats)
  - [Grid Layout](#grid-layout)
  - [Dashboard Tiles](#dashboard-tiles)
  - [Menu Items](#menu-items)
  - [RSS Feeds](#rss-feeds)
  - [Weather Underground Integration](#weather-underground-integration)
  - [511PA Traffic Camera Integration](#511pa-traffic-camera-integration)
- [Using the Dashboard](#using-the-dashboard)
  - [Keyboard and Mouse Controls](#keyboard-and-mouse-controls)
  - [Settings Page](#settings-page)
  - [Multiple Configurations](#multiple-configurations)
- [Tile Source Types](#tile-source-types)
- [Legacy HTML Version](#legacy-html-version)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Quick Start

The fastest way to get started is using the included launcher scripts. They handle everything for you — checking for prerequisites, installing dependencies, and opening the dashboard in your browser.

### Windows

Open PowerShell and run:

```powershell
.\start.ps1
```

### macOS / Linux

Open a terminal and run:

```bash
./start.sh
```

> **Note:** On macOS/Linux, if you get a "permission denied" error, first run: `chmod +x start.sh`

That's it! The script will:
1. Check if Node.js is installed (and tell you where to get it if not)
2. Install project dependencies automatically
3. Start the development server
4. Open the dashboard in your default browser

---

## Requirements

- **Node.js** version 18 or newer — [Download here](https://nodejs.org/)
  - The LTS (Long Term Support) version is recommended
  - The installer includes `npm` (Node Package Manager) automatically

That's the only thing you need to install yourself. Everything else is handled automatically.

### How to Check if Node.js is Installed

Open a terminal (or PowerShell on Windows) and type:

```
node --version
```

If you see a version number like `v20.11.0`, you're good to go. If you get an error, [download and install Node.js](https://nodejs.org/).

---

## Installation

1. **Download or clone** this repository to your computer:

   ```bash
   git clone https://github.com/rbleattler/hamdashboard.git
   cd hamdashboard
   ```

   Or download the ZIP file from GitHub and extract it.

2. **Install dependencies** (the launcher scripts do this automatically, but you can also do it manually):

   ```bash
   npm install
   ```

---

## Running the Dashboard

### Using Launcher Scripts (Recommended)

| Platform        | Command              |
|-----------------|----------------------|
| Windows         | `.\start.ps1`       |
| macOS / Linux   | `./start.sh`        |

### Manual Start

```bash
npm run dev
```

Then open your browser to **http://localhost:5173**

### Script Options

Both launcher scripts support optional parameters:

| Parameter     | Default   | Description                        |
|---------------|----------|------------------------------------|
| `--port`      | `5173`   | Port number for the dev server     |
| `--no-browser`| *(off)*  | Don't open the browser automatically |
| `--host`      | *(off)*  | Allow access from other devices on your network |

**Examples:**

```powershell
# Windows - use port 8080 and allow network access
.\start.ps1 -Port 8080 -ExposeHost

# Windows - don't open the browser
.\start.ps1 -NoBrowser
```

```bash
# macOS/Linux - use port 8080 and allow network access
./start.sh --port 8080 --host

# macOS/Linux - don't open the browser
./start.sh --no-browser
```

---

## Configuration

The dashboard is configured using a config file that controls everything: the grid layout, which tiles are shown, what menu links are available, and more.

### Config File Formats

The dashboard supports two config file formats. Both go in the `public/` folder:

1. **`config.js`** — JavaScript format (original format, easiest to edit)
2. **`config.json`** — JSON format (alternative)

The dashboard looks for configs in this order:
1. Settings saved in your browser (via the Setup page)
2. Config file specified in the URL (e.g., `?config=myconfig.js`)
3. `config.js`
4. `config.json`
5. Built-in minimal fallback

### Grid Layout

Control how many tiles appear on screen:

```js
// config.js
var layout_cols = 4;  // Number of columns (default: 4)
var layout_rows = 3;  // Number of rows (default: 3)
```

```json
// config.json
{
  "layout_cols": 4,
  "layout_rows": 3
}
```

Common layouts:
- **4×3** = 12 tiles (default, good for widescreen monitors)
- **3×3** = 9 tiles
- **2×2** = 4 tiles (good for smaller screens)
- **5×3** = 15 tiles (for ultra-wide monitors)

### Dashboard Tiles

Each tile shows an image, video, website, or weather widget. Images auto-refresh periodically.

**JavaScript format (`config.js`):**

```js
var aIMG = [
  ["TILE TITLE", "https://example.com/image.gif"],
  ["ANOTHER TILE", "https://example.com/other.png"],
  // ... more tiles
];

// Optional: set rotation speed per tile (in milliseconds)
var tileDelay = [
  10000, 30000,  // tile 1 = 10 seconds, tile 2 = 30 seconds
];
```

**JSON format (`config.json`):**

```json
{
  "aIMG": [
    ["TILE TITLE", "https://example.com/image.gif", 10000],
    ["ANOTHER TILE", "https://example.com/other.png", 30000]
  ]
}
```

#### Multiple Sources per Tile

A tile can rotate between multiple images:

```js
// config.js — multiple titles + multiple sources
[["Radar Large", "Radar Small"],
  "https://example.com/radar-large.gif",
  "https://example.com/radar-small.gif"],
```

The tile will cycle through the images and update the title to match.

### Menu Items

Menu items appear in the left and right hamburger menus. Clicking a menu item opens a full-screen overlay with that website.

**JavaScript format (`config.js`):**

```js
var aURL = [
  // [color, name, URL, scale, side]
  ["2196F3", "DX CLUSTER", "https://dxcluster.ha8tks.hu/map/", "1"],
  ["2196F3", "RADAR", "https://weather.gc.ca/", "1", "R"],
  //                                                     ^^^ "R" = right menu
];
```

| Field  | Description                                        |
|--------|----------------------------------------------------|
| Color  | Hex color code for the menu text (without `#`)     |
| Name   | Text shown in the menu                             |
| URL    | Website to open when clicked                       |
| Scale  | Zoom level (1 = normal, 1.5 = 150%, etc.)         |
| Side   | `"R"` for right menu, omit or anything else for left |

### RSS Feeds

Add RSS/Atom feeds to display a scrolling news ticker at the bottom of the dashboard:

```js
// config.js
var aRSS = [
  ["https://www.amsat.org/feed/", 60],           // Refresh every 60 minutes
  ["https://daily.hamweekly.com/atom.xml", 120],  // Refresh every 120 minutes
];
```

### Weather Underground Integration

The dashboard includes a built-in weather widget that shows real-time data from a Weather Underground Personal Weather Station (PWS).

**To set up weather:**

1. Get a free API key from [Weather Underground](https://www.wunderground.com/member/api-keys)
2. Find your station ID (or a nearby station) on [Weather Underground](https://www.wunderground.com/wundermap)
3. Add a weather tile to your config:

```js
// config.js — add to aIMG array:
["WEATHER (WU)", "weather|YOUR_STATION_ID|YOUR_API_KEY|e"],
```

The format is: `weather|STATION_ID|API_KEY|UNITS`

| Units | Description    |
|-------|---------------|
| `e`   | Imperial (°F, mph, inHg) |
| `m`   | Metric (°C, km/h, mb)    |
| `h`   | Hybrid (°C, mph, mb)     |

The weather tile shows temperature, humidity, and wind at a glance. Double-click the tile to open the full weather view with detailed gauges for temperature, wind direction, precipitation, and barometric pressure.

### 511PA Traffic Camera Integration

The dashboard can display live video feeds from Pennsylvania's 511PA / PennDOT traffic camera network. Camera feeds are streamed as live HLS video directly in the tile.

**To add a traffic camera tile:**

1. Find a camera on [511PA](https://www.511pa.com) and note its camera ID (visible in the camera's URL or details, e.g. `CAM-11-185`)
2. Add a tile using the `511pa|` prefix:

```js
// config.js — add to aIMG array:
["511PA TRAFFIC CAM", "511pa|CAM-11-185"],
```

The format is: `511pa|CAMERA_ID`

| Parameter   | Description                                                        |
|-------------|--------------------------------------------------------------------|
| `CAMERA_ID` | The PennDOT camera identifier (e.g. `CAM-11-185`, `171_003`)      |

The stream URL is automatically constructed as:
`https://cwwp2.dot.pa.gov/rtplive/{CAMERA_ID}/playlist.m3u8`

The traffic camera tile shows:
- Live HLS video stream from the camera
- A "LIVE" indicator overlay
- An error state when the camera feed is unavailable
- Video controls in the full-screen view

Double-click the tile to open a full-screen view with video controls and camera details.

---

## Using the Dashboard

### Keyboard and Mouse Controls

| Action                           | What It Does                                         |
|----------------------------------|------------------------------------------------------|
| **Double-click** an image tile   | Open full-screen view of that image                  |
| **Double-click** a weather tile  | Open the full weather detail page                    |
| **Double-click** a traffic cam tile | Open full-screen traffic camera view              |
| **Double-click** in full screen  | Close full-screen view                               |
| **Right-click** an image tile    | Switch to the next image (for tiles with multiple sources) |
| **Mouse wheel** (in full screen) | Zoom in/out                                          |

### Settings Page

Click the **Setup** button in the right menu to open the Settings page. From here you can:

- Change the top bar text (your callsign, grid locator, etc.)
- Adjust the grid layout (columns × rows)
- Add, edit, or remove tiles
- Add, edit, or remove menu items
- Configure RSS feeds
- Choose whether settings are saved in your browser or loaded from a config file
- Export your settings to a `config.js` file

### Multiple Configurations

You can create multiple config files and switch between them:

1. Create a new config file (e.g., `public/contest.js`)
2. Add it as a menu item:
   ```js
   ["f3de21", "CONTEST MODE", "contest.js"],
   ```
3. Clicking that menu item loads the new configuration
4. A **PREVIOUS** button automatically appears to go back

You can also load a config directly via URL:
```
http://localhost:5173/?config=contest.js
```

---

## Tile Source Types

| Prefix          | Example                                      | Description                          |
|-----------------|----------------------------------------------|--------------------------------------|
| *(none)*        | `https://example.com/image.gif`              | Regular image (auto-refreshing)      |
| `invert\|`      | `invert\|https://example.com/dark-image.png` | Image with colors inverted           |
| `iframe\|`      | `iframe\|https://example.com/page`           | Embedded website                     |
| `iframedark\|`  | `iframedark\|https://example.com/page`       | Embedded website with dark background |
| `dark\|`        | `dark\|https://example.com/page`             | Website with dark theme applied      |
| `weather\|`     | `weather\|STATION\|APIKEY\|e`                | Weather Underground widget           |
| `511pa\|`       | `511pa\|CAM-11-185`                          | 511PA live traffic camera (HLS video)|

**Video files** (`.mp4`, `.webm`, `.ogg`) are automatically detected and played as video.

---

## Legacy HTML Version

The original single-file HTML version is still included at `legacy/hamdash.html`. It works by simply opening the file in a browser — no Node.js required. However, it does not include the newer features like the weather widget, RSS ticker, or settings page.

---

## Troubleshooting

### "node: command not found" or "'node' is not recognized"

Node.js is not installed. Download it from [nodejs.org](https://nodejs.org/) and install the LTS version.

### The dashboard opens but shows "Loading Dashboard..."

This usually means the config file has a syntax error. Open your browser's Developer Tools (press `F12`), go to the Console tab, and look for error messages. Common issues:
- Missing comma at the end of a line in `config.js`
- Invalid JSON in `config.json`

### Images aren't loading

- Check that the image URLs are accessible in your browser
- Some image sources block embedding (CORS). Try a different source.
- For local network sources (like Pi-Star), make sure you're on the same network.

### Weather tile shows "Error" or no data

- Verify your Weather Underground API key is valid
- Check that the station ID exists on [wunderground.com](https://www.wunderground.com)
- The free API key has a limit of 1,500 calls/day

### Port already in use

If you see "Port 5173 is already in use," either:
- Close the other application using that port, or
- Use a different port: `.\start.ps1 -Port 8080` or `./start.sh --port 8080`

### Permission denied on macOS/Linux

Run `chmod +x start.sh` to make the script executable.

---

## For Developers

### Build Commands

| Command          | Description                                |
|------------------|--------------------------------------------|
| `npm run dev`    | Start development server with hot reload   |
| `npm run build`  | Build for production (output in `dist/`)   |
| `npm run preview`| Preview the production build locally       |
| `npm run lint`   | Run ESLint code linting                    |

### Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool and dev server
- **Tailwind CSS 4** — Styling
- **No backend required** — Everything runs in the browser

### Project Structure

```
hamdashboard/
├── public/              # Static files & config
│   ├── config.js        # Default JS config (edit this!)
│   ├── config.json      # Default JSON config (alternative)
│   └── satellite.js     # Example satellite tracking config
├── src/
│   ├── HamDashApp.tsx   # Main app component
│   ├── components/      # UI components
│   │   ├── Dashboard/   # Grid layout
│   │   ├── Menu/        # Side menus & overlay
│   │   ├── Settings/    # Setup page
│   │   ├── Tile/        # Individual tile
│   │   ├── TopBar/      # Top header bar
│   │   ├── RssTicker/   # RSS news ticker
│   │   └── FullScreenView/ # Full-screen image view
│   ├── config/          # Config loading & types
│   ├── modules/         # Content renderers
│   │   ├── ImageModule  # Image display
│   │   ├── VideoModule  # Video player
│   │   ├── WeatherModule # Weather Underground widget
│   │   ├── TrafficCamModule # 511PA traffic camera feed
│   │   └── WebContentModule # Iframe content
│   ├── hooks/           # React hooks
│   └── utils/           # Helper functions
├── legacy/              # Original single-file HTML version
├── examples/            # Screenshot examples
├── start.ps1            # Windows launcher script
├── start.sh             # macOS/Linux launcher script
└── package.json         # Project dependencies
```

---

## License

MIT — See [LICENSE](LICENSE) for details.

Based on the original [VA3HDL Ham Radio Dashboard](https://github.com/VA3HDL/hamdashboard).
