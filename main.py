import psutil
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import os
from app_detector import get_detected_apps, get_app_info
from backend.scoring import sort_processes_by_relevance

app = FastAPI(title="System Pulse API")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Dynamically load app icons (downloads and caches logos)
APP_ICONS = get_detected_apps()

DEFAULT_ICON = "" 
ITEMS_PER_PAGE = 20

@app.get("/api/dashboard")
def get_dashboard_data(page: int = 1):
    """
    Get paginated process list sorted by relevance score.
    Combines CPU, memory, and network activity priority.
    
    Args:
        page: Page number (1-indexed). Each page has 20 items.
    
    Returns:
        List of process dicts with relevance_score included
    """
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

    # Sort by relevance score (combines CPU, memory, and network activity)
    sorted_apps = sort_processes_by_relevance(list(apps.values()))
    
    # Paginate results (20 per page)
    start_idx = (page - 1) * ITEMS_PER_PAGE
    end_idx = start_idx + ITEMS_PER_PAGE
    paginated_apps = sorted_apps[start_idx:end_idx]
    
    return {
        "items": paginated_apps,
        "page": page,
        "items_per_page": ITEMS_PER_PAGE,
        "total_items": len(sorted_apps),
        "has_more": end_idx < len(sorted_apps)
    }

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
