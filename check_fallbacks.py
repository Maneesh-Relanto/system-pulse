import json
m = json.load(open('static/logo/windows/app_mappings.json'))
print("\n📊 Checking Fallback Icons:")
print("="*60)
for app in ['gcc.exe', 'vlc.exe', 'taskmgr.exe', 'registry.exe']:
    if app in m:
        logo = m[app].get('logo', 'NOT FOUND')
        is_svg = "svg" in logo
        icon = "✅ SVG Fallback" if is_svg else "📥 CDN"
        print(f"  {app:20} -> {icon}")
        print(f"     {logo}")
print("="*60)
