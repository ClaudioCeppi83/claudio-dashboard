import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  type DocumentReference,
} from "firebase/firestore";
import type { StorageDriver } from "./storage-driver";
import { db } from "./firebase-config";

/**
 * Cloud Firestore Storage Driver.
 * Stores data in Firestore under `users/{userId}/{key}` collections with real-time/offline support.
 */
export class FirestoreStore implements StorageDriver {
  private readonly maxBatchSize = 400;

  constructor(private readonly userId: string) {}

  /** Appends a single record into the user's Firestore collection. */
  async append<T>(key: string, value: T): Promise<void> {
    const cleanKey = this.sanitizeKey(key);
    const itemObj = value as Record<string, unknown>;
    const id = typeof itemObj.id === "string" ? itemObj.id : crypto.randomUUID();

    const docRef = doc(db, "users", this.userId, cleanKey, id);
    await setDoc(docRef, value as Record<string, unknown>, { merge: true });
  }

  /** Reads all records from the user's Firestore collection. */
  async readAll<T>(key: string): Promise<T[]> {
    const cleanKey = this.sanitizeKey(key);
    const colRef = collection(db, "users", this.userId, cleanKey);
    const snapshot = await getDocs(query(colRef));

    const results: T[] = [];
    snapshot.forEach((document) => {
      results.push(document.data() as T);
    });

    return results;
  }

  /** Overwrites all records in the user's Firestore collection in safe chunks <= 400 items. */
  async saveAll<T>(key: string, items: T[]): Promise<void> {
    const cleanKey = this.sanitizeKey(key);
    const colRef = collection(db, "users", this.userId, cleanKey);

    // Delete existing documents in safe batches
    const snapshot = await getDocs(colRef);
    await this.commitBatchedDeletes(snapshot.docs);

    // Insert new documents in safe batches
    await this.commitBatchedWrites<T>(cleanKey, items);
  }

  /** Exports all stored records for a key as NDJSON formatted string. */
  async exportNDJSON(key: string): Promise<string> {
    const items = await this.readAll<unknown>(key);
    return items.map((item) => JSON.stringify(item)).join("\n");
  }

  /** Imports NDJSON formatted string into the user's Firestore collection. */
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
    for (const item of parsedItems) {
      await this.append<T>(key, item);
    }
    return parsedItems.length;
  }

  /** Deletes a single record by its id from Firestore. */
  async deleteItem(key: string, id: string): Promise<void> {
    const cleanKey = this.sanitizeKey(key);
    const docRef = doc(db, "users", this.userId, cleanKey, id);
    await deleteDoc(docRef);
  }

  /** Clears all collections managed by Claudio Dashboard for this user in safe chunks. */
  async clearAll(): Promise<void> {
    const keys = ["deliveries", "debts", "expenses", "raw", "settings"];
    for (const key of keys) {
      const colRef = collection(db, "users", this.userId, key);
      const snapshot = await getDocs(colRef);
      await this.commitBatchedDeletes(snapshot.docs);
    }
  }

  private async commitBatchedDeletes(docs: Array<{ ref: DocumentReference }>): Promise<void> {
    for (let i = 0; i < docs.length; i += this.maxBatchSize) {
      const chunk = docs.slice(i, i + this.maxBatchSize);
      const batch = writeBatch(db);
      for (const docItem of chunk) {
        batch.delete(docItem.ref);
      }
      await batch.commit();
    }
  }

  private async commitBatchedWrites<T>(cleanKey: string, items: T[]): Promise<void> {
    for (let i = 0; i < items.length; i += this.maxBatchSize) {
      const chunk = items.slice(i, i + this.maxBatchSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const itemObj = item as Record<string, unknown>;
        const id = typeof itemObj.id === "string" ? itemObj.id : crypto.randomUUID();
        const docRef = doc(db, "users", this.userId, cleanKey, id);
        batch.set(docRef, item as Record<string, unknown>);
      }
      await batch.commit();
    }
  }

  private sanitizeKey(key: string): string {
    return key.replace(/\.cld$/, "");
  }
}
