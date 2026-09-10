import type { DashboardData, Debt, Delivery, Expense, RawMessage, Settings } from "../domain/models";
import { BrowserStore } from "./browser-store";
import type { StorageDriver } from "./storage-driver";

const KEYS = {
  deliveries: "deliveries",
  debts: "debts",
  expenses: "expenses",
  raw: "raw",
  settings: "settings",
} as const;

export class Repository {
  constructor(private store: StorageDriver = new BrowserStore()) {}

  setDriver(driver: StorageDriver): void {
    this.store = driver;
  }

  getDriver(): StorageDriver {
    return this.store;
  }

  async load(): Promise<DashboardData> {
    const [deliveries, debts, expenses, rawMessages, settings] = await Promise.all([
      this.store.readAll<Delivery>(KEYS.deliveries),
      this.store.readAll<Debt>(KEYS.debts),
      this.store.readAll<Expense>(KEYS.expenses),
      this.store.readAll<RawMessage>(KEYS.raw),
      this.store.readAll<Settings>(KEYS.settings),
    ]);

    const defaultExpenses: Expense[] = [
      { id: "expense-transport", amount: 22, date: new Date().toISOString().slice(0, 10), description: "Transporte", recurring: true },
      { id: "expense-mobile", amount: 7, date: new Date().toISOString().slice(0, 10), description: "Móvil", recurring: true },
      { id: "expense-room", amount: 250, date: new Date().toISOString().slice(0, 10), description: "Habitación", recurring: true },
      { id: "expense-google", amount: 6, date: new Date().toISOString().slice(0, 10), description: "Google Pro", recurring: true },
    ];

    return {\n      deliveries,
      debts,
      expenses: expenses.length > 0 ? expenses : defaultExpenses,
      rawMessages,
      settings: settings[0] ?? { pricePerDelivery: 0.7, currency: "EUR" },
    };
  }

  async addDelivery(delivery: Delivery, rawMessage: string): Promise<void> {
    await this.store.append(KEYS.deliveries, delivery);
    await this.store.append(KEYS.raw, {
      id: delivery.rawMessageId,
      receivedAt: new Date().toISOString(),
      content: rawMessage,
    } satisfies RawMessage);
  }

  async addDebt(amount: number, description?: string, date?: string): Promise<void> {
    await this.store.append(KEYS.debts, {
      id: crypto.randomUUID(),
      amount,
      date: date ?? new Date().toISOString().slice(0, 10),
      ...(description ? { description } : {}),
    } satisfies Debt);
  }

  async exportAllData(): Promise<Record<string, string>> {
    const [deliveries, debts, expenses, raw] = await Promise.all([
      this.store.exportNDJSON(KEYS.deliveries),
      this.store.exportNDJSON(KEYS.debts),
      this.store.exportNDJSON(KEYS.expenses),
      this.store.exportNDJSON(KEYS.raw),
    ]);

    return {
      "deliveries.cld": deliveries,
      "debts.cld": debts,
      "expenses.cld": expenses,
      "raw.cld": raw,
    };
  }

  async clearAllData(): Promise<void> {
    await this.store.clearAll();
  }
}
