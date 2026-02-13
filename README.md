# System Pulse

**Real-time app monitoring for local dev environments**

A lightweight, open-source tool for monitoring running applications with beautiful logos, real-time network statistics, and intelligent resource usage alerts.

![Python](https://img.shields.io/badge/Python-3.13+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.128.8-green?logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

---

## ✨ Key Features

### 📊 Real-Time Dashboard
- Monitor **top 20 active applications** with intelligent relevance scoring
- **Paginated view** - Load More button to browse all processes
- Live **CPU & Memory** usage metrics
- **Incoming/Outgoing** connection counts
- **Configurable auto-refresh** (5-300 seconds, default: 30 seconds)
- **Visible page indicator** (Page X of Y) for clear pagination
- User notifications during data loading

### 🔍 System Snapshot View
- **View all 147+ running processes** in a comprehensive table
- **6-column layout**: Process Name, CPU %, Memory MB, Incoming, Outgoing, PID
- **Real-time search** by process name (case-insensitive)
- **CPU filter slider** (0-100%) and **Memory filter slider** (0-1000 MB)
- **Sortable columns** with visual indicators (↑/↓)
- **CSV export** - Download snapshot as timestamped CSV file
- **Combined filtering** - Apply multiple filters simultaneously
- **Fresh data** - No caching for accurate real-time snapshot

### 🎯 Self-Monitoring Dashboard
- **4 visual indicator cards** showing system health:
  - **CPU Usage** - Real-time percentage with color-coded progress bar
  - **RAM Usage** - Current memory consumption with status indicator
  - **Uptime** - System runtime in human-readable format (days, hours, minutes)
  - **Last Deviation** - Alerts for anomalous process behavior
- **Automatic deviation detection**:
  - 🟡 Warning: Process >70% CPU or >500MB memory
  - 🔴 Critical: Process >90% CPU or >800MB memory
  - Shows process name, metric type, severity level, and timestamp
- **5-second refresh cycle** - Independent from dashboard refresh interval
- **Only visible on Dashboard view** - Hidden in Snapshot for clarity

### 🎨 Beautiful UI
- Four **professional themes**: Light (default), Warm, Pink, Dark
- **Modern design** with smooth animations and transitions
- **Responsive** layout works on desktop and tablet
- **Lightweight** - no heavy frameworks (vanilla JS + Tailwind CSS)
- **Solid modal backgrounds** with enhanced contrast and depth effects
- **Accessible color patterns** - Readable across all themes
- **Conventional toast notifications** with emoji icons

### 📦 50+ App Support
- **Windows**: Chrome, Firefox, VS Code, Git, Docker, and more
- **Linux**: Python, Node.js, Docker, Redis, PostgreSQL, and more
- **Auto-detection** of installed applications
- High-quality logos from SimpleIcons CDN with automatic caching

### ⚙️ Configurable Thresholds & Settings
- Set custom CPU/RAM warning levels (Yellow/Red)
- **Configurable auto-refresh interval** (5-300 seconds)
- Color-coded status indicators (🟢🟡🔴)
- Persistent settings via browser storage
- Real-time threshold validation

### ⚡ Performance Optimizations
- **1-second TTL caching** reduces redundant process collection
- **Request timeout protection** (5 second max per request)
- **Async operation support** for non-blocking data collection
- ~100x speedup on cached requests (first: 1400ms, cached: 12ms)

### 🔐 Security-First
- ✅ No data collection or analytics
- ✅ Runs entirely locally (localhost:8000)
- ✅ No external API calls except CDN for images
- ✅ Open-source code - fully auditable
- ✅ License: MIT (permissive, commercial-friendly)


---

## 🚀 Quick Start

### Requirements
- **Python** 3.8+ 
- **Windows**, **Linux**, or **macOS**

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/Maneesh-Relanto/system-pulse.git
cd system-pulse
```

**2. Create a virtual environment (optional but recommended):**
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# Linux/macOS
python3 -m venv .venv
source .venv/bin/activate
```

**3. Install dependencies:**
```bash
pip install -r requirements.txt
```

**4. Start the server:**
```bash
python -m uvicorn main:app --reload --port 8000
```

**5. Open in browser:**
```
http://localhost:8000
```

---

## 📖 Usage Guide

### View Selector
Switch between three main views using the top navigation:
- **Dashboard** - Default view with self-monitoring cards + top 20 processes
- **Snapshot** - Comprehensive table of all processes with sorting and filtering
- **All Apps** - Complete catalog of 50+ detected applications

### Dashboard View
The default view shows **4 self-monitoring cards** + **top 20 active applications** ranked by relevance score (CPU + Memory + Network activity):

**Self-Monitoring Cards (update every 5 seconds):**
- 🖥️ **CPU Usage** - Current percentage with progress bar and status color
- 💾 **RAM Usage** - Current memory in MB with threshold indicator
- ⏱️ **Uptime** - System runtime (e.g., "5 days, 3 hours, 15 minutes")
- ⚠️ **Last Deviation** - Most recent anomaly detected:
  - Shows process name (e.g., "Code.exe")
  - Metric type (CPU or Memory)
  - Severity: 🟡 Warning or 🔴 Critical
  - Timestamp (e.g., "2 minutes ago")

**Process Cards (top 20):**
- Application logo and name
- Process ID (PID)
- Incoming/outgoing connections
- CPU usage percentage with status indicator
- Memory usage with status indicator

**Status Indicators:**
- 🟢 **Green**: Healthy (below threshold)
- 🟡 **Yellow**: Caution (approaching limit)
- 🔴 **Red**: Critical (over limit)

### System Snapshot View
Click **"Snapshot"** to view comprehensive process analysis:

**Table Features:**
- **All 147+ running processes** displayed in real-time
- **6 columns** with sortable headers (click column header to sort):
  1. Process Name - Executable name
  2. CPU % - Current CPU usage
  3. Memory MB - Current RAM usage
  4. Incoming - Incoming connection count
  5. Outgoing - Outgoing connection count
  6. PID - Process ID

**Filtering:**
- **Search Box** - Type process name to filter (case-insensitive, real-time)
- **CPU Filter Slider** - Drag to show processes above threshold (0-100%)
- **Memory Filter Slider** - Drag to show processes above threshold (0-1000 MB)
- **Combined Filters** - Stack multiple filters for precise analysis

**Sorting:**
- Click any column header to sort (CPU, Memory, PID, etc.)
- Visual indicators show sort direction (↑ ascending, ↓ descending)
- Click again to reverse sort direction

**CSV Export:**
- Click **"📥 Download CSV"** to export entire snapshot
- File saved as `system-snapshot-YYYY-MM-DD.csv`
- Useful for analysis, logging, and archival

### Pagination with Load More (Dashboard only)
- **Page 1** automatically loads with top 20 processes
- **Page indicator** shows "Page X of Y" (e.g., "Page 1 of 8" for 142 total processes)
- **Load More button** appears when more processes are available
- Click **"Load More"** to load the next 20 processes
- **Real-time notifications** show:
  - 🔍 Reading system processes...
  - ✅ Loaded X processes (Page Y)
- **Auto-refresh** returns to Page 1 to show latest top 20 processes

### All Apps View
Click **"All Apps"** to browse all 50+ detected applications:
- Complete application catalog
- Logos cached locally
- Executable names
- Responsive grid layout

### Theme Selection
Choose from 4 themes via dropdown:
- **Light** (Default) - Clean, professional appearance
- **Warm** - Orange/amber color palette
- **Pink** - Rose/magenta color palette
- **Dark** - Original dark mode

### Settings Modal
Click **⚙️ Settings** to configure:

**CPU Thresholds (%):**
- Yellow Alert: Default 20%
- Red Critical: Default 70%

**Memory Thresholds (%):**
- Yellow Alert: Default 50%
- Red Critical: Default 80%

**📡 Auto-Refresh Settings:**
- **Refresh Interval**: Configure how often processes are refreshed (5-300 seconds)
- **Default**: 30 seconds (reduced from 3 seconds for less noise)
- **Faster**: Set to 5-10 seconds for real-time monitoring
- **Slower**: Set to 60-300 seconds to reduce server load
- Changes take effect immediately

Use **Reset** to restore defaults, or **Save** to apply changes.

---

## 🛠️ Configuration

### Platform Detection
The app automatically detects your operating system and monitors relevant apps:
- **Windows**: Scans Program Files and AppData for installed executables
- **Linux**: Uses `which` command to find installed applications
- **macOS**: Falls back to Windows sources (can be extended)

### Custom Applications
To add custom applications, edit [app_detector.py](app_detector.py):

**For Windows:**
```python
APP_LOGO_SOURCES = {
    "myapp.exe": {"name": "My App", "url": "https://example.com/logo.svg"},
    # ... rest of apps
}
```

**For Linux:**
```python
APP_LOGO_SOURCES_LINUX = {
    "myapp": {"name": "My App", "url": "https://example.com/logo.svg"},
    # ... rest of apps
}
```

The logos will be downloaded and cached automatically on next run.

---

## 📁 Project Structure

```
System-Pulse/
├── main.py                      # FastAPI server (213 lines)
│                               # Endpoints: /api/dashboard, /api/snapshot, /api/self-monitor
├── app_detector.py              # App detection & logo management
├── check_fallbacks.py           # Fallback handling for logo downloads
├── init_logos.py                # Logo initialization script
├── requirements.txt             # Python dependencies (5 packages)
├── README.md                    # This file
├── LICENSE                      # MIT License
├── .gitignore                   # Git exclusions
├── index.html                   # Web interface (338 lines)
├── backend/                     # Backend optimization modules
│   ├── scoring.py               # Relevance score calculation
│   ├── cache.py                 # TTL caching layer (1s TTL)
│   ├── async_ops.py             # Async operation support
│   ├── timeout.py               # Request timeout middleware (5s max)
│   └── __init__.py              # Package initialization
├── static/
│   ├── css/
│   │   └── style.css            # Tailwind CSS + 4 custom themes (242 lines)
│   ├── js/
│   │   └── app.js               # Frontend logic (vanilla JS, 746 lines)
│   │                           # Features: views, filtering, sorting, export, settings
│   └── logo/                    # Generated cache (git-ignored)
│       ├── windows/             # Windows app logos (cached SVG)
│       ├── linux/               # Linux app logos (cached SVG)
│       └── app_mappings.json    # Logo index
├── STRUCTURE.md                 # Project architecture documentation
└── confidential/                # Documentation & reference files
    ├── ARCHITECTURE.txt         # System design details
    ├── GETTING_STARTED.txt      # Development guide
    └── ... (additional docs)
```

### Backend Architecture
**Performance Optimizations:**
- **TTLCache** (`backend/cache.py`): 1-second caching of process collection
- **RequestTimeoutMiddleware** (`backend/timeout.py`): 5-second max per request
- **AsyncOps** (`backend/async_ops.py`): Thread pool executor for non-blocking operations
- **Relevance Scoring** (`backend/scoring.py`): Combines CPU + Memory + Network activity

**Frontend:**
- **Vanilla JavaScript** (~440 lines): No frameworks, pure DOM manipulation
- **Pagination State Management**: Preserves user's page during auto-refresh
- **Real-time Notifications**: Toast notifications for Load More actions
- **Configurable Refresh**: Dynamic interval management via Settings

---

## 🔌 API Endpoints

### GET `/api/dashboard`
Returns paginated active applications with network connections, sorted by relevance score.

**Query Parameters:**
- `page` (int, default=1): Page number (1-indexed). Each page has 20 items.

**Example:**
```
/api/dashboard?page=1  # First 20 processes
/api/dashboard?page=2  # Next 20 processes
```

**Response:**
```json
{
  "items": [
    {
      "name": "chrome.exe",
      "pid": 12345,
      "logo": "/static/logo/windows/Chrome.svg",
      "incoming": 5,
      "outgoing": 3,
      "cpu": 12.5,
      "memory": 256.5,
      "relevance_score": 45.2
    }
  ],
  "page": 1,
  "items_per_page": 20,
  "total_items": 142,
  "has_more": true
}
```

### GET `/api/snapshot`
Returns all running processes with filtering, sorting, and search support. **No caching** for real-time accuracy.

**Query Parameters (all optional):**
- `min_cpu` (float, default=0.0): Filter processes with CPU≥ threshold
- `min_memory` (float, default=0.0): Filter processes with memory ≥ threshold (in MB)
- `search` (string, default=""): Search process name (case-insensitive substring match)

**Examples:**
```
/api/snapshot                          # All processes
/api/snapshot?min_cpu=50               # Processes with CPU ≥ 50%
/api/snapshot?min_memory=500           # Processes with memory ≥ 500 MB
/api/snapshot?search=chrome            # Processes matching "chrome"
/api/snapshot?min_cpu=50&min_memory=200&search=java  # Combined filters
```

**Response:**
```json
{
  "items": [
    {
      "name": "Code.exe",
      "pid": 2116,
      "cpu": 117.4,
      "memory": 3610.8,
      "incoming": 0,
      "outgoing": 0
    },
    {
      "name": "python.exe",
      "pid": 4521,
      "cpu": 45.2,
      "memory": 512.3,
      "incoming": 8,
      "outgoing": 3
    }
  ],
  "total_items": 148
}
```

### GET `/api/self-monitor`
Returns System Pulse health metrics (CPU, RAM, Uptime, Deviation tracking).

**Response:**
```json
{
  "cpu_percent": 28.5,
  "memory_mb": 8192.4,
  "memory_percent": 65.3,
  "uptime_seconds": 432000,
  "last_deviation": {
    "process_name": "Code.exe",
    "metric": "cpu",
    "value": 87.6,
    "severity": "critical",
    "timestamp": 1708873920.123
  }
}
```

**Deviation Severity Levels:**
- **warning**: CPU >70% or Memory >500MB
- **critical**: CPU >90% or Memory >800MB
- `null` if no deviations detected

### GET `/api/all-apps`
Returns all detected applications for current platform.

**Response:**
```json
[
  {
    "exe_name": "chrome.exe",
    "display_name": "Chrome",
    "logo": "/static/logo/windows/Chrome.svg",
    "logo_url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlechrome.svg"
  }
]
```

### GET `/api/app-icons`
Returns the complete executable-to-logo mapping.

**Response:**
```json
{
  "chrome.exe": "/static/logo/windows/Chrome.svg",
  "firefox.exe": "/static/logo/windows/Firefox.svg",
  ...
}
```

### GET `/api/cache-stats`
Returns cache performance metrics (internal endpoint).

**Response:**
```json
{
  "hits": 45,
  "misses": 12,
  "hit_rate": 0.789
}
```

---

## 🔒 Security & Privacy

### No Data Collection
- ✅ Zero analytics
- ✅ Zero telemetry
- ✅ Zero tracking cookies
- ✅ No external database connections
- ✅ All data stored locally in browser

### Code Security (Audited)
- ✅ No SQL injection risks (no database)
- ✅ No XSS vulnerabilities (safe DOM manipulation)
- ✅ No hardcoded credentials
- ✅ All dependencies from PyPI (verified)
- ✅ HTTPS-only for external CDN requests

### Safe OS Access
- ✅ Read-only process monitoring via psutil
- ✅ No system modification capability
- ✅ No credential access
- ✅ No file system write access (except logo cache)

**Full security audit available in code review.**

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **First Request (uncached)** | ~1400 ms |
| **Cached Requests** | ~12 ms (100x faster) |
| **Speedup with TTL Cache** | 100x improvement |
| **Cache TTL** | 1 second |
| **Request Timeout** | 5 seconds max |
| **Dashboard Refresh** | 30 seconds (configurable) |
| **Memory Usage** | ~80-120 MB |
| **CPU Usage** | <5% at rest |
| **Logo Cache Size** | ~5-10 MB |
| **Pagination** | 20 items per page |

**Optimization Features:**
- ✅ TTL caching eliminates redundant process collection
- ✅ Request timeout middleware prevents hanging requests
- ✅ Async operation support for non-blocking data collection
- ✅ Relevance scoring ranks processes by importance

---

## 🐛 Troubleshooting

### "Port 8000 already in use"
```bash
# Use a different port
python -m uvicorn main:app --reload --port 8001
```

### Load More button not working?
- Ensure you have more than 20 processes running
- Check browser console (F12) for errors
- Clear browser cache and reload
- Try a different refresh interval in Settings

### Missing app logos?
- Logos download automatically on first run
- Check internet connection is active on startup
- Verify `static/logo/` folder exists
- Clear browser cache (Ctrl+Shift+Delete in Chrome)

### "Module not found" error?
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Auto-refresh seems too fast/slow?
- Open ⚙️ Settings > "📡 Auto-Refresh Settings"
- Adjust refresh interval (5-300 seconds)
- Click "✓ Save" to apply immediately

### Notifications not appearing?
- Notifications only show when you click "Load More"
- Check that notifications container exists in HTML
- Clear browser cache if notifications don't appear

### App not being detected?
- Ensure app is in Program Files or PATH
- Restart the server after app installation
- Check [app_detector.py](app_detector.py) has the app configured

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `psutil` | 7.2.2+ | Process & system monitoring |
| `fastapi` | 0.128.8+ | Web framework |
| `uvicorn` | 0.40.0+ | ASGI server |
| `requests` | 2.32.5+ | HTTP client for logo downloads |

**Frontend:**
- Vanilla JavaScript (no frameworks)
- Tailwind CSS via CDN
- Google Fonts for typography

---

## 🎯 Supported Applications

### Windows (38 apps)
**Browsers**: Chrome, Firefox, Edge, Internet Explorer  
**Dev Tools**: VS Code, Git, Python, Node.js, Java  
**Office**: Word, Excel, PowerPoint, OneNote  
**Communication**: Outlook, Teams, Zoom, Discord, Slack  
**Media**: Spotify, VLC  
**System**: PowerShell, Task Manager, Registry Editor  
**Database**: MySQL, MongoDB, PostgreSQL  

### Linux (40+ apps)
**Dev Tools**: Python, Node.js, Git, GCC, Rust, Go  
**Browsers**: Firefox, Chrome, Chromium, Edge  
**Services**: Docker, Kubernetes, Nginx, Apache  
**Database**: PostgreSQL, MySQL, MongoDB, Redis  
**Media**: VLC, FFmpeg  
**Other**: Vim, Nano, Blender, GIMP  

---

## 🚀 Deployment

### Docker (Optional)
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t smart-network-monitor .
docker run -p 8000:8000 smart-network-monitor
```

### Production Server
For production deployment:
```bash
# Use gunicorn or production ASGI server
pip install gunicorn
gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app
```

---

## 📝 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

**Summary:**
- ✅ Free for commercial use
- ✅ Can modify and distribute
- ✅ Must include license notice
- ✅ No warranty provided

---

## 🤝 Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 💡 Feature Ideas

- Search/filter applications
- Historical statistics and graphs
- Dark web traffic detection
- Process priority management
- Network packet inspection
- Custom application categories
- Desktop notifications for thresholds
- Application startup time tracking

---

## 🐞 Issues & Support

**Found a bug?** Please open an issue with:
- Operating system (Windows/Linux/macOS)
- Python version
- Error message/screenshot
- Steps to reproduce

**Feature request?** Describe the feature and its use case.

---

## 👨‍💻 Author

**Maneesh Thakur**

---

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [psutil Documentation](https://psutil.readthedocs.io)
- [Tailwind CSS](https://tailwindcss.com)
- [SimpleIcons](https://simpleicons.org)

---

## ⭐ Show Your Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting issues
- 💭 Sharing feedback
- 🔄 Contributing improvements

---

**Made with ❤️ for developers who care about their systems**
