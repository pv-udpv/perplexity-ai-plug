import type { StorageData, StorageEntry } from '../types';

function tryParseJSON(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function dumpStorage(): Promise<StorageData> {
  const data: StorageData = {
    localStorage: {},
    sessionStorage: {},
    size: { local: 0, session: 0 },
  };

  // localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    const value = localStorage.getItem(key)!;
    const size = new Blob([value]).size;
    
    data.localStorage[key] = {
      value,
      size,
      parsed: tryParseJSON(value),
    };
    data.size.local += size;
  }

  // sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)!;
    const value = sessionStorage.getItem(key)!;
    const size = new Blob([value]).size;
    
    data.sessionStorage[key] = {
      value,
      size,
      parsed: tryParseJSON(value),
    };
    data.size.session += size;
  }

  return data;
}
