/**
 * Plugin Manager
 * 
 * Manages plugin lifecycle, registration, and state
 */

import type {
  Plugin,
  PluginManager as IPluginManager,
  PluginEntry,
  PluginState,
  CoreAPI,
} from './types';
import { initializeLogger } from './logger';

const logger = initializeLogger('plugin-manager');

export class PluginManager implements IPluginManager {
  private plugins: Map<string, PluginEntry> = new Map();
  private coreAPI: CoreAPI;

  constructor(coreAPI: CoreAPI) {
    this.coreAPI = coreAPI;
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    logger.info(`Registering plugin: ${plugin.id}`);

    // Validate plugin
    this.validatePlugin(plugin);

    // Check dependencies
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(
            `Plugin ${plugin.id} depends on ${depId}, which is not registered`
          );
        }
      }
    }

    // Create entry
    const entry: PluginEntry = {
      plugin,
      state: 'unloaded',
      loadedAt: undefined,
      enabledAt: undefined,
    };

    this.plugins.set(plugin.id, entry);

    // Load the plugin
    await this.load(plugin.id);

    logger.info(`Plugin registered: ${plugin.id}`);
  }

  /**
   * Unregister a plugin
   */
  async unregister(id: string): Promise<void> {
    const entry = this.plugins.get(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }

    logger.info(`Unregistering plugin: ${id}`);

    // Disable if enabled
    if (entry.state === 'enabled') {
      await this.disable(id);
    }

    // Unload
    if (entry.state === 'loaded' || entry.state === 'disabled') {
      await this.unload(id);
    }

    this.plugins.delete(id);
    logger.info(`Plugin unregistered: ${id}`);
  }

  /**
   * Load a plugin
   */
  private async load(id: string): Promise<void> {
    const entry = this.plugins.get(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }

    if (entry.state !== 'unloaded') {
      logger.warn(`Plugin ${id} is already loaded`);
      return;
    }

    try {
      logger.debug(`Loading plugin: ${id}`);
      
      if (entry.plugin.onLoad) {
        await entry.plugin.onLoad(this.coreAPI);
      }

      entry.state = 'loaded';
      entry.loadedAt = Date.now();
      
      logger.info(`Plugin loaded: ${id}`);
    } catch (error) {
      entry.state = 'error';
      entry.error = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to load plugin ${id}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  private async unload(id: string): Promise<void> {
    const entry = this.plugins.get(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }

    if (entry.state === 'unloaded') {
      logger.warn(`Plugin ${id} is already unloaded`);
      return;
    }

    try {
      logger.debug(`Unloading plugin: ${id}`);
      
      if (entry.plugin.onUnload) {
        await entry.plugin.onUnload();
      }

      entry.state = 'unloaded';
      entry.loadedAt = undefined;
      entry.enabledAt = undefined;
      
      logger.info(`Plugin unloaded: ${id}`);
    } catch (error) {
      entry.state = 'error';
      entry.error = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to unload plugin ${id}:`, error);
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  async enable(id: string): Promise<void> {
    const entry = this.plugins.get(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }

    if (entry.state === 'enabled') {
      logger.warn(`Plugin ${id} is already enabled`);
      return;
    }

    if (entry.state !== 'loaded' && entry.state !== 'disabled') {
      throw new Error(`Plugin ${id} must be loaded before it can be enabled`);
    }

    try {
      logger.debug(`Enabling plugin: ${id}`);
      
      if (entry.plugin.onEnable) {
        await entry.plugin.onEnable();
      }

      entry.state = 'enabled';
      entry.enabledAt = Date.now();
      
      // Persist enabled state
      await this.coreAPI.storage.set(`plugin:${id}:enabled`, true);
      
      logger.info(`Plugin enabled: ${id}`);
      
      // Emit event
      this.coreAPI.messaging.emit('core:plugin:enabled', { pluginId: id });
    } catch (error) {
      entry.state = 'error';
      entry.error = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to enable plugin ${id}:`, error);
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  async disable(id: string): Promise<void> {
    const entry = this.plugins.get(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }

    if (entry.state === 'disabled') {
      logger.warn(`Plugin ${id} is already disabled`);
      return;
    }

    if (entry.state !== 'enabled') {
      throw new Error(`Plugin ${id} is not enabled`);
    }

    try {
      logger.debug(`Disabling plugin: ${id}`);
      
      if (entry.plugin.onDisable) {
        await entry.plugin.onDisable();
      }

      entry.state = 'disabled';
      entry.enabledAt = undefined;
      
      // Persist disabled state
      await this.coreAPI.storage.set(`plugin:${id}:enabled`, false);
      
      logger.info(`Plugin disabled: ${id}`);
      
      // Emit event
      this.coreAPI.messaging.emit('core:plugin:disabled', { pluginId: id });
    } catch (error) {
      entry.state = 'error';
      entry.error = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to disable plugin ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a plugin by ID
   */
  get(id: string): Plugin | undefined {
    return this.plugins.get(id)?.plugin;
  }

  /**
   * Get all plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values()).map((entry) => entry.plugin);
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(id: string): boolean {
    const entry = this.plugins.get(id);
    return entry?.state === 'enabled';
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(id: string): boolean {
    const entry = this.plugins.get(id);
    return entry?.state === 'loaded' || entry?.state === 'enabled' || entry?.state === 'disabled';
  }

  /**
   * Get plugin state
   */
  getState(id: string): PluginState | undefined {
    return this.plugins.get(id)?.state;
  }

  /**
   * Get plugin entry (internal)
   */
  getEntry(id: string): PluginEntry | undefined {
    return this.plugins.get(id);
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new Error('Plugin must have a valid id');
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error(`Plugin ${plugin.id} must have a valid name`);
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error(`Plugin ${plugin.id} must have a valid version`);
    }

    if (!plugin.description || typeof plugin.description !== 'string') {
      throw new Error(`Plugin ${plugin.id} must have a valid description`);
    }

    if (!plugin.author || typeof plugin.author !== 'string') {
      throw new Error(`Plugin ${plugin.id} must have a valid author`);
    }

    // Validate ID format (kebab-case)
    if (!/^[a-z][a-z0-9-]*$/.test(plugin.id)) {
      throw new Error(
        `Plugin ID ${plugin.id} must be in kebab-case (lowercase letters, numbers, and hyphens)`
      );
    }

    // Validate version format (semver)
    if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
      throw new Error(`Plugin ${plugin.id} version must follow semver format (e.g., 1.0.0)`);
    }
  }

  /**
   * Auto-enable plugins that were previously enabled
   */
  async autoEnablePlugins(): Promise<void> {
    logger.info('Auto-enabling previously enabled plugins...');
    
    for (const [id, entry] of this.plugins.entries()) {
      if (entry.state === 'loaded') {
        const wasEnabled = await this.coreAPI.storage.get<boolean>(`plugin:${id}:enabled`);
        if (wasEnabled === true) {
          try {
            await this.enable(id);
          } catch (error) {
            logger.error(`Failed to auto-enable plugin ${id}:`, error);
          }
        }
      }
    }
  }
}
