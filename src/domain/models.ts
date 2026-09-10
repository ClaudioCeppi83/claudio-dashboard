export interface Delivery {
  readonly id: string;
  readonly courier: string;
  readonly route: string;
  readonly date: string;
  readonly received: number;
  readonly incidents: number;
  readonly delivered: number;
  readonly rawMessageId: string;
}

export interface Debt {
  readonly id: string;
  readonly amount: number;
  readonly date: string;
  readonly description?: string;
}

export interface Expense {
  readonly id: string;
  readonly amount: number;
  readonly date: string;
  readonly description: string;
  readonly recurring: boolean;
}

export interface Settings {
  readonly id?: string;
  readonly courierName?: string;
  readonly pricePerDelivery: number;
  readonly currency: string;
}

export interface RawMessage {
  readonly id: string;
  readonly receivedAt: string;
  readonly content: string;
}

export interface DashboardData {
  readonly deliveries: readonly Delivery[];
  readonly debts: readonly Debt[];
  readonly expenses: readonly Expense[];
  readonly settings: Settings;
  readonly rawMessages: readonly RawMessage[];
}
