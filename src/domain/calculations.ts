import type { DashboardData } from "./models";

export interface DailySummary {
  readonly date: string;
  readonly formattedDate: string;
  readonly deliveries: number;
  readonly grossIncome: number;
  readonly isRestDay?: boolean;
}

export interface MonthlySummary {
  readonly month: string;
  readonly monthName: string;
  readonly deliveries: number;
  readonly grossIncome: number;
  readonly debts: number;
  readonly expenses: number;
  readonly net: number;
  readonly daysWithDeliveries: number;
  readonly averagePerActiveDay: number;
  readonly dailyBreakdown: readonly DailySummary[];
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MONTH_SHORT_NAMES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = Number.parseInt(parts[2] ?? "1", 10);
  const monthIdx = Number.parseInt(parts[1] ?? "1", 10) - 1;
  return `${day} ${MONTH_SHORT_NAMES[monthIdx] ?? ""}`;
}

/** Produces presentation-independent monthly financial metrics. */
export function calculateMonth(data: DashboardData, month: string): MonthlySummary {
  const deliveries = data.deliveries.filter((item) => item.date.startsWith(month));
  const debts = data.debts.filter((item) => item.date.startsWith(month));
  const expenses = data.expenses.filter((item) => item.date.startsWith(month));

  const delivered = deliveries.reduce((sum, item) => sum + item.delivered, 0);
  const grossIncome = delivered * data.settings.pricePerDelivery;
  const debtTotal = debts.reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const daysWithDeliveries = new Set(deliveries.map((item) => item.date)).size;

  // Group deliveries by date
  const dailyMap = new Map<string, number>();
  for (const item of deliveries) {
    const current = dailyMap.get(item.date) ?? 0;
    dailyMap.set(item.date, current + item.delivered);
  }

  const dailyBreakdown: DailySummary[] = [];

  if (dailyMap.size > 0) {
    const activeDates = Array.from(dailyMap.keys()).sort();
    const minDateStr = activeDates[0]!;
    const maxDateStr = activeDates[activeDates.length - 1]!;
    const minDay = Number.parseInt(minDateStr.split("-")[2] ?? "1", 10);
    const maxDay = Number.parseInt(maxDateStr.split("-")[2] ?? "1", 10);

    for (let day = minDay; day <= maxDay; day++) {
      const dayStr = day.toString().padStart(2, "0");
      const dateKey = `${month}-${dayStr}`;
      const count = dailyMap.get(dateKey);

      if (count !== undefined && count > 0) {
        const income = count * data.settings.pricePerDelivery;
        dailyBreakdown.push({
          date: dateKey,
          formattedDate: formatShortDate(dateKey),
          deliveries: count,
          grossIncome: Math.round(income * 100) / 100,
          isRestDay: false,
        });
      } else {
        dailyBreakdown.push({
          date: dateKey,
          formattedDate: formatShortDate(dateKey),
          deliveries: 0,
          grossIncome: 0,
          isRestDay: true,
        });
      }
    }
  }

  const [yearStr, monthStr] = month.split("-");
  const monthIdx = Number.parseInt(monthStr ?? "1", 10) - 1;
  const monthName = `${MONTH_NAMES[monthIdx] ?? "Mes"} ${yearStr ?? ""}`.trim();

  return {
    month,
    monthName,
    deliveries: delivered,
    grossIncome,
    debts: debtTotal,
    expenses: expenseTotal,
    net: grossIncome - debtTotal - expenseTotal,
    daysWithDeliveries,
    averagePerActiveDay: daysWithDeliveries > 0 ? delivered / daysWithDeliveries : 0,
    dailyBreakdown,
  };
}