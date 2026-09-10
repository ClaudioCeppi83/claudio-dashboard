import type { StorageDriver } from "./storage-driver";

/**
 * Browser-compatible append-only storage driver.
 * Stores data in localStorage while providing NDJSON (.cld) export/import capabilities.
 */
export class BrowserStore implements StorageDriver {
  private readonly storagePrefix = "claudio_cld_";

  /** Appends a single record to the specified storage key. */
  async append<T>(key: string, value: T): Promise<void> {
    const existing = await this.readAll<T>(key);
    existing.push(value);
    const storageKey = this.getStorageKey(key);
    localStorage.setItem(storageKey, JSON.stringify(existing));
  }

  /** Reads all records for the specified storage key. */
  async readAll<T>(key: string): Promise<T[]> {
    const storageKey = this.getStorageKey(key);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  /** Overwrites all records for the specified storage key. */
  async saveAll<T>(key: string, items: T[]): Promise<void> {
    const storageKey = this.getStorageKey(key);
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  /** Exports all stored keys as an object of NDJSON (.cld) formatted strings. */
  async exportNDJSON(key: string): Promise<string> {
    const items = await this.readAll<unknown>(key);
    return items.map((item) => JSON.stringify(item)).join("\n");
  }

  /** Imports NDJSON (.cld) formatted string into the specified storage key. */
  async importNDJSON<T>(key: string, ndjson: string): Promise<number> {
    const lines = ndjson.split("\n").map((line) => line.trim()).filter(Boolean);
    const parsedItems: T[] = [];
    for (const line of lines) {
      try {
        parsedItems.push(JSON.parse(line) as T);
      } catch {
        // Skip invalid lines gracefully
      }
    }
    const existing = await this.readAll<T>(key);
    const merged = [...existing, ...parsedItems];
    await this.saveAll<T>(key, merged);
    return parsedItems.length;
  }

  /** Deletes a single record by its id from localStorage. */
  async deleteItem(key: string, id: string): Promise<void> {
    const existing = await this.readAll<{ id?: string }>(key);
    const filtered = existing.filter((item) => item?.id !== id);
    await this.saveAll(key, filtered);
  }

  /** Clears all storage keys managed by Claudio Dashboard. */
  async clearAll(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storagePrefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  }

  private getStorageKey(key: string): string {
    return `${this.storagePrefix}${key.replace(/\.cld$/, "")}`;
  }
}
