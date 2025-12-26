/**
 * Hello World Plugin
 * 
 * A minimal example plugin demonstrating the plugin system basics.
 */

import type { Plugin, CoreAPI, Logger } from '../../core/types';

export class HelloWorldPlugin implements Plugin {
  id = 'hello-world';
  name = 'Hello World';
  version = '1.0.0';
  description = 'A simple example plugin that demonstrates the plugin system';
  author = 'pv-udpv';

  private core!: CoreAPI;
  private logger!: Logger;
  private unsubscribe?: () => void;

  async onLoad(core: CoreAPI): Promise<void> {
    this.core = core;
    this.logger = core.logger.create(this.id);
    this.logger.info('Hello World plugin loaded');
  }

  async onEnable(): Promise<void> {
    this.logger.info('Hello World plugin enabled');
    this.core.ui.showToast('Hello from the plugin system! 👋', 'success');
    
    this.unsubscribe = this.core.messaging.on('perplexity:query-sent', (data) => {
      this.logger.debug('Query detected:', data.query);
    });

    this.addHelloButton();
  }

  async onDisable(): Promise<void> {
    this.logger.info('Hello World plugin disabled');
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    const button = document.getElementById('hello-world-btn');
    if (button) {
      button.remove();
    }
  }

  async onUnload(): Promise<void> {
    this.logger.info('Hello World plugin unloaded');
  }

  private addHelloButton(): void {
    const button = document.createElement('button');
    button.id = 'hello-world-btn';
    button.textContent = '👋 Hello Plugin';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      z-index: 10000;
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    button.addEventListener('click', () => {
      this.handleButtonClick();
    });

    document.body.appendChild(button);
    this.logger.debug('Hello button added to page');
  }

  private handleButtonClick(): void {
    const messages = [
      'Hello from the plugin! 🎉',
      'Plugin system is working! ✨',
      'This is a test message! 🚀',
      'Plugins are awesome! 💫',
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    this.core.ui.showToast(randomMessage, 'info', 2000);
    this.logger.info('Button clicked');
  }
}

export default new HelloWorldPlugin();
