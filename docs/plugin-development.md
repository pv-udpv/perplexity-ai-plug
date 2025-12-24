# Plugin Development Guide

## Overview

This guide will walk you through creating plugins for the Perplexity AI Userscripts platform. Plugins extend the core functionality with custom features while leveraging shared infrastructure for UI, storage, messaging, and more.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Structure](#plugin-structure)
3. [Plugin Lifecycle](#plugin-lifecycle)
4. [Core API Reference](#core-api-reference)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge
- Familiarity with browser extension/userscript development

### Creating a New Plugin

1. Create a new directory in `src/plugins/`:
```bash
mkdir -p src/plugins/my-plugin
```

2. Create an `index.ts` file with your plugin class:
```typescript
import type { Plugin, CoreAPI } from '../../core/types';

export class MyPlugin implements Plugin {
  id = 'my-plugin';  // Must be unique, kebab-case
  name = 'My Plugin';
  version = '1.0.0';
  description = 'Description of what my plugin does';
  author = 'Your Name';

  async onLoad(core: CoreAPI): Promise<void> {
    // Initialize plugin
  }

  async onEnable(): Promise<void> {
    // Activate features
  }

  async onDisable(): Promise<void> {
    // Deactivate features
  }
}

export default new MyPlugin();
```

3. Register your plugin in `src/main.ts`:
```typescript
import MyPlugin from './plugins/my-plugin';

// In the main() function:
await core.registerPlugin(MyPlugin);
```

## Plugin Structure

### Required Properties

```typescript
interface Plugin {
  id: string;              // Unique identifier (kebab-case)
  name: string;            // Display name
  version: string;         // Semantic version (e.g., "1.0.0")
  description: string;     // Brief description
  author: string;          // Author name or email
}
```

### Optional Properties

```typescript
interface Plugin {
  dependencies?: string[];      // Array of plugin IDs this plugin depends on
  requiredCoreVersion?: string; // Minimum core version required
  config?: PluginConfig;        // Configuration schema
}
```

### Lifecycle Hooks

```typescript
interface Plugin {
  onLoad?(core: CoreAPI): Promise<void> | void;
  onEnable?(): Promise<void> | void;
  onDisable?(): Promise<void> | void;
  onUnload?(): Promise<void> | void;
}
```

## Plugin Lifecycle

### 1. Load Phase

Called when the plugin is loaded into memory. Use this to:
- Store the CoreAPI reference
- Create loggers
- Initialize services
- Register configuration schemas

```typescript
async onLoad(core: CoreAPI): Promise<void> {
  this.core = core;
  this.logger = core.logger.create(this.id);
  this.storage = core.storage.namespace(this.id);
}
```

### 2. Enable Phase

Called when the plugin is activated. Use this to:
- Create UI elements
- Register event listeners
- Start background tasks
- Load saved data

```typescript
async onEnable(): Promise<void> {
  // Create panel
  this.panel = this.core.ui.createPanel({
    title: 'My Plugin',
    position: 'right',
    width: 300,
    content: '<div>Hello!</div>',
  });
  this.panel.show();

  // Listen to events
  this.unsubscribe = this.core.messaging.on('some-event', this.handleEvent);
}
```

### 3. Disable Phase

Called when the plugin is deactivated. Use this to:
- Hide/remove UI elements
- Remove event listeners
- Stop background tasks
- Save state

```typescript
async onDisable(): Promise<void> {
  if (this.panel) {
    this.panel.hide();
  }

  if (this.unsubscribe) {
    this.unsubscribe();
  }
}
```

### 4. Unload Phase

Called when the plugin is removed from memory. Use this to:
- Cleanup all resources
- Remove DOM elements
- Clear timers/intervals

```typescript
async onUnload(): Promise<void> {
  if (this.panel) {
    this.panel.destroy();
  }
}
```

## Core API Reference

### UI Service

#### Create Panel

```typescript
const panel = core.ui.createPanel({
  id: 'my-panel',          // Optional, auto-generated if not provided
  title: 'My Panel',
  position: 'right',       // 'left' or 'right'
  width: 300,              // Optional, default: 300
  content: element,        // HTMLElement or string
  collapsible: true,       // Optional, default: true
  draggable: false,        // Optional, default: false
  resizable: true,         // Optional, default: true
});

panel.show();
panel.hide();
panel.toggle();
panel.setContent('<div>New content</div>');
panel.setTitle('New Title');
```

#### Show Toast Notification

```typescript
core.ui.showToast(
  'Success message',
  'success',  // 'info' | 'success' | 'warning' | 'error'
  3000        // Duration in ms (optional, default: 3000)
);
```

#### UI Components

```typescript
// Button
const button = core.ui.components.button({
  label: 'Click Me',
  variant: 'primary',  // 'primary' | 'secondary' | 'danger'
  onClick: () => console.log('Clicked!'),
});

// Input
const input = core.ui.components.input({
  type: 'text',
  placeholder: 'Enter text...',
  value: 'Initial value',
  onChange: (value) => console.log('Value:', value),
});

// Select
const select = core.ui.components.select({
  options: [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ],
  value: '1',
  onChange: (value) => console.log('Selected:', value),
});
```

### Messaging Service

#### Emit Events

```typescript
core.messaging.emit('my-event', {
  data: 'some data',
  timestamp: Date.now(),
});
```

#### Subscribe to Events

```typescript
const unsubscribe = core.messaging.on('some-event', (data) => {
  console.log('Event received:', data);
});

// Later: unsubscribe()
```

#### One-time Subscription

```typescript
core.messaging.once('one-time-event', (data) => {
  console.log('This will only fire once');
});
```

#### Request/Response Pattern

```typescript
// Register handler
core.messaging.onRequest('get-data', async (params) => {
  return { result: 'some data' };
});

// Make request
const response = await core.messaging.request('get-data', { id: 123 });
```

### Storage Service

#### Namespaced Storage

```typescript
const storage = core.storage.namespace(this.id);

// Save data
await storage.set('key', { value: 'data' });

// Load data
const data = await storage.get<{ value: string }>('key');

// Remove data
await storage.remove('key');

// Check existence
const exists = await storage.has('key');

// List keys
const keys = await storage.keys();
```

#### Global Storage

```typescript
// Direct access (not namespaced)
await core.storage.set('global-key', 'value');
const value = await core.storage.get('global-key');
```

### Logger Service

```typescript
const logger = core.logger.create('my-plugin');

logger.debug('Debug message', { extra: 'data' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Browser Service

#### DOM Utilities

```typescript
// Safe query
const element = core.browser.dom.query<HTMLDivElement>('.my-selector');

// Query all
const elements = core.browser.dom.queryAll<HTMLButtonElement>('button');

// Wait for element
const element = await core.browser.dom.waitFor('.dynamic-element', 5000);

// Check viewport
if (core.browser.dom.isInViewport(element)) {
  console.log('Element is visible');
}

// Observe changes
const stopObserving = core.browser.dom.observe(
  document.body,
  (mutations) => {
    console.log('DOM changed:', mutations);
  },
  { childList: true, subtree: true }
);
```

### Plugin Manager

```typescript
// Get a plugin
const plugin = core.plugins.get('hello-world');

// Get all plugins
const allPlugins = core.plugins.getAll();

// Check if enabled
if (core.plugins.isEnabled('hello-world')) {
  console.log('Plugin is enabled');
}

// Enable/disable
await core.plugins.enable('hello-world');
await core.plugins.disable('hello-world');
```

## Best Practices

### 1. Always Use Namespaced Storage

```typescript
// Good
const storage = core.storage.namespace(this.id);
await storage.set('config', data);

// Avoid (unless intentional)
await core.storage.set('config', data);  // Global namespace
```

### 2. Clean Up Resources

Always remove listeners and DOM elements in `onDisable` and `onUnload`:

```typescript
async onDisable(): Promise<void> {
  // Remove listeners
  this.listeners.forEach(unsubscribe => unsubscribe());
  
  // Remove DOM elements
  this.elements.forEach(el => el.remove());
  
  // Clear intervals/timeouts
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
}
```

### 3. Handle Errors Gracefully

```typescript
async onEnable(): Promise<void> {
  try {
    await this.initializeFeature();
  } catch (error) {
    this.logger.error('Failed to initialize:', error);
    core.ui.showToast('Failed to enable plugin', 'error');
    throw error;  // Let plugin manager handle it
  }
}
```

### 4. Use Type Safety

```typescript
interface MyData {
  value: string;
  count: number;
}

const data = await storage.get<MyData>('my-data');
if (data) {
  console.log(data.value);  // TypeScript knows the type
}
```

### 5. Declare Dependencies

```typescript
export class MyPlugin implements Plugin {
  id = 'my-plugin';
  dependencies = ['required-plugin-id'];  // Ensures dependency is loaded first
  
  async onEnable(): Promise<void> {
    const dep = this.core.plugins.get('required-plugin-id');
    // Can safely use the dependency
  }
}
```

## Examples

### Example 1: Simple UI Plugin

```typescript
export class SimpleUIPlugin implements Plugin {
  id = 'simple-ui';
  name = 'Simple UI';
  version = '1.0.0';
  description = 'Adds a simple UI button';
  author = 'Your Name';

  private core!: CoreAPI;
  private button?: HTMLButtonElement;

  async onLoad(core: CoreAPI): Promise<void> {
    this.core = core;
  }

  async onEnable(): Promise<void> {
    this.button = document.createElement('button');
    this.button.textContent = 'Click Me';
    this.button.onclick = () => {
      this.core.ui.showToast('Button clicked!', 'success');
    };
    document.body.appendChild(this.button);
  }

  async onDisable(): Promise<void> {
    this.button?.remove();
  }
}
```

### Example 2: Data Storage Plugin

```typescript
export class DataStoragePlugin implements Plugin {
  id = 'data-storage';
  name = 'Data Storage';
  version = '1.0.0';
  description = 'Demonstrates data storage';
  author = 'Your Name';

  private core!: CoreAPI;
  private storage!: StorageService;
  private logger!: Logger;

  async onLoad(core: CoreAPI): Promise<void> {
    this.core = core;
    this.storage = core.storage.namespace(this.id);
    this.logger = core.logger.create(this.id);
  }

  async onEnable(): Promise<void> {
    // Load saved count
    let count = await this.storage.get<number>('click-count') || 0;

    const button = this.core.ui.components.button({
      label: `Clicked ${count} times`,
      onClick: async () => {
        count++;
        button.textContent = `Clicked ${count} times`;
        await this.storage.set('click-count', count);
        this.logger.info(`Click count: ${count}`);
      },
    });

    document.body.appendChild(button);
  }

  async onDisable(): Promise<void> {
    // Cleanup handled by framework
  }
}
```

### Example 3: Event-Driven Plugin

```typescript
export class EventDrivenPlugin implements Plugin {
  id = 'event-driven';
  name = 'Event Driven';
  version = '1.0.0';
  description = 'Responds to Perplexity events';
  author = 'Your Name';

  private core!: CoreAPI;
  private logger!: Logger;
  private unsubscribes: Array<() => void> = [];

  async onLoad(core: CoreAPI): Promise<void> {
    this.core = core;
    this.logger = core.logger.create(this.id);
  }

  async onEnable(): Promise<void> {
    // Listen to query events
    const unsub1 = this.core.messaging.on('perplexity:query-sent', (data) => {
      this.logger.info('Query:', data.query);
      this.core.ui.showToast(`Query: ${data.query}`, 'info', 2000);
    });

    // Listen to response events
    const unsub2 = this.core.messaging.on('perplexity:response-received', (data) => {
      this.logger.info('Response received');
    });

    this.unsubscribes.push(unsub1, unsub2);
  }

  async onDisable(): Promise<void> {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  }
}
```

## Testing Your Plugin

1. Build the project:
```bash
npm run build
```

2. Load the built userscript in Tampermonkey

3. Open Perplexity.ai and check the browser console for logs

4. Test your plugin's features

## Publishing Your Plugin

1. Ensure your plugin follows the structure above
2. Add comprehensive documentation
3. Test thoroughly
4. Submit a pull request to the main repository
5. Maintainers will review and merge

## Getting Help

- Check existing plugins for examples
- Read the Core API documentation
- Open an issue on GitHub with questions
- Join community discussions

## Resources

- [Core API Documentation](./core-api.md)
- [Architecture Overview](../PLUGIN_ARCHITECTURE.md)
- [Example Plugins](../src/plugins/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
