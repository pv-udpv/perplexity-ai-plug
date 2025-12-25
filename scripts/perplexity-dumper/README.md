# Perplexity Storage Dumper

📦 Userscript для полного дампа runtime-контекста Perplexity.ai в JSON.

## 🎯 Возможности

### Storage APIs
- **localStorage** - все ключи и значения с auto-parse JSON
- **sessionStorage** - session data
- **IndexedDB** - полный дамп всех баз данных и stores
- **Cache API** - список закэшированных URL и metadata
- **Cookies** - все cookies для perplexity.ai

### Application State
- **React DevTools** - состояние React компонентов (если доступно)
- **Global Objects** - window._pplx*, __PPLX* и другие
- **Router State** - текущий URL, history state

### Network State
- **WebSocket** - активные соединения
- **ServiceWorker** - регистрация и scope
- **Pending Requests** - незавершенные fetch запросы

## 🚀 Использование

### Установка

1. Установите [Tampermonkey](https://www.tampermonkey.net/) или [Violentmonkey](https://violentmonkey.github.io/)
2. Установите скрипт из [gist](https://gist.github.com/pv-udpv/8c0bafb4af72141a40f207b964b68725)
3. Откройте [perplexity.ai](https://www.perplexity.ai)

### Запуск дампа

**Вариант 1**: Кнопка
- Найдите floating кнопку "📦 Dump" в правом нижнем углу
- Нажмите для запуска

**Вариант 2**: Keyboard Shortcut
- Нажмите `Ctrl+Shift+D`

### Результат

Скачается файл `perplexity-dump_2025-12-25T20-00-00.json` со структурой:

```json
{
  "metadata": {
    "timestamp": "2025-12-25T20:00:00.000Z",
    "url": "https://www.perplexity.ai/search/...",
    "userAgent": "Mozilla/5.0...",
    "viewport": { "width": 1920, "height": 1080 },
    "script_version": "1.0.0"
  },
  "storage": {
    "localStorage": {
      "some-key": {
        "value": "{...}",
        "size": 1234,
        "parsed": { ... }
      }
    },
    "sessionStorage": { ... },
    "size": { "local": 123456, "session": 7890 }
  },
  "indexedDB": [
    {
      "name": "perplexity-db",
      "version": 1,
      "stores": [
        {
          "name": "threads",
          "keyPath": "id",
          "autoIncrement": false,
          "indexes": ["createdAt"],
          "records": [ ... ],
          "count": 42
        }
      ]
    }
  ],
  "caches": [ ... ],
  "cookies": [ ... ],
  "state": { ... },
  "network": { ... }
}
```

## 🛠️ Анализ дампа

### Python

```python
import json
from pathlib import Path

def analyze_dump(dump_path: Path):
    with open(dump_path) as f:
        data = json.load(f)
    
    print(f"📊 Perplexity Dump Analysis")
    print(f"Timestamp: {data['metadata']['timestamp']}")
    print(f"\nStorage:")
    print(f"  localStorage: {len(data['storage']['localStorage'])} keys")
    print(f"  Total size: {data['storage']['size']['local'] / 1024:.2f} KB")
    print(f"\nIndexedDB:")
    for db in data['indexedDB']:
        print(f"  {db['name']} v{db['version']}")
        for store in db['stores']:
            print(f"    - {store['name']}: {store['count']} records")

if __name__ == '__main__':
    analyze_dump(Path('perplexity-dump_2025-12-25T20-00-00.json'))
```

### JavaScript/Node.js

```javascript
const fs = require('fs');

const dump = JSON.parse(fs.readFileSync('perplexity-dump_2025-12-25T20-00-00.json', 'utf8'));

console.log('📊 Perplexity Dump Analysis');
console.log(`Timestamp: ${dump.metadata.timestamp}`);
console.log(`\nlocalStorage keys: ${Object.keys(dump.storage.localStorage).length}`);
console.log(`IndexedDB databases: ${dump.indexedDB.length}`);

// Найти все thread ID
const threads = dump.indexedDB
  .flatMap(db => db.stores)
  .find(store => store.name === 'threads');
  
if (threads) {
  console.log(`\n📝 Threads: ${threads.count}`);
  threads.records.forEach(thread => {
    console.log(`  - ${thread.id}: ${thread.title}`);
  });
}
```

## 🔧 Технические детали

### Архитектура

```
scripts/perplexity-dumper/
├── index.ts              # Main entry point
├── manifest.json         # Userscript metadata
├── types.ts              # TypeScript interfaces
├── dumpers/
│   ├── storage.ts        # localStorage/sessionStorage
│   ├── indexeddb.ts      # IndexedDB full dump
│   ├── cache.ts          # Cache API
│   ├── cookies.ts        # document.cookie parser
│   ├── spa-state.ts      # React/global state
│   └── network.ts        # WebSocket, fetch hooks
├── ui/
│   ├── button.ts         # Floating dump button
│   └── progress.ts       # Progress modal
└── utils/
    └── export.ts         # JSON download
```

### Хуки и перехваты

Скрипт устанавливает следующие хуки:

```typescript
// WebSocket tracking
const OriginalWebSocket = window.WebSocket;
window.WebSocket = class extends OriginalWebSocket { ... };

// Fetch tracking
const originalFetch = window.fetch;
window.fetch = async (...args) => { ... };
```

### Performance

- **Dump time**: ~2-5s для типичного state
- **JSON size**: ~1-10 MB uncompressed
- **Compression**: Поддержка `.json.gz` (CompressionStream API)

## 🐛 Известные ограничения

- ⚠️ HttpOnly cookies недоступны из JavaScript
- ⚠️ ServiceWorker может блокировать некоторые Cache API операции
- ⚠️ React state extraction зависит от DevTools
- ⚠️ Большие IndexedDB (>50MB) могут замедлить дамп

## 🔒 Privacy & Security

**⚠️ ВНИМАНИЕ**: Дамп содержит:
- Токены аутентификации (если хранятся в localStorage)
- История чатов
- Персональные настройки

**Не делитесь дампом публично!**

## 📝 License

MIT - see [LICENSE](../../LICENSE)

## 🔗 Links

- [GitHub Repository](https://github.com/pv-udpv/perplexity-ai-plug)
- [Gist](https://gist.github.com/pv-udpv/8c0bafb4af72141a40f207b964b68725)
- [Issue #12](https://github.com/pv-udpv/perplexity-ai-plug/issues/12)
