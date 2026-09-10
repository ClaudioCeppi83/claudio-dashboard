import { describe, expect, it } from "vitest";
import { parseWhatsAppMessage } from "../src/domain/parser";

describe("parseWhatsAppMessage domain parser", () => {
  it("parses valid formatted report with asterisk headers and zero incidents", () => {
    const result = parseWhatsAppMessage(`*Claudio*
08918
26/08/2026
Recibidos: 52
*Incidencias: 03
Entregados: 49`);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.delivery.courier).toBe("Claudio");
      expect(result.value.delivery.route).toBe("08918");
      expect(result.value.delivery.date).toBe("2026-08-26");
      expect(result.value.delivery.received).toBe(52);
      expect(result.value.delivery.incidents).toBe(3);
      expect(result.value.delivery.delivered).toBe(49);
    }
  });

  it("parses report without asterisks in courier name and tight colons (e.g. Recibidos:30)", () => {
    const result = parseWhatsAppMessage(`Claudio
08918
17/07/2026
Recibidos:30
*Incidencias:1
Entregados:29`);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.delivery.courier).toBe("Claudio");
      expect(result.value.delivery.route).toBe("08918");
      expect(result.value.delivery.date).toBe("2026-07-17");
      expect(result.value.delivery.received).toBe(30);
      expect(result.value.delivery.incidents).toBe(1);
      expect(result.value.delivery.delivered).toBe(29);
    }
  });

  it("handles hyphens (-, --, ---) and '00' as zero incidents correctly", () => {
    const reportSingleDash = parseWhatsAppMessage(`*Claudio*
08918
26/08/2026
Recibidos: 50
*Incidencias: -
Entregados: 50`);
    expect(reportSingleDash.success).toBe(true);
    if (reportSingleDash.success) {
      expect(reportSingleDash.value.delivery.incidents).toBe(0);
    }

    const reportTripleDash = parseWhatsAppMessage(`*Claudio*
08918
26/08/2026
Recibidos: 50
*Incidencias: ---
Entregados: 50`);
    expect(reportTripleDash.success).toBe(true);
    if (reportTripleDash.success) {
      expect(reportTripleDash.value.delivery.incidents).toBe(0);
    }

    const reportDoubleZero = parseWhatsAppMessage(`*Claudio*
08918
26/08/2026
Recibidos: 50
*Incidencias: 00
Entregados: 50`);
    expect(reportDoubleZero.success).toBe(true);
    if (reportDoubleZero.success) {
      expect(reportDoubleZero.value.delivery.incidents).toBe(0);
    }
  });

  it("parses multiple reports pasted together in a single text block", () => {
    const multiMessage = `Claudio
08918
06/07/2026
Recibidos: 30
*Incidencias: 1
Entregados: 29

Claudio
08918
07/07/2026
Recibidos: 40
*Incidencias: -
Entregados: 40

Claudio
08918
08/07/2026
Recibidos: 50
*Incidencias: 0
Entregados: 50`;

    const result = parseWhatsAppMessage(multiMessage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.values.length).toBe(3);
      expect(result.values[0]!.delivery.date).toBe("2026-07-06");
      expect(result.values[1]!.delivery.date).toBe("2026-07-07");
      expect(result.values[2]!.delivery.date).toBe("2026-07-08");
    }
  });

  it("filters WhatsApp export chats with timestamp headers to extract target courier only", () => {
    const chatExport = `[26/08/26 19:40:00] Los mensajes y llamadas están cifrados de extremo a extremo.
[26/08/26 19:42:10] Claudio: *Claudio*
08918
26/08/2026
Recibidos: 50
*Incidencias: 0
Entregados: 50

[26/08/26 19:45:00] Juan: *Juan*
08919
26/08/2026
Recibidos: 40
*Incidencias: 1
Entregados: 39

[27/08/26 19:40:12] Claudio: *Claudio*
08918
27/08/2026
Recibidos: 45
*Incidencias: 0
Entregados: 45`;

		const result = parseWhatsAppMessage(chatExport, "Claudio");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.values.length).toBe(2);
			expect(result.values[0]!.delivery.courier).toBe("Claudio");
			expect(result.values[0]!.delivery.date).toBe("2026-08-26");
			expect(result.values[1]!.delivery.courier).toBe("Claudio");
			expect(result.values[1]!.delivery.date).toBe("2026-08-27");
			expect(result.otherCouriersOmitted).toBe(1);
		}
	});

	it("parses new hypothetical employees universally without hardcoded names", () => {
		const newEmployeeReport = `Lucía
08920
05/09/2026
Recibidos: 35
*Incidencias: 02
Entregados: 33`;

		const result = parseWhatsAppMessage(newEmployeeReport, "Lucia");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.delivery.courier).toBe("Lucía");
			expect(result.value.delivery.delivered).toBe(33);
			expect(result.value.delivery.route).toBe("08920");
		}
	});

	it("parses Sofia format with dots, 'Entregas', and omitted incidents line", () => {
		const sofiaReport = `Sofia
08918
17.07.2026
Recibidos 28
Entregas 28`;

		const result = parseWhatsAppMessage(sofiaReport, "Sofia");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.delivery.date).toBe("2026-07-17");
			expect(result.value.delivery.received).toBe(28);
			expect(result.value.delivery.delivered).toBe(28);
			expect(result.value.delivery.incidents).toBe(0);
		}
	});

	it("parses Alexander format with 2-digit year and singular 'Recibido'", () => {
		const alexReport = `Alexander
08930
18/07/26
Recibido 48
Entregados 48`;

		const result = parseWhatsAppMessage(alexReport, "Alexander");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.delivery.date).toBe("2026-07-18");
			expect(result.value.delivery.received).toBe(48);
			expect(result.value.delivery.delivered).toBe(48);
		}
	});

	it("reconciles 2025 year typo to 2026 using WhatsApp message header timestamp", () => {
		const omarChat = `17/7/26, 8:10 p. m. - Omar Gervez: Omar
08918-08930
17/07/2025
Recibidos:29
*Incidencias:3
Entregados:26`;

		const result = parseWhatsAppMessage(omarChat, "Omar");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.delivery.date).toBe("2026-07-17");
			expect(result.value.delivery.route).toBe("08918-08930");
			expect(result.value.delivery.delivered).toBe(26);
		}
	});

	it("reconciles copied template date when sent on the following day", () => {
		const copiedTemplateChat = `31/7/26, 3:05 p. m. - Claudio: *Claudio*
08918
31/07/2026
Recibidos: 21
*Incidencias: ---
Entregados: 21

1/8/26, 4:28 p. m. - Claudio: *Claudio*
08918
31/07/2026
Recibidos: 20
*Incidencias: 03
Entregados: 17`;

		const result = parseWhatsAppMessage(copiedTemplateChat, "Claudio");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.values.length).toBe(2);
			expect(result.values[0]!.delivery.date).toBe("2026-07-31");
			expect(result.values[1]!.delivery.date).toBe("2026-08-01");
			expect(result.values[1]!.delivery.delivered).toBe(17);
		}
	});

	it("extracts specific connected courier from real chat export file", async () => {
		const fs = await import("node:fs");
		const chatPath = "/home/erceppi/.gemini/antigravity-ide/brain/7db268fe-4ef0-4c3b-9fcd-6613b955d41b/scratch/Chat de WhatsApp con REPORTE FINAL COD 08918 Y 08930.txt";

		if (!fs.existsSync(chatPath)) {
			return;
		}

		const realChat = fs.readFileSync(chatPath, "utf-8");

		// Claudio connected
		const claudioResult = parseWhatsAppMessage(realChat, "Claudio");
		expect(claudioResult.success).toBe(true);
		if (claudioResult.success) {
			expect(claudioResult.values.length).toBe(39);
			expect(claudioResult.values.every((v) => v.delivery.courier.toLowerCase().includes("claudio"))).toBe(true);
			// Verify all dates were reconciled to 2026 (no 2025 left)
			expect(claudioResult.values.every((v) => v.delivery.date.startsWith("2026"))).toBe(true);
		}

		// Omar connected
		const omarResult = parseWhatsAppMessage(realChat, "Omar");
		expect(omarResult.success).toBe(true);
		if (omarResult.success) {
			expect(omarResult.values.length).toBe(47);
			expect(omarResult.values.every((v) => v.delivery.date.startsWith("2026"))).toBe(true);
			expect(omarResult.values.every((v) => v.delivery.route === "08918-08930")).toBe(true);
		}

		// Alexander connected
		const alexResult = parseWhatsAppMessage(realChat, "Alexander");
		expect(alexResult.success).toBe(true);
		if (alexResult.success) {
			expect(alexResult.values.length).toBe(45);
			expect(alexResult.values.every((v) => v.delivery.date.startsWith("2026"))).toBe(true);
		}

		// Sofia connected
		const sofiaResult = parseWhatsAppMessage(realChat, "Sofia");
		expect(sofiaResult.success).toBe(true);
		if (sofiaResult.success) {
			expect(sofiaResult.values.length).toBe(22);
		}

		// Unauthenticated guest "usuario" returns all recognized reports
		const guestResult = parseWhatsAppMessage(realChat, "usuario");
		expect(guestResult.success).toBe(true);
		if (guestResult.success) {
			expect(guestResult.values.length).toBeGreaterThan(200);
			expect(guestResult.otherCouriersOmitted).toBe(0);
		}
	});
});