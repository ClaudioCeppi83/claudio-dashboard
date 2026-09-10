import type { MonthlySummary } from "../domain/calculations";

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
}

// Minimalist SVG Vector Icons (Eliminating Emojis)
const ICONS = {
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>`,
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

export class DashboardView {
  private readonly root: HTMLElement;
  private options?: DashboardViewOptions;
  private dailySortOrder: "desc" | "asc" = "desc";
  private lastSummary?: MonthlySummary;
  private currentUser: { displayName?: string | null; email?: string | null } | null = null;
  private isOnline: boolean = typeof window !== "undefined" ? window.navigator.onLine : true;

  constructor(root: HTMLElement) {
    this.root = root;
    this.restoreTheme();
    this.initNetworkListeners();
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

  render(summary: MonthlySummary): void {
    this.lastSummary = summary;

    const money = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    });

    const rawFirstName = this.currentUser?.displayName
      ? this.currentUser.displayName.trim().split(" ")[0]
      : null;
    const greetingText = rawFirstName
      ? `Hola, ${escapeHtml(rawFirstName)}`
      : "Hola, Invitado";

    let syncBadgeHtml = `<span class="sync-badge local"><span class="sync-dot"></span>Modo Local</span>`;
    if (this.currentUser) {
      syncBadgeHtml = this.isOnline
        ? `<span class="sync-badge online" title="Sincronización directa con Google Cloud"><span class="sync-dot"></span>Nube</span>`
        : `<span class="sync-badge offline" title="Sin conexión a internet. Los cambios se guardarán en la nube al volver la red."><span class="sync-dot"></span>Sin conexión (En cola)</span>`;
    }

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
              <div class="month-capsule" role="button" aria-haspopup="dialog" aria-label="${safeMonthName} — Cambiar mes">
                <h1 id="month-title">${safeMonthName}</h1>
                ${ICONS.chevronDown}
                <input type="month" id="month-picker" value="${summary.month}" aria-label="Seleccionar mes" />
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
                  </button>`
                : `<button id="auth-login" class="menu-item btn-auth-google" role="menuitem">
                    ${ICONS.google} Conectar Google Cloud
                  </button>`
            }
            <button id="export-backup" class="menu-item" role="menuitem">
              ${ICONS.download} Exportar copia (.cld)
            </button>
            <button id="import-trigger" class="menu-item" role="menuitem">
              ${ICONS.upload} Importar copia (.cld)
            </button>
            <input type="file" id="import-file" accept=".cld,.json,.txt" style="display:none" aria-hidden="true" />
            <button id="clear-data" class="menu-item danger" role="menuitem">
              ${ICONS.trash} Restablecer datos
            </button>
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
              <div class="metric-card">
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