"""
Initialize and download app logos - Run this once to pre-cache all logos
Usage: python init_logos.py
"""

from app_detector import build_app_icons_dict, get_app_info
import json

if __name__ == "__main__":
    print("=" * 60)
    print("System Pulse - App Logo Initializer")
    print("=" * 60)
    print()
    
    print("Downloading and caching logos for standard applications...")
    print("This may take a minute on first run...\n")
    
    icons = build_app_icons_dict()
    
    print(f"\n✓ Successfully cached {len(icons)} application logos!")
    print("\nCached Applications:")
    print("-" * 60)
    
    for app_info in get_app_info():
        logo_status = "✓" if app_info['logo'] else "✗"
        print(f"{logo_status} {app_info['display_name']:<25} ({app_info['exe_name']})")
    
    print("\n" + "=" * 60)
    print("Setup complete! Start the server with: python -m uvicorn main:app --reload")
    print("=" * 60)
