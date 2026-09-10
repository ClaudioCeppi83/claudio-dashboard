import { describe, expect, it } from "vitest";
import { calculateMonth } from "../src/domain/calculations";
import type { DashboardData } from "../src/domain/models";

describe("calculateMonth domain logic", () => {
  it("calculates totals, rest days, and avoids projecting rest days after last active day", () => {
    const data: DashboardData = {
      deliveries: [
        {
          id: "del-1",
          courier: "Claudio",
          route: "08918",
          date: "2026-08-01",
          received: 50,
          incidents: 0,
          delivered: 50,
          rawMessageId: "raw-1",
        },
        {
          id: "del-2",
          courier: "Claudio",
          route: "08918",
          date: "2026-08-04",
          received: 40,
          incidents: 2,
          delivered: 38,
          rawMessageId: "raw-2",
        },
      ],
      debts: [
        {
          id: "debt-1",
          amount: 15,
          date: "2026-08-02",
          description: "Adelanto",
        },
      ],
      expenses: [
        {
          id: "exp-1",
          amount: 10,
          date: "2026-08-03",
          description: "Gasolina",
          recurring: false,
        },
      ],
      settings: { pricePerDelivery: 0.7, currency: "EUR" },
      rawMessages: [],
    };

    const result = calculateMonth(data, "2026-08");

    expect(result.deliveries).toBe(88); // 50 + 38
    expect(result.grossIncome).toBeCloseTo(61.6); // 88 * 0.7
    expect(result.debts).toBe(15);
    expect(result.expenses).toBe(10);
    expect(result.net).toBeCloseTo(36.6); // 61.6 - 15 - 10
    expect(result.daysWithDeliveries).toBe(2);
    expect(result.averagePerActiveDay).toBe(44); // 88 / 2

    // Breakdown from day 1 to day 4 (4 days total: day 1 active, day 2 rest, day 3 rest, day 4 active)
    expect(result.dailyBreakdown).toHaveLength(4);
    
    const day4 = result.dailyBreakdown.find((d) => d.date === "2026-08-04");
    expect(day4).toEqual({
      date: "2026-08-04",
      formattedDate: "4 ago",
      deliveries: 38,
      grossIncome: 26.6,
      isRestDay: false,
    });

    const day3 = result.dailyBreakdown.find((d) => d.date === "2026-08-03");
    expect(day3).toEqual({
      date: "2026-08-03",
      formattedDate: "3 ago",
      deliveries: 0,
      grossIncome: 0,
      isRestDay: true,
    });

    const day2 = result.dailyBreakdown.find((d) => d.date === "2026-08-02");
    expect(day2).toEqual({
      date: "2026-08-02",
      formattedDate: "2 ago",
      deliveries: 0,
      grossIncome: 0,
      isRestDay: true,
    });

    const day1 = result.dailyBreakdown.find((d) => d.date === "2026-08-01");
    expect(day1).toEqual({
      date: "2026-08-01",
      formattedDate: "1 ago",
      deliveries: 50,
      grossIncome: 35.0,
      isRestDay: false,
    });
  });

  it("handles months with zero deliveries gracefully", () => {
    const data: DashboardData = {
      deliveries: [],
      debts: [],
      expenses: [],
      settings: { pricePerDelivery: 0.7, currency: "EUR" },
      rawMessages: [],
    };

    const result = calculateMonth(data, "2026-08");

    expect(result.deliveries).toBe(0);
    expect(result.grossIncome).toBe(0);
    expect(result.net).toBe(0);
    expect(result.averagePerActiveDay).toBe(0);
    expect(result.dailyBreakdown).toHaveLength(0);
  });
});