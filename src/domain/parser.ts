import type { Delivery } from "./models";

export interface ParsedDelivery {
  readonly delivery: Delivery;
  readonly rawMessage: string;
}

export type ParseResult =
  | {
      readonly success: true;
      readonly value: ParsedDelivery;
      readonly values: ParsedDelivery[];
      readonly otherCouriersOmitted: number;
    }
  | { readonly success: false; readonly error: string };

const patterns = {
  route: /^\s*(\d{5})\s*$/m,
  date: /(\d{1,2}\/\d{1,2}\/\d{4})/,
  received: /Recibidos:?\s*(\d+)/i,
  incidents: /(?:\*|\s)*Incidencias:?\s*([^\r\n]+)/i,
  delivered: /Entregados:?\s*(\d+)/i,
};

/** Converts the known WhatsApp report format (single, multi, or chat export) into validated domain candidates. */
export function parseWhatsAppMessage(message: string, targetCourier?: string): ParseResult {
  const chunks = splitIntoReportChunks(message);

  if (chunks.length === 0) {
    return { success: false, error: "No se pudieron reconocer reportes válidos en el mensaje." };
  }

  const allValues: ParsedDelivery[] = [];
  const errors: string[] = [];

  for (const chunk of chunks) {
    const res = parseSingleReport(chunk);
    if (res.success) {
      allValues.push(res.value);
    } else {
      errors.push(res.error);
    }
  }

  if (allValues.length === 0) {
    return {
      success: false,
      error: errors[0] ?? "No se pudieron reconocer todos los campos del mensaje (repartidor, ruta, fecha, recibidos, incidencias, entregados).",
    };
  }

  let finalValues = allValues;
  let omitted = 0;

  if (targetCourier && targetCourier.trim().length > 0) {
    const normTarget = normalizeName(targetCourier);
    finalValues = allValues.filter((v) => normalizeName(v.delivery.courier).includes(normTarget) || normTarget.includes(normalizeName(v.delivery.courier)));
    omitted = allValues.length - finalValues.length;

    if (finalValues.length === 0) {
      return {
        success: false,
        error: `Se encontraron ${allValues.length} reportes, pero ninguno pertenece a "${targetCourier}".`,
      };
    }
  }

  return {
    success: true,
    value: finalValues[0]!,
    values: finalValues,
    otherCouriersOmitted: omitted,
  };
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Identifies boundaries of reports inside single paste or WhatsApp exported text. */
function splitIntoReportChunks(message: string): string[] {
  const lines = message.split(/\r?\n/);
  const routeLineIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // Match 5-digit route alone on a line, or preceded by WhatsApp metadata like [09/03/2026, 21:00] Name: 28001
    if (/^\s*\d{5}\s*$/.test(line) || /:\s*\d{5}\s*$/.test(line)) {
      routeLineIndices.push(i);
    }
  }

  if (routeLineIndices.length <= 1) {
    return [message.trim()];
  }

  const chunks: string[] = [];
  for (let k = 0; k < routeLineIndices.length; k++) {
    const startIdx = routeLineIndices[k]!;
    const courierLineIdx = startIdx > 0 ? startIdx - 1 : startIdx;
    const endIdx = k + 1 < routeLineIndices.length ? routeLineIndices[k + 1]! - 1 : lines.length;

    const chunkLines = lines.slice(courierLineIdx, endIdx);
    chunks.push(chunkLines.join("\n").trim());
  }

  return chunks;
}

function parseSingleReport(rawChunk: string): { success: true; value: ParsedDelivery } | { success: false; error: string } {
  // Strip typical WhatsApp export headers like "[09/03/26, 21:30:15] ~ Claudio:" or "[09/03/2026, 21:30] Nombre:"
  const cleanChunk = rawChunk
    .replace(/^\[\d{1,2}\/\d{1,2}\/\d{2,4}[^\]]*\]\s*([^:]+:\s*)?/gm, "")
    .replace(/^\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}\s*-\s*([^:]+:\s*)?/gm, "");

  const routeMatch = cleanChunk.match(patterns.route);
  const dateMatch = cleanChunk.match(patterns.date);
  const receivedMatch = cleanChunk.match(patterns.received);
  const incidentsMatch = cleanChunk.match(patterns.incidents);
  const deliveredMatch = cleanChunk.match(patterns.delivered);

  const courier = extractCourier(cleanChunk);
  const route = routeMatch?.[1];
  const date = dateMatch?.[1] ? normalizeDate(dateMatch[1]) : undefined;
  const received = number(receivedMatch?.[1]);
  const incidents = parseIncidents(incidentsMatch?.[1]);
  const delivered = number(deliveredMatch?.[1]);

  if (!courier || !route || !date || received === undefined || incidents === undefined || delivered === undefined) {
    return {
      success: false,
      error: "Faltan campos requeridos en el reporte.",
    };
  }

  const rawMessageId = crypto.randomUUID();

  return {
    success: true,
    value: {
      rawMessage: rawChunk,
      delivery: {
        id: crypto.randomUUID(),
        courier,
        route,
        date,
        received,
        incidents,
        delivered,
        rawMessageId,
      },
    },
  };
}

function extractCourier(message: string): string | undefined {
  const boldMatch = message.match(/\*([^*\r\n]+)\*/);
  if (boldMatch?.[1]?.trim()) {
    return boldMatch[1].trim();
  }

  const lines = message.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^\d{5}$/.test(line)) continue;
    if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(line)) continue;
    if (/^(recibidos|incidencias|entregados):?/i.test(line)) continue;

    const cleaned = line.replace(/^\*+|\*+$/g, "").trim();
    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return undefined;
}

function number(value: string | undefined): number | undefined {
  return value === undefined ? undefined : Number.parseInt(value, 10);
}

function parseIncidents(value: string | undefined): number | undefined {
  if (value === undefined) return 0;
  const trimmed = value.trim();
  if (/^[-—_]+$/.test(trimmed) || /^(ninguna|ninguno|n\/a|no|none)$/i.test(trimmed) || trimmed === "") {
    return 0;
  }
  const digitsMatch = trimmed.match(/^(\d+)/);
  if (digitsMatch?.[1]) {
    return Number.parseInt(digitsMatch[1], 10);
  }
  return undefined;
}

function normalizeDate(value: string): string | undefined {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return undefined;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return undefined;

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString().padStart(2, "0")}`;
}