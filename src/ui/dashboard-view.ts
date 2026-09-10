import type { MonthlySummary } from "../domain/calculations";
import type { Expense, Settings } from "../domain/models";

export interface DashboardViewOptions {
  onMessageSubmit: (message: string) => Promise<void>;
  onDebtSubmit: (amount: number, description?: string) => Promise<void>;
  onMonthChange: (month: string) => void;
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
  onClear: () => Promise<void>;
  onLogin?: () => Promise<void>;
  onLogout?: () => Promise<void>;
  onMigrateLocalData?: () => Promise<void>;
  onSaveSettings?: (settings: Settings) => Promise<void>;
  onAddExpense?: (amount: number, description: string) => Promise<void>;
  onDeleteExpense?: (id: string) => Promise<void>;
}

// Minimalist SVG Vector Icons (Eliminating Emojis)
const ICONS = {
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  sunMoon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
  message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  debt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  rhythm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  sortDesc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`,
  sortAsc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  google: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 15.987 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>`,
};

/** Sanitizes any user-supplied string to prevent DOM-based XSS (CWE-79). */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Calculates adjacent month string (YYYY-MM) with an offset (+1 or -1). */
export function getAdjacentMonth(monthStr: string, offset: number): string {
  const parts = (monthStr || "").split("-");
  const y = Number.parseInt(parts[0] ?? "", 10);
  const m = Number.parseInt(parts[1] ?? "", 10);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    return new Date().toISOString().slice(0, 7);
  }
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return d.toISOString().slice(0, 7);
}

export class DashboardView {
  private readonly root: HTMLElement;
  private options?: DashboardViewOptions;
  private dailySortOrder: "desc" | "asc" = "desc";
  private lastSummary?: MonthlySummary;
  private currentSettings: Settings = { pricePerDelivery: 0.7, currency: "EUR" };
  private currentExpenses: readonly Expense[] = [];
  private isSettingsOpen = false;
  private currentUser: { displayName?: string | null; email?: string | null } | null = null;
  private isOnline: boolean = typeof window !== "undefined" ? window.navigator.onLine : true;

  constructor(root: HTMLElement) {
    this.root = root;
    this.restoreTheme();
    this.initNetworkListeners();
  }

  setSettings(settings: Settings): void {
    this.currentSettings = settings;
    if (this.lastSummary) {
      this.render(this.lastSummary);
    }
  }

  setExpenses(expenses: readonly Expense[]): void {
    this.currentExpenses = expenses;
    if (this.lastSummary) {
      this.render(this.lastSummary);
    }
  }

  setUser(user: { displayName?: string | null; email?: string | null } | null): void {
    this.currentUser = user;
    if (this.lastSummary) {
      this.render(this.lastSummary);
    }
  }

  setHandlers(options: DashboardViewOptions): void {
    this.options = options;
  }

	openSettings(): void {
		this.isSettingsOpen = true;
		const modal = this.root.querySelector("#settings-modal");
		if (modal) {
			modal.classList.remove("hidden");
			modal.classList.add("active");
			modal.setAttribute("aria-hidden", "false");
		}
	}

	closeSettings(): void {
		this.isSettingsOpen = false;
		const modal = this.root.querySelector("#settings-modal");
		if (modal) {
			modal.classList.remove("active");
			modal.classList.add("hidden");
			modal.setAttribute("aria-hidden", "true");
		}
	}

  render(summary: MonthlySummary, settings?: Settings, expenses?: readonly Expense[]): void {
    this.lastSummary = summary;
    if (settings) {
      this.currentSettings = settings;
    }
    if (expenses) {
      this.currentExpenses = expenses;
    }

    const money = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    });

		const rawFirstName = this.currentSettings.courierName?.trim()
			|| (this.currentUser?.displayName ? this.currentUser.displayName.trim().split(/\s+/)[0] : null);
		const greetingText = rawFirstName
			? `Hola, ${escapeHtml(rawFirstName)}`
			: "Hola, Usuario";

    let syncBadgeHtml = `<span class="sync-badge local"><span class="sync-dot"></span>Modo Local</span>`;
    if (this.currentUser) {
      syncBadgeHtml = this.isOnline
        ? `<span class="sync-badge online" title="Sincronización directa con Google Cloud"><span class="sync-dot"></span>Nube</span>`
        : `<span class="sync-badge offline" title="Sin conexión a internet. Los cambios se guardarán en la nube al volver la red."><span class="sync-dot"></span>Sin conexión (En cola)</span>`;
    }

    const totalRecurringExpenses = this.currentExpenses.reduce(
      (sum, exp) => sum + (Number.isFinite(exp.amount) ? exp.amount : 0),
      0,
    );

    const expensesListHtml = this.currentExpenses.length > 0
      ? this.currentExpenses.map((exp) => `
          <div class="expense-item-row" data-id="${escapeHtml(exp.id)}">
            <div class="expense-item-info">
              <span class="expense-item-desc">${escapeHtml(exp.description)}</span>
              <span class="badge-recurring">Fijo mensual</span>
            </div>
            <div class="expense-item-right">
              <span class="expense-item-amount">−${money.format(exp.amount)}</span>
              <button class="btn-delete-expense" data-id="${escapeHtml(exp.id)}" aria-label="Eliminar ${escapeHtml(exp.description)}">
                ${ICONS.trash}
              </button>
            </div>
          </div>
        `).join("")
      : `<p class="expenses-empty">No hay gastos fijos registrados. Añade tus gastos habituales (habitación, móvil, etc.) a continuación.</p>`;

    const sortedDaily = [...summary.dailyBreakdown].sort((a, b) => {
      return this.dailySortOrder === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
    });

    const safeMonthName = escapeHtml(summary.monthName);

    const dailyRows = sortedDaily.length > 0
      ? sortedDaily.map((day) => {
          const safeDate = escapeHtml(day.formattedDate);
          if (day.isRestDay) {
            return `
              <tr class="rest-day-row">
                <td>${safeDate}</td>
                <td class="align-center"><span class="badge-rest">Día libre</span></td>
                <td class="align-right muted-dash">—</td>
              </tr>
            `;
          }
          return `
            <tr>
              <td>${safeDate}</td>
              <td class="align-center">${day.deliveries}</td>
              <td class="align-right">${money.format(day.grossIncome)}</td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="3" class="daily-empty">No hay entregas registradas en este mes.</td></tr>`;

    this.root.innerHTML = `
      <main class="shell" aria-labelledby="month-title">
        <header class="topbar">
          <div class="brand-section">
            <div class="brand-badge">C</div>
            <div class="brand-details">
              <div class="user-greeting">
                <span>${greetingText}</span>
                ${syncBadgeHtml}
              </div>
              <div class="month-navigator">
                <button class="month-nav-arrow" id="prev-month" aria-label="Mes anterior" title="Mes anterior">
                  ${ICONS.chevronLeft}
                </button>
                <div class="month-capsule" role="button" aria-haspopup="dialog" aria-label="${safeMonthName} — Cambiar mes">
                  <h1 id="month-title">${safeMonthName}</h1>
                  ${ICONS.chevronDown}
                  <input type="month" id="month-picker" value="${summary.month}" aria-label="Seleccionar mes" />
                </div>
                <button class="month-nav-arrow" id="next-month" aria-label="Mes siguiente" title="Mes siguiente">
                  ${ICONS.chevronRight}
                </button>
              </div>
            </div>
          </div>
          <div class="actions">
            <button class="icon-btn" id="toggle-theme" aria-label="Cambiar tema claro/oscuro">
              ${ICONS.sunMoon}
            </button>
            <button class="icon-btn" id="toggle-menu" aria-label="Menú de opciones" aria-expanded="false" aria-controls="dropdown-menu">
              ${ICONS.menu}
            </button>
          </div>
          <div id="dropdown-menu" class="dropdown-menu hidden" role="menu">
            ${
              this.currentUser
                ? `<div class="menu-user-card">
                    <span class="menu-user-name">${escapeHtml(this.currentUser.displayName || "Usuario en la nube")}</span>
                    <span class="menu-user-email">${escapeHtml(this.currentUser.email || "")}</span>
                  </div>
                  <button id="auth-logout" class="menu-item" role="menuitem">
                    ${ICONS.user} Cerrar sesión
                  </button>
                  <button id="migrate-data" class="menu-item" role="menuitem">
                    ${ICONS.upload} Subir datos locales a nube
                  </button>
                  <button id="open-settings" class="menu-item" role="menuitem">
                    ${ICONS.settings} Configuración
                  </button>
                  <button id="export-backup" class="menu-item" role="menuitem">
                    ${ICONS.download} Exportar copia (.cld)
                  </button>
                  <button id="import-trigger" class="menu-item" role="menuitem">
                    ${ICONS.upload} Importar copia (.cld)
                  </button>
                  <input type="file" id="import-file" accept=".cld,.json,.txt" style="display:none" aria-hidden="true" />
                  <button id="clear-data" class="menu-item danger" role="menuitem">
                    ${ICONS.trash} Restablecer datos
                  </button>`
                : `<button id="auth-login" class="menu-item btn-auth-google" role="menuitem">
                    ${ICONS.google} Conectar Google Cloud
                  </button>`
            }
          </div>
        </header>

        <div class="dashboard-grid">
          <!-- Columna Principal: Héroe y Métricas -->
          <div class="main-column">
            <section class="hero-card" aria-label="Disponible">
              <p class="eyebrow">Disponible neto</p>
              <p class="balance">${money.format(summary.net)}</p>
            </section>

            <section class="metrics-grid" aria-label="Resumen mensual">
              <div class="metric-card">
                <strong>${summary.deliveries}</strong>
                <span>Entregados</span>
              </div>
              <div class="metric-card">
                <strong>${money.format(summary.grossIncome)}</strong>
                <span>Generado</span>
              </div>
              <div class="metric-card">
                <strong>−${money.format(summary.debts)}</strong>
                <span>Deudas</span>
              </div>
              <div class="metric-card metric-card-interactive" id="card-expenses" role="button" tabindex="0" aria-label="Gastos fijos: −${money.format(summary.expenses)}. Clic para configurar gastos.">
                <strong>−${money.format(summary.expenses)}</strong>
                <span>Gastos</span>
              </div>
            </section>

            <section class="rhythm-card" aria-label="Ritmo de entregas">
              <div class="rhythm-icon">
                ${ICONS.rhythm}
              </div>
              <div class="rhythm-info">
                <h2>Ritmo activo</h2>
                <p>${summary.averagePerActiveDay.toFixed(1)} entregas/día (${summary.daysWithDeliveries} días activos)</p>
              </div>
            </section>

            <!-- Desglose Diario en 3 Columnas: Fecha, Entregados, Generado -->
            <section class="daily-card" aria-label="Desglose diario">
              <div class="daily-header">
                <h2>${ICONS.calendar} Desglose diario</h2>
                <div class="daily-header-actions">
                  <button id="toggle-daily-sort" class="sort-btn" aria-label="${this.dailySortOrder === "desc" ? "Recientes — Ordenar por fecha" : "Antiguos — Ordenar por fecha"}">
                    ${this.dailySortOrder === "desc" ? ICONS.sortDesc : ICONS.sortAsc}
                    <span>${this.dailySortOrder === "desc" ? "Recientes" : "Antiguos"}</span>
                  </button>
                  <span class="daily-count-badge">${summary.dailyBreakdown.length} días</span>
                </div>
              </div>
              <table class="daily-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th class="align-center">Entregados</th>
                    <th class="align-right">Generado</th>
                  </tr>
                </thead>
                <tbody>
                  ${dailyRows}
                </tbody>
              </table>
            </section>
          </div>

          <!-- Columna Secundaria: Escritorio (Entrada directa) -->
          <div class="side-column desktop-only-panel">
            <section class="section-panel">
              <h2>${ICONS.message} Entrada WhatsApp</h2>
              <div class="form-group">
                <label for="message" class="form-label">Pegar reporte</label>
                <textarea id="message" rows="4" placeholder="Pega aquí el reporte (*Nombre*, 08918, Recibidos: 50, Incidencias: 2, Entregados: 48)…"></textarea>
              </div>
              <button class="btn-primary" id="save-message">
                Guardar <span class="kbd-badge">⌘↵</span>
              </button>
            </section>

            <section class="section-panel">
              <h2>${ICONS.debt} Registro de Deuda</h2>
              <div class="inline-form">
                <input id="debt-amount" type="number" min="0.01" step="0.01" placeholder="Importe (€)" />
                <input id="debt-desc" type="text" placeholder="Concepto (opcional)" />
                <button class="btn-secondary" id="save-debt">Añadir</button>
              </div>
            </section>
          </div>
        </div>

        <p class="status" id="status" role="status" aria-live="polite"></p>

        <!-- Dock Flotante Móvil -->
        <nav class="mobile-dock" aria-label="Acciones rápidas">
          <button class="dock-btn" id="open-sheet-message">
            ${ICONS.message} Entrada
          </button>
          <button class="dock-btn" id="open-sheet-debt">
            ${ICONS.plus} Deuda
          </button>
        </nav>

        <!-- Bottom Sheet: WhatsApp Message (Mobile) -->
        <div class="sheet-overlay" id="sheet-message" aria-hidden="true" inert role="dialog" aria-modal="true" aria-labelledby="sheet-msg-title">
          <div class="sheet-content">
            <div class="sheet-handle"></div>
            <div class="sheet-header">
              <h2 id="sheet-msg-title">Entrada de WhatsApp</h2>
              <button class="sheet-close" id="close-sheet-message" aria-label="Cerrar">${ICONS.close}</button>
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <textarea id="sheet-message-input" rows="5" placeholder="Pega aquí el reporte de WhatsApp…"></textarea>
            </div>
            <button class="btn-primary" id="sheet-save-message" style="width: 100%;">Revisar y guardar</button>
          </div>
        </div>

        <!-- Bottom Sheet: Debt Entry (Mobile) -->
        <div class="sheet-overlay" id="sheet-debt" aria-hidden="true" inert role="dialog" aria-modal="true" aria-labelledby="sheet-debt-title">
          <div class="sheet-content">
            <div class="sheet-handle"></div>
            <div class="sheet-header">
              <h2 id="sheet-debt-title">Añadir Deuda</h2>
              <button class="sheet-close" id="close-sheet-debt" aria-label="Cerrar">${ICONS.close}</button>
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="sheet-debt-amount" class="form-label">Importe (€)</label>
              <input id="sheet-debt-amount" type="number" min="0.01" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label for="sheet-debt-desc" class="form-label">Concepto (Opcional)</label>
              <input id="sheet-debt-desc" type="text" placeholder="Ej. Combustible, peaje…" />
            </div>
            <button class="btn-primary" id="sheet-save-debt" style="width: 100%;">Guardar deuda</button>
          </div>
        </div>

        <!-- Modal de Configuración / Ajustes (Popup) -->
        <div class="modal-overlay ${this.isSettingsOpen ? "" : "hidden"}" id="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div class="modal-card">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="modal-icon">${ICONS.settings}</div>
                <h2 id="settings-title">Configuración & Gastos</h2>
              </div>
              <button class="modal-close" id="close-settings" aria-label="Cerrar ventana de configuración">${ICONS.close}</button>
            </div>

            <div class="modal-body">
              <!-- Sección 1: Perfil y Tarifa -->
              <section class="modal-section" aria-labelledby="section-profile-title">
                <h3 id="section-profile-title" class="section-subtitle">Perfil de Repartidor & Tarifa</h3>
                <div class="settings-grid">
                  <div class="form-group">
                    <label for="setting-courier-name" class="form-label">Nombre / Alias del Repartidor</label>
                    <input type="text" id="setting-courier-name" placeholder="usuario" value="${escapeHtml(this.currentSettings.courierName || "")}" />
                    <span class="form-hint">Usado para atribuirte tus entregas en reportes y exportaciones de WhatsApp.</span>
                  </div>
                  <div class="form-group">
                    <label for="setting-price" class="form-label">Precio por entrega (€)</label>
                    <input type="number" id="setting-price" step="0.01" min="0" max="1000" value="${Number.isFinite(this.currentSettings.pricePerDelivery) ? this.currentSettings.pricePerDelivery : 0.7}" />
                    <span class="form-hint">Tarifa bruta por cada paquete entregado.</span>
                  </div>
                </div>
                <button class="btn-primary btn-sm" id="btn-save-settings" style="margin-top: 10px;">
                  Guardar Perfil y Tarifa
                </button>
              </section>

              <hr class="modal-divider" />

              <!-- Sección 2: Gastos Fijos Mensuales -->
              <section class="modal-section" aria-labelledby="section-expenses-title">
                <div class="expenses-header">
                  <div>
                    <h3 id="section-expenses-title" class="section-subtitle">Gastos Fijos Mensuales</h3>
                    <p class="form-hint">Se deducen automáticamente cada mes de tu ingreso neto.</p>
                  </div>
                  <span class="badge-total-expense">Total: ${money.format(totalRecurringExpenses)}/mes</span>
                </div>

                <div class="expenses-list" id="expenses-list">
                  ${expensesListHtml}
                </div>

                <div class="add-expense-box">
                  <h4>Añadir nuevo gasto fijo</h4>
                  <div class="inline-form-expense">
                    <input type="text" id="new-expense-desc" placeholder="Concepto (ej. Habitación, Móvil, Seguro)" />
                    <input type="number" id="new-expense-amount" step="0.01" min="0.01" placeholder="Importe (€)" />
                    <button class="btn-secondary" id="btn-add-expense">Añadir</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    `;

    this.bindEvents();
  }

  showSuccess(message: string): void {
    this.setStatus(message, "success");
  }

  showError(message: string): void {
    this.setStatus(message, "error");
  }

  clearInputs(): void {
    const msg = this.root.querySelector<HTMLTextAreaElement>("#message");
    const sheetMsg = this.root.querySelector<HTMLTextAreaElement>("#sheet-message-input");
    const debtAmount = this.root.querySelector<HTMLInputElement>("#debt-amount");
    const sheetDebtAmount = this.root.querySelector<HTMLInputElement>("#sheet-debt-amount");
    const debtDesc = this.root.querySelector<HTMLInputElement>("#debt-desc");
    const sheetDebtDesc = this.root.querySelector<HTMLInputElement>("#sheet-debt-desc");

    if (msg) msg.value = "";
    if (sheetMsg) sheetMsg.value = "";
    if (debtAmount) debtAmount.value = "";
    if (sheetDebtAmount) sheetDebtAmount.value = "";
    if (debtDesc) debtDesc.value = "";
    if (sheetDebtDesc) sheetDebtDesc.value = "";
  }

  private bindEvents(): void {
    // Save Message Desktop
    this.root.querySelector("#save-message")?.addEventListener("click", async () => {
      const value = this.root.querySelector<HTMLTextAreaElement>("#message")?.value.trim();
      if (!value) return this.showError("Pega un mensaje antes de guardar.");
      await this.options?.onMessageSubmit(value);
    });

    // Save Message Mobile Sheet
    this.root.querySelector("#sheet-save-message")?.addEventListener("click", async () => {
      const value = this.root.querySelector<HTMLTextAreaElement>("#sheet-message-input")?.value.trim();
      if (!value) return this.showError("Pega un mensaje antes de guardar.");
      this.closeSheet("#sheet-message");
      await this.options?.onMessageSubmit(value);
    });

    // Save Debt Desktop
    this.root.querySelector("#save-debt")?.addEventListener("click", async () => {
      const amount = Number(this.root.querySelector<HTMLInputElement>("#debt-amount")?.value);
      const desc = this.root.querySelector<HTMLInputElement>("#debt-desc")?.value.trim();
      if (!Number.isFinite(amount) || amount <= 0) return this.showError("Introduce un importe de deuda válido.");
      await this.options?.onDebtSubmit(amount, desc);
    });

    // Save Debt Mobile Sheet
    this.root.querySelector("#sheet-save-debt")?.addEventListener("click", async () => {
      const amount = Number(this.root.querySelector<HTMLInputElement>("#sheet-debt-amount")?.value);
      const desc = this.root.querySelector<HTMLInputElement>("#sheet-debt-desc")?.value.trim();
      if (!Number.isFinite(amount) || amount <= 0) return this.showError("Introduce un importe de deuda válido.");
      this.closeSheet("#sheet-debt");
      await this.options?.onDebtSubmit(amount, desc);
    });

    // Keyboard Shortcut (Cmd+Enter or Ctrl+Enter) for Textarea
    const handleKeydown = async (e: KeyboardEvent, textareaId: string, submitFn: () => Promise<void>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        const active = document.activeElement;
        if (active && active.id === textareaId) {
          e.preventDefault();
          await submitFn();
        }
      }
    };

    this.root.addEventListener("keydown", (e) => {
      void handleKeydown(e as KeyboardEvent, "message", async () => {
        const value = this.root.querySelector<HTMLTextAreaElement>("#message")?.value.trim();
        if (value) await this.options?.onMessageSubmit(value);
      });
      void handleKeydown(e as KeyboardEvent, "sheet-message-input", async () => {
        const value = this.root.querySelector<HTMLTextAreaElement>("#sheet-message-input")?.value.trim();
        if (value) {
          this.closeSheet("#sheet-message");
          await this.options?.onMessageSubmit(value);
        }
      });
    });

    // Month picker
    const monthPicker = this.root.querySelector<HTMLInputElement>("#month-picker");
    const monthCapsule = this.root.querySelector<HTMLElement>(".month-capsule");

    const openMonthPicker = () => {
      if (monthPicker && typeof monthPicker.showPicker === "function") {
        try {
          monthPicker.showPicker();
        } catch {
          // Fallback for older browsers
        }
      }
    };

    monthCapsule?.addEventListener("click", openMonthPicker);
    monthPicker?.addEventListener("click", (e) => {
      e.stopPropagation();
      openMonthPicker();
    });

    monthPicker?.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value) {
        this.options?.onMonthChange(target.value);
      }
    });

    // Previous / Next Month Navigation Buttons
    this.root.querySelector("#prev-month")?.addEventListener("click", () => {
      if (this.lastSummary) {
        this.options?.onMonthChange(getAdjacentMonth(this.lastSummary.month, -1));
      }
    });

    this.root.querySelector("#next-month")?.addEventListener("click", () => {
      if (this.lastSummary) {
        this.options?.onMonthChange(getAdjacentMonth(this.lastSummary.month, 1));
      }
    });

    // Toggle Theme (Light / Dark)
    this.root.querySelector("#toggle-theme")?.addEventListener("click", () => {
      this.toggleTheme();
    });

    // Toggle Daily Sort (Desc / Asc)
    this.root.querySelector("#toggle-daily-sort")?.addEventListener("click", () => {
      this.dailySortOrder = this.dailySortOrder === "desc" ? "asc" : "desc";
      if (this.lastSummary) {
        this.render(this.lastSummary);
      }
    });

    // Toggle Dropdown Menu
    const menuBtn = this.root.querySelector("#toggle-menu");
    const dropdown = this.root.querySelector("#dropdown-menu");
    menuBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = dropdown?.classList.contains("hidden");
      dropdown?.classList.toggle("hidden");
      menuBtn.setAttribute("aria-expanded", String(isHidden));
    });

    document.addEventListener("click", () => {
      if (dropdown && !dropdown.classList.contains("hidden")) {
        dropdown.classList.add("hidden");
        menuBtn?.setAttribute("aria-expanded", "false");
      }
    });

    // Mobile Dock Sheet Triggers
    this.root.querySelector("#open-sheet-message")?.addEventListener("click", () => {
      this.openSheet("#sheet-message");
    });
    this.root.querySelector("#close-sheet-message")?.addEventListener("click", () => {
      this.closeSheet("#sheet-message");
    });

    this.root.querySelector("#open-sheet-debt")?.addEventListener("click", () => {
      this.openSheet("#sheet-debt");
    });
    this.root.querySelector("#close-sheet-debt")?.addEventListener("click", () => {
      this.closeSheet("#sheet-debt");
    });

    // Close Sheet on Overlay Click
    this.root.querySelectorAll(".sheet-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("active");
          overlay.setAttribute("aria-hidden", "true");
        }
      });
    });

    // Export Backup
    this.root.querySelector("#export-backup")?.addEventListener("click", async () => {
      await this.options?.onExport();
    });

    // Import Backup
    this.root.querySelector("#import-trigger")?.addEventListener("click", () => {
      this.root.querySelector<HTMLInputElement>("#import-file")?.click();
    });

    this.root.querySelector("#import-file")?.addEventListener("change", async (e) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        await this.options?.onImport(file);
      }
    });

    // Auth Handlers
    this.root.querySelector("#auth-login")?.addEventListener("click", async () => {
      await this.options?.onLogin?.();
    });

    this.root.querySelector("#auth-logout")?.addEventListener("click", async () => {
      await this.options?.onLogout?.();
    });

    this.root.querySelector("#migrate-data")?.addEventListener("click", async () => {
      await this.options?.onMigrateLocalData?.();
    });

    // Clear Data
    this.root.querySelector("#clear-data")?.addEventListener("click", async () => {
      if (confirm("¿Estás seguro de que quieres borrar todos los datos locales?")) {
        await this.options?.onClear();
      }
    });

    // Settings Modal Triggers
    this.root.querySelector("#open-settings")?.addEventListener("click", () => {
      this.openSettings();
    });
    this.root.querySelector("#card-expenses")?.addEventListener("click", () => {
      this.openSettings();
    });
    this.root.querySelector("#card-expenses")?.addEventListener("keydown", (e) => {
      const event = e as KeyboardEvent;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.openSettings();
      }
    });
    this.root.querySelector("#close-settings")?.addEventListener("click", () => {
      this.closeSettings();
    });
    const settingsModal = this.root.querySelector("#settings-modal");
    settingsModal?.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        this.closeSettings();
      }
    });

    // Save Settings
    this.root.querySelector("#btn-save-settings")?.addEventListener("click", async () => {
      const courierInput = this.root.querySelector<HTMLInputElement>("#setting-courier-name");
      const priceInput = this.root.querySelector<HTMLInputElement>("#setting-price");
      const courierName = courierInput?.value.trim() || undefined;
      const pricePerDelivery = Number.parseFloat(priceInput?.value || "0.7");

      if (Number.isNaN(pricePerDelivery) || pricePerDelivery < 0) {
        this.showError("El precio por entrega debe ser un número positivo.");
        return;
      }

      await this.options?.onSaveSettings?.({
        ...this.currentSettings,
        courierName,
        pricePerDelivery,
      });
    });

    // Add Expense
    this.root.querySelector("#btn-add-expense")?.addEventListener("click", async () => {
      const descInput = this.root.querySelector<HTMLInputElement>("#new-expense-desc");
      const amountInput = this.root.querySelector<HTMLInputElement>("#new-expense-amount");
      const desc = descInput?.value.trim();
      const amount = Number.parseFloat(amountInput?.value || "");

      if (!desc) {
        this.showError("Ingresa una descripción para el gasto (ej. Habitación, Móvil).");
        return;
      }

      if (Number.isNaN(amount) || amount <= 0) {
        this.showError("Ingresa un importe válido mayor a 0.");
        return;
      }

      await this.options?.onAddExpense?.(amount, desc);
      if (descInput) descInput.value = "";
      if (amountInput) amountInput.value = "";
    });

    // Delete Expense
    this.root.querySelectorAll(".btn-delete-expense").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const target = e.currentTarget as HTMLElement;
        const id = target.getAttribute("data-id");
        if (id) {
          await this.options?.onDeleteExpense?.(id);
        }
      });
    });

    // Global Escape Key to Close Settings
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isSettingsOpen) {
        this.closeSettings();
      }
    });
  }

  showMigrationBanner(count: number, onConfirm: () => Promise<void>): void {
    const existing = document.querySelector("#cloud-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.id = "cloud-banner";
    banner.className = "cloud-banner";
    banner.innerHTML = `
      <div class="cloud-banner-body">
        <div class="cloud-banner-icon">${ICONS.upload}</div>
        <div class="cloud-banner-text">
          <h4>Sincronizar datos locales</h4>
          <p>Tienes ${Math.max(0, Math.floor(Number(count) || 0))} registro(s) guardado(s) en este navegador. ¿Deseas subirlos a tu cuenta de Google Cloud?</p>
        </div>
      </div>
      <div class="cloud-banner-actions">
        <button class="btn-secondary" id="banner-dismiss" style="min-height: 36px; padding: 0 14px; font-size: 13px;">Mantener en navegador</button>
        <button class="btn-primary" id="banner-confirm" style="min-height: 36px; padding: 0 16px; font-size: 13px;">Sincronizar a la Nube</button>
      </div>
    `;

    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add("active"));

    const closeBanner = () => {
      banner.classList.remove("active");
      setTimeout(() => banner.remove(), 350);
    };

    banner.querySelector("#banner-dismiss")?.addEventListener("click", closeBanner);
    banner.querySelector("#banner-confirm")?.addEventListener("click", async () => {
      closeBanner();
      await onConfirm();
    });
  }

  private initNetworkListeners(): void {
    if (typeof window === "undefined") return;
    window.addEventListener("online", () => {
      this.isOnline = true;
      if (this.lastSummary) this.render(this.lastSummary);
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
      if (this.lastSummary) this.render(this.lastSummary);
    });
  }

  private openSheet(selector: string): void {
    const sheet = this.root.querySelector<HTMLElement>(selector);
    if (sheet) {
      sheet.removeAttribute("inert");
      sheet.classList.add("active");
      sheet.setAttribute("aria-hidden", "false");
      const textarea = sheet.querySelector<HTMLTextAreaElement | HTMLInputElement>("textarea, input");
      textarea?.focus();
    }
  }

  private closeSheet(selector: string): void {
    const sheet = this.root.querySelector<HTMLElement>(selector);
    if (sheet) {
      sheet.setAttribute("inert", "");
      sheet.classList.remove("active");
      sheet.setAttribute("aria-hidden", "true");
    }
  }

  private toggleTheme(): void {
    const isSystemDark = typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentTheme = document.documentElement.dataset.theme || (isSystemDark ? "dark" : "light");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("claudio_theme", nextTheme);

    const metaTheme = document.querySelector("#meta-theme-color");
    if (metaTheme) {
      metaTheme.setAttribute("content", nextTheme === "dark" ? "#0c0c0d" : "#f7f7f5");
    }
  }

  private restoreTheme(): void {
    const saved = localStorage.getItem("claudio_theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.dataset.theme = saved;
      const metaTheme = document.querySelector("#meta-theme-color");
      if (metaTheme) {
        metaTheme.setAttribute("content", saved === "dark" ? "#0c0c0d" : "#f7f7f5");
      }
    }
  }

  private setStatus(message: string, type: "success" | "error"): void {
    const status = this.root.querySelector<HTMLElement>("#status");
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
  }
}