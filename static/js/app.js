// Network Monitor App Logic
const App = {
    state: {
        theme: 'light',
        lastUpdated: null,
        currentView: 'dashboard',  // 'dashboard' or 'all-apps'
        currentPage: 1,
        totalItems: 0,
        displayedItems: 0,
        allProcesses: [],
        refreshInterval: 30000,  // 30 seconds default
        refreshIntervalId: null,
        thresholds: {
            cpuYellow: 20,
            cpuRed: 70,
            ramYellow: 50,
            ramRed: 80
        }
    },

    init() {
        this.loadSettings();
        this.updateDashboard();
        this.startRefreshInterval();
        this.loadAllApps();
        this.updateSelfMonitor();
        setInterval(() => this.updateSelfMonitor(), 5000);  // Update self-monitor every 5 seconds
        console.log('System Pulse - Local Dev Monitoring Initialized');
    },

    startRefreshInterval() {
        if (this.state.refreshIntervalId) {
            clearInterval(this.state.refreshIntervalId);
        }
        this.state.refreshIntervalId = setInterval(() => this.updateDashboard(), this.state.refreshInterval);
    },

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        
        // Limit to max 2 notifications - remove oldest if exceeding
        const notifications = container.querySelectorAll('div');
        if (notifications.length >= 2) {
            notifications[0].classList.add('animate-fade-out');
            setTimeout(() => notifications[0].remove(), 300);
        }
        
        const notification = document.createElement('div');
        
        const colors = {
            'info': 'bg-blue-600 text-white',
            'success': 'bg-green-600 text-white',
            'warning': 'bg-orange-600 text-white',
            'error': 'bg-red-600 text-white'
        };
        
        const icons = {
            'info': '📡',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        
        const colorClass = colors[type] || colors['info'];
        const icon = icons[type] || icons['info'];
        
        notification.className = `px-4 py-3 rounded-lg text-sm font-medium transition-all transform shadow-lg ${colorClass} animate-slide-in`;
        notification.innerHTML = `<div class="flex items-center gap-2">
            <span>${icon}</span>
            <span>${message}</span>
        </div>`;
        
        container.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.add('animate-fade-out');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
        
        return notification;
    },

    loadSettings() {
        const storedThresholds = localStorage.getItem('appThresholds');
        if (storedThresholds) {
            this.state.thresholds = JSON.parse(storedThresholds);
        }
        const storedInterval = localStorage.getItem('appRefreshInterval');
        if (storedInterval) {
            this.state.refreshInterval = Number.parseInt(storedInterval, 10);
        }
    },

    saveSettings() {
        localStorage.setItem('appThresholds', JSON.stringify(this.state.thresholds));
        localStorage.setItem('appRefreshInterval', this.state.refreshInterval.toString());
    },

    getStatus(value, yellowThreshold, redThreshold) {
        if (value >= redThreshold) return { color: 'red', icon: '🔴', text: 'CRITICAL' };
        if (value >= yellowThreshold) return { color: 'yellow', icon: '🟡', text: 'CAUTION' };
        return { color: 'green', icon: '🟢', text: 'HEALTHY' };
    },

    getColorClass(value, yellowThreshold, redThreshold) {
        if (value >= redThreshold) return 'text-red-500';
        if (value >= yellowThreshold) return 'text-yellow-500';
        return 'text-green-500';
    },

    getBarColorClass(value, yellowThreshold, redThreshold) {
        if (value >= redThreshold) return 'bg-red-500';
        if (value >= yellowThreshold) return 'bg-yellow-500';
        return 'bg-cyan-500';
    },

    openSettings() {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('hidden');
        document.getElementById('cpu-yellow-input').value = this.state.thresholds.cpuYellow;
        document.getElementById('cpu-red-input').value = this.state.thresholds.cpuRed;
        document.getElementById('ram-yellow-input').value = this.state.thresholds.ramYellow;
        document.getElementById('ram-red-input').value = this.state.thresholds.ramRed;
        document.getElementById('refresh-interval-input').value = this.state.refreshInterval / 1000;  // Convert to seconds for display
    },

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    },

    saveDashboardSettings() {
        this.state.thresholds.cpuYellow = Number.parseFloat(document.getElementById('cpu-yellow-input').value);
        this.state.thresholds.cpuRed = Number.parseFloat(document.getElementById('cpu-red-input').value);
        this.state.thresholds.ramYellow = Number.parseFloat(document.getElementById('ram-yellow-input').value);
        this.state.thresholds.ramRed = Number.parseFloat(document.getElementById('ram-red-input').value);
        this.state.refreshInterval = Number.parseInt(document.getElementById('refresh-interval-input').value, 10) * 1000;  // Convert to milliseconds
        this.saveSettings();
        this.closeSettings();
        this.startRefreshInterval();  // Restart interval with new value
        this.showNotification('✅ Settings saved', 'success', 3000);
        this.state.currentPage = 1;
        this.state.displayedItems = 0;
        this.state.allProcesses = [];
        this.updateDashboard();
    },

    resetSettings() {
        this.state.thresholds = {
            cpuYellow: 20,
            cpuRed: 70,
            ramYellow: 50,
            ramRed: 80
        };
        this.state.refreshInterval = 30000;
        this.saveSettings();
        this.openSettings();
    },

    setTheme(theme) {
        this.state.theme = theme;
        document.body.className = 'p-8';
        if (theme !== 'light') {
            document.body.classList.add('theme-' + theme);
        }
        
        const title = document.getElementById('main-title');
        if (theme === 'pink') {
            title.className = 'text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500';
        } else if (theme === 'warm') {
            title.className = 'text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500';
        } else if (theme === 'dark') {
            title.className = 'text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500';
        } else {
            title.className = 'text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500';
        }
    },

    switchView(view) {
        this.state.currentView = view;
        
        // Update button styles
        document.querySelectorAll('[data-view-btn]').forEach(btn => {
            btn.classList.remove('bg-cyan-500', 'text-white');
            btn.classList.add('bg-slate-700', 'text-slate-300');
        });
        document.querySelector(`[data-view-btn="${view}"]`)?.classList.add('bg-cyan-500', 'text-white');
        
        if (view === 'all-apps') {
            this.displayAllApps();
        } else {
            this.state.currentPage = 1;
            this.state.displayedItems = 0;
            this.state.allProcesses = [];
            this.updateDashboard();
        }
    },

    renderIcon(app, size = 'w-16 h-16') {
        const firstLetter = app.name?.charAt(0).toUpperCase() || app.display_name?.charAt(0).toUpperCase() || '?';
        const logo = (app.logo || '').trim();
        
        if (!logo || logo === 'LETTER_AVATAR' || logo === 'undefined') {
            const colors = [
                'from-blue-500 to-indigo-600', 
                'from-purple-500 to-fuchsia-600', 
                'from-emerald-500 to-teal-600', 
                'from-rose-500 to-pink-600', 
                'from-orange-500 to-amber-600',
                'from-cyan-500 to-blue-600'
            ];
            const gradient = colors[(app.pid || app.exe_name || '').length % colors.length];
            return `<div class="w-full h-full rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl font-black text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                ${firstLetter}
            </div>`;
        }
        return `
            <img src="${logo}" alt="${app.name || app.display_name}" 
                class="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-all duration-300"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="hidden w-full h-full rounded-2xl bg-slate-700 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                ${firstLetter}
            </div>`;
    },

    async loadAllApps() {
        try {
            const response = await fetch('/api/all-apps');
            if (!response.ok) throw new Error('Failed to load apps');
            const apps = await response.json();
            // Store for later display
            this.state.allApps = apps;
        } catch (error) {
            console.error('Failed to load all apps:', error);
        }
    },

    async updateSelfMonitor() {
        try {
            const response = await fetch('/api/self-monitor');
            if (!response.ok) throw new Error('Failed to fetch self-monitor data');
            const data = await response.json();
            
            // Update CPU Card
            const cpuPercent = data.cpu_percent;
            const cpuBar = document.getElementById('monitor-cpu-bar');
            const cpuText = document.getElementById('monitor-cpu-percent');
            const cpuStatus = document.getElementById('monitor-cpu-status');
            if (cpuBar) {
                cpuBar.style.width = Math.min(cpuPercent, 100) + '%';
                cpuBar.className = cpuPercent > 15 ? 'bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full transition-all duration-300' : 'bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-300';
            }
            if (cpuText) cpuText.textContent = cpuPercent.toFixed(1) + '%';
            if (cpuStatus) cpuStatus.textContent = cpuPercent > 15 ? '⚠️ Warning' : '✓ Healthy';
            
            // Update RAM Card
            const memoryMb = data.memory_mb;
            const ramBar = document.getElementById('monitor-ram-bar');
            const ramText = document.getElementById('monitor-ram-mb');
            const ramStatus = document.getElementById('monitor-ram-status');
            const memPercent = Math.min((memoryMb / 500) * 100, 100);
            if (ramBar) {
                ramBar.style.width = memPercent + '%';
                ramBar.className = memoryMb > 200 ? 'bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full transition-all duration-300' : 'bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full transition-all duration-300';
            }
            if (ramText) ramText.textContent = memoryMb.toFixed(1) + ' MB';
            if (ramStatus) ramStatus.textContent = memoryMb > 200 ? '⚠️ Warning' : '✓ Healthy';
            
            // Update Uptime Card
            const uptimeSeconds = data.uptime_seconds;
            const uptimeFormatted = this.formatUptime(uptimeSeconds);
            const uptimeText = document.getElementById('monitor-uptime-text');
            const uptimeDetail = document.getElementById('monitor-uptime-detail');
            if (uptimeText) uptimeText.textContent = uptimeFormatted.short;
            if (uptimeDetail) uptimeDetail.textContent = `Running for ${uptimeFormatted.long}`;
            
            // Update Last Deviation Card
            const deviation = data.last_deviation;
            const deviationApp = document.getElementById('monitor-deviation-app');
            const deviationMetric = document.getElementById('monitor-deviation-metric');
            const deviationTime = document.getElementById('monitor-deviation-time');
            const deviationSeverity = document.getElementById('monitor-deviation-severity');
            
            if (deviation && deviation.process_name !== 'None') {
                if (deviationApp) deviationApp.textContent = `⚠️ ${deviation.process_name}`;
                if (deviationMetric) deviationMetric.textContent = `${deviation.metric}`;
                if (deviationSeverity) deviationSeverity.textContent = deviation.severity === 'critical' ? '🔴 Critical' : '🟡 Warning';
                if (deviationTime) {
                    const deviationDate = new Date(deviation.timestamp);
                    const now = new Date();
                    const diffMs = now - deviationDate;
                    const diffSec = Math.floor(diffMs / 1000);
                    let timeAgo = '';
                    if (diffSec < 60) timeAgo = `${diffSec}s ago`;
                    else if (diffSec < 3600) timeAgo = `${Math.floor(diffSec / 60)}m ago`;
                    else timeAgo = `${Math.floor(diffSec / 3600)}h ago`;
                    deviationTime.textContent = `Last seen: ${timeAgo}`;
                }
                document.getElementById('monitor-deviation-card').style.borderColor = deviation.severity === 'critical' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(217, 119, 6, 0.5)';
            } else {
                if (deviationApp) deviationApp.textContent = '✓ No deviations';
                if (deviationMetric) deviationMetric.textContent = 'System running smoothly';
                if (deviationSeverity) deviationSeverity.textContent = '🟢 Good';
                if (deviationTime) deviationTime.textContent = '---';
                document.getElementById('monitor-deviation-card').style.borderColor = 'rgba(34, 197, 94, 0.3)';
            }
        } catch (error) {
            console.error('Failed to update self-monitor:', error);
        }
    },

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (seconds < 60) {
            return { short: secs + 's', long: secs + ' seconds' };
        } else if (seconds < 3600) {
            return { short: minutes + 'm ' + secs + 's', long: minutes + ' minutes, ' + secs + ' seconds' };
        } else if (seconds < 86400) {
            return { 
                short: hours + 'h ' + minutes + 'm', 
                long: hours + ' hour' + (hours > 1 ? 's' : '') + ', ' + minutes + ' minute' + (minutes !== 1 ? 's' : '') 
            };
        } else {
            return { 
                short: days + 'd ' + hours + 'h', 
                long: days + ' day' + (days > 1 ? 's' : '') + ', ' + hours + ' hour' + (hours !== 1 ? 's' : '') 
            };
        }
    },

    displayAllApps() {
        const container = document.getElementById('dashboard');
        
        // Add the all-apps-view class to the grid
        container.classList.add('all-apps-view');
        
        if (!this.state.allApps || this.state.allApps.length === 0) {
            container.innerHTML = '<div class="col-span-4 text-center text-slate-500 py-20">Loading applications...</div>';
            return;
        }

        container.innerHTML = this.state.allApps.map(app => `
            <div class="glass p-4 rounded-2xl flex flex-col items-center group relative overflow-hidden transition-all duration-500 hover:bg-slate-700/50">
                <div class="w-12 h-12 mb-3 relative">
                    ${this.renderIcon(app, 'w-12 h-12')}
                </div>
                
                <h3 class="font-bold text-center text-sm truncate w-full px-2" title="${app.display_name}">${app.display_name}</h3>
                <p class="text-[8px] text-slate-500 truncate w-full text-center px-2">${app.exe_name}</p>
                
                <div class="mt-2 text-[10px] text-slate-400 text-center">
                    <span class="inline-block px-2 py-1 bg-slate-800 rounded mt-2">Logo cached</span>
                </div>
            </div>
        `).join('');
        
        this.state.lastUpdated = new Date();
        document.getElementById('load-more-btn').style.display = 'none';
        document.getElementById('pagination-info').textContent = '';
    },

    renderProcessCard(app) {
        return `
            <div class="glass p-6 rounded-2xl flex flex-col items-center group relative overflow-hidden transition-all duration-500">
                <div class="absolute top-0 right-0 p-2">
                    <span class="text-[10px] font-mono text-slate-500">PID: ${app.pid}</span>
                </div>
                
                <div class="w-16 h-16 mb-4 relative">
                    ${this.renderIcon(app)}
                </div>
                
                <h3 class="font-bold text-center mb-4 truncate w-full px-2" title="${app.name}">${app.name}</h3>
                
                <div class="grid grid-cols-2 gap-4 w-full">
                    <div class="text-center">
                        <p class="text-[10px] text-slate-500 uppercase tracking-wider">Incoming</p>
                        <p class="text-lg font-bold text-cyan-400">${app.incoming}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-[10px] text-slate-500 uppercase tracking-wider">Outgoing</p>
                        <p class="text-lg font-bold text-blue-400">${app.outgoing}</p>
                    </div>
                </div>
                
                <div class="mt-4 w-full grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                        ${(() => {
                            const cpuStatus = this.getStatus(app.cpu, this.state.thresholds.cpuYellow, this.state.thresholds.cpuRed);
                            const barColor = this.getBarColorClass(app.cpu, this.state.thresholds.cpuYellow, this.state.thresholds.cpuRed);
                            const textColor = this.getColorClass(app.cpu, this.state.thresholds.cpuYellow, this.state.thresholds.cpuRed);
                            return `
                        <div class="w-full h-[2px] bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full ${barColor} transition-all duration-1000" style="width: ${Math.min(app.cpu * 4, 100)}%"></div>
                        </div>
                        <div class="flex justify-between w-full items-center group">
                            <div class="flex items-center gap-1">
                                <span class="text-[11px] text-slate-500 font-bold uppercase">CPU</span>
                                <span class="text-xs cursor-help tooltip-trigger" title="Thresholds: Yellow ≥ ${this.state.thresholds.cpuYellow}% | Red ≥ ${this.state.thresholds.cpuRed}%">ⓘ</span>
                            </div>
                            <span class="${textColor} text-[11px] font-bold">${app.cpu.toFixed(1)}% ${cpuStatus.icon}</span>
                        </div>
                        `;
                        })()}
                    </div>
                    <div class="space-y-1">
                        ${(() => {
                            const ramPercent = Math.min(app.memory / 10, 100);
                            const ramStatus = this.getStatus(ramPercent, this.state.thresholds.ramYellow, this.state.thresholds.ramRed);
                            const barColor = this.getBarColorClass(ramPercent, this.state.thresholds.ramYellow, this.state.thresholds.ramRed);
                            const textColor = this.getColorClass(ramPercent, this.state.thresholds.ramYellow, this.state.thresholds.ramRed);
                            return `
                        <div class="w-full h-[2px] bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full ${barColor} transition-all duration-1000" style="width: ${ramPercent}%"></div>
                        </div>
                        <div class="flex justify-between w-full items-center">
                            <div class="flex items-center gap-1">
                                <span class="text-[11px] text-slate-500 font-bold uppercase">RAM</span>
                                <span class="text-xs cursor-help tooltip-trigger" title="Thresholds: Yellow ≥ ${this.state.thresholds.ramYellow}% | Red ≥ ${this.state.thresholds.ramRed}%">ⓘ</span>
                            </div>
                            <span class="${textColor} text-[11px] font-bold">${app.memory > 1024 ? (app.memory/1024).toFixed(1) + 'GB' : Math.round(app.memory) + 'MB'} ${ramStatus.icon}</span>
                        </div>
                        `;
                        })()}
                    </div>
                </div>
            </div>
        `;
    },

    updatePaginationInfo() {
        const info = document.getElementById('pagination-info');
        const pageInd = document.getElementById('page-indicator');
        const total = this.state.totalItems || 0;
        const displayed = this.state.displayedItems || 0;
        const currentPage = this.state.currentPage || 1;
        const totalPages = Math.ceil(total / 20) || 1; // 20 items per page
        
        // Show page indicator
        pageInd.textContent = `Page ${currentPage} of ${totalPages}`;
        
        // Show count dynamically
        if (total === 0) {
            info.textContent = 'No processes detected';
        } else if (displayed === total) {
            info.textContent = `Showing all ${total} processes`;
        } else {
            info.textContent = `Showing ${displayed} of ${total} processes · ${total - displayed} more available`;
        }
        
        const btn = document.getElementById('load-more-btn');
        if (displayed < total) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    },

    async loadMore() {
        const btn = document.getElementById('load-more-btn');
        btn.disabled = true;
        btn.style.opacity = '0.5';
        
        this.showNotification('🔍 Reading system processes...', 'info', 0);
        this.state.currentPage += 1;
        await this.fetchAndDisplay(true);  // true = show notifications
        
        btn.disabled = false;
        btn.style.opacity = '1';
    },

    async fetchAndDisplay(showNotifications = false) {
        try {
            const response = await fetch(`/api/dashboard?page=${this.state.currentPage}&t=${Date.now()}`);
            
            if (!response.ok) {
                if (showNotifications) {
                    this.showNotification('Failed to fetch processes', 'error', 5000);
                }
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            const container = document.getElementById('dashboard');
            
            // Ensure correct grid class for dashboard view
            container.classList.remove('all-apps-view');
            if (!container.classList.contains('app-grid')) {
                container.classList.add('app-grid');
            }
            
            if (!data.items || data.items.length === 0) {
                if (this.state.currentPage === 1) {
                    container.innerHTML = '<div class="col-span-4 text-center text-slate-500 py-20">Monitoring network connections...</div>';
                }
                this.updatePaginationInfo();
                this.showNotification('No additional processes found', 'warning', 3000);
                return;
            }

            // Store total info
            this.state.totalItems = data.total_items;
            this.state.displayedItems = data.items_per_page * (data.page - 1) + data.items.length;
            
            // If first page, replace container; otherwise append
            if (data.page === 1) {
                container.innerHTML = '';
            }
            
            // Append new items
            data.items.forEach(app => {
                const cardHtml = this.renderProcessCard(app);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardHtml;
                container.appendChild(tempDiv.firstElementChild);
            });
            
            this.state.lastUpdated = new Date();
            this.updatePaginationInfo();
            
            // Show success notification only for manual Load More
            if (showNotifications) {
                const itemsText = data.items.length === 1 ? 'process' : 'processes';
                this.showNotification(`✅ Loaded ${data.items.length} ${itemsText} (Page ${data.page})`, 'success', 3000);
            }
        } catch (error) {
            console.error('Update failed:', error);
            if (showNotifications) {
                this.showNotification('Failed to load processes', 'error', 5000);
            }
        }
    },

    async updateDashboard() {
        if (this.state.currentView !== 'dashboard') return;
        
        // Only auto-refresh page 1 to preserve user's Load More pagination
        // If user is on page 2+, let them browse at their own pace
        if (this.state.currentPage === 1) {
            this.state.displayedItems = 0;
            await this.fetchAndDisplay();
        }
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());

// Global exposed for dropdown
globalThis.setTheme = (theme) => App.setTheme(theme);
globalThis.switchView = (view) => App.switchView(view);

