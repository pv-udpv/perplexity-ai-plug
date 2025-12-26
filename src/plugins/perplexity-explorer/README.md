# Perplexity Explorer Plugin

## Overview

The Perplexity Explorer plugin automatically explores and maps the Perplexity AI application structure. It discovers DOM elements, interactive components, API endpoints, and application state in real-time.

## Features

### 1. **DOM Structure Discovery** 🏗️
- Recursively explores the DOM tree
- Identifies key elements with IDs, classes, and attributes
- Detects ARIA roles and accessibility labels
- Tracks element hierarchy and relationships
- Discovers data attributes and component markers

### 2. **Interactive Elements Detection** 🎮
- Finds all interactive components:
  - **Buttons**: Including role="button" elements
  - **Inputs**: Text, password, email, etc.
  - **Textareas**: Multi-line input fields
  - **Select dropdowns**: Option selectors
  - **Links**: Navigation elements
  - **Forms**: Form elements and submission handlers
- Extracts labels, placeholders, and values
- Detects event listeners (click, change, submit, etc.)
- Generates CSS selectors for automation

### 3. **API Endpoint Discovery** 🌐
- Monitors network requests using PerformanceObserver
- Tracks API endpoints and frequencies
- Identifies:
  - REST API calls
  - GraphQL endpoints
  - JSON data fetches
- Shows request counts and last seen timestamps

### 4. **Application State Inspection** 📦
- Detects framework usage (React, Vue, Angular)
- Reports localStorage usage
- Reports sessionStorage usage
- Tracks cookie count
- Captures URL state (pathname, search, hash)

### 5. **Resource Mapping** 📚
- Lists all loaded JavaScript files
- Lists all loaded stylesheets
- Tracks external dependencies

### 6. **Real-Time Monitoring** 🔄
- Automatic re-exploration every 5 seconds
- MutationObserver for DOM change detection
- PerformanceObserver for network monitoring
- Maintains history of last 10 explorations

## Usage

### Opening the Explorer

**Method 1: Keyboard Shortcut**
```
Ctrl + Shift + E
```

**Method 2: Enable Plugin**
1. Open plugin manager
2. Find "Perplexity Explorer" in the list
3. Click "Enable"

### Controls

- **🔄 Explore Now**: Trigger immediate exploration
- **⏸️ Pause Auto / ▶️ Resume Auto**: Toggle automatic exploration

### Understanding Results

#### Overview Section
- **DOM Elements**: Total number of discovered elements
- **Interactive**: Count of buttons, inputs, forms, etc.
- **API Endpoints**: Number of unique API calls detected

#### Interactive Elements Section
Grouped by type (buttons, inputs, etc.) with:
- Label or placeholder text
- CSS selector for automation
- Event listeners attached

#### API Endpoints Section
Shows discovered endpoints with:
- HTTP method
- Full URL
- Call frequency
- Last seen timestamp

#### Application State Section
JSON representation of:
- Framework detection
- Storage usage
- URL parameters

## Use Cases

### 1. **UI Testing & Automation**
Use the generated selectors to:
- Write Playwright/Selenium tests
- Create automation scripts
- Build browser extensions

### 2. **API Documentation**
- Discover undocumented endpoints
- Understand API usage patterns
- Monitor API call frequencies

### 3. **Reverse Engineering**
- Understand application structure
- Map component hierarchy
- Identify key interactive elements

### 4. **Accessibility Auditing**
- Check ARIA labels
- Verify role attributes
- Ensure proper semantic HTML

### 5. **Performance Analysis**
- Track resource loading
- Monitor API call patterns
- Identify bottlenecks

## Technical Details

### Exploration Process

1. **Initial Scan**: Explores DOM from root elements
2. **Interactive Discovery**: Queries for all interactive elements
3. **Resource Detection**: Lists scripts and stylesheets
4. **State Extraction**: Reads application state
5. **Continuous Monitoring**: Watches for changes

### DOM Traversal

- Maximum depth: 5 levels
- Filters dynamic classes (starting with `_`)
- Limits text content to 100 characters
- Generates unique CSS selectors

### Network Monitoring

Uses PerformanceObserver to track:
- Resource timing entries
- API endpoint patterns
- Request frequencies

### Memory Management

- Keeps last 10 exploration snapshots
- Tracks unique elements with Set
- Automatic cleanup of old data

## Configuration

Currently no user configuration. Future enhancements may include:
- Configurable exploration depth
- Custom element filters
- Export formats
- Automation script generation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` | Toggle Explorer panel |

## API

Access the explorer through the core plugin system:

```typescript
const explorer = core.plugins.get('perplexity-explorer');
const isEnabled = core.plugins.isEnabled('perplexity-explorer');

// Enable/disable
await core.plugins.enable('perplexity-explorer');
await core.plugins.disable('perplexity-explorer');
```

## Example Output

```json
{
  "timestamp": 1703456789000,
  "domElements": [
    {
      "tag": "button",
      "classes": ["primary-btn", "submit"],
      "attributes": {
        "data-testid": "search-button",
        "type": "submit"
      },
      "text": "Search",
      "events": ["click"],
      "role": "button",
      "ariaLabel": "Submit search query"
    }
  ],
  "interactiveElements": [
    {
      "type": "input",
      "selector": "input.search-input",
      "placeholder": "Ask anything...",
      "events": ["keydown", "change"]
    }
  ],
  "apiEndpoints": [
    {
      "url": "https://api.perplexity.ai/query",
      "method": "POST",
      "count": 15,
      "lastSeen": 1703456789000
    }
  ],
  "state": {
    "react": "detected",
    "localStorage": 5,
    "sessionStorage": 2,
    "cookies": 8,
    "url": {
      "pathname": "/search",
      "search": "?q=test",
      "hash": ""
    }
  }
}
```

## Integration with Playwright

Use explorer data to generate Playwright tests:

```typescript
// From explorer output
const selector = "input.search-input";

// In Playwright test
await page.locator(selector).fill('test query');
await page.locator('button[data-testid="search-button"]').click();
```

## Future Enhancements

- Export exploration data to JSON/CSV
- Generate Playwright test scripts
- Visual element highlighting
- Screenshot capture with annotations
- Component tree visualization
- Event flow tracking
- State change diff viewer
- WebSocket monitoring
- Service Worker detection

## Troubleshooting

### No elements found
- Wait for page to fully load
- Click "Explore Now" manually
- Check if content is in shadow DOM

### Missing API endpoints
- APIs called before plugin loaded won't be captured
- Only monitors after plugin is enabled
- Some requests may not be tracked by PerformanceObserver

### High memory usage
- Explorer keeps only last 10 snapshots
- Disable auto-explore if not needed
- Restart plugin to clear history

## Dependencies

- Core framework
- PerformanceObserver API (optional, for network monitoring)
- MutationObserver API (for DOM change detection)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Limited PerformanceObserver support

## License

MIT License - Same as parent project
