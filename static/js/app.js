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
        thresholds: {
            cpuYellow: 20,
            cpuRed: 70,
            ramYellow: 50,
            ramRed: 80
        }
    },

    init() {
        this.loadThresholds();
        this.updateDashboard();
        setInterval(() => this.updateDashboard(), 3000);
        this.loadAllApps();
        console.log('System Pulse - Local Dev Monitoring Initialized');
    },

    loadThresholds() {
        const stored = localStorage.getItem('appThresholds');
        if (stored) {
            this.state.thresholds = JSON.parse(stored);
        }
    },

    saveThresholds() {
        localStorage.setItem('appThresholds', JSON.stringify(this.state.thresholds));
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
    },

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    },

    saveSettings() {
        this.state.thresholds.cpuYellow = parseFloat(document.getElementById('cpu-yellow-input').value);
        this.state.thresholds.cpuRed = parseFloat(document.getElementById('cpu-red-input').value);
        this.state.thresholds.ramYellow = parseFloat(document.getElementById('ram-yellow-input').value);
        this.state.thresholds.ramRed = parseFloat(document.getElementById('ram-red-input').value);
        this.saveThresholds();
        this.closeSettings();
        this.state.currentPage = 1;
        this.state.displayedItems = 0;
        this.state.allProcesses = [];
        this.updateDashboard();
    },

    resetThresholds() {
        this.state.thresholds = {
            cpuYellow: 20,
            cpuRed: 70,
            ramYellow: 50,
            ramRed: 80
        };
        this.saveThresholds();
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
        const total = this.state.totalItems || 0;
        const displayed = this.state.displayedItems || 0;
        
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
        this.state.currentPage += 1;
        await this.fetchAndDisplay();
    },

    async fetchAndDisplay() {
        try {
            const response = await fetch(`/api/dashboard?page=${this.state.currentPage}&t=${Date.now()}`);
            if (!response.ok) throw new Error('Network response was not ok');
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
        } catch (error) {
            console.error('Update failed:', error);
        }
    },

    async updateDashboard() {
        if (this.state.currentView !== 'dashboard') return;
        
        // Auto-refresh always resets to page 1 (fresh top 20 processes)
        // User can then click "Load More" to see additional pages
        this.state.currentPage = 1;
        this.state.displayedItems = 0;
        await this.fetchAndDisplay();
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());

// Global exposed for dropdown
window.setTheme = (theme) => App.setTheme(theme);
window.switchView = (view) => App.switchView(view);

