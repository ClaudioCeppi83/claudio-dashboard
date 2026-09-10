import "./styles.css";
import { calculateMonth } from "./domain/calculations";
import { parseWhatsAppMessage } from "./domain/parser";
import { BrowserStore } from "./infrastructure/browser-store";
import { loginWithGoogle, logoutFirebase, subscribeToAuth } from "./infrastructure/firebase-config";
import { FirestoreStore } from "./infrastructure/firestore-store";
import { Repository } from "./infrastructure/repository";
import { DashboardView } from "./ui/dashboard-view";

const repository = new Repository();
const localStore = new BrowserStore();
const view = new DashboardView(document.querySelector("#app")!);

let currentMonth = new Date().toISOString().slice(0, 7);
let activeUser: { displayName: string | null; email: string | null } | null = null;
let userManuallySelectedMonth = false;

async function render(): Promise<void> {
  const data = await repository.load();
  if (!userManuallySelectedMonth && data.deliveries.length > 0) {
    const hasCurrentDeliveries = data.deliveries.some((d) => d.date.startsWith(currentMonth));
    if (!hasCurrentDeliveries) {
      const activeMonths = Array.from(new Set(data.deliveries.map((d) => d.date.slice(0, 7)))).sort();
      const latestMonth = activeMonths[activeMonths.length - 1];
      if (latestMonth) {
        currentMonth = latestMonth;
      }
    }
  }
  view.render(calculateMonth(data, currentMonth), data.settings, data.expenses);
}

async function migrateLocalDataToCloud(userId: string): Promise<number> {
  const cloudStore = new FirestoreStore(userId);
  const localDeliveries = await localStore.readAll<unknown>("deliveries");
  const localDebts = await localStore.readAll<unknown>("debts");
  const localExpenses = await localStore.readAll<unknown>("expenses");
  const localRaw = await localStore.readAll<unknown>("raw");
  const localSettings = await localStore.readAll<unknown>("settings");

  let totalMigrated = 0;

  for (const item of localDeliveries) {
    await cloudStore.append("deliveries", item);
    totalMigrated++;
  }
  for (const item of localDebts) {
    await cloudStore.append("debts", item);
  }
  for (const item of localExpenses) {
    await cloudStore.append("expenses", item);
  }
  for (const item of localRaw) {
    await cloudStore.append("raw", item);
  }
  for (const item of localSettings) {
    await cloudStore.append("settings", item);
  }

  if (totalMigrated > 0) {
    await localStore.clearAll();
  }

  return totalMigrated;
}

function getTargetCourier(settingsCourier?: string, displayName?: string | null): string {
	const configured = settingsCourier?.trim();
	if (configured) return configured;
	const sessionName = displayName?.trim().split(/\s+/)[0];
	if (sessionName) return sessionName;
	return "usuario";
}

async function bootstrap(): Promise<void> {
  view.setHandlers({
    onMessageSubmit: async (message) => {
      const current = await repository.load();
      const targetCourier = getTargetCourier(current.settings.courierName, activeUser?.displayName);
      const parsed = parseWhatsAppMessage(message, targetCourier);
      if (!parsed.success) {
        view.showError(parsed.error);
        return;
      }
      let addedCount = 0;
      let duplicateCount = 0;
      let lastDeliveryMonth = currentMonth;

      for (const item of parsed.values) {
        const isDuplicate = current.deliveries.some(
          (existing) =>
            existing.courier.toLowerCase() === item.delivery.courier.toLowerCase() &&
            existing.route === item.delivery.route &&
            existing.date === item.delivery.date,
        );

        if (isDuplicate) {
          duplicateCount++;
          continue;
        }

        await repository.addDelivery(item.delivery, item.rawMessage);
        addedCount++;
        lastDeliveryMonth = item.delivery.date.slice(0, 7);
      }

      const courierNotice = parsed.otherCouriersOmitted > 0
        ? ` (${parsed.otherCouriersOmitted} de otros repartidores omitidos)`
        : "";

      if (addedCount === 0 && duplicateCount > 0) {
        view.showError(`Se omitieron ${duplicateCount} registro(s) por estar ya guardados (duplicados).${courierNotice}`);
        return;
      }

      if (addedCount === 0) {
        view.showError(`No se pudo guardar ninguna entrega.${courierNotice}`);
        return;
      }

      if (lastDeliveryMonth !== currentMonth) {
        currentMonth = lastDeliveryMonth;
      }

      await render();
      view.clearInputs();

      const successMsg = duplicateCount > 0
        ? `Se guardaron ${addedCount} entrega(s) correctamente (${duplicateCount} duplicadas omitidas).${courierNotice}`
        : addedCount === 1
          ? `Entrega procesada y guardada correctamente.${courierNotice}`
          : `Se procesaron y guardaron ${addedCount} entregas en lote.${courierNotice}`;

      view.showSuccess(successMsg);
    },

    onDebtSubmit: async (amount, description) => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayMonth = todayStr.slice(0, 7);
      const targetDate = currentMonth === todayMonth ? todayStr : `${currentMonth}-01`;

      await repository.addDebt(amount, description, targetDate);
      await render();
      view.clearInputs();
      view.showSuccess("Deuda añadida correctamente.");
    },

    onMonthChange: (month) => {
      userManuallySelectedMonth = true;
      currentMonth = month;
      void render();
    },

    onExport: async () => {
      const exported = await repository.exportAllData();
      const content = exported["deliveries.cld"] ?? "";
      if (!content.trim()) {
        view.showError("No hay datos cargados para exportar.");
        return;
      }
      const blob = new Blob([content], { type: "application/x-ndjson" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `claudio_deliveries_${currentMonth}.cld`;
      a.click();
      URL.revokeObjectURL(url);
      view.showSuccess("Copia de seguridad (.cld) descargada.");
    },

    onImport: async (file) => {
      try {
        const text = await file.text();
        if (file.name.endsWith(".txt") || (!text.trim().startsWith("{") && /entreg/i.test(text))) {
          const current = await repository.load();
          const targetCourier = getTargetCourier(current.settings.courierName, activeUser?.displayName);
          const parsed = parseWhatsAppMessage(text, targetCourier);
          if (!parsed.success) {
            view.showError(parsed.error);
            return;
          }
          let addedCount = 0;
          let duplicateCount = 0;
          let lastDeliveryMonth = currentMonth;

          for (const item of parsed.values) {
            const isDuplicate = current.deliveries.some(
              (existing) =>
                existing.courier.toLowerCase() === item.delivery.courier.toLowerCase() &&
                existing.route === item.delivery.route &&
                existing.date === item.delivery.date,
            );

            if (isDuplicate) {
              duplicateCount++;
              continue;
            }

            await repository.addDelivery(item.delivery, item.rawMessage);
            addedCount++;
            lastDeliveryMonth = item.delivery.date.slice(0, 7);
          }

          const dupNotice = duplicateCount > 0 ? ` (${duplicateCount} duplicadas omitidas)` : "";
          const courierNotice = parsed.otherCouriersOmitted > 0
            ? ` (${parsed.otherCouriersOmitted} de otros repartidores omitidos)`
            : "";

          if (lastDeliveryMonth !== currentMonth) {
            currentMonth = lastDeliveryMonth;
          }

          await render();
          view.showSuccess(`Se importaron ${addedCount} entregas desde ${file.name}.${dupNotice}${courierNotice}`);
          return;
        }

        const count = await repository.getDriver().importNDJSON("deliveries", text);
        await render();
        view.showSuccess(`Se importaron ${count} registros desde ${file.name}.`);
      } catch {
        view.showError("Error al importar el archivo.");
      }
    },

    onClear: async () => {
      await repository.clearAllData();
      await render();
      view.showSuccess("Datos restablecidos.");
    },

    onLogin: async () => {
      try {
        const user = await loginWithGoogle();
        view.showSuccess(`Bienvenido, ${user.displayName || user.email}`);
      } catch (err) {
        const error = err as Error;
        view.showError(`Error al iniciar sesión: ${error.message}`);
      }
    },

    onLogout: async () => {
      try {
        await logoutFirebase();
        view.showSuccess("Sesión cerrada. Modo almacenamiento local activo.");
      } catch (err) {
        const error = err as Error;
        view.showError(`Error al cerrar sesión: ${error.message}`);
      }
    },

    onMigrateLocalData: async () => {
      const currentDriver = repository.getDriver();
      if (currentDriver instanceof FirestoreStore) {
        const userId = (currentDriver as unknown as { userId: string }).userId;
        const count = await migrateLocalDataToCloud(userId);
        await render();
        if (count > 0) {
          view.showSuccess(`Se migraron ${count} entregas locales a Cloud Firestore.`);
        } else {
          view.showError("No hay datos locales pendientes por migrar.");
        }
      } else {
        view.showError("Inicia sesión primero para subir tus datos a Google Cloud.");
      }
    },

    onSaveSettings: async (settings) => {
      await repository.saveSettings(settings);
      await render();
      view.showSuccess("Perfil y tarifas guardados correctamente.");
    },

    onAddExpense: async (amount, description) => {
      await repository.addExpense(amount, description, true);
      await render();
      view.showSuccess(`Gasto fijo "${description}" añadido.`);
    },

    onDeleteExpense: async (id) => {
      await repository.deleteExpense(id);
      await render();
      view.showSuccess("Gasto fijo eliminado.");
    },
  });

  // Subscribe to Firebase Auth state
  subscribeToAuth(async (user) => {
    if (user) {
      activeUser = { displayName: user.displayName, email: user.email };
      repository.setDriver(new FirestoreStore(user.uid));
      view.setUser(activeUser);
      
      // Auto-prompt migration if local data exists using non-blocking Glass Banner
      const localDeliveries = await localStore.readAll("deliveries");
      if (localDeliveries.length > 0) {
        view.showMigrationBanner(localDeliveries.length, async () => {
          const count = await migrateLocalDataToCloud(user.uid);
          await render();
          view.showSuccess(`Se sincronizaron ${count} entregas locales a la nube.`);
        });
      }
    } else {
      activeUser = null;
      repository.setDriver(localStore);
      view.setUser(null);
    }
    await render();
  });
}

void bootstrap();