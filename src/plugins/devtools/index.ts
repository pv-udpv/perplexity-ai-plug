/**
 * DevTools Plugin
 * 
 * Provides low-level access to:
 * - Network traffic monitoring
 * - Plugin logs aggregation
 * - Special agent debugging
 * - Performance metrics
 * - State inspection
 */

import type { Plugin, CoreAPI, Logger, Panel } from '../../core/types';

interface NetworkRequest {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  status?: number;
  duration?: number;
  headers?: Record<string, string>;
  body?: any;
  response?: any;
  error?: string;
}

interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  data?: any;
}

interface PluginState {
  id: string;
  name: string;
  enabled: boolean;
  loaded: boolean;
  error?: string;
}

export class DevToolsPlugin implements Plugin {
  id = 'devtools';
  name = 'DevTools';
  version = '1.0.0';
  description = 'Developer tools for debugging plugins, monitoring traffic, and inspecting state';
  author = 'pv-udpv';

  private core!: CoreAPI;
  private logger!: Logger;
  private panel?: Panel;
  
  // Data stores
  private networkRequests: NetworkRequest[] = [];
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private maxRequests = 500;
  
  // Interceptors
  private originalFetch?: typeof window.fetch;
  private originalXHR?: typeof XMLHttpRequest;
  private originalConsole?: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };
  
  // UI state
  private activeTab: 'network' | 'logs' | 'plugins' | 'performance' = 'logs';
  private filterText = '';
  private autoScroll = true;

  async onLoad(core: CoreAPI): Promise<void> {
    this.core = core;
    this.logger = core.logger.create(this.id);
    this.logger.info('DevTools plugin loaded');
  }

  async onEnable(): Promise<void> {
    this.logger.info('DevTools plugin enabled');

    // Intercept network traffic
    this.interceptNetwork();
    
    // Intercept console logs
    this.interceptConsole();
    
    // Listen to core events
    this.setupEventListeners();

    // Create DevTools panel
    this.createDevToolsPanel();
    
    // Show welcome message
    this.core.ui.showToast('DevTools enabled - Press Ctrl+Shift+D to toggle', 'info', 4000);
  }

  async onDisable(): Promise<void> {
    this.logger.info('DevTools plugin disabled');
    
    // Restore original functions
    this.restoreNetwork();
    this.restoreConsole();
    
    // Hide panel
    if (this.panel) {
      this.panel.hide();
    }
  }

  async onUnload(): Promise<void> {
    this.logger.info('DevTools plugin unloaded');
    
    // Cleanup
    this.restoreNetwork();
    this.restoreConsole();
    
    if (this.panel) {
      this.panel.destroy();
    }
  }

  /**
   * Intercept network requests
   */
  private interceptNetwork(): void {
    // Intercept fetch
    this.originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const requestId = this.generateId();
      const startTime = Date.now();
      
      const request: NetworkRequest = {
        id: requestId,
        timestamp: startTime,
        url: typeof args[0] === 'string' ? args[0] : (args[0] as Request).url,
        method: args[1]?.method || 'GET',
      };
      
      try {
        const response = await this.originalFetch!(...args);
        request.status = response.status;
        request.duration = Date.now() - startTime;
        
        // Clone response to read body
        const clone = response.clone();
        try {
          const text = await clone.text();
          request.response = text.length > 10000 ? text.substring(0, 10000) + '...' : text;
        } catch (e) {
          request.response = '[Unable to read response body]';
        }
        
        this.addNetworkRequest(request);
        return response;
      } catch (error) {
        request.error = error instanceof Error ? error.message : String(error);
        request.duration = Date.now() - startTime;
        this.addNetworkRequest(request);
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    this.originalXHR = XMLHttpRequest;
    const self = this;
    
    (window as any).XMLHttpRequest = function() {
      const xhr = new self.originalXHR!();
      const requestId = self.generateId();
      let startTime = 0;
      
      const request: NetworkRequest = {
        id: requestId,
        timestamp: Date.now(),
        url: '',
        method: 'GET',
      };
      
      const originalOpen = xhr.open;
      xhr.open = function(method: string, url: string, ...args: any[]) {
        request.method = method;
        request.url = url;
        startTime = Date.now();
        return originalOpen.apply(this, [method, url, ...args] as any);
      };
      
      const originalSend = xhr.send;
      xhr.send = function(body?: any) {
        if (body) {
          request.body = body;
        }
        return originalSend.apply(this, [body] as any);
      };
      
      xhr.addEventListener('loadend', () => {
        request.status = xhr.status;
        request.duration = Date.now() - startTime;
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            request.response = xhr.responseText.length > 10000 
              ? xhr.responseText.substring(0, 10000) + '...'
              : xhr.responseText;
          } catch (e) {
            request.response = '[Unable to read response]';
          }
        } else if (xhr.status >= 400) {
          request.error = `HTTP ${xhr.status} ${xhr.statusText}`;
        }
        
        self.addNetworkRequest(request);
      });
      
      return xhr;
    };
  }

  /**
   * Intercept console logs
   */
  private interceptConsole(): void {
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    const createInterceptor = (level: LogEntry['level'], original: Function) => {
      return (...args: any[]) => {
        // Extract source from stack trace
        const stack = new Error().stack || '';
        const match = stack.match(/at\s+(.+?)\s+\(/);
        const source = match ? match[1] : 'unknown';
        
        this.addLog({
          timestamp: Date.now(),
          level,
          source,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          data: args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined,
        });
        
        // Call original console method
        original.apply(console, args);
      };
    };

    console.log = createInterceptor('info', this.originalConsole.log);
    console.info = createInterceptor('info', this.originalConsole.info);
    console.warn = createInterceptor('warn', this.originalConsole.warn);
    console.error = createInterceptor('error', this.originalConsole.error);
    console.debug = createInterceptor('debug', this.originalConsole.debug);
  }

  /**
   * Setup event listeners for core events
   */
  private setupEventListeners(): void {
    this.core.messaging.on('core:plugin:enabled', (data) => {
      this.addLog({
        timestamp: Date.now(),
        level: 'info',
        source: 'core',
        message: `Plugin enabled: ${data.pluginId}`,
      });
      this.refreshUI();
    });

    this.core.messaging.on('core:plugin:disabled', (data) => {
      this.addLog({
        timestamp: Date.now(),
        level: 'info',
        source: 'core',
        message: `Plugin disabled: ${data.pluginId}`,
      });
      this.refreshUI();
    });
  }

  /**
   * Create the DevTools panel
   */
  private createDevToolsPanel(): void {
    this.panel = this.core.ui.createPanel({
      title: 'DevTools',
      position: 'right',
      width: 600,
      content: this.renderContent(),
    });

    // Keyboard shortcut: Ctrl+Shift+D
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.panel?.toggle();
      }
    });
  }

  /**
   * Render DevTools content
   */
  private renderContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'devtools-container';
    container.style.cssText = `
      height: 100%;
      display: flex;
      flex-direction: column;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
    `;

    // Tabs
    const tabs = this.renderTabs();
    container.appendChild(tabs);

    // Content area
    const content = document.createElement('div');
    content.className = 'devtools-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      background: #1e1e1e;
      color: #d4d4d4;
    `;
    content.id = 'devtools-content';

    this.renderTabContent(content);
    container.appendChild(content);

    // Controls
    const controls = this.renderControls();
    container.appendChild(controls);

    return container;
  }

  /**
   * Render tab navigation
   */
  private renderTabs(): HTMLElement {
    const tabsContainer = document.createElement('div');
    tabsContainer.style.cssText = `
      display: flex;
      background: #252526;
      border-bottom: 1px solid #3e3e42;
    `;

    const tabs = [
      { id: 'logs', label: 'Logs', icon: '📋' },
      { id: 'network', label: 'Network', icon: '🌐' },
      { id: 'plugins', label: 'Plugins', icon: '🔌' },
      { id: 'performance', label: 'Performance', icon: '⚡' },
    ];

    tabs.forEach(({ id, label, icon }) => {
      const tab = document.createElement('button');
      tab.textContent = `${icon} ${label}`;
      tab.style.cssText = `
        padding: 10px 20px;
        background: ${this.activeTab === id ? '#1e1e1e' : 'transparent'};
        color: ${this.activeTab === id ? '#ffffff' : '#cccccc'};
        border: none;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
      `;
      
      tab.addEventListener('mouseenter', () => {
        if (this.activeTab !== id) {
          tab.style.background = '#2a2a2a';
        }
      });
      
      tab.addEventListener('mouseleave', () => {
        if (this.activeTab !== id) {
          tab.style.background = 'transparent';
        }
      });
      
      tab.addEventListener('click', () => {
        this.activeTab = id as any;
        this.refreshUI();
      });
      
      tabsContainer.appendChild(tab);
    });

    return tabsContainer;
  }

  /**
   * Render tab content based on active tab
   */
  private renderTabContent(container: HTMLElement): void {
    container.innerHTML = '';

    switch (this.activeTab) {
      case 'logs':
        this.renderLogsTab(container);
        break;
      case 'network':
        this.renderNetworkTab(container);
        break;
      case 'plugins':
        this.renderPluginsTab(container);
        break;
      case 'performance':
        this.renderPerformanceTab(container);
        break;
    }
  }

  /**
   * Render logs tab
   */
  private renderLogsTab(container: HTMLElement): void {
    const filteredLogs = this.logs.filter(log => 
      !this.filterText || 
      log.message.toLowerCase().includes(this.filterText.toLowerCase()) ||
      log.source.toLowerCase().includes(this.filterText.toLowerCase())
    );

    if (filteredLogs.length === 0) {
      container.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No logs yet. Console output will appear here.</div>';
      return;
    }

    filteredLogs.forEach(log => {
      const logEntry = document.createElement('div');
      logEntry.style.cssText = `
        padding: 5px 10px;
        border-bottom: 1px solid #3e3e42;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 11px;
      `;

      const levelColors = {
        debug: '#888',
        info: '#4CAF50',
        warn: '#FF9800',
        error: '#f44336',
      };

      logEntry.innerHTML = `
        <div style="display: flex; gap: 10px;">
          <span style="color: #888; min-width: 80px;">${new Date(log.timestamp).toLocaleTimeString()}</span>
          <span style="color: ${levelColors[log.level]}; min-width: 50px; font-weight: bold;">[${log.level.toUpperCase()}]</span>
          <span style="color: #569cd6; min-width: 100px;">${log.source}</span>
          <span style="color: #d4d4d4; flex: 1; word-break: break-all;">${this.escapeHtml(log.message)}</span>
        </div>
      `;

      container.appendChild(logEntry);
    });

    if (this.autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Render network tab
   */
  private renderNetworkTab(container: HTMLElement): void {
    if (this.networkRequests.length === 0) {
      container.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No network requests yet. Fetch and XHR requests will appear here.</div>';
      return;
    }

    const filteredRequests = this.networkRequests.filter(req =>
      !this.filterText ||
      req.url.toLowerCase().includes(this.filterText.toLowerCase()) ||
      req.method.toLowerCase().includes(this.filterText.toLowerCase())
    );

    filteredRequests.forEach(req => {
      const reqEntry = document.createElement('div');
      reqEntry.style.cssText = `
        padding: 8px 10px;
        border-bottom: 1px solid #3e3e42;
        cursor: pointer;
        transition: background 0.2s;
      `;

      reqEntry.addEventListener('mouseenter', () => {
        reqEntry.style.background = '#2a2a2a';
      });

      reqEntry.addEventListener('mouseleave', () => {
        reqEntry.style.background = 'transparent';
      });

      const statusColor = req.error ? '#f44336' : 
        (req.status && req.status >= 400) ? '#FF9800' :
        (req.status && req.status >= 200 && req.status < 300) ? '#4CAF50' : '#888';

      reqEntry.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center;">
          <span style="color: #888; font-size: 10px; min-width: 60px;">${new Date(req.timestamp).toLocaleTimeString()}</span>
          <span style="color: #569cd6; font-weight: bold; min-width: 50px;">${req.method}</span>
          <span style="color: ${statusColor}; font-weight: bold; min-width: 40px;">${req.status || (req.error ? 'ERR' : '...')}</span>
          <span style="color: #888; min-width: 50px;">${req.duration ? req.duration + 'ms' : '...'}</span>
          <span style="color: #d4d4d4; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${req.url}</span>
        </div>
        ${req.error ? `<div style="color: #f44336; font-size: 10px; margin-top: 4px; margin-left: 220px;">Error: ${req.error}</div>` : ''}
      `;

      reqEntry.addEventListener('click', () => {
        this.showRequestDetails(req);
      });

      container.appendChild(reqEntry);
    });
  }

  /**
   * Render plugins tab
   */
  private renderPluginsTab(container: HTMLElement): void {
    const plugins = this.core.plugins.getAll();
    
    if (plugins.length === 0) {
      container.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No plugins registered.</div>';
      return;
    }

    plugins.forEach(plugin => {
      const isEnabled = this.core.plugins.isEnabled(plugin.id);
      
      const pluginCard = document.createElement('div');
      pluginCard.style.cssText = `
        padding: 15px;
        margin-bottom: 10px;
        background: #2a2a2a;
        border-radius: 4px;
        border-left: 3px solid ${isEnabled ? '#4CAF50' : '#888'};
      `;

      pluginCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 16px;">${isEnabled ? '✅' : '⭕'}</span>
            <strong style="color: #fff; font-size: 14px;">${plugin.name}</strong>
            <span style="color: #888; font-size: 11px;">v${plugin.version}</span>
          </div>
          <button id="toggle-${plugin.id}" style="
            padding: 5px 15px;
            background: ${isEnabled ? '#f44336' : '#4CAF50'};
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
          ">${isEnabled ? 'Disable' : 'Enable'}</button>
        </div>
        <div style="color: #bbb; font-size: 11px; margin-bottom: 5px;">${plugin.description}</div>
        <div style="color: #888; font-size: 10px;">
          <span>ID: ${plugin.id}</span> | 
          <span>Author: ${plugin.author}</span>
          ${plugin.dependencies ? ` | Dependencies: ${plugin.dependencies.join(', ')}` : ''}
        </div>
      `;

      container.appendChild(pluginCard);

      // Add toggle functionality
      setTimeout(() => {
        const toggleBtn = document.getElementById(`toggle-${plugin.id}`);
        if (toggleBtn) {
          toggleBtn.addEventListener('click', async () => {
            try {
              if (isEnabled) {
                await this.core.plugins.disable(plugin.id);
                this.core.ui.showToast(`Plugin ${plugin.name} disabled`, 'info');
              } else {
                await this.core.plugins.enable(plugin.id);
                this.core.ui.showToast(`Plugin ${plugin.name} enabled`, 'success');
              }
              this.refreshUI();
            } catch (error) {
              this.core.ui.showToast(`Error: ${error}`, 'error');
            }
          });
        }
      }, 0);
    });
  }

  /**
   * Render performance tab
   */
  private renderPerformanceTab(container: HTMLElement): void {
    const stats = {
      totalLogs: this.logs.length,
      totalRequests: this.networkRequests.length,
      pluginsLoaded: this.core.plugins.getAll().length,
      pluginsEnabled: this.core.plugins.getAll().filter(p => this.core.plugins.isEnabled(p.id)).length,
      memoryUsage: (performance as any).memory ? 
        `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)}MB` : 
        'N/A',
    };

    container.innerHTML = `
      <div style="padding: 20px;">
        <h3 style="color: #fff; margin-bottom: 20px;">Performance Metrics</h3>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px;">
            <div style="color: #888; font-size: 11px; margin-bottom: 5px;">TOTAL LOGS</div>
            <div style="color: #4CAF50; font-size: 24px; font-weight: bold;">${stats.totalLogs}</div>
          </div>
          
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px;">
            <div style="color: #888; font-size: 11px; margin-bottom: 5px;">NETWORK REQUESTS</div>
            <div style="color: #2196F3; font-size: 24px; font-weight: bold;">${stats.totalRequests}</div>
          </div>
          
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px;">
            <div style="color: #888; font-size: 11px; margin-bottom: 5px;">PLUGINS LOADED</div>
            <div style="color: #FF9800; font-size: 24px; font-weight: bold;">${stats.pluginsLoaded}</div>
          </div>
          
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px;">
            <div style="color: #888; font-size: 11px; margin-bottom: 5px;">PLUGINS ENABLED</div>
            <div style="color: #9C27B0; font-size: 24px; font-weight: bold;">${stats.pluginsEnabled}</div>
          </div>
          
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px; grid-column: span 2;">
            <div style="color: #888; font-size: 11px; margin-bottom: 5px;">MEMORY USAGE</div>
            <div style="color: #fff; font-size: 18px; font-weight: bold;">${stats.memoryUsage}</div>
          </div>
        </div>
        
        <div style="margin-top: 30px;">
          <h4 style="color: #fff; margin-bottom: 10px;">Recent Network Activity</h4>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px;">
            ${this.renderNetworkChart()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render network activity chart
   */
  private renderNetworkChart(): string {
    const recent = this.networkRequests.slice(-20);
    if (recent.length === 0) {
      return '<div style="color: #888; text-align: center;">No recent activity</div>';
    }

    const maxDuration = Math.max(...recent.map(r => r.duration || 0));
    
    return recent.map(req => {
      const width = req.duration ? (req.duration / maxDuration) * 100 : 0;
      const color = req.error ? '#f44336' : req.status && req.status >= 400 ? '#FF9800' : '#4CAF50';
      
      return `
        <div style="margin-bottom: 5px;">
          <div style="display: flex; align-items: center; gap: 10px; font-size: 10px;">
            <span style="color: #888; min-width: 40px;">${req.method}</span>
            <div style="flex: 1; background: #1e1e1e; height: 20px; border-radius: 2px; overflow: hidden;">
              <div style="background: ${color}; height: 100%; width: ${width}%; transition: width 0.3s;"></div>
            </div>
            <span style="color: #888; min-width: 50px; text-align: right;">${req.duration || 0}ms</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render controls
   */
  private renderControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.style.cssText = `
      padding: 10px;
      background: #252526;
      border-top: 1px solid #3e3e42;
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    // Filter input
    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.placeholder = 'Filter...';
    filterInput.value = this.filterText;
    filterInput.style.cssText = `
      flex: 1;
      padding: 5px 10px;
      background: #3c3c3c;
      border: 1px solid #555;
      color: #d4d4d4;
      border-radius: 3px;
      font-size: 12px;
    `;
    filterInput.addEventListener('input', (e) => {
      this.filterText = (e.target as HTMLInputElement).value;
      this.refreshUI();
    });
    controls.appendChild(filterInput);

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ Clear';
    clearBtn.style.cssText = `
      padding: 5px 15px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    clearBtn.addEventListener('click', () => {
      if (this.activeTab === 'logs') {
        this.logs = [];
      } else if (this.activeTab === 'network') {
        this.networkRequests = [];
      }
      this.refreshUI();
    });
    controls.appendChild(clearBtn);

    // Auto-scroll toggle
    if (this.activeTab === 'logs') {
      const autoScrollBtn = document.createElement('button');
      autoScrollBtn.textContent = this.autoScroll ? '📌 Auto-scroll ON' : '📌 Auto-scroll OFF';
      autoScrollBtn.style.cssText = `
        padding: 5px 15px;
        background: ${this.autoScroll ? '#4CAF50' : '#888'};
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
      `;
      autoScrollBtn.addEventListener('click', () => {
        this.autoScroll = !this.autoScroll;
        this.refreshUI();
      });
      controls.appendChild(autoScrollBtn);
    }

    return controls;
  }

  /**
   * Show request details in modal
   */
  private showRequestDetails(request: NetworkRequest): void {
    this.core.ui.showToast('Request details: ' + request.url, 'info', 3000);
    // TODO: Implement modal dialog for full request details
  }

  /**
   * Refresh UI
   */
  private refreshUI(): void {
    if (!this.panel || !this.panel.isVisible()) return;

    const contentDiv = document.getElementById('devtools-content');
    if (contentDiv) {
      this.renderTabContent(contentDiv);
    }

    // Update panel content
    this.panel.setContent(this.renderContent());
  }

  /**
   * Add network request
   */
  private addNetworkRequest(request: NetworkRequest): void {
    this.networkRequests.push(request);
    if (this.networkRequests.length > this.maxRequests) {
      this.networkRequests.shift();
    }
    
    if (this.activeTab === 'network' && this.panel?.isVisible()) {
      this.refreshUI();
    }
  }

  /**
   * Add log entry
   */
  private addLog(log: LogEntry): void {
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    if (this.activeTab === 'logs' && this.panel?.isVisible()) {
      this.refreshUI();
    }
  }

  /**
   * Restore network interceptors
   */
  private restoreNetwork(): void {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    if (this.originalXHR) {
      (window as any).XMLHttpRequest = this.originalXHR;
    }
  }

  /**
   * Restore console interceptors
   */
  private restoreConsole(): void {
    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.info = this.originalConsole.info;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.debug = this.originalConsole.debug;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default new DevToolsPlugin();
