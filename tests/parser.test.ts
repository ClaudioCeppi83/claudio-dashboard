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
});