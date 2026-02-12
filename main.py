import psutil
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import os
from app_detector import get_detected_apps, get_app_info

app = FastAPI(title="System Pulse API")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Dynamically load app icons (downloads and caches logos)
APP_ICONS = get_detected_apps()

DEFAULT_ICON = "" 

@app.get("/api/dashboard")
def get_dashboard_data():
    apps = {}
    # kind='inet' ensures we only get IPv4/IPv6 connections
    connections = psutil.net_connections(kind='inet')
    
    # Pre-fetch all processes to minimize overhead
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
        try:
            pinfo = proc.info
            name = pinfo['name']
            pid = pinfo['pid']
            
            # Grouping by name to aggregate stats if multi-process (like Chrome)
            if name not in apps:
                apps[name] = {
                    "name": name,
                    "pid": pid,
                    "logo": APP_ICONS.get(name.lower(), DEFAULT_ICON),
                    "incoming": 0,
                    "outgoing": 0,
                    "cpu": pinfo['cpu_percent'] or 0.0,
                    "memory": (pinfo['memory_info'].rss / (1024 * 1024)) if pinfo['memory_info'] else 0 # MB
                }
            else:
                # Aggregate for multi-process apps
                apps[name]["cpu"] += pinfo['cpu_percent'] or 0.0
                apps[name]["memory"] += (pinfo['memory_info'].rss / (1024 * 1024)) if pinfo['memory_info'] else 0
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    # Map connections to our aggregated apps
    for conn in connections:
        if conn.pid:
            try:
                # We already have the app data by name, but we need to find which app this PID belongs to
                # For speed, we can use a PID-to-Name map
                p = psutil.Process(conn.pid)
                name = p.name()
                if name in apps:
                    if conn.status == 'LISTEN':
                        apps[name]["incoming"] += 1
                    elif conn.status == 'ESTABLISHED' and conn.raddr:
                        apps[name]["outgoing"] += 1
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

    # Sort by activity (incoming + outgoing) and take top 16 for a 4x4 matrix
    sorted_apps = sorted(apps.values(), key=lambda x: (x['incoming'] + x['outgoing']), reverse=True)
    return sorted_apps[:16]

@app.get("/api/all-apps")
def get_all_apps():
    """Get all detected applications with their logos"""
    return get_app_info()

@app.get("/api/app-icons")
def get_app_icons():
    """Get the current app icons mapping"""
    return APP_ICONS

@app.get("/favicon.ico")
async def favicon():
    """Favicon endpoint - returns 404 as no favicon is provided"""
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Not found")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    if os.path.exists("index.html"):
        with open("index.html", "r", encoding="utf-8") as f:
            return f.read()
    return "Index file not found."

if __name__ == "__main__":
    import uvicorn
    # Use reload=True for better development experience if needed
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=False)
