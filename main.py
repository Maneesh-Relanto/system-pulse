import psutil
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import os
from app_detector import get_detected_apps, get_app_info
from backend.scoring import sort_processes_by_relevance
from backend.cache import get_cache
from backend.timeout import RequestTimeoutMiddleware

app = FastAPI(title="System Pulse API")

# Add request timeout protection (5 seconds maximum)
app.add_middleware(RequestTimeoutMiddleware, timeout_seconds=5.0)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Dynamically load app icons (downloads and caches logos)
APP_ICONS = get_detected_apps()

DEFAULT_ICON = "" 
ITEMS_PER_PAGE = 20

# Get cache instance
cache = get_cache()


def collect_process_data():
    """
    Expensive operation: Collect all process and connection data.
    This is called once and cached for 1 second to avoid redundant lookups.
    
    Returns:
        dict: Aggregated process data with connection info
    """
    apps = {}
    
    # Get network connections once (expensive call)
    try:
        connections = psutil.net_connections(kind='inet')
    except (psutil.AccessDenied, OSError):
        connections = []
    
    # Pre-fetch all processes with limited scope
    try:
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
                        "memory": (pinfo['memory_info'].rss / (1024 * 1024)) if pinfo['memory_info'] else 0  # MB
                    }
                else:
                    # Aggregate for multi-process apps
                    apps[name]["cpu"] += pinfo['cpu_percent'] or 0.0
                    apps[name]["memory"] += (pinfo['memory_info'].rss / (1024 * 1024)) if pinfo['memory_info'] else 0
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
    except Exception as e:
        print(f"Warning: Error iterating processes: {str(e)}")
    
    # Map connections to our aggregated apps
    # Create PID -> name map first for faster lookups
    pid_to_name = {}
    for name, data in apps.items():
        pid_to_name[data['pid']] = name
    
    for conn in connections:
        if conn.pid and conn.pid in pid_to_name:
            name = pid_to_name[conn.pid]
            if conn.status == 'LISTEN':
                apps[name]["incoming"] += 1
            elif conn.status == 'ESTABLISHED' and conn.raddr:
                apps[name]["outgoing"] += 1
    
    return apps


def get_sorted_processes():
    """
    Get sorted process list from cache or compute if needed.
    Cached for 1 second to avoid redundant collection.
    
    Returns:
        list: Sorted process list by relevance
    """
    apps = cache.get_or_compute(
        'dashboard_processes',
        compute_fn=collect_process_data,
        ttl=1.0  # Cache for 1 second
    )
    return sort_processes_by_relevance(list(apps.values()))


@app.get("/api/dashboard")
async def get_dashboard_data(page: int = 1):
    """
    Get paginated process list sorted by relevance score.
    Results are cached for 1 second to avoid redundant computation.
    On cache miss, computation runs in a thread pool to avoid blocking.
    
    Args:
        page: Page number (1-indexed). Each page has 20 items.
    
    Returns:
        Paginated list with metadata
    """
    sorted_apps = get_sorted_processes()
    
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


@app.get("/api/cache-stats")
def get_cache_stats():
    """Get cache performance statistics for monitoring."""
    return cache.get_stats()


@app.get("/api/all-apps")

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
