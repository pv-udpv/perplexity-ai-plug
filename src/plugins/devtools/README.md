# DevTools Plugin

## Overview

The DevTools plugin provides low-level debugging and monitoring capabilities for the Perplexity AI plugin system. It intercepts network traffic, aggregates logs from all sources, monitors plugin states, and displays performance metrics.

## Features

### 1. **Logs Tab** 📋
- Intercepts all console output (log, info, warn, error, debug)
- Displays with timestamp, level, source, and message
- Color-coded by log level:
  - 🟢 INFO (green)
  - 🟡 WARN (orange)
  - 🔴 ERROR (red)
  - ⚪ DEBUG (gray)
- Filter logs by text
- Auto-scroll option
- Clear logs button

### 2. **Network Tab** 🌐
- Intercepts all `fetch` and `XMLHttpRequest` calls
- Displays:
  - Timestamp
  - HTTP method
  - Status code
  - Duration in milliseconds
  - Full URL
  - Error messages (if any)
- Click on request to see details
- Filter by URL or method
- Clear requests button

### 3. **Plugins Tab** 🔌
- Lists all registered plugins
- Shows plugin metadata:
  - Name and version
  - Description
  - Author
  - ID
  - Dependencies
- Visual status indicator (✅ enabled, ⭕ disabled)
- Enable/disable plugins with one click
- Real-time state updates

### 4. **Performance Tab** ⚡
- Real-time metrics:
  - Total logs count
  - Total network requests
  - Plugins loaded/enabled count
  - Memory usage (if available)
- Network activity chart
  - Visual timeline of recent requests
  - Color-coded by status (success/error/warning)
  - Duration bars for each request

## Usage

### Opening DevTools

**Method 1: Keyboard Shortcut**
```
Ctrl + Shift + D
```

**Method 2: Enable Plugin**
1. Open plugin manager
2. Find "DevTools" in the list
3. Click "Enable"

### Filtering Data

Use the filter input at the bottom to filter:
- **Logs**: Filter by message or source
- **Network**: Filter by URL or method

### Clearing Data

Click the 🗑️ Clear button to:
- Clear all logs (in Logs tab)
- Clear all network requests (in Network tab)

### Auto-scroll

In the Logs tab, toggle auto-scroll with the 📌 button:
- **ON**: Automatically scroll to newest logs
- **OFF**: Stay at current scroll position

## Technical Details

### Network Interception

The plugin intercepts network traffic by:
1. Wrapping `window.fetch` with a custom implementation
2. Replacing `XMLHttpRequest` constructor with a proxied version
3. Tracking request lifecycle (start, end, error)
4. Storing request metadata (URL, method, status, timing, body, response)

### Console Interception

The plugin intercepts console output by:
1. Wrapping console methods (log, info, warn, error, debug)
2. Extracting source information from stack traces
3. Preserving original console behavior (still logs to browser console)
4. Storing log entries with metadata

### Plugin Monitoring

The plugin monitors plugin lifecycle by:
1. Listening to core events (`core:plugin:enabled`, `core:plugin:disabled`)
2. Querying plugin manager for current state
3. Providing UI controls for enabling/disabling plugins

### Performance Metrics

The plugin collects performance data:
1. Counting total logs and requests
2. Tracking plugin states
3. Reading memory usage from `performance.memory` API (Chrome)
4. Displaying recent network activity as a visual chart

## Architecture

```typescript
DevToolsPlugin
├── Network Interception
│   ├── fetch wrapper
│   └── XMLHttpRequest proxy
├── Console Interception
│   └── console.* wrappers
├── Event Listeners
│   └── Core events (plugin enabled/disabled)
├── UI Components
│   ├── Tab navigation
│   ├── Logs view
│   ├── Network view
│   ├── Plugins view
│   └── Performance view
└── Data Management
    ├── Log storage (max 1000)
    └── Request storage (max 500)
```

## Data Limits

To prevent memory issues:
- **Logs**: Maximum 1,000 entries (oldest removed first)
- **Network Requests**: Maximum 500 entries (oldest removed first)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+D` | Toggle DevTools panel |

## API

The DevTools plugin doesn't expose a public API but can be accessed through the core:

```typescript
const devtools = core.plugins.get('devtools');
const isEnabled = core.plugins.isEnabled('devtools');

// Enable/disable
await core.plugins.enable('devtools');
await core.plugins.disable('devtools');
```

## Styling

The DevTools panel uses a dark theme inspired by VS Code:
- Background: `#1e1e1e`
- Panel: `#252526`
- Border: `#3e3e42`
- Text: `#d4d4d4`
- Accent colors for different log levels and status codes

## Future Enhancements

Potential improvements:
- Export logs/requests to file
- WebSocket traffic monitoring
- GraphQL query inspection
- Redux/Vuex state inspection
- Network request replay
- Performance profiling timeline
- Memory leak detection
- Custom filters and queries
- Request/response body inspection modal

## Troubleshooting

### DevTools not appearing
1. Check if plugin is enabled in Plugins tab
2. Try keyboard shortcut: `Ctrl+Shift+D`
3. Check browser console for errors

### Missing network requests
- Some requests may be made before DevTools is loaded
- Only captures requests after plugin is enabled
- ServiceWorker requests may not be captured

### High memory usage
- Clear logs regularly with 🗑️ button
- Disable DevTools when not needed
- Data is automatically limited (1000 logs, 500 requests)

## Dependencies

- Core framework
- No external dependencies

## License

MIT License - Same as parent project
