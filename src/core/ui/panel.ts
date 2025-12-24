/**
 * UI Panel System
 * 
 * Creates side panels for plugin UI
 */

import type { Panel as IPanel, PanelConfig } from '../types';
import { generateId } from '../browser/dom-utils';

export class Panel implements IPanel {
  id: string;
  private config: Required<PanelConfig>;
  private element: HTMLElement;
  private visible: boolean = false;
  private contentElement: HTMLElement;
  private headerElement: HTMLElement;

  constructor(config: PanelConfig) {
    this.id = config.id || generateId('panel');
    
    // Set defaults
    this.config = {
      id: this.id,
      title: config.title,
      position: config.position,
      width: config.width || 300,
      content: config.content,
      collapsible: config.collapsible ?? true,
      draggable: config.draggable ?? false,
      resizable: config.resizable ?? true,
    };

    this.element = this.createPanelElement();
    this.headerElement = this.element.querySelector('.pplx-panel-header')!;
    this.contentElement = this.element.querySelector('.pplx-panel-content')!;
    
    this.setContent(config.content);
    this.attachEventListeners();
  }

  private createPanelElement(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = `pplx-panel pplx-panel-${this.config.position}`;
    panel.id = this.id;
    panel.style.cssText = `
      position: fixed;
      top: 0;
      ${this.config.position}: 0;
      width: ${this.config.width}px;
      height: 100vh;
      background: var(--pplx-panel-bg, #ffffff);
      border-${this.config.position === 'left' ? 'right' : 'left'}: 1px solid var(--pplx-panel-border, #e0e0e0);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      display: none;
      flex-direction: column;
      transition: transform 0.3s ease;
      transform: translateX(${this.config.position === 'left' ? '-100%' : '100%'});
    `;

    const header = document.createElement('div');
    header.className = 'pplx-panel-header';
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid var(--pplx-panel-border, #e0e0e0);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--pplx-panel-header-bg, #f5f5f5);
    `;

    const title = document.createElement('h3');
    title.className = 'pplx-panel-title';
    title.textContent = this.config.title;
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--pplx-panel-text, #333333);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'pplx-panel-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--pplx-panel-text, #666666);
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(0,0,0,0.1)';
    closeBtn.onmouseleave = () => closeBtn.style.background = 'none';

    header.appendChild(title);
    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.className = 'pplx-panel-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `;

    panel.appendChild(header);
    panel.appendChild(content);

    return panel;
  }

  private attachEventListeners(): void {
    const closeBtn = this.headerElement.querySelector('.pplx-panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  show(): void {
    if (this.visible) return;

    // Inject into DOM if not already
    if (!document.body.contains(this.element)) {
      document.body.appendChild(this.element);
    }

    this.element.style.display = 'flex';
    
    // Trigger reflow for animation
    void this.element.offsetHeight;
    
    this.element.style.transform = 'translateX(0)';
    this.visible = true;
  }

  hide(): void {
    if (!this.visible) return;

    this.element.style.transform = `translateX(${this.config.position === 'left' ? '-100%' : '100%'})`;
    
    setTimeout(() => {
      this.element.style.display = 'none';
      this.visible = false;
    }, 300);
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  setContent(content: HTMLElement | string): void {
    if (typeof content === 'string') {
      this.contentElement.innerHTML = content;
    } else {
      this.contentElement.innerHTML = '';
      this.contentElement.appendChild(content);
    }
  }

  setTitle(title: string): void {
    const titleElement = this.headerElement.querySelector('.pplx-panel-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
    this.config.title = title;
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    this.hide();
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 300);
  }
}

/**
 * Create a panel
 */
export function createPanel(config: PanelConfig): Panel {
  return new Panel(config);
}
