import psutil
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import os
import time
from datetime import datetime
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

# Self-monitoring tracking
APP_START_TIME = time.time()
LAST_DEVIATION = {
    "process_name": "None",
    "metric": "N/A",
    "value": 0,
    "timestamp": datetime.now().isoformat()
}


def collect_process_data():
    """
    Expensive operation: Collect all process and connection data.
    This is called once and cached for 1 second to avoid redundant lookups.
    Also tracks process deviations (excessive resource use).
    
    Returns:
        dict: Aggregated process data with connection info
    """
    global LAST_DEVIATION
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
                cpu = pinfo['cpu_percent'] or 0.0
                memory = (pinfo['memory_info'].rss / (1024 * 1024)) if pinfo['memory_info'] else 0  # MB
                
                # Track deviations - processes using excessive resources
                if cpu > 70 or memory > 500:  # Extreme resource use
                    severity = "critical" if (cpu > 90 or memory > 800) else "warning"
                    LAST_DEVIATION = {
                        "process_name": name,
                        "metric": f"CPU: {cpu}%" if cpu > 70 else f"Memory: {memory}MB",
                        "value": round(cpu, 1) if cpu > 70 else round(memory, 1),
                        "severity": severity,
                        "timestamp": datetime.now().isoformat()
                    }
                
                # Grouping by name to aggregate stats if multi-process (like Chrome)
                if name not in apps:
                    apps[name] = {
                        "name": name,
                        "pid": pid,
                        "logo": APP_ICONS.get(name.lower(), DEFAULT_ICON),
                        "incoming": 0,
                        "outgoing": 0,
                        "cpu": cpu,
                        "memory": memory
                    }
                else:
                    # Aggregate for multi-process apps
                    apps[name]["cpu"] += cpu
                    apps[name]["memory"] += memory
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


@app.get("/api/snapshot")
async def get_snapshot(min_cpu: float = 0.0, min_memory: float = 0.0, search: str = ""):
    """
    Get complete system snapshot with all running processes.
    Optional filtering by CPU%, memory (MB), and process name search.
    Fresh data (not cached) to ensure accuracy for analysis.
    
    Args:
        min_cpu: Minimum CPU usage % to include (default 0.0 = no filter)
        min_memory: Minimum memory usage MB to include (default 0.0 = no filter)
        search: Search term to filter process names (case-insensitive)
    
    Returns:
        List of all processes with full details
    """
    # Get fresh data from collect_process_data (not cached)
    app_data = collect_process_data()
    apps_list = list(app_data.values())
    
    # Apply relevance scoring
    sorted_apps = sort_processes_by_relevance(apps_list)
    
    # Apply filters
    filtered_apps = []
    search_lower = search.lower()
    
    for app in sorted_apps:
        # CPU filter
        if app['cpu'] < min_cpu:
            continue
        # Memory filter
        if app['memory'] < min_memory:
            continue
        # Search filter
        if search and search_lower not in app['name'].lower():
            continue
        
        filtered_apps.append(app)
    
    return {
        "total": len(sorted_apps),
        "filtered": len(filtered_apps),
        "processes": filtered_apps
    }


@app.get("/api/cache-stats")
def get_cache_stats():
    """Get cache performance statistics for monitoring."""
    return cache.get_stats()


@app.get("/api/self-monitor")
def get_self_monitor():
    """Get System Pulse's own resource usage, uptime, and deviation tracking."""
    process = psutil.Process(os.getpid())
    cpu_percent = process.cpu_percent(interval=0.1)
    memory_info = process.memory_info()
    memory_mb = memory_info.rss / (1024 * 1024)  # Convert bytes to MB
    
    # Calculate uptime in seconds
    uptime_seconds = time.time() - APP_START_TIME
    
    return {
        "cpu_percent": round(cpu_percent, 2),
        "memory_mb": round(memory_mb, 2),
        "cpu_alert": cpu_percent > 15,
        "memory_alert": memory_mb > 200,
        "status": "critical" if (cpu_percent > 15 or memory_mb > 200) else "healthy",
        "uptime_seconds": round(uptime_seconds, 2),
        "last_deviation": LAST_DEVIATION
    }


@app.get("/api/process-search")
async def search_processes():
    """
    Get all running processes for search auto-complete.
    Returns process name, PID, and basics for search results.
    """
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'exe', 'status']):
            try:
                info = proc.as_dict(attrs=['pid', 'name', 'exe', 'status'])
                processes.append({
                    "pid": info['pid'],
                    "name": info['name'],
                    "exe": info.get('exe', ''),
                    "status": info.get('status', 'unknown')
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return {"processes": sorted(processes, key=lambda p: p['name'])}
    except Exception as e:
        return {"processes": [], "error": str(e)}


@app.get("/api/process-details/{pid}")
async def get_process_details(pid: int):
    """
    Get detailed information about a specific process.
    Includes all metrics: CPU, memory, connections, file handles, etc.
    """
    try:
        proc = psutil.Process(pid)
        
        # Get all process info
        info = proc.as_dict(attrs=[
            'pid', 'name', 'exe', 'cmdline', 'status', 'create_time',
            'cpu_percent', 'memory_info', 'num_threads', 'ppid'
        ])
        
        # Get connection info
        connections = proc.net_connections(kind='inet')
        num_connections = len(connections)
        
        # Get open files count
        try:
            open_files = len(proc.open_files())
        except:
            open_files = 0
        
        # Format create time
        create_time = datetime.fromtimestamp(info['create_time']).isoformat() if info['create_time'] else None
        
        # Build response
        return {
            "pid": info['pid'],
            "name": info['name'],
            "exe": info.get('exe', ''),
            "cmdline": ' '.join(info.get('cmdline', [])),
            "status": info.get('status', 'unknown'),
            "cpu_percent": round(info['cpu_percent'], 2),
            "memory_mb": round(info['memory_info'].rss / 1024 / 1024, 2),
            "memory_percent": round(proc.memory_percent(), 2),
            "num_threads": info['num_threads'],
            "num_connections": num_connections,
            "open_files": open_files,
            "created_at": create_time,
            "parent_pid": info.get('ppid', 0),
            "logo": APP_ICONS.get(info['name'].lower(), ''),
            "found": True
        }
    except psutil.NoSuchProcess:
        return {"found": False, "error": f"Process with PID {pid} not found"}
    except Exception as e:
        return {"found": False, "error": str(e)}


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
