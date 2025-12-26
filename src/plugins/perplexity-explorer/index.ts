/**
 * Perplexity AI Explorer Plugin
 * 
 * Automatically explores and maps the Perplexity AI application:
 * - Discovers DOM structure and key elements
 * - Identifies interactive components (buttons, inputs, forms)
 * - Maps event listeners and handlers
 * - Detects API endpoints and data flows
 * - Analyzes page state and updates
 * - Finds accessibility attributes and ARIA labels
 */

import type { Plugin, CoreAPI, Logger, Panel } from '../../core/types';

interface DOMElement {
  tag: string;
  id?: string;
  classes: string[];
  attributes: Record<string, string>;
  text?: string;
  children: number;
  events: string[];
  role?: string;
  ariaLabel?: string;
}

interface InteractiveElement {
  type: 'button' | 'input' | 'link' | 'form' | 'textarea' | 'select';
  selector: string;
  label?: string;
  placeholder?: string;
  value?: string;
  events: string[];
}

interface APIEndpoint {
  url: string;
  method: string;
  count: number;
  lastSeen: number;
}

interface ExplorationResult {
  timestamp: number;
  domElements: DOMElement[];
  interactiveElements: InteractiveElement[];
  apiEndpoints: APIEndpoint[];
  scripts: string[];
  stylesheets: string[];
  state: Record<string, any>;
}

export class PerplexityExplorerPlugin implements Plugin {
  id = 'perplexity-explorer';
  name = 'Perplexity Explorer';
  version = '1.0.0';
  description = 'Explores and maps the Perplexity AI application structure, components, and APIs';
  author = 'pv-udpv';

  private core!: CoreAPI;
  private logger!: Logger;
  private panel?: Panel;
  
  private explorationData: ExplorationResult[] = [];
  private apiEndpoints: Map<string, APIEndpoint> = new Map();
  private observedElements: Set<Element> = new Set();
  
  private mutationObserver?: MutationObserver;
  private performanceObserver?: PerformanceObserver;
  private isExploring = false;
  private autoExplore = true;

  async onLoad(core: CoreAPI): Promise<void> {
    this.core = core;
    this.logger = core.logger.create(this.id);
    this.logger.info('Perplexity Explorer plugin loaded');
  }

  async onEnable(): Promise<void> {
    this.logger.info('Perplexity Explorer plugin enabled');

    // Start exploration
    this.startExploration();

    // Create explorer panel
    this.createExplorerPanel();

    // Show welcome message
    this.core.ui.showToast('Perplexity Explorer enabled - Press Ctrl+Shift+E to view', 'info', 4000);
  }

  async onDisable(): Promise<void> {
    this.logger.info('Perplexity Explorer plugin disabled');
    
    // Stop exploration
    this.stopExploration();
    
    // Hide panel
    if (this.panel) {
      this.panel.hide();
    }
  }

  async onUnload(): Promise<void> {
    this.logger.info('Perplexity Explorer plugin unloaded');
    
    this.stopExploration();
    
    if (this.panel) {
      this.panel.destroy();
    }
  }

  /**
   * Start exploration
   */
  private startExploration(): void {
    if (this.isExploring) return;
    
    this.isExploring = true;
    this.logger.info('Starting exploration...');

    // Initial exploration
    this.exploreApplication();

    // Set up mutation observer to detect DOM changes
    this.setupMutationObserver();

    // Set up performance observer for network requests
    this.setupPerformanceObserver();

    // Periodic exploration
    if (this.autoExplore) {
      setInterval(() => {
        if (this.isExploring) {
          this.exploreApplication();
        }
      }, 5000); // Re-explore every 5 seconds
    }
  }

  /**
   * Stop exploration
   */
  private stopExploration(): void {
    this.isExploring = false;
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  /**
   * Explore the application
   */
  private exploreApplication(): void {
    const result: ExplorationResult = {
      timestamp: Date.now(),
      domElements: this.exploreDOMStructure(),
      interactiveElements: this.findInteractiveElements(),
      apiEndpoints: Array.from(this.apiEndpoints.values()),
      scripts: this.findScripts(),
      stylesheets: this.findStylesheets(),
      state: this.extractState(),
    };

    this.explorationData.push(result);
    
    // Keep only last 10 explorations
    if (this.explorationData.length > 10) {
      this.explorationData.shift();
    }

    this.logger.debug('Exploration complete', {
      domElements: result.domElements.length,
      interactive: result.interactiveElements.length,
      apis: result.apiEndpoints.length,
    });

    // Refresh UI if panel is visible
    if (this.panel?.isVisible()) {
      this.refreshUI();
    }
  }

  /**
   * Explore DOM structure
   */
  private exploreDOMStructure(): DOMElement[] {
    const elements: DOMElement[] = [];
    const maxDepth = 5;

    const explore = (element: Element, depth: number = 0) => {
      if (depth > maxDepth) return;
      if (this.observedElements.has(element)) return;
      
      this.observedElements.add(element);

      const domElement: DOMElement = {
        tag: element.tagName.toLowerCase(),
        id: element.id || undefined,
        classes: Array.from(element.classList),
        attributes: {},
        children: element.children.length,
        events: this.getEventListeners(element),
        role: element.getAttribute('role') || undefined,
        ariaLabel: element.getAttribute('aria-label') || undefined,
      };

      // Get important attributes
      ['data-testid', 'data-component', 'name', 'type', 'href'].forEach(attr => {
        const value = element.getAttribute(attr);
        if (value) {
          domElement.attributes[attr] = value;
        }
      });

      // Get text content (limited)
      if (element.children.length === 0) {
        const text = element.textContent?.trim();
        if (text && text.length < 100) {
          domElement.text = text;
        }
      }

      elements.push(domElement);

      // Explore children
      for (const child of Array.from(element.children)) {
        explore(child, depth + 1);
      }
    };

    // Start from main content areas
    const rootSelectors = [
      'main',
      '[role="main"]',
      '#__next',
      '.app',
      'body > div:first-child',
    ];

    for (const selector of rootSelectors) {
      const root = document.querySelector(selector);
      if (root) {
        explore(root);
        break;
      }
    }

    return elements;
  }

  /**
   * Find interactive elements
   */
  private findInteractiveElements(): InteractiveElement[] {
    const elements: InteractiveElement[] = [];

    // Buttons
    document.querySelectorAll('button, [role="button"]').forEach((el) => {
      elements.push({
        type: 'button',
        selector: this.generateSelector(el),
        label: el.textContent?.trim() || el.getAttribute('aria-label') || undefined,
        events: this.getEventListeners(el),
      });
    });

    // Inputs
    document.querySelectorAll('input').forEach((el: HTMLInputElement) => {
      elements.push({
        type: 'input',
        selector: this.generateSelector(el),
        placeholder: el.placeholder || undefined,
        value: el.value || undefined,
        events: this.getEventListeners(el),
      });
    });

    // Textareas
    document.querySelectorAll('textarea').forEach((el: HTMLTextAreaElement) => {
      elements.push({
        type: 'textarea',
        selector: this.generateSelector(el),
        placeholder: el.placeholder || undefined,
        value: el.value || undefined,
        events: this.getEventListeners(el),
      });
    });

    // Select dropdowns
    document.querySelectorAll('select').forEach((el: HTMLSelectElement) => {
      elements.push({
        type: 'select',
        selector: this.generateSelector(el),
        value: el.value || undefined,
        events: this.getEventListeners(el),
      });
    });

    // Links
    document.querySelectorAll('a[href]').forEach((el) => {
      elements.push({
        type: 'link',
        selector: this.generateSelector(el),
        label: el.textContent?.trim() || undefined,
        events: this.getEventListeners(el),
      });
    });

    // Forms
    document.querySelectorAll('form').forEach((el) => {
      elements.push({
        type: 'form',
        selector: this.generateSelector(el),
        events: this.getEventListeners(el),
      });
    });

    return elements;
  }

  /**
   * Find scripts
   */
  private findScripts(): string[] {
    const scripts: string[] = [];
    
    document.querySelectorAll('script[src]').forEach((script: HTMLScriptElement) => {
      if (script.src) {
        scripts.push(script.src);
      }
    });

    return scripts;
  }

  /**
   * Find stylesheets
   */
  private findStylesheets(): string[] {
    const stylesheets: string[] = [];
    
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link: HTMLLinkElement) => {
      if (link.href) {
        stylesheets.push(link.href);
      }
    });

    return stylesheets;
  }

  /**
   * Extract application state
   */
  private extractState(): Record<string, any> {
    const state: Record<string, any> = {};

    // Try to find React/Vue/Angular state
    try {
      // React Fiber
      const rootElement = document.querySelector('#__next') || document.querySelector('[data-reactroot]');
      if (rootElement) {
        const fiberKey = Object.keys(rootElement).find(key => key.startsWith('__react'));
        if (fiberKey) {
          state.react = 'detected';
        }
      }

      // Local storage
      state.localStorage = Object.keys(localStorage).length;

      // Session storage
      state.sessionStorage = Object.keys(sessionStorage).length;

      // Cookies
      state.cookies = document.cookie.split(';').length;

      // URL state
      state.url = {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      };

    } catch (error) {
      this.logger.warn('Error extracting state:', error);
    }

    return state;
  }

  /**
   * Get event listeners for an element
   */
  private getEventListeners(element: Element): string[] {
    const events: string[] = [];
    
    // Check for common event attributes
    const eventAttrs = ['onclick', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onfocus', 'onblur'];
    eventAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        events.push(attr.substring(2)); // Remove 'on' prefix
      }
    });

    return events;
  }

  /**
   * Generate CSS selector for element
   */
  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = Array.from(current.classList)
          .filter(c => c && !c.startsWith('_')) // Filter out dynamic classes
          .slice(0, 2) // Take first 2 classes
          .join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;

      if (path.length > 5) break; // Limit depth
    }

    return path.join(' > ');
  }

  /**
   * Setup mutation observer
   */
  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      let hasSignificantChange = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          hasSignificantChange = true;
          break;
        }
      }

      if (hasSignificantChange && this.autoExplore) {
        this.logger.debug('DOM changed, re-exploring...');
        setTimeout(() => this.exploreApplication(), 1000);
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Setup performance observer
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            const url = resourceEntry.name;

            // Track API endpoints (excluding static resources)
            if (url.includes('/api/') || url.includes('.json') || url.includes('graphql')) {
              const method = 'GET'; // Can't detect method from PerformanceResourceTiming
              const key = `${method}:${url}`;

              const existing = this.apiEndpoints.get(key);
              if (existing) {
                existing.count++;
                existing.lastSeen = Date.now();
              } else {
                this.apiEndpoints.set(key, {
                  url,
                  method,
                  count: 1,
                  lastSeen: Date.now(),
                });
              }
            }
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      this.logger.warn('Could not setup PerformanceObserver:', error);
    }
  }

  /**
   * Create explorer panel
   */
  private createExplorerPanel(): void {
    this.panel = this.core.ui.createPanel({
      title: 'Perplexity Explorer',
      position: 'right',
      width: 700,
      content: this.renderContent(),
    });

    // Keyboard shortcut: Ctrl+Shift+E
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this.panel?.toggle();
      }
    });
  }

  /**
   * Render content
   */
  private renderContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'explorer-container';
    container.style.cssText = `
      height: 100%;
      display: flex;
      flex-direction: column;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
      background: #1e1e1e;
      color: #d4d4d4;
    `;

    // Header with controls
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 15px;
      background: #252526;
      border-bottom: 1px solid #3e3e42;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    header.innerHTML = `
      <div>
        <h3 style="margin: 0; color: #fff; font-size: 16px;">🔍 Perplexity Explorer</h3>
        <p style="margin: 5px 0 0 0; color: #888; font-size: 11px;">
          Status: ${this.isExploring ? '🟢 Exploring' : '🔴 Stopped'} | 
          Last Update: ${this.explorationData.length > 0 ? new Date(this.explorationData[this.explorationData.length - 1].timestamp).toLocaleTimeString() : 'Never'}
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="explore-now" style="
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        ">🔄 Explore Now</button>
        <button id="toggle-auto" style="
          padding: 8px 16px;
          background: ${this.autoExplore ? '#2196F3' : '#888'};
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        ">${this.autoExplore ? '⏸️ Pause Auto' : '▶️ Resume Auto'}</button>
      </div>
    `;

    container.appendChild(header);

    // Content area
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 15px;
    `;
    content.id = 'explorer-content';

    this.renderExplorationResults(content);
    container.appendChild(content);

    // Add event listeners after DOM insertion
    setTimeout(() => {
      document.getElementById('explore-now')?.addEventListener('click', () => {
        this.exploreApplication();
        this.core.ui.showToast('Exploring...', 'info', 1000);
      });

      document.getElementById('toggle-auto')?.addEventListener('click', () => {
        this.autoExplore = !this.autoExplore;
        this.refreshUI();
        this.core.ui.showToast(`Auto-explore ${this.autoExplore ? 'enabled' : 'disabled'}`, 'info');
      });
    }, 0);

    return container;
  }

  /**
   * Render exploration results
   */
  private renderExplorationResults(container: HTMLElement): void {
    if (this.explorationData.length === 0) {
      container.innerHTML = '<div style="color: #888; text-align: center; padding: 40px;">No exploration data yet. Click "Explore Now" to start.</div>';
      return;
    }

    const latest = this.explorationData[this.explorationData.length - 1];

    container.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h4 style="color: #4CAF50; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
          📊 Overview
        </h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px; border-left: 3px solid #4CAF50;">
            <div style="color: #888; font-size: 11px; margin-bottom: 5px;">DOM ELEMENTS</div>
            <div style="color: #4CAF50; font-size: 24px; font-weight: bold;">${latest.domElements.length}</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px; border-left: 3px solid #2196F3;">
            <div style="color: #888; font-size: 11px; margin-bottom: 5px;">INTERACTIVE</div>
            <div style="color: #2196F3; font-size: 24px; font-weight: bold;">${latest.interactiveElements.length}</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px; border-left: 3px solid #FF9800;">
            <div style="color: #888; font-size: 11px; margin-bottom: 5px;">API ENDPOINTS</div>
            <div style="color: #FF9800; font-size: 24px; font-weight: bold;">${latest.apiEndpoints.length}</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h4 style="color: #2196F3; margin-bottom: 15px;">🎮 Interactive Elements</h4>
        <div style="background: #2a2a2a; padding: 15px; border-radius: 4px; max-height: 300px; overflow-y: auto;">
          ${this.renderInteractiveElements(latest.interactiveElements)}
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h4 style="color: #FF9800; margin-bottom: 15px;">🌐 API Endpoints</h4>
        <div style="background: #2a2a2a; padding: 15px; border-radius: 4px; max-height: 250px; overflow-y: auto;">
          ${this.renderAPIEndpoints(latest.apiEndpoints)}
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h4 style="color: #9C27B0; margin-bottom: 15px;">📦 Application State</h4>
        <div style="background: #2a2a2a; padding: 15px; border-radius: 4px;">
          <pre style="margin: 0; color: #d4d4d4; font-size: 11px; white-space: pre-wrap;">${JSON.stringify(latest.state, null, 2)}</pre>
        </div>
      </div>

      <div>
        <h4 style="color: #888; margin-bottom: 15px;">📚 Resources</h4>
        <div style="background: #2a2a2a; padding: 15px; border-radius: 4px;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #888;">Scripts:</strong> ${latest.scripts.length}
          </div>
          <div>
            <strong style="color: #888;">Stylesheets:</strong> ${latest.stylesheets.length}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render interactive elements
   */
  private renderInteractiveElements(elements: InteractiveElement[]): string {
    if (elements.length === 0) {
      return '<div style="color: #888;">No interactive elements found.</div>';
    }

    const grouped = elements.reduce((acc, el) => {
      if (!acc[el.type]) acc[el.type] = [];
      acc[el.type].push(el);
      return acc;
    }, {} as Record<string, InteractiveElement[]>);

    return Object.entries(grouped).map(([type, items]) => `
      <div style="margin-bottom: 15px;">
        <div style="color: #2196F3; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; font-size: 11px;">
          ${type}s (${items.length})
        </div>
        ${items.slice(0, 10).map(item => `
          <div style="
            padding: 8px;
            background: #1e1e1e;
            margin-bottom: 5px;
            border-radius: 3px;
            font-size: 11px;
          ">
            <div style="color: #d4d4d4; margin-bottom: 3px;">
              ${item.label || item.placeholder || item.selector}
            </div>
            <div style="color: #888; font-size: 10px;">
              ${item.selector}
            </div>
          </div>
        `).join('')}
        ${items.length > 10 ? `<div style="color: #888; font-size: 10px; margin-top: 5px;">...and ${items.length - 10} more</div>` : ''}
      </div>
    `).join('');
  }

  /**
   * Render API endpoints
   */
  private renderAPIEndpoints(endpoints: APIEndpoint[]): string {
    if (endpoints.length === 0) {
      return '<div style="color: #888;">No API endpoints detected yet.</div>';
    }

    return endpoints.map(endpoint => `
      <div style="
        padding: 10px;
        background: #1e1e1e;
        margin-bottom: 8px;
        border-radius: 3px;
        border-left: 3px solid #FF9800;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="color: #FF9800; font-weight: bold; font-size: 11px;">${endpoint.method}</span>
          <span style="color: #888; font-size: 10px;">
            Called ${endpoint.count} time${endpoint.count > 1 ? 's' : ''}
          </span>
        </div>
        <div style="color: #d4d4d4; font-size: 11px; word-break: break-all;">
          ${endpoint.url}
        </div>
      </div>
    `).join('');
  }

  /**
   * Refresh UI
   */
  private refreshUI(): void {
    if (!this.panel || !this.panel.isVisible()) return;
    this.panel.setContent(this.renderContent());
  }
}

export default new PerplexityExplorerPlugin();
