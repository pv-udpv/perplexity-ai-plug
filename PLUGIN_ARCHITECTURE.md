# Plugin Architecture Design

## Overview

This document outlines the architectural transformation of the Perplexity AI Userscripts repository into a plugin-based system where the core provides fundamental infrastructure and features are added as plugins.

## Architecture Goals

1. **Separation of Concerns**: Core infrastructure separate from feature implementations
2. **Extensibility**: Easy to add new features without modifying core
3. **Modularity**: Plugins are self-contained and can be enabled/disabled independently
4. **Reusability**: Core services available to all plugins
5. **Maintainability**: Clear boundaries between core and plugins

## System Components

### Core (`src/core/`)

The core framework provides essential infrastructure:

#### 1. **Core Manager** (`core/manager.ts`)
- Initializes the core framework
- Manages plugin lifecycle
- Provides service registry
- Handles global events

#### 2. **UI Framework** (`core/ui/`)
- Panel system for creating side panels, modals, and overlays
- Component library (buttons, inputs, dropdowns, etc.)
- Theme system (light/dark mode support)
- Toast/notification system
- Layout utilities

#### 3. **Messaging System** (`core/messaging/`)
- Inter-plugin communication
- Event bus for plugin coordination
- Message passing between components
- Request/response patterns

#### 4. **Browser API Abstraction** (`core/browser/`)
- Unified API for Tampermonkey/Violentmonkey
- Storage management (already exists in `shared/storage.ts`)
- HTTP requests wrapper
- DOM utilities
- Permissions management

#### 5. **Configuration System** (`core/config/`)
- Global configuration management
- Plugin-specific configuration
- Settings UI generation
- Persistence layer

#### 6. **Logger** (`core/logger.ts`)
- Already exists in `shared/logger.ts`
- Move to core with enhancements

### Plugin System (`src/plugins/`)

#### Plugin Structure
```
plugins/
├── example-plugin/
│   ├── index.ts          # Plugin entry point
│   ├── manifest.json     # Plugin metadata
│   ├── components/       # UI components
│   ├── services/         # Business logic
│   └── styles/           # Plugin-specific styles
```

#### Plugin Interface
```typescript
interface Plugin {
  // Metadata
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  
  // Lifecycle hooks
  onLoad?(core: CoreAPI): Promise<void>;
  onEnable?(): Promise<void>;
  onDisable?(): Promise<void>;
  onUnload?(): Promise<void>;
  
  // Configuration
  config?: PluginConfig;
  
  // Dependencies
  dependencies?: string[];
  requiredCoreVersion?: string;
}
```

#### Plugin Lifecycle
1. **Load**: Plugin is loaded into memory, can access core APIs
2. **Enable**: Plugin activates its features (event listeners, UI, etc.)
3. **Disable**: Plugin deactivates but stays in memory
4. **Unload**: Plugin is removed from memory

### Core API (`src/core/api.ts`)

The Core API object provided to plugins:

```typescript
interface CoreAPI {
  // UI Services
  ui: {
    createPanel(config: PanelConfig): Panel;
    createModal(config: ModalConfig): Modal;
    showToast(message: string, type: ToastType): void;
    components: UIComponents;
  };
  
  // Messaging
  messaging: {
    emit(event: string, data?: any): void;
    on(event: string, handler: Function): () => void;
    request(target: string, data: any): Promise<any>;
  };
  
  // Storage
  storage: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    namespace(pluginId: string): StorageService;
  };
  
  // Configuration
  config: {
    get<T>(key: string): T;
    set<T>(key: string, value: T): void;
    registerSchema(schema: ConfigSchema): void;
  };
  
  // Logger
  logger: {
    create(namespace: string): Logger;
  };
  
  // Browser API
  browser: {
    xhr(request: XHRConfig): Promise<Response>;
    dom: DOMUtils;
  };
  
  // Plugin Management
  plugins: {
    get(id: string): Plugin | undefined;
    isEnabled(id: string): boolean;
    enable(id: string): Promise<void>;
    disable(id: string): Promise<void>;
  };
}
```

## Migration Strategy

### Phase 1: Core Infrastructure
1. Create `src/core/` directory structure
2. Move and enhance shared utilities to core
3. Implement Core Manager and API
4. Create basic UI framework components
5. Set up messaging system

### Phase 2: Plugin System
1. Define plugin interface and manifest schema
2. Implement plugin loader and registry
3. Create plugin lifecycle management
4. Build plugin configuration system

### Phase 3: Example Plugins
1. Convert `vitemonkey-built` to a plugin
2. Convert `just-written` to a plugin
3. Create a simple "Hello World" plugin example
4. Create a "Settings Panel" plugin example

### Phase 4: Documentation
1. Plugin development guide
2. Core API documentation
3. UI component library documentation
4. Migration guide for existing scripts

## Directory Structure (After Refactoring)

```
perplexity-ai-userscripts/
├── src/
│   ├── core/                    # Core framework
│   │   ├── manager.ts          # Core initialization & lifecycle
│   │   ├── api.ts              # Core API interface
│   │   ├── plugin-loader.ts    # Plugin loading system
│   │   ├── ui/                 # UI framework
│   │   │   ├── panel.ts
│   │   │   ├── modal.ts
│   │   │   ├── components/
│   │   │   └── theme.ts
│   │   ├── messaging/          # Event & messaging system
│   │   │   ├── event-bus.ts
│   │   │   └── message-bus.ts
│   │   ├── browser/            # Browser API abstraction
│   │   │   ├── storage.ts
│   │   │   ├── xhr.ts
│   │   │   └── dom.ts
│   │   └── config/             # Configuration system
│   │       ├── manager.ts
│   │       └── schema.ts
│   ├── plugins/                # Plugin implementations
│   │   ├── hello-world/       # Example: Simple plugin
│   │   ├── settings-panel/    # Example: Settings UI
│   │   ├── vitemonkey-built/  # Migrated from scripts/
│   │   └── just-written/      # Migrated from scripts/
│   └── main.ts                # Entry point - loads core & plugins
├── scripts/                    # Legacy (to be migrated)
│   └── shared/                # To be moved to core/
├── docs/                       # Documentation
│   ├── plugin-development.md
│   ├── core-api.md
│   └── ui-components.md
├── examples/                   # Plugin examples
│   ├── minimal-plugin/
│   └── full-featured-plugin/
└── dist/                      # Build output
    └── perplexity-ai-core.user.js
```

## Plugin Examples

### Minimal Plugin
```typescript
// plugins/hello-world/index.ts
import { Plugin, CoreAPI } from '@core/types';

export default class HelloWorldPlugin implements Plugin {
  id = 'hello-world';
  name = 'Hello World';
  version = '1.0.0';
  description = 'A simple example plugin';
  author = 'pv-udpv';
  
  private logger: Logger;
  
  async onLoad(core: CoreAPI): Promise<void> {
    this.logger = core.logger.create('hello-world');
    this.logger.info('Hello World plugin loaded!');
  }
  
  async onEnable(): Promise<void> {
    this.logger.info('Hello World plugin enabled!');
  }
  
  async onDisable(): Promise<void> {
    this.logger.info('Hello World plugin disabled!');
  }
}
```

### Full-Featured Plugin
```typescript
// plugins/example-feature/index.ts
import { Plugin, CoreAPI, PanelConfig } from '@core/types';

export default class ExamplePlugin implements Plugin {
  id = 'example-feature';
  name = 'Example Feature';
  version = '1.0.0';
  description = 'Demonstrates all plugin capabilities';
  author = 'pv-udpv';
  
  private core: CoreAPI;
  private logger: Logger;
  private panel: Panel;
  private storage: StorageService;
  
  async onLoad(core: CoreAPI): Promise<void> {
    this.core = core;
    this.logger = core.logger.create(this.id);
    this.storage = core.storage.namespace(this.id);
    
    // Register configuration schema
    core.config.registerSchema({
      pluginId: this.id,
      fields: {
        enabled: { type: 'boolean', default: true },
        threshold: { type: 'number', default: 5 },
      },
    });
  }
  
  async onEnable(): Promise<void> {
    this.logger.info('Enabling plugin...');
    
    // Create UI panel
    this.panel = this.core.ui.createPanel({
      title: 'Example Feature',
      position: 'right',
      width: 300,
      content: this.renderContent(),
    });
    
    // Listen to events
    this.core.messaging.on('perplexity:query-sent', this.handleQuery.bind(this));
    
    // Load saved data
    const data = await this.storage.get('user-data');
    if (data) {
      this.logger.debug('Loaded data:', data);
    }
  }
  
  async onDisable(): Promise<void> {
    this.logger.info('Disabling plugin...');
    if (this.panel) {
      this.panel.hide();
    }
  }
  
  private renderContent(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
      <h3>Example Feature</h3>
      <p>This is an example plugin demonstrating core capabilities.</p>
    `;
    return container;
  }
  
  private async handleQuery(data: any): Promise<void> {
    this.logger.debug('Query received:', data.query);
    // Plugin logic here
  }
}
```

## Benefits of Plugin Architecture

1. **Modularity**: Features can be developed, tested, and maintained independently
2. **Scalability**: Easy to add new features without growing the core codebase
3. **Community**: External developers can create plugins without modifying core
4. **Performance**: Users only load plugins they need
5. **Maintenance**: Clear separation makes bugs easier to isolate and fix
6. **Testing**: Plugins can be tested in isolation from core
7. **Flexibility**: Plugins can be enabled/disabled without reinstalling

## Technical Decisions

### Why This Architecture?

1. **Proven Pattern**: Similar to VS Code, Chrome extensions, WordPress
2. **Clean Separation**: Core provides services, plugins provide features
3. **Type Safety**: TypeScript interfaces ensure plugin compatibility
4. **Backward Compatible**: Existing code can be gradually migrated
5. **Future-Proof**: Easy to extend without breaking changes

### Build System

- Single userscript bundle containing core + enabled plugins
- Tree-shaking removes unused code
- Source maps for debugging
- Plugin hot-reloading in development mode (future enhancement)

### Configuration

- Core configuration stored in `pplx-core:config`
- Plugin configuration stored in `pplx-plugin:{id}:config`
- Settings UI automatically generated from schema
- Export/import configuration for backup/sharing

## Next Steps

1. Implement core framework structure
2. Create plugin loader and API
3. Build basic UI components
4. Migrate one existing script as proof-of-concept
5. Write documentation
6. Create example plugins
7. Test and refine
