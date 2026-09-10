// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView, getAdjacentMonth } from "../src/ui/dashboard-view";
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
		expect(root.querySelector(".user-greeting")?.textContent).toContain("Hola, Usuario");
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

  it("navigates to previous and next months via arrow buttons", () => {
    const onMonthChange = vi.fn();
    view.setHandlers({
      onMessageSubmit: vi.fn(),
      onDebtSubmit: vi.fn(),
      onMonthChange,
      onExport: vi.fn(),
      onImport: vi.fn(),
      onClear: vi.fn(),
    });
    view.render(mockSummary); // month: "2026-08"

    const prevBtn = root.querySelector<HTMLButtonElement>("#prev-month")!;
    const nextBtn = root.querySelector<HTMLButtonElement>("#next-month")!;

    prevBtn.click();
    expect(onMonthChange).toHaveBeenCalledWith("2026-07");

    nextBtn.click();
    expect(onMonthChange).toHaveBeenCalledWith("2026-09");
  });

	it("calculates adjacent months correctly across year boundaries", () => {
		expect(getAdjacentMonth("2026-08", -1)).toBe("2026-07");
		expect(getAdjacentMonth("2026-08", 1)).toBe("2026-09");
		expect(getAdjacentMonth("2026-01", -1)).toBe("2025-12");
		expect(getAdjacentMonth("2025-12", 1)).toBe("2026-01");
	});

	it("renders structured menu with login button in local mode when unauthenticated", () => {
		view.setUser(null);
		view.render(mockSummary);

		const loginBtn = root.querySelector("#auth-login");
		expect(loginBtn).not.toBeNull();
		expect(loginBtn?.textContent).toContain("Iniciar sesión");
		expect(root.querySelector("#auth-logout")).toBeNull();
		expect(root.querySelector("#migrate-data")).toBeNull();

		// Local mode tools are available
		expect(root.querySelector("#open-settings")).not.toBeNull();
		expect(root.querySelector("#export-backup")).not.toBeNull();
		expect(root.querySelector("#import-trigger")).not.toBeNull();
		expect(root.querySelector("#clear-data")).not.toBeNull();
		expect(root.querySelector(".menu-badge.local")?.textContent).toContain("Local");
	});

	it("requires typing current date in DD/MM/YYYY to confirm clear-data", async () => {
		const onClear = vi.fn().mockResolvedValue(undefined);
		view.setHandlers({
			onMessageSubmit: vi.fn(),
			onDebtSubmit: vi.fn(),
			onMonthChange: vi.fn(),
			onExport: vi.fn(),
			onImport: vi.fn(),
			onClear,
		});
		view.render(mockSummary);

		const now = new Date();
		const day = String(now.getDate()).padStart(2, "0");
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const year = now.getFullYear();
		const todayFormatted = `${day}/${month}/${year}`;

		const clearBtn = root.querySelector<HTMLButtonElement>("#clear-data")!;

		// 1. Wrong date -> should NOT call onClear
		vi.spyOn(window, "prompt").mockReturnValueOnce("01/01/2000");
		clearBtn.click();
		expect(onClear).not.toHaveBeenCalled();

		// 2. Correct date -> should call onClear
		vi.spyOn(window, "prompt").mockReturnValueOnce(todayFormatted);
		clearBtn.click();
		expect(onClear).toHaveBeenCalledTimes(1);
	});

	it("triggers file input click when quick upload button is clicked", () => {
		view.render(mockSummary);
		const fileInput = root.querySelector<HTMLInputElement>("#import-file")!;
		const clickSpy = vi.spyOn(fileInput, "click");

		const quickUploadBtn = root.querySelector<HTMLButtonElement>("#quick-upload-trigger")!;
		quickUploadBtn.click();

		expect(clickSpy).toHaveBeenCalled();
	});

	it("opens and closes settings modal from menu button and expenses card", () => {
		view.setUser({ displayName: "Claudio", email: "claudio@example.com" });
		view.render(mockSummary);

		const modal = root.querySelector<HTMLDivElement>("#settings-modal")!;
		const openBtn = root.querySelector<HTMLButtonElement>("#open-settings")!;
		const closeBtn = root.querySelector<HTMLButtonElement>("#close-settings")!;
		const cardExpenses = root.querySelector<HTMLDivElement>("#card-expenses")!;

		expect(modal.classList.contains("active")).toBe(false);

		// Open via menu button
		openBtn.click();
		expect(modal.classList.contains("active")).toBe(true);

		// Close via close button
		closeBtn.click();
		expect(modal.classList.contains("active")).toBe(false);

		// Open via expenses card
		cardExpenses.click();
		expect(modal.classList.contains("active")).toBe(true);
	});

	it("triggers onSaveSettings when saving profile configuration", async () => {
		const onSaveSettings = vi.fn().mockResolvedValue(undefined);
		view.setHandlers({
			onMessageSubmit: vi.fn(),
			onDebtSubmit: vi.fn(),
			onMonthChange: vi.fn(),
			onExport: vi.fn(),
			onImport: vi.fn(),
			onClear: vi.fn(),
			onSaveSettings,
		});

		view.render(
			mockSummary,
			{ pricePerDelivery: 0.7, currency: "EUR", courierName: "Claudio" },
			[],
		);

		const nameInput = root.querySelector<HTMLInputElement>("#setting-courier-name")!;
		const rateInput = root.querySelector<HTMLInputElement>("#setting-price")!;
		const saveBtn = root.querySelector<HTMLButtonElement>("#btn-save-settings")!;

		nameInput.value = "Claudio Rossi";
		rateInput.value = "0.75";

		saveBtn.click();

		expect(onSaveSettings).toHaveBeenCalledWith({
			pricePerDelivery: 0.75,
			currency: "EUR",
			courierName: "Claudio Rossi",
		});
	});

	it("triggers onAddExpense and onDeleteExpense correctly", async () => {
		const onAddExpense = vi.fn().mockResolvedValue(undefined);
		const onDeleteExpense = vi.fn().mockResolvedValue(undefined);
		view.setHandlers({
			onMessageSubmit: vi.fn(),
			onDebtSubmit: vi.fn(),
			onMonthChange: vi.fn(),
			onExport: vi.fn(),
			onImport: vi.fn(),
			onClear: vi.fn(),
			onAddExpense,
			onDeleteExpense,
		});

		view.render(
			mockSummary,
			{ pricePerDelivery: 0.7, currency: "EUR" },
			[
				{
					id: "exp-123",
					description: "Gestoría",
					amount: 60,
					date: "2026-08-01",
					recurring: true,
				},
			],
		);

		// Add expense
		const descInput = root.querySelector<HTMLInputElement>("#new-expense-desc")!;
		const amountInput = root.querySelector<HTMLInputElement>("#new-expense-amount")!;
		const addBtn = root.querySelector<HTMLButtonElement>("#btn-add-expense")!;

		descInput.value = "Seguro Moto";
		amountInput.value = "45";

		addBtn.click();

		expect(onAddExpense).toHaveBeenCalledWith(45, "Seguro Moto");

		// Delete expense
		const deleteBtn = root.querySelector<HTMLButtonElement>('.btn-delete-expense[data-id="exp-123"]')!;
		expect(deleteBtn).toBeTruthy();
		deleteBtn.click();

		expect(onDeleteExpense).toHaveBeenCalledWith("exp-123");
	});

	it("displays loading state with spinner and filename when showImportLoading is called", () => {
		view.render(mockSummary);
		const testFile = new File(["test data"], "reporte_agosto.zip", { type: "application/zip" });

		view.showImportLoading(testFile);

		const modal = root.querySelector<HTMLDivElement>("#import-modal")!;
		expect(modal.classList.contains("active")).toBe(true);
		expect(modal.classList.contains("hidden")).toBe(false);
		expect(modal.textContent).toContain("reporte_agosto.zip");
		expect(modal.textContent).toContain("Importando Archivo");
		expect(modal.querySelector(".spin")).toBeTruthy();
	});

	it("displays interactive preview with editable table and metrics", () => {
		view.render(mockSummary);
		const testFile = new File(["test data"], "chat.txt", { type: "text/plain" });

		view.showImportPreview({
			file: testFile,
			format: "whatsapp",
			targetCourier: "Claudio",
			deliveries: [
				{
					id: "del-1",
					courier: "Claudio",
					route: "08918",
					date: "2026-08-28",
					received: 50,
					incidents: 2,
					delivered: 48,
					rawMessageId: "raw-1",
				},
				{
					id: "del-2",
					courier: "Claudio",
					route: "08930",
					date: "2026-08-29",
					received: 42,
					incidents: 1,
					delivered: 41,
					rawMessageId: "raw-2",
				},
			],
			rawMessages: {
				"2026-08-28": "msg 1",
				"2026-08-29": "msg 2",
			},
			duplicates: 3,
			otherCouriersOmitted: 5,
		});

		const modal = root.querySelector<HTMLDivElement>("#import-modal")!;
		expect(modal.classList.contains("active")).toBe(true);
		expect(modal.textContent).toContain("Vista Previa & Corrección");
		expect(modal.textContent).toContain("WHATSAPP");
		expect(modal.textContent).toContain("Repartidor: Claudio");
		expect(modal.querySelector("#stat-total-rows")?.textContent).toBe("2");
		expect(modal.querySelector("#stat-total-pkgs")?.textContent).toBe("89");
		expect(modal.querySelector("#stat-total-inc")?.textContent).toBe("3");
		expect(modal.textContent).toContain("3 entregas duplicadas omitidas");
		expect(modal.textContent).toContain("5 reportes de otros repartidores excluidos");

		const rows = modal.querySelectorAll("#import-table-body tr");
		expect(rows.length).toBe(2);

		const firstRowRoute = modal.querySelector<HTMLInputElement>('input[data-idx="0"][data-field="route"]')!;
		expect(firstRowRoute.value).toBe("08918");
	});

	it("updates delivery and dynamically recalculates stats when editing input cells", () => {
		view.render(mockSummary);
		const testFile = new File(["test data"], "chat.txt", { type: "text/plain" });

		view.showImportPreview({
			file: testFile,
			format: "whatsapp",
			targetCourier: "Claudio",
			deliveries: [
				{
					id: "del-1",
					courier: "Claudio",
					route: "08918",
					date: "2026-08-28",
					received: 50,
					incidents: 2,
					delivered: 48,
					rawMessageId: "raw-1",
				},
			],
			rawMessages: {},
			duplicates: 0,
		});

		const modal = root.querySelector<HTMLDivElement>("#import-modal")!;
		const deliveredInput = modal.querySelector<HTMLInputElement>('input[data-idx="0"][data-field="delivered"]')!;
		const incidentsInput = modal.querySelector<HTMLInputElement>('input[data-idx="0"][data-field="incidents"]')!;

		deliveredInput.value = "55";
		deliveredInput.dispatchEvent(new Event("input"));

		expect(modal.querySelector("#stat-total-pkgs")?.textContent).toBe("55");

		incidentsInput.value = "4";
		incidentsInput.dispatchEvent(new Event("input"));

		expect(modal.querySelector("#stat-total-inc")?.textContent).toBe("4");
	});

	it("removes a row and re-renders table when clicking delete row button", () => {
		view.render(mockSummary);
		const testFile = new File(["test data"], "chat.txt", { type: "text/plain" });

		view.showImportPreview({
			file: testFile,
			format: "whatsapp",
			targetCourier: "Claudio",
			deliveries: [
				{
					id: "del-1",
					courier: "Claudio",
					route: "08918",
					date: "2026-08-28",
					received: 50,
					incidents: 2,
					delivered: 48,
					rawMessageId: "raw-1",
				},
				{
					id: "del-2",
					courier: "Claudio",
					route: "08930",
					date: "2026-08-29",
					received: 42,
					incidents: 1,
					delivered: 41,
					rawMessageId: "raw-2",
				},
			],
			rawMessages: {},
			duplicates: 0,
		});

		const modal = root.querySelector<HTMLDivElement>("#import-modal")!;
		const deleteFirstBtn = modal.querySelector<HTMLButtonElement>('.btn-delete-import-row[data-idx="0"]')!;

		deleteFirstBtn.click();

		const rows = modal.querySelectorAll("#import-table-body tr");
		expect(rows.length).toBe(1);
		expect(modal.querySelector("#stat-total-rows")?.textContent).toBe("1");
		expect(modal.querySelector("#stat-total-pkgs")?.textContent).toBe("41");

		const remainingRoute = modal.querySelector<HTMLInputElement>('input[data-idx="0"][data-field="route"]')!;
		expect(remainingRoute.value).toBe("08930");
	});

	it("closes modal on cancel without triggering onConfirmImport", () => {
		const onConfirmImport = vi.fn().mockResolvedValue(undefined);
		view.setHandlers({
			onMessageSubmit: vi.fn(),
			onDebtSubmit: vi.fn(),
			onMonthChange: vi.fn(),
			onExport: vi.fn(),
			onImport: vi.fn(),
			onConfirmImport,
			onClear: vi.fn(),
		});

		view.render(mockSummary);
		const testFile = new File(["data"], "test.cld");

		view.showImportPreview({
			file: testFile,
			format: "cld",
			targetCourier: "Claudio",
			deliveries: [
				{
					id: "del-1",
					courier: "Claudio",
					route: "08918",
					date: "2026-08-28",
					received: 50,
					incidents: 2,
					delivered: 48,
					rawMessageId: "raw-1",
				},
			],
			rawMessages: {},
			duplicates: 0,
		});

		const modal = root.querySelector<HTMLDivElement>("#import-modal")!;
		const cancelBtn = modal.querySelector<HTMLButtonElement>("#btn-cancel-import")!;

		cancelBtn.click();

		expect(modal.classList.contains("hidden")).toBe(true);
		expect(modal.classList.contains("active")).toBe(false);
		expect(onConfirmImport).not.toHaveBeenCalled();
	});

	it("triggers onConfirmImport with edited deliveries when clicking confirm button", async () => {
		const onConfirmImport = vi.fn().mockResolvedValue(undefined);
		view.setHandlers({
			onMessageSubmit: vi.fn(),
			onDebtSubmit: vi.fn(),
			onMonthChange: vi.fn(),
			onExport: vi.fn(),
			onImport: vi.fn(),
			onConfirmImport,
			onClear: vi.fn(),
		});

		view.render(mockSummary);
		const testFile = new File(["data"], "test.cld");

		view.showImportPreview({
			file: testFile,
			format: "cld",
			targetCourier: "Claudio",
			deliveries: [
				{
					id: "del-1",
					courier: "Claudio",
					route: "08918",
					date: "2026-08-28",
					received: 50,
					incidents: 2,
					delivered: 48,
					rawMessageId: "raw-1",
				},
			],
			rawMessages: { "2026-08-28": "raw" },
			duplicates: 0,
		});

		const modal = root.querySelector<HTMLDivElement>("#import-modal")!;
		const routeInput = modal.querySelector<HTMLInputElement>('input[data-idx="0"][data-field="route"]')!;
		routeInput.value = "08999";
		routeInput.dispatchEvent(new Event("input"));

		const confirmBtn = modal.querySelector<HTMLButtonElement>("#btn-confirm-import")!;
		confirmBtn.click();

		expect(onConfirmImport).toHaveBeenCalledWith(
			[
				expect.objectContaining({
					route: "08999",
					delivered: 48,
				}),
			],
			{ "2026-08-28": "raw" },
			testFile,
		);
	});

	it("displays error state with descriptive message and allows closing", () => {
		view.render(mockSummary);

		view.showImportError("corrupto.zip", "El archivo ZIP está dañado o no contiene texto legible.");

		const modal = root.querySelector<HTMLDivElement>("#import-modal")!;
		expect(modal.classList.contains("active")).toBe(true);
		expect(modal.textContent).toContain("Error al Importar");
		expect(modal.textContent).toContain("corrupto.zip");
		expect(modal.textContent).toContain("El archivo ZIP está dañado");

		const closeBtn = modal.querySelector<HTMLButtonElement>("#btn-close-import-error")!;
		closeBtn.click();

		expect(modal.classList.contains("hidden")).toBe(true);
		expect(modal.classList.contains("active")).toBe(false);
	});
});