/**
 * Generic asynchronous storage driver contract for Claudio Dashboard.
 * Enables transparent switching between localStorage (BrowserStore) and Cloud Firestore (FirestoreStore).
 */
export interface StorageDriver {
  /** Appends a single record to the specified storage key/collection. */
  append<T>(key: string, value: T): Promise<void>;

  /** Reads all records for the specified storage key/collection. */
  readAll<T>(key: string): Promise<T[]>;

  /** Overwrites all records for the specified storage key/collection. */
  saveAll<T>(key: string, items: T[]): Promise<void>;

  /** Exports all stored records for a key as NDJSON formatted string. */
  exportNDJSON(key: string): Promise<string>;

  /** Imports NDJSON formatted string into the specified storage key/collection. */
  importNDJSON(key: string, ndjson: string): Promise<number>;

  /** Clears all storage keys managed by the driver. */
  clearAll(): Promise<void>;
}
