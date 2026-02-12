# Project Structure

System Pulse - Professional Project Layout

```
Smart-Network-Monitor/
├── README.md                    # Main documentation (START HERE)
├── requirements.txt             # Python dependencies
├── .gitignore                   # Git exclusions
│
├── Backend (Entry Points)
├── main.py                      # FastAPI application server
├── app_detector.py              # Application detection & logo management
├── init_logos.py                # Logo initialization script
│
├── Frontend
├── index.html                   # Web UI (HTML)
├── static/
│   ├── css/
│   │   └── style.css            # Tailwind styling
│   ├── js/
│   │   └── app.js               # Client-side logic
│   └── logo/                    # Cached application logos (generated)
│       ├── Chrome.png
│       ├── Python.png
│       └── ... (50+ cached logos)
│
├── Setup Scripts
├── quickstart.bat               # Windows quick-start
├── quickstart.sh                # Linux/Mac quick-start
│
├── Documentation (Excluded from Git)
├── confidential/                # Internal documentation (not in git)
│   ├── ARCHITECTURE.txt         # System design & data flows
│   ├── ENHANCEMENT_SUMMARY.md   # Feature enhancements summary
│   ├── CHANGES.txt              # Detailed changelog
│   ├── QUICK_REFERENCE.txt      # Developer quick reference
│   ├── GETTING_STARTED.txt      # Setup guide (see README instead)
│   ├── FILE_LISTING.txt         # File overview
│   └── COMPLETION_SUMMARY.txt   # Project completion summary
│
├── Python Environment
├── .venv/                       # Virtual environment (excluded from git)
└── __pycache__/                 # Python cache (excluded from git)
```

## File Purposes

### Essential for Developers
- **README.md** - How to install, run, and use the application
- **requirements.txt** - Python package dependencies
- **main.py** - FastAPI server entry point
- **.gitignore** - Git exclusions for clean repositories

### Source Code
- **app_detector.py** - Detects installed applications and manages logo caching
- **init_logos.py** - One-time setup to download and cache application logos
- **index.html** - Web interface HTML
- **static/css/style.css** - Styling (Tailwind CSS)
- **static/js/app.js** - Client-side JavaScript logic
- **static/logo/** - Cached application logos (auto-generated, not in git)

### Setup
- **quickstart.bat** - Automated Windows setup
- **quickstart.sh** - Automated Linux/Mac setup

### Documentation
- **confidential/** - Internal documentation (excluded from git)
  - Not needed for regular development
  - Includes architecture, enhancements, changelogs
  - Use for reference only

## Getting Started

1. Clone the repository
2. Run appropriate quickstart script:
   - Windows: `quickstart.bat`
   - Linux/Mac: `./quickstart.sh`
3. Start server: `python -m uvicorn main:app --reload`
4. Visit: `http://localhost:8000`

## Git Exclusions

The following are ignored (not in git):
- `confidential/` - Internal documentation
- `.venv/` - Python virtual environment
- `__pycache__/` - Python cache
- `static/logo/` - Generated logo cache
- `.vscode/` - VS Code settings (personal)
- `*.env` - Environment files (sensitive)

## Development Standards

### Code Organization
- Keep application code in root (small project)
- Backend: Python files at root
- Frontend: HTML in root, static files in `static/`
- Separate concerns: config, logic, presentation

### File Naming
- PascalCase: Classes (`App`, `Monitor`)
- snake_case: Functions, variables (`get_detected_apps()`)
- UPPERCASE: Constants (`DEFAULT_ICON`)
- HTML files lowercase (`index.html`)

### Documentation
- README.md: User-facing documentation
- Code comments: Complex logic explanation
- Docstrings: Function/class documentation
- confidential/: Internal architectural notes

### Git
- Clean repository: Only source code and config
- Generated files ignored: Logos, cache, environment
- Confidential docs excluded: Use locally only

## Next Steps

- **For using the app**: Read README.md
- **For development**: Check app_detector.py and main.py
- **For architecture**: See confidential/ARCHITECTURE.txt
- **For API reference**: See confidential/QUICK_REFERENCE.txt
