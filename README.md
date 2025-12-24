# Perplexity AI Userscripts

A modular, plugin-based framework for enhancing [Perplexity AI](https://www.perplexity.ai) with custom features and functionality.

🚀 **Architecture**: Plugin-based system with core framework  
🔧 **Built with**: TypeScript + Modern DOM API  
📦 **Compatible**: Tampermonkey, Violentmonkey (Chrome, Firefox, Safari)  
⚡ **Package Manager**: npm

---

## 🎯 Overview

This repository provides a powerful plugin system for extending Perplexity AI:

### Core Framework
- **UI Components**: Panels, modals, toasts, and form components
- **Messaging**: Event bus for inter-plugin communication
- **Storage**: Namespaced storage with localStorage/GM_storage support
- **Logger**: Structured logging for debugging
- **Browser API**: Unified API for userscript managers

### Plugin System
- **Modular**: Features implemented as independent plugins
- **Type-Safe**: Full TypeScript support with defined contracts
- **Lifecycle Management**: Load, enable, disable, and unload plugins
- **Configuration**: Plugin-specific settings with persistence
- **Extensible**: Easy to create custom plugins

---

## 📦 Plugins

| Plugin | Description | Status |
|--------|-------------|--------|
| `hello-world` | Simple example demonstrating plugin system | ✅ Complete |
| `devtools` | Developer tools with network monitoring, logs aggregation, plugin management, and performance metrics | ✅ Complete |
| `vitemonkey-built` | [Migration in progress] Template features | 🚧 Migrating |
| `just-written` | [Migration in progress] Example features | 🚧 Migrating |

---

## 🚀 Quick Start

### Installation

1. **Install Userscript Manager** (if not already installed):
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox)

2. **Install a Script** from `/dist/`:
   - Download `.user.js` file from releases or `/dist/` folder
   - Click to install in your userscript manager
   - Script is now active on perplexity.ai

### Example
```bash
# Visit and install dist/vitemonkey-built.user.js
# Script auto-updates from GitHub (if configured)
```

---

## 🔨 Development

### Prerequisites
```bash
Node.js 18+ (or Python 3.9+ with uv)
npm install -g npm@latest
```

### Setup
```bash
# Clone repository
git clone https://github.com/pv-udpv/perplexity-ai-userscripts.git
cd perplexity-ai-userscripts

# Install dependencies
npm install

# Build all scripts
npm run build

# Watch mode for development
npm run build:watch

# Run tests
npm run test

# Lint & format
npm run lint
npm run format
```

### Creating a New Plugin

See [Plugin Development Guide](./docs/plugin-development.md) for detailed instructions.

Quick start:
```bash
# Create plugin directory
mkdir -p src/plugins/my-plugin

# Create plugin file (src/plugins/my-plugin/index.ts)
# Implement Plugin interface
# Register in src/main.ts
```

A plugin typically includes:
- `index.ts` - Plugin implementation
- Plugin metadata (id, name, version, etc.)
- Lifecycle hooks (onLoad, onEnable, onDisable)
- Uses Core API for UI, storage, messaging

### Testing Locally
1. Run `npm run build`
2. Open `dist/script-name.user.js` in text editor
3. Copy content to new Tampermonkey script
4. Test on [perplexity.ai](https://www.perplexity.ai)
5. Use browser DevTools for debugging

---

## 📋 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before starting.

### Contribution Steps
1. Fork the repository
2. Create feature branch: `git checkout -b feat/awesome-feature`
3. Develop & test locally
4. Commit with conventional messages: `feat: add awesome feature`
5. Push & open PR with test results
6. Maintainer reviews & merges

### Code Style
- **TypeScript**: Strict mode, ESLint, Prettier
- **Testing**: Vitest, >80% coverage for new features
- **Documentation**: JSDoc comments, README per script
- **Commits**: Conventional format (feat, fix, docs, refactor)

See [RULES.md](./RULES.md) for complete guidelines.

---

## 📚 Documentation

- **[PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md)** - Architecture design and overview
- **[Plugin Development Guide](./docs/plugin-development.md)** - How to create plugins
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute
- **[RULES.md](./RULES.md)** - Project standards & conventions
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history (coming soon)

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|----------|
| **TypeScript 5+** | Type-safe plugin development |
| **Core Framework** | Plugin system, UI, messaging, storage |
| **Vitest** | Unit testing framework |
| **ESLint + Prettier** | Code quality & formatting |
| **Tampermonkey API** | Browser integration (storage, HTTP, etc.) |
| **Vite** | Build system for bundling |
| **GitHub Actions** | CI/CD automation (planned) |

---

## 🔐 Security & Privacy

- ✅ No hardcoded credentials
- ✅ No external CDN dependencies (bundled only)
- ✅ XSS prevention (textContent, not innerHTML)
- ✅ Respects Perplexity TOS
- ✅ Open source for community review

---

## 📞 Support

- 🐛 **Bug Reports**: [Open an issue](https://github.com/pv-udpv/perplexity-ai-userscripts/issues)
- 💡 **Feature Requests**: [Discussions](https://github.com/pv-udpv/perplexity-ai-userscripts/discussions)
- 💬 **Questions**: Ask in [Issues](https://github.com/pv-udpv/perplexity-ai-userscripts/issues) with `[question]` label

---

## 📄 License

MIT License – see [LICENSE](./LICENSE) for details.

Feel free to fork, modify, and distribute these userscripts.

---

## 🙏 Acknowledgments

- [Perplexity AI](https://www.perplexity.ai) – Amazing search & research platform
- [ViteMonkey](https://github.com/lisongedu/vite-plugin-monkey) – Modern userscript bundler
- [Tampermonkey](https://www.tampermonkey.net/) – Userscript manager
- Community contributors

---

## 🗺️ Roadmap

### Phase 1: Core Framework ✅
- [x] Plugin system architecture
- [x] Core API (UI, messaging, storage, logger)
- [x] Plugin manager with lifecycle
- [x] Basic UI components (panels, toasts)
- [x] Hello World example plugin

### Phase 2: Plugin Migration 🚧
- [ ] Migrate vitemonkey-built to plugin
- [ ] Migrate just-written to plugin
- [ ] Create settings panel plugin
- [ ] Build plugin manager UI

### Phase 3: Enhanced Features
- [ ] Modal dialog system
- [ ] Advanced UI components
- [ ] Plugin configuration UI
- [ ] Theme system
- [ ] XHR wrapper for API calls

### Phase 4: Distribution
- [ ] Build system for userscript generation
- [ ] Auto-update system via GitHub releases
- [ ] Plugin marketplace/directory
- [ ] GitHub Actions CI/CD pipeline
- [ ] Distribution via Greasy Fork

---

**Last updated**: December 2025  
**Author**: [pv-udpv](https://github.com/pv-udpv)
