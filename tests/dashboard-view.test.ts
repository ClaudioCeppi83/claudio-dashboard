// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "../src/ui/dashboard-view";
import type { MonthlySummary } from "../src/domain/calculations";

describe("DashboardView", () => {
  let root: HTMLDivElement;
  let view: DashboardView;
  const mockSummary: MonthlySummary = {
    month: "2026-08",
    monthName: "Agosto 2026",
    deliveries: 48,
    grossIncome: 1800,
    debts: 120,
    expenses: 250,
    net: 1430,
    daysWithDeliveries: 10,
    averagePerActiveDay: 4.8,
    dailyBreakdown: [
      { date: "2026-08-29", formattedDate: "29 ago", deliveries: 28, grossIncome: 1050 },
      { date: "2026-08-28", formattedDate: "28 ago", deliveries: 20, grossIncome: 750 },
    ],
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
    view = new DashboardView(root);
  });

  it("renders financial summary correctly with SVG elements and clean labels", () => {
    view.render(mockSummary);

    expect(root.querySelector("#month-title")?.textContent).toBe("Agosto 2026");
    expect(root.querySelector(".balance")?.textContent).toMatch(/1.?430/);
    expect(root.querySelector(".metrics-grid")?.textContent).toContain("48");
    expect(root.querySelector(".metrics-grid")?.textContent).toMatch(/1.?800/);
    expect(root.querySelector(".daily-table")?.textContent).toContain("29 ago");
    expect(root.querySelector(".daily-table")?.textContent).toContain("28");
  });

  it("toggles dropdown menu on click", () => {
    view.render(mockSummary);

    const toggleBtn = root.querySelector<HTMLButtonElement>("#toggle-menu")!;
    const dropdown = root.querySelector<HTMLDivElement>("#dropdown-menu")!;

    expect(dropdown.classList.contains("hidden")).toBe(true);

    toggleBtn.click();
    expect(dropdown.classList.contains("hidden")).toBe(false);
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens and closes mobile bottom sheets", () => {
    view.render(mockSummary);

    const openMsgBtn = root.querySelector<HTMLButtonElement>("#open-sheet-message")!;
    const sheetOverlay = root.querySelector<HTMLDivElement>("#sheet-message")!;
    const closeMsgBtn = root.querySelector<HTMLButtonElement>("#close-sheet-message")!;

    expect(sheetOverlay.classList.contains("active")).toBe(false);

    openMsgBtn.click();
    expect(sheetOverlay.classList.contains("active")).toBe(true);
    expect(sheetOverlay.getAttribute("aria-hidden")).toBe("false");

    closeMsgBtn.click();
    expect(sheetOverlay.classList.contains("active")).toBe(false);
    expect(sheetOverlay.getAttribute("aria-hidden")).toBe("true");
  });

  it("triggers onMessageSubmit handler on desktop save button click", async () => {
    const onMessageSubmit = vi.fn().mockResolvedValue(undefined);
    view.setHandlers({
      onMessageSubmit,
      onDebtSubmit: vi.fn(),
      onMonthChange: vi.fn(),
      onExport: vi.fn(),
      onImport: vi.fn(),
      onClear: vi.fn(),
    });
    view.render(mockSummary);

    const textarea = root.querySelector<HTMLTextAreaElement>("#message")!;
    textarea.value = "*Juan*, 08918, Recibidos: 50, Incidencias: 2, Entregados: 48";

    const saveBtn = root.querySelector<HTMLButtonElement>("#save-message")!;
    saveBtn.click();

    expect(onMessageSubmit).toHaveBeenCalledWith("*Juan*, 08918, Recibidos: 50, Incidencias: 2, Entregados: 48");
  });

  it("toggles light/dark theme when clicking theme button", () => {
    view.render(mockSummary);

    const themeBtn = root.querySelector<HTMLButtonElement>("#toggle-theme")!;
    expect(document.documentElement.dataset.theme).toBeUndefined();

    themeBtn.click();
    expect(document.documentElement.dataset.theme).toBe("dark");

    themeBtn.click();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("toggles daily breakdown sort order between desc and asc", () => {
    view.render(mockSummary);

    const sortBtn = root.querySelector<HTMLButtonElement>("#toggle-daily-sort")!;
    let rows = root.querySelectorAll(".daily-table tbody tr");

    // Initially descending: 29 ago comes first
    expect(rows[0]?.textContent).toContain("29 ago");
    expect(rows[1]?.textContent).toContain("28 ago");

    // Click to toggle to ascending: 28 ago comes first
    sortBtn.click();
    rows = root.querySelectorAll(".daily-table tbody tr");
    expect(rows[0]?.textContent).toContain("28 ago");
    expect(rows[1]?.textContent).toContain("29 ago");
  });

  it("renders guest greeting and local sync badge by default when unauthenticated", () => {
    view.render(mockSummary);
    expect(root.querySelector(".user-greeting")?.textContent).toContain("Hola, Invitado");
    expect(root.querySelector(".sync-badge.local")?.textContent).toContain("Modo Local");
  });

  it("renders personalized user greeting and cloud online sync badge when authenticated", () => {
    view.setUser({ displayName: "Claudio Rossi", email: "claudio@example.com" });
    view.render(mockSummary);
    expect(root.querySelector(".user-greeting")?.textContent).toContain("Hola, Claudio");
    expect(root.querySelector(".sync-badge.online")?.textContent).toContain("Nube");
  });

  it("invokes showPicker on month picker when month capsule is clicked", () => {
    view.render(mockSummary);
    const monthPicker = root.querySelector<HTMLInputElement>("#month-picker")!;
    const showPickerSpy = vi.fn();
    monthPicker.showPicker = showPickerSpy;

    const monthCapsule = root.querySelector<HTMLElement>(".month-capsule")!;
    monthCapsule.click();

    expect(showPickerSpy).toHaveBeenCalled();
  });
});