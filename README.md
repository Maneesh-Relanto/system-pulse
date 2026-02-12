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
- Monitor **top 16 active applications** with network connections
- Live **CPU & Memory** usage metrics
- **Incoming/Outgoing** connection counts
- **3-second** refresh rate for instant updates

### 🎨 Beautiful UI
- Four **professional themes**: Light (default), Warm, Pink, Dark
- **Glass morphism** design with smooth animations
- **Responsive** layout works on desktop and tablet
- **Lightweight** - no heavy frameworks (vanilla JS + Tailwind CSS)

### 📦 50+ App Support
- **Windows**: Chrome, Firefox, VS Code, Git, Docker, and more
- **Linux**: Python, Node.js, Docker, Redis, PostgreSQL, and more
- **Auto-detection** of installed applications
- High-quality logos from SimpleIcons CDN with automatic caching

### ⚙️ Configurable Thresholds
- Set custom CPU/RAM warning levels (Yellow/Red)
- Color-coded status indicators (🟢🟡🔴)
- Persistent settings via browser storage
- Real-time threshold validation

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
git clone https://github.com/yourusername/Smart-Network-Monitor.git
cd Smart-Network-Monitor
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

### Dashboard View
The default view shows the **top 16 active applications** with:
- Application logo and name
- Process ID (PID)
- Incoming/outgoing connections
- CPU usage percentage with status indicator
- Memory usage with status indicator

**Status Indicators:**
- 🟢 **Green**: Healthy (below threshold)
- 🟡 **Yellow**: Caution (approaching limit)
- 🔴 **Red**: Critical (over limit)

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
Smart-Network-Monitor/
├── main.py                      # FastAPI server & endpoints
├── app_detector.py              # App detection & logo management
├── requirements.txt             # Python dependencies
├── README.md                    # This file
├── LICENSE                      # MIT License
├── .gitignore                   # Git exclusions
├── index.html                   # Web interface
└── static/
    ├── css/
    │   └── style.css            # Tailwind CSS + custom themes
    ├── js/
    │   └── app.js               # Frontend logic (vanilla JS)
    └── logo/                    # Generated cache (git-ignored)
        ├── windows/             # Windows app logos
        ├── linux/               # Linux app logos
        └── app_mappings.json    # Logo index
```

---

## 🔌 API Endpoints

### GET `/api/dashboard`
Returns top 16 active applications with network connections.

**Response:**
```json
[
  {
    "name": "chrome.exe",
    "pid": 12345,
    "logo": "/static/logo/windows/Chrome.svg",
    "incoming": 5,
    "outgoing": 3,
    "cpu": 12.5,
    "memory": 256.5
  }
]
```

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
| **First Run** | ~3-10 seconds (logo cache build) |
| **Dashboard Refresh** | 3 seconds (configurable) |
| **Memory Usage** | ~80-120 MB |
| **CPU Usage** | <5% at rest |
| **Logo Cache Size** | ~5-10 MB |

---

## 🐛 Troubleshooting

### "Port 8000 already in use"
```bash
# Use a different port
python -m uvicorn main:app --reload --port 8001
```

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

### App not being detected?
- Ensure app is in Program Files or PATH
- Restart the server after app installation
- Check [app_detector.py](app_detector.py) has the app configured

### Frontend shows letter avatars instead of logos?
- This is normal for apps without logos
- Logos will appear after initial cache build
- Try refreshing the page (F5)

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
