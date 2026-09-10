import { beforeEach, describe, expect, it } from "vitest";
import { BrowserStore } from "../src/infrastructure/browser-store";
import { Repository } from "../src/infrastructure/repository";

// Simple in-memory localStorage mock for Node test runner
const memoryStorage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => memoryStorage.set(key, value),
  removeItem: (key: string) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
  key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
  get length() {
    return memoryStorage.size;
  },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("Repository & BrowserStore", () => {
  let store: BrowserStore;
  let repository: Repository;

  beforeEach(() => {
    localStorage.clear();
    store = new BrowserStore();
    repository = new Repository(store);
  });

  it("stores and loads delivery and raw message data", async () => {
    await repository.addDelivery({
      id: "del-1",
      courier: "Claudio",
      route: "08918",
      date: "2026-08-29",
      received: 50,
      incidents: 0,
      delivered: 50,
      rawMessageId: "raw-1",
    }, "*Claudio*\n08918\n29/08/2026\nRecibidos: 50\nIncidencias: 0\nEntregados: 50");

    const data = await repository.load();
    expect(data.deliveries).toHaveLength(1);
    expect(data.deliveries[0]?.courier).toBe("Claudio");
    expect(data.rawMessages).toHaveLength(1);
    expect(data.rawMessages[0]?.content).toContain("Recibidos: 50");
  });

  it("exports NDJSON format correctly", async () => {
    await repository.addDelivery({
      id: "del-1",
      courier: "Claudio",
      route: "08918",
      date: "2026-08-29",
      received: 50,
      incidents: 0,
      delivered: 50,
      rawMessageId: "raw-1",
    }, "raw content");

		const exported = await repository.exportAllData();
		expect(exported["deliveries.cld"]).toContain('"courier":"Claudio"');
	});

	it("defaults to empty expenses array without hardcoded expenses", async () => {
		const data = await repository.load();
		expect(data.expenses).toEqual([]);
	});

	it("adds and deletes dynamic expenses correctly", async () => {
		const expense = await repository.addExpense(60, "Gestoría autónomos", true);
		expect(expense.id).toBeDefined();
		expect(expense.amount).toBe(60);
		expect(expense.recurring).toBe(true);

		let data = await repository.load();
		expect(data.expenses).toHaveLength(1);
		expect(data.expenses[0]?.description).toBe("Gestoría autónomos");

		await repository.deleteExpense(expense.id);
		data = await repository.load();
		expect(data.expenses).toHaveLength(0);
	});

	it("persists and updates settings", async () => {
		await repository.saveSettings({
			pricePerDelivery: 0.85,
			currency: "EUR",
			courierName: "Claudio Rossi",
		});

		const data = await repository.load();
		expect(data.settings.pricePerDelivery).toBe(0.85);
		expect(data.settings.courierName).toBe("Claudio Rossi");
	});
});