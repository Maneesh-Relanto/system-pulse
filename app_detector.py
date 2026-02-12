"""
Detect installed applications and manage their logos
"""
import os
import json
import requests
import platform
import subprocess
from pathlib import Path
from typing import Dict, List

# Comprehensive mapping of executable names to app info with logo sources
# Icons from: SimpleIcons CDN + Icons8 (reliable, 99% uptime, high quality)
APP_LOGO_SOURCES = {
    # Browsers
    "chrome.exe": {"name": "Chrome", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlechrome.svg"},
    "firefox.exe": {"name": "Firefox", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/firefox.svg"},
    "msedge.exe": {"name": "Edge", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftedge.svg"},
    "iexplore.exe": {"name": "Internet Explorer", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/internetexplorer.svg"},
    
    # Development Tools
    "code.exe": {"name": "VS Code", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/visualstudiocode.svg"},
    "java.exe": {"name": "Java", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openjdk.svg"},
    "javaw.exe": {"name": "Java", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openjdk.svg"},
    "node.exe": {"name": "Node.js", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/nodedotjs.svg"},
    "python.exe": {"name": "Python", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/python.svg"},
    "gcc.exe": {"name": "GCC", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/gnucompilercollection.svg"},
    "git.exe": {"name": "Git", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/git.svg"},
    
    # Communication
    "outlook.exe": {"name": "Outlook", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftoutlook.svg"},
    "teams.exe": {"name": "Teams", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftteams.svg"},
    "zoom.exe": {"name": "Zoom", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/zoom.svg"},
    "discord.exe": {"name": "Discord", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/discord.svg"},
    "telegram.exe": {"name": "Telegram", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/telegram.svg"},
    "skype.exe": {"name": "Skype", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/skype.svg"},
    "slack.exe": {"name": "Slack", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg"},
    "whatsapp.exe": {"name": "WhatsApp", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/whatsapp.svg"},
    
    # Productivity
    "winword.exe": {"name": "Word", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftword.svg"},
    "excel.exe": {"name": "Excel", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftexcel.svg"},
    "powerpnt.exe": {"name": "PowerPoint", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftpowerpoint.svg"},
    "onenote.exe": {"name": "OneNote", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftonenote.svg"},
    
    # Media & Entertainment
    "spotify.exe": {"name": "Spotify", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/spotify.svg"},
    "vlc.exe": {"name": "VLC", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/videolan.svg"},
    "foobar2000.exe": {"name": "Foobar2000", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/foobar2000.svg"},
    
    # System & Utilities
    "explorer.exe": {"name": "File Explorer", "url": "https://img.icons8.com/color/96/folder-invoices--v1.png"},
    "taskmgr.exe": {"name": "Task Manager", "url": "https://img.icons8.com/color/96/system-task-manager.png"},
    "powershell.exe": {"name": "PowerShell", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/powershell.svg"},
    "cmd.exe": {"name": "Command Prompt", "url": "https://img.icons8.com/color/96/console.png"},
    "notepad.exe": {"name": "Notepad", "url": "https://img.icons8.com/color/96/notepad.png"},
    "registry.exe": {"name": "Registry Editor", "url": "https://img.icons8.com/color/96/regedit.png"},
    
    # Database
    "mysql.exe": {"name": "MySQL", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mysql.svg"},
    "mongod.exe": {"name": "MongoDB", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mongodb.svg"},
    "postgres.exe": {"name": "PostgreSQL", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/postgresql.svg"},
    
    # Other Services
    "svchost.exe": {"name": "Service Host", "url": "https://img.icons8.com/color/96/services.png"},
    "dwm.exe": {"name": "Desktop Window Manager", "url": "https://img.icons8.com/color/96/monitor.png"},
    "csrss.exe": {"name": "Client/Server Runtime", "url": "https://img.icons8.com/color/96/processor.png"},
}

# Linux applications mapping
APP_LOGO_SOURCES_LINUX = {
    # Development Tools
    "python": {"name": "Python", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/python.svg"},
    "python3": {"name": "Python", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/python.svg"},
    "node": {"name": "Node.js", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/nodedotjs.svg"},
    "npm": {"name": "npm", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/npm.svg"},
    "yarn": {"name": "Yarn", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/yarn.svg"},
    "code": {"name": "VS Code", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/visualstudiocode.svg"},
    "vim": {"name": "Vim", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/vim.svg"},
    "nano": {"name": "Nano", "url": "https://img.icons8.com/color/96/notepad.png"},
    "git": {"name": "Git", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/git.svg"},
    "gcc": {"name": "GCC", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/gnucompilercollection.svg"},
    "g++": {"name": "GCC", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/gnucompilercollection.svg"},
    "java": {"name": "Java", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openjdk.svg"},
    "javac": {"name": "Java", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openjdk.svg"},
    "cargo": {"name": "Rust", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/rust.svg"},
    "rustc": {"name": "Rust", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/rust.svg"},
    "go": {"name": "Go", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/go.svg"},
    
    # Browsers
    "firefox": {"name": "Firefox", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/firefox.svg"},
    "google-chrome": {"name": "Chrome", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlechrome.svg"},
    "chromium": {"name": "Chromium", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/chromium.svg"},
    "microsoft-edge": {"name": "Edge", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftedge.svg"},
    
    # Communication & Productivity
    "discord": {"name": "Discord", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/discord.svg"},
    "slack": {"name": "Slack", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg"},
    "telegram": {"name": "Telegram", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/telegram.svg"},
    "zoom": {"name": "Zoom", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/zoom.svg"},
    "blender": {"name": "Blender", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/blender.svg"},
    "gimp": {"name": "GIMP", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/gimp.svg"},
    "vlc": {"name": "VLC", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/videolan.svg"},
    "ffmpeg": {"name": "FFmpeg", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/ffmpeg.svg"},
    
    # Database
    "mysql": {"name": "MySQL", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mysql.svg"},
    "mongod": {"name": "MongoDB", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mongodb.svg"},
    "postgres": {"name": "PostgreSQL", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/postgresql.svg"},
    "redis-server": {"name": "Redis", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/redis.svg"},
    "mariadb": {"name": "MariaDB", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mariadb.svg"},
    
    # Container & Cloud
    "docker": {"name": "Docker", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/docker.svg"},
    "kubectl": {"name": "Kubernetes", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/kubernetes.svg"},
    "aws": {"name": "AWS", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/amazonaws.svg"},
    
    # System Services
    "nginx": {"name": "Nginx", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/nginx.svg"},
    "apache2": {"name": "Apache", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/apache.svg"},
    "ssh": {"name": "SSH", "url": "https://img.icons8.com/color/96/console.png"},
    "bash": {"name": "Bash", "url": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/gnubash.svg"},
    "systemctl": {"name": "SystemD", "url": "https://img.icons8.com/color/96/services.png"},
}

# Detect current OS
CURRENT_OS = platform.system()  # 'Windows', 'Linux', 'Darwin'
IS_WINDOWS = CURRENT_OS == "Windows"
IS_LINUX = CURRENT_OS == "Linux"
IS_MAC = CURRENT_OS == "Darwin"

# Select app sources based on platform
if IS_WINDOWS:
    ACTIVE_APP_SOURCES = APP_LOGO_SOURCES
    PLATFORM_LOGO_DIR = "static/logo/windows"
elif IS_LINUX:
    ACTIVE_APP_SOURCES = APP_LOGO_SOURCES_LINUX
    PLATFORM_LOGO_DIR = "static/logo/linux"
else:  # macOS and others
    ACTIVE_APP_SOURCES = APP_LOGO_SOURCES  # Fallback to Windows sources
    PLATFORM_LOGO_DIR = "static/logo/macos"

LOGO_DIR = Path(PLATFORM_LOGO_DIR)
APP_MAPPINGS_FILE = LOGO_DIR / "app_mappings.json"

def ensure_logo_dir():
    """Ensure logo directory exists"""
    LOGO_DIR.mkdir(parents=True, exist_ok=True)

def download_logo(app_name: str, url: str) -> str:
    """
    Download and cache a logo from URL. Falls back to local SVG if download fails.
    Returns: path to local logo or empty string on failure
    """
    ensure_logo_dir()
    
    # Sanitize filename
    safe_name = "".join(c for c in app_name if c.isalnum() or c in (' ', '_', '-')).strip()
    
    # Determine file extension based on URL
    ext = ".png"
    if url.endswith(".svg"):
        ext = ".svg"
    elif url.endswith(".ico"):
        ext = ".ico"
    
    logo_path = LOGO_DIR / f"{safe_name}{ext}"
    
    # Skip if already cached
    if logo_path.exists():
        return f"/static/logo/{PLATFORM_LOGO_DIR.split('/')[-1]}/{logo_path.name}"
    
    # Try to download from CDN
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, timeout=5, headers=headers)
        response.raise_for_status()
        
        with open(logo_path, 'wb') as f:
            f.write(response.content)
        
        print(f"✓ {app_name}: Downloaded from CDN")
        return f"/static/logo/{PLATFORM_LOGO_DIR.split('/')[-1]}/{logo_path.name}"
    except Exception as e:
        print(f"⚠ {app_name}: CDN download failed ({str(e)[:50]}), checking for fallback SVG...")
        
        # Search directory for any SVG file matching the app name (case-insensitive)
        try:
            for svg_file in LOGO_DIR.glob("*.svg"):
                # Compare app names (normalize spaces and case)
                file_app_name = svg_file.stem.lower().replace("-", " ")
                search_name = app_name.lower().replace("-", " ")
                
                if file_app_name == search_name:
                    print(f"  → Using local fallback SVG for {app_name}")
                    return f"/static/logo/{PLATFORM_LOGO_DIR.split('/')[-1]}/{svg_file.name}"
        except Exception:
            pass
        
        return ""

def get_installed_apps_windows() -> Dict[str, Dict]:
    """
    Detect installed applications on Windows
    Returns: Dict mapping executable name to app info
    """
    apps = {}
    
    try:
        # Check Program Files
        for program_dir in [
            "C:\\Program Files",
            "C:\\Program Files (x86)",
            os.path.expandvars("%APPDATA%\\..\\Local\\Programs")
        ]:
            if os.path.exists(program_dir):
                for item in os.listdir(program_dir):
                    path = os.path.join(program_dir, item)
                    if os.path.isdir(path):
                        # Look for exe files
                        for root, dirs, files in os.walk(path):
                            for file in files:
                                if file.lower().endswith('.exe'):
                                    exe_name = file.lower()
                                    if exe_name not in apps:
                                        apps[exe_name] = {"name": file[:-4], "path": os.path.join(root, file)}
                            # Limit depth to avoid scanning too deep
                            if root.count(os.sep) - path.count(os.sep) > 2:
                                del dirs[:]
    except Exception as e:
        print(f"Error scanning Program Files: {str(e)}")
    
    # Add from APP_LOGO_SOURCES even if not detected (they might be in PATH)
    for exe_name, info in ACTIVE_APP_SOURCES.items():
        if exe_name not in apps:
            apps[exe_name] = {"name": info["name"], "path": None}
    
    return apps

def get_installed_apps_linux() -> Dict[str, Dict]:
    """
    Detect installed applications on Linux
    Returns: Dict mapping app name to app info
    """
    apps = {}
    
    try:
        # Use 'which' command to detect if apps are in PATH
        for app_name in ACTIVE_APP_SOURCES.keys():
            try:
                result = subprocess.run(['which', app_name], capture_output=True, text=True, timeout=2)
                if result.returncode == 0:
                    path = result.stdout.strip()
                    apps[app_name] = {"name": ACTIVE_APP_SOURCES[app_name]["name"], "path": path}
            except Exception:
                # App not found, but keep it in mappings for reference
                apps[app_name] = {"name": ACTIVE_APP_SOURCES[app_name]["name"], "path": None}
    except Exception as e:
        print(f"Error detecting Linux apps: {str(e)}")
    
    return apps

def get_installed_apps() -> Dict[str, Dict]:
    """
    Platform-aware detection of installed applications
    """
    if IS_WINDOWS:
        return get_installed_apps_windows()
    elif IS_LINUX:
        return get_installed_apps_linux()
    else:
        return get_installed_apps_windows()  # Fallback for macOS

def build_app_icons_dict() -> Dict[str, str]:
    """
    Build the APP_ICONS dictionary with cached logos
    Returns: Dict mapping app name to logo path
    """
    app_icons = {}
    app_mappings = {}
    
    ensure_logo_dir()
    
    # First add predefined sources for current platform
    for exe_name, info in ACTIVE_APP_SOURCES.items():
        app_name = info["name"]
        logo_url = info["url"]
        
        # Try to download and cache the logo
        cached_logo = download_logo(app_name, logo_url)
        
        # Always add to mappings, even if logo is empty string (will show as letter avatar)
        app_icons[exe_name] = cached_logo if cached_logo else ""
        app_mappings[exe_name] = {
            "name": app_name,
            "logo": cached_logo if cached_logo else "",
            "source": "downloaded" if cached_logo else "fallback"
        }
        
    # Save mappings
    try:
        with open(APP_MAPPINGS_FILE, 'w') as f:
            json.dump(app_mappings, f, indent=2)
    except Exception as e:
        print(f"Error saving app mappings: {str(e)}")
    
    return app_icons

def get_detected_apps() -> Dict[str, str]:
    """
    Get all detected applications with their logos
    Returns: Dict of {exe_name: logo_path}
    """
    ensure_logo_dir()
    
    # Try to load from cache first
    try:
        if APP_MAPPINGS_FILE.exists():
            with open(APP_MAPPINGS_FILE, 'r') as f:
                mappings = json.load(f)
                return {k: v.get("logo", "") for k, v in mappings.items()}
    except Exception as e:
        print(f"Error loading mappings cache: {str(e)}")
    
    # Build fresh if cache doesn't exist or is stale
    return build_app_icons_dict()

def get_app_info() -> List[Dict]:
    """
    Get a list of all known apps with their information for current platform
    """
    apps_list = []
    for exe_name, info in ACTIVE_APP_SOURCES.items():
        app_icons = get_detected_apps()
        logo = app_icons.get(exe_name, "/static/logo/default.png")
        
        apps_list.append({
            "exe_name": exe_name,
            "display_name": info["name"],
            "logo": logo,
            "logo_url": info["url"]
        })
    
    return sorted(apps_list, key=lambda x: x["display_name"])

if __name__ == "__main__":
    print("Building app logos cache...")
    print(f"Platform: {CURRENT_OS}")
    print(f"Logo directory: {PLATFORM_LOGO_DIR}")
    print("\n" + "="*60)
    icons = build_app_icons_dict()
    print("="*60)
    print(f"\n✓ Successfully processed {len(icons)} applications")
    print(f"\nApp Logos (first 15):")
    for app, logo in sorted(icons.items())[:15]:
        status = "📥 CDN" if "svg" in logo or "png" in logo else "📦 Local"
        print(f"  {app:20} → {status}")
