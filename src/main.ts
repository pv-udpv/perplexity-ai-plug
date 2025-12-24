/**
 * Main Entry Point for Perplexity AI Core + Plugins
 * 
 * This is the entry point that loads the core framework and all plugins.
 */

import { createCore } from './core/manager';
import type { Plugin } from './core/types';

// Import plugins
// NOTE: In a real setup, this would dynamically import from src/plugins/
// For now, we'll demonstrate with a simple structure

/**
 * Initialize the application
 */
async function main() {
  try {
    // Create core instance
    const core = createCore();
    
    // Initialize core
    await core.initialize();
    
    // Get CoreAPI for plugins
    const coreAPI = core.getAPI();
    
    console.log('[Perplexity AI] Core initialized, version:', coreAPI.version);
    
    // Register plugins here
    // Example: await core.registerPlugin(HelloWorldPlugin);
    // Example: await core.registerPlugin(SettingsPanelPlugin);
    
    // Plugins will be auto-enabled if they were previously enabled
    
  } catch (error) {
    console.error('[Perplexity AI] Failed to initialize:', error);
  }
}

// Run when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// Export core types for plugin development
export type { Plugin, CoreAPI } from './core/types';
