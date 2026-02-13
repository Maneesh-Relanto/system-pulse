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
        searchCache: [],  // Cache for search autocomplete
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
        
        // Show loading indicator when app starts
        const loadingIndicator = document.getElementById('loading-indicator');
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) loadingMsg.classList.remove('hidden');
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        
        this.updateDashboard();
        this.startRefreshInterval();
        this.loadAllApps();
        
        // Update self-monitor once on load
        this.updateSelfMonitor();
        
        // Fetch search processes once on load
        this.fetchSearchProcesses();
        
        // Regular updates
        setInterval(() => this.updateSelfMonitor(), 5000);  // Update self-monitor every 5 seconds
        
        // Add click-outside handler to close search dropdown
        document.addEventListener('click', (e) => {
            const searchContainer = document.getElementById('search-autocomplete');
            const searchInput = document.getElementById('process-search-input');
            
            if (searchContainer && searchInput) {
                if (!searchContainer.contains(e.target) && !searchInput.contains(e.target)) {
                    searchContainer.classList.add('hidden');
                }
            }
        });
        
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
        
        // Hide/Show views
        document.getElementById('self-monitor-container').style.display = view === 'dashboard' ? 'grid' : 'none';
        document.getElementById('dashboard').style.display = view === 'dashboard' ? 'grid' : 'none';
        document.getElementById('load-more-section').style.display = view === 'dashboard' ? 'flex' : 'none';
        document.getElementById('snapshot-view').style.display = view === 'snapshot' ? 'block' : 'none';
        
        if (view === 'all-apps') {
            this.displayAllApps();
        } else if (view === 'snapshot') {
            this.loadSnapshot();
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
            return `<div class="avatar-button gradient bg-gradient-to-br ${gradient}">
                ${firstLetter}
            </div>`;
        }
        return `
            <img src="${logo}" alt="${app.name || app.display_name}" 
                class="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-all duration-300"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="hidden avatar-button fallback">
                ${firstLetter}
            </div>`;
    },

    async loadAllApps() {
        try {
            const url = `${window.location.origin}/api/all-apps`;
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HTTP ${response.status}: ${error}`);
            }
            const apps = await response.json();
            // Store for later display
            this.state.allApps = apps;
        } catch (error) {
            console.error('Failed to load all apps:', error);
        }
    },

    async updateSelfMonitor() {
        try {
            const url = `${window.location.origin}/api/self-monitor`;
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HTTP ${response.status}: ${error}`);
            }
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
            const url = `${window.location.origin}/api/dashboard?page=${this.state.currentPage}&t=${Date.now()}`;
            const response = await fetch(url);
            
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
                // Hide loading indicators for empty results
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
                if (loadingMsg) loadingMsg.classList.add('hidden');
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

    async loadSnapshot() {
        try {
            const url = `${window.location.origin}/api/snapshot`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load snapshot');
            const data = await response.json();
            
            // Store snapshot data in state
            this.state.snapshotData = data.processes || [];
            this.state.snapshotTotal = data.total || 0;
            this.state.snapshotFiltered = data.filtered || 0;
            
            // Initialize sorting
            this.state.snapshotSortKey = 'cpu';
            this.state.snapshotSortOrder = 'desc';
            
            this.displaySnapshot();
        } catch (error) {
            console.error('Failed to load snapshot:', error);
            this.showNotification('Failed to load system snapshot', 'error', 5000);
        }
    },

    displaySnapshot() {
        const tbody = document.getElementById('snapshot-tbody');
        
        if (!this.state.snapshotData || this.state.snapshotData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No processes found</td></tr>';
            return;
        }

        tbody.innerHTML = this.state.snapshotData.map(app => `
            <tr class="border-t border-slate-700/50 hover:bg-slate-800/30 transition-all">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        ${app.logo ? `<img src="${app.logo}" alt="" class="w-5 h-5 rounded">` : '<div class="w-5 h-5 rounded bg-slate-700"></div>'}
                        <span class="font-medium text-slate-800 dark:text-slate-100 truncate">${app.name}</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="${app.cpu > 70 ? 'text-red-400 font-bold' : app.cpu > 20 ? 'text-yellow-400' : 'text-green-400'}">
                        ${app.cpu.toFixed(1)}%
                    </span>
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="${app.memory > 500 ? 'text-red-400 font-bold' : app.memory > 200 ? 'text-yellow-400' : 'text-purple-400'}">
                        ${app.memory.toFixed(1)}
                    </span>
                </td>
                <td class="px-4 py-3 text-right text-blue-400">${app.incoming}</td>
                <td class="px-4 py-3 text-right text-orange-400">${app.outgoing}</td>
                <td class="px-4 py-3 text-right text-slate-500 text-sm">${app.pid}</td>
            </tr>
        `).join('');

        // Update stats
        document.getElementById('snapshot-total').textContent = this.state.snapshotTotal;
        document.getElementById('snapshot-filtered').textContent = this.state.snapshotData.length;
    },

    filterSnapshot() {
        const searchTerm = document.getElementById('snapshot-search')?.value || '';
        const minCpu = parseFloat(document.getElementById('snapshot-cpu-filter')?.value || 0);
        const minMemory = parseFloat(document.getElementById('snapshot-memory-filter')?.value || 0);

        // Update display values
        document.getElementById('snapshot-cpu-value').textContent = minCpu + '%';
        document.getElementById('snapshot-memory-value').textContent = minMemory + ' MB';

        // Fetch with filters
        const url = `${window.location.origin}/api/snapshot?min_cpu=${minCpu}&min_memory=${minMemory}&search=${encodeURIComponent(searchTerm)}`;
        fetch(url)
            .then(r => r.json())
            .then(data => {
                this.state.snapshotData = data.processes || [];
                this.state.snapshotFiltered = data.filtered || 0;
                
                // Reapply current sort
                if (this.state.snapshotSortKey) {
                    this.state.snapshotData.sort((a, b) => {
                        const aVal = a[this.state.snapshotSortKey];
                        const bVal = b[this.state.snapshotSortKey];
                        
                        if (typeof aVal === 'string') {
                            return this.state.snapshotSortOrder === 'asc' ? 
                                aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                        }
                        return this.state.snapshotSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                    });
                }
                
                this.displaySnapshot();
            })
            .catch(err => {
                console.error('Filter error:', err);
                this.showNotification('Failed to filter snapshot', 'error', 3000);
            });
    },

    sortSnapshot(key) {
        // Toggle sort order if clicking same column
        if (this.state.snapshotSortKey === key) {
            this.state.snapshotSortOrder = this.state.snapshotSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.snapshotSortKey = key;
            this.state.snapshotSortOrder = key === 'name' ? 'asc' : 'desc';  // Name ascending, numbers descending
        }

        // Sort data
        this.state.snapshotData.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (typeof aVal === 'string') {
                return this.state.snapshotSortOrder === 'asc' ? 
                    aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return this.state.snapshotSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        // Update sort indicator
        document.querySelectorAll('#snapshot-table [id^="sort-"]').forEach(el => {
            el.textContent = '▼▲';
            el.classList.remove('text-cyan-400', 'text-slate-500');
            el.classList.add('text-slate-500');
        });
        
        const sortEl = document.getElementById(`sort-${key}`);
        if (sortEl) {
            sortEl.textContent = this.state.snapshotSortOrder === 'asc' ? '▲' : '▼';
            sortEl.classList.remove('text-slate-500');
            sortEl.classList.add('text-cyan-400');
        }

        this.displaySnapshot();
    },

    exportToCSV() {
        if (!this.state.snapshotData || this.state.snapshotData.length === 0) {
            this.showNotification('No data to export', 'warning', 3000);
            return;
        }

        // Create CSV header
        const headers = ['Process Name', 'CPU %', 'Memory MB', 'Incoming Connections', 'Outgoing Connections', 'PID'];
        
        // Create CSV rows
        const rows = this.state.snapshotData.map(app => [
            app.name,
            app.cpu.toFixed(1),
            app.memory.toFixed(1),
            app.incoming,
            app.outgoing,
            app.pid
        ]);

        // Combine header and rows
        const csv = [headers, ...rows]
            .map(row => row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma
                const str = String(cell);
                return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
            }).join(','))
            .join('\n');

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `system-snapshot-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Snapshot exported to CSV', 'success', 3000);
    },

    // ============ SEARCH AND MODAL METHODS ============

    async fetchSearchProcesses() {
        try {
            const url = `${window.location.origin}/api/process-search`;
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HTTP ${response.status}: ${error}`);
            }
            const data = await response.json();
            this.state.searchCache = data.processes || [];
            console.log(`Loaded ${this.state.searchCache.length} processes for search`);
        } catch (error) {
            console.error('Error loading search processes:', error);
            this.state.searchCache = [];
        }
    },

    handleSearchInput(event) {
        const input = event.target.value.toLowerCase().trim();
        
        if (input.length === 0) {
            document.getElementById('search-autocomplete').classList.add('hidden');
            return;
        }

        const filtered = this.state.searchCache.filter(p => 
            p.name.toLowerCase().includes(input) ||
            p.pid.toString().includes(input)
        ).slice(0, 10);  // Limit to 10 results

        this.showSearchResults(filtered);
    },

    closeSearchDropdown() {
        document.getElementById('search-autocomplete').classList.add('hidden');
        document.getElementById('process-search-input').value = '';
    },

    handleSearchKeydown(event) {
        const dropdown = document.getElementById('search-autocomplete');
        const items = dropdown.querySelectorAll('[data-pid]');

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            const current = dropdown.querySelector('[data-selected="true"]');
            if (current) {
                current.removeAttribute('data-selected');
            }
            const next = current?.nextElementSibling || items[0];
            if (next) {
                next.setAttribute('data-selected', 'true');
                next.scrollIntoView({ block: 'nearest' });
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const current = dropdown.querySelector('[data-selected="true"]');
            if (current) {
                current.removeAttribute('data-selected');
            }
            const prev = current?.previousElementSibling || items[items.length - 1];
            if (prev) {
                prev.setAttribute('data-selected', 'true');
                prev.scrollIntoView({ block: 'nearest' });
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const selected = dropdown.querySelector('[data-selected="true"]');
            if (selected) {
                const pid = selected.getAttribute('data-pid');
                this.showProcessDetailsModal(pid);
                this.closeSearchDropdown();
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.closeSearchDropdown();
        }
    },

    showSearchResults(results) {
        const container = document.getElementById('search-autocomplete');
        
        if (results.length === 0) {
            container.innerHTML = '<div class="search-item" style="cursor:default; justify-content: center; padding: 20px;"><div class="search-item-name">No processes found</div></div>';
            container.classList.remove('hidden');
            return;
        }

        container.innerHTML = results.map((p, idx) => `
            <div data-pid="${p.pid}" class="search-item" 
                 data-selected="${idx === 0 ? 'true' : 'false'}"
                 onmouseover="this.setAttribute('data-selected', 'true')"
                 onmouseout="this.setAttribute('data-selected', 'false')"
                 onclick="App.showProcessDetailsModal(${p.pid}); App.closeSearchDropdown();">
                <div class="search-item-content">
                    <div class="search-item-name">${p.name}</div>
                    <div class="search-item-info">
                        <span class="search-item-pid">PID: ${p.pid}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.classList.remove('hidden');
    },

    async showProcessDetailsModal(pid) {
        const modal = document.getElementById('process-details-modal');
        modal.classList.remove('hidden');

        try {
            const url = `${window.location.origin}/api/process-details/${pid}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.found) {
                this.showNotification('Process not found or terminated', 'warning', 3000);
                this.closeProcessDetailsModal();
                return;
            }

            // Update modal with data
            const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleString();
            };

            // Avatar
            const avatarDiv = document.getElementById('modal-process-avatar');
            if (data.logo) {
                avatarDiv.innerHTML = `<img src="${data.logo}" alt="${data.name}" class="w-full h-full rounded-lg object-contain" />`;
            } else {
                avatarDiv.textContent = data.name.charAt(0).toUpperCase();
                avatarDiv.className = 'w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-xl rounded-lg';
            }

            // Basic info
            document.getElementById('modal-process-name').textContent = data.name;
            document.getElementById('modal-process-pid').textContent = `PID: ${data.pid}`;

            // Metrics
            document.getElementById('modal-cpu').textContent = (data.cpu_percent || 0).toFixed(1);
            document.getElementById('modal-memory').textContent = (data.memory_mb || 0).toFixed(1);
            document.getElementById('modal-memory-percent').textContent = (data.memory_percent || 0).toFixed(1);
            document.getElementById('modal-threads').textContent = data.num_threads || 0;
            document.getElementById('modal-connections').textContent = data.num_connections || 0;
            document.getElementById('modal-status').textContent = (data.status || 'unknown').charAt(0).toUpperCase() + (data.status || 'unknown').slice(1);

            // Details
            document.getElementById('modal-exe').textContent = data.exe || 'Unknown';
            document.getElementById('modal-cmdline').textContent = data.cmdline || 'N/A';
            document.getElementById('modal-created').textContent = formatDate(data.created_at);
            document.getElementById('modal-ppid').textContent = data.parent_pid || 'N/A';
            document.getElementById('modal-files').textContent = data.open_files || 0;

        } catch (error) {
            console.error('Error loading process details:', error);
            this.showNotification('Failed to load process details', 'error', 3000);
            this.closeProcessDetailsModal();
        }
    },

    closeProcessDetailsModal() {
        document.getElementById('process-details-modal').classList.add('hidden');
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

