import type { Delivery } from "./models";

export interface ParsedDelivery {
	readonly delivery: Delivery;
	readonly rawMessage: string;
	readonly sender?: string;
}

export type ParseResult =
	| {
			readonly success: true;
			readonly value: ParsedDelivery;
			readonly values: ParsedDelivery[];
			readonly otherCouriersOmitted: number;
	  }
	| { readonly success: false; readonly error: string };

interface ChunkMeta {
	readonly text: string;
	readonly headerSender?: string;
	readonly headerDate?: string;
}

const patterns = {
	// Simple route (08918) or composite route (08918-08930)
	route: /\b(089\d{2}(?:-089\d{2})?)\b/,
	// Dates with /, -, . and 2 or 4 digit years
	date: /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/,
	// Received: recibidos, recibido, recibidas, recibo, etc.
	received: /recib[a-z]*[:\s]+(\d+)/i,
	// Incidents: incidencias, incidencia, etc.
	incidents: /(?:\*|\s)*incid[a-z]*[:\s]*([^\r\n]+)/i,
	// Delivered: entregados, entregado, entregas, entrega
	delivered: /entreg[a-z]*[:\s]+(\d+)/i,
	// WhatsApp message header: e.g. 17/7/26, 7:07 p. m. - Sender: ... or [17/07/2026, 19:07] Sender:
	header: /(?:^|\n)(?:\[?(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})[,\s]+([^-\]\n]+)[\]\s]*-\s*|\[\d{1,2}[./-]\d{1,2}[./-]\d{2,4}[^\]]*\]\s*)([^:\n]+):\s*/,
};

/**
 * Universal parser capable of handling single reports, multi-day reports,
 * and full WhatsApp group chat exports for any courier.
 */
export function parseWhatsAppMessage(message: string, targetCourier?: string): ParseResult {
	if (typeof message !== "string" || message.trim().length === 0) {
		return { success: false, error: "El mensaje no puede estar vacío." };
	}

	if (message.length > 500_000) {
		return { success: false, error: "El mensaje excede el tamaño máximo permitido (500 KB)." };
	}

	const chunks = splitIntoReportChunks(message);
	if (chunks.length === 0) {
		return { success: false, error: "No se pudieron reconocer reportes válidos en el mensaje." };
	}

	const allValues: ParsedDelivery[] = [];
	const seenDatesByCourier = new Map<string, Set<string>>();

	for (const chunk of chunks) {
		const res = parseSingleReport(chunk, seenDatesByCourier);
		if (res.success) {
			allValues.push(res.value);
			const cKey = normalizeName(res.value.delivery.courier);
			if (!seenDatesByCourier.has(cKey)) {
				seenDatesByCourier.set(cKey, new Set());
			}
			seenDatesByCourier.get(cKey)!.add(res.value.delivery.date);
		}
	}

	if (allValues.length === 0) {
		return {
			success: false,
			error: "No se pudieron reconocer los campos del reporte (repartidor, ruta, fecha, recibidos, entregados).",
		};
	}

	return filterByTargetCourier(allValues, targetCourier);
}

function filterByTargetCourier(allValues: ParsedDelivery[], targetCourier?: string): ParseResult {
	const normTarget = targetCourier ? normalizeName(targetCourier) : "";

	// If no specific courier is targeted or target is generic "usuario"
	if (!normTarget || normTarget === "usuario") {
		return {
			success: true,
			value: allValues[0]!,
			values: allValues,
			otherCouriersOmitted: 0,
		};
	}

	const finalValues = allValues.filter((v) => {
		const cName = normalizeName(v.delivery.courier);
		const sName = v.sender ? normalizeName(v.sender) : "";
		return matchCourier(cName, normTarget) || (Boolean(sName) && matchCourier(sName, normTarget));
	});

	if (finalValues.length === 0) {
		return {
			success: false,
			error: `Se encontraron ${allValues.length} reportes, pero ninguno pertenece a "${targetCourier}".`,
		};
	}

	return {
		success: true,
		value: finalValues[0]!,
		values: finalValues,
		otherCouriersOmitted: allValues.length - finalValues.length,
	};
}

export function normalizeName(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[*_~]/g, "")
		.trim();
}

function matchCourier(candidate: string, target: string): boolean {
	if (candidate === target) return true;
	if (candidate.includes(target) || target.includes(candidate)) return true;

	const cTokens = candidate.split(/\s+/);
	const tTokens = target.split(/\s+/);
	const cFirst = cTokens[0] || "";
	const tFirst = tTokens[0] || "";

	if (cFirst === tFirst) return true;

	// Prefix matching for abbreviations (e.g. "Alex" <-> "Alexander", "Sofi" <-> "Sofia")
	if (cFirst.length >= 4 && tFirst.length >= 4 && (cFirst.startsWith(tFirst) || tFirst.startsWith(cFirst))) {
		return true;
	}

	// Fuzzy distance ONLY for longer names (6+ characters) with distance <= 1
	// to prevent short distinct names (like "Omar" and "Oscar") from colliding.
	if (cFirst.length >= 6 && tFirst.length >= 6 && Math.abs(cFirst.length - tFirst.length) <= 1 && levenshtein(cFirst, tFirst) <= 1) {
		return true;
	}

	return false;
}

function levenshtein(a: string, b: string): number {
	if (a === b) return 0;
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	const row = Array.from({ length: a.length + 1 }, (_, i) => i);
	for (let i = 1; i <= b.length; i++) {
		let prev = i;
		for (let j = 1; j <= a.length; j++) {
			const val = b[i - 1] === a[j - 1] ? row[j - 1]! : Math.min(row[j - 1]!, prev, row[j]!) + 1;
			row[j - 1] = prev;
			prev = val;
		}
		row[a.length] = prev;
	}

	return row[a.length]!;
}

/** Splits chat text into report chunks while retaining WhatsApp header metadata. */
function splitIntoReportChunks(message: string): ChunkMeta[] {
	const normalized = message.replace(/\u202f/g, " ").replace(/\xa0/g, " ");
	const headerRegex = new RegExp(patterns.header.source, "gm");
	const matches = Array.from(normalized.matchAll(headerRegex));

	if (matches.length === 0) {
		return splitRawSubReports(normalized);
	}

	const chunks: ChunkMeta[] = [];
	for (let i = 0; i < matches.length; i++) {
		const match = matches[i]!;
		const day = Number.parseInt(match[1] || "", 10);
		const month = Number.parseInt(match[2] || "", 10);
		let year = Number.parseInt(match[3] || "", 10);
		if (year < 100) year += 2000;

		const headerSender = match[5]?.trim();
		const headerDate = (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year))
			? `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
			: undefined;

		const startIndex = match.index! + match[0].length;
		const endIndex = i + 1 < matches.length ? matches[i + 1]!.index! : normalized.length;
		const body = normalized.slice(startIndex, endIndex).replace(/<Se editó este mensaje.>/g, "").trim();

		const subChunks = splitRawSubReports(body, headerSender, headerDate);
		chunks.push(...subChunks);
	}

	return chunks;
}

/** Splits message body if it contains multiple bundled reports (e.g. 3 reports in 1 message). */
function splitRawSubReports(text: string, headerSender?: string, headerDate?: string): ChunkMeta[] {
	const boundaryRegex = /(?=(?:\n|^)\s*(?:\*[^*\n]+\*|[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+)\s*\n\s*089\d{2})/g;
	const parts = text.split(boundaryRegex).map((p) => p.trim()).filter(Boolean);

	if (parts.length <= 1) {
		return [{ text, headerSender, headerDate }];
	}

	return parts.map((part) => ({
		text: part,
		headerSender,
		headerDate,
	}));
}

function parseSingleReport(
	chunk: ChunkMeta,
	seenDatesByCourier: Map<string, Set<string>>,
): { success: true; value: ParsedDelivery } | { success: false; error: string } {
	const routeMatch = chunk.text.match(patterns.route);
	const dateMatch = chunk.text.match(patterns.date);
	const receivedMatch = chunk.text.match(patterns.received);
	const incidentsMatch = chunk.text.match(patterns.incidents);
	const deliveredMatch = chunk.text.match(patterns.delivered);

	const courier = extractCourier(chunk.text, chunk.headerSender);
	const route = routeMatch?.[1];
	const received = extractNumber(receivedMatch?.[1]);
	const incidents = parseIncidents(incidentsMatch?.[1]);
	const delivered = extractNumber(deliveredMatch?.[1]);

	if (!courier || !route || received === undefined || delivered === undefined) {
		return { success: false, error: "Faltan campos requeridos en el reporte." };
	}

	const cKey = normalizeName(courier);
	const seenDates = seenDatesByCourier.get(cKey);
	const date = reconcileDate(dateMatch, chunk.headerDate, seenDates);

	if (!date) {
		return { success: false, error: "No se pudo resolver una fecha válida." };
	}

	return {
		success: true,
		value: {
			rawMessage: chunk.text,
			sender: chunk.headerSender,
			delivery: {
				id: crypto.randomUUID(),
				courier,
				route,
				date,
				received,
				incidents,
				delivered,
				rawMessageId: crypto.randomUUID(),
			},
		},
	};
}

function extractCourier(text: string, headerSender?: string): string | undefined {
	const boldMatch = text.match(/\*([^*\r\n]+)\*/);
	if (boldMatch?.[1]?.trim()) {
		return boldMatch[1].trim();
	}

	const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
	for (const line of lines) {
		if (patterns.route.test(line)) continue;
		if (patterns.date.test(line)) continue;
		if (/^(recib|incid|entreg)/i.test(line)) continue;

		const cleaned = line.replace(/^\*+|\*+$/g, "").trim();
		if (cleaned.length > 0 && cleaned.length < 35 && !/^\d+$/.test(cleaned)) {
			return cleaned;
		}
	}

	return headerSender || undefined;
}

function reconcileDate(
	dateMatch: RegExpMatchArray | null,
	headerDate?: string,
	seenDates?: Set<string>,
): string | undefined {
	if (!dateMatch) {
		return headerDate;
	}

	const day = Number.parseInt(dateMatch[1] || "", 10);
	const month = Number.parseInt(dateMatch[2] || "", 10);
	let year = Number.parseInt(dateMatch[3] || "", 10);

	if (year < 100) {
		year += 2000;
	}

	// Smart Typo Correction: written as 2025 but sent in 2026
	if (year === 2025 && headerDate?.startsWith("2026")) {
		year = 2026;
	}

	let candidate = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

	// Copied Template Correction: sent next day but retaining yesterday's date
	if (headerDate && headerDate > candidate && seenDates?.has(candidate)) {
		candidate = headerDate;
	}

	return isValidDateIso(candidate) ? candidate : headerDate;
}

function isValidDateIso(iso: string): boolean {
	const [y, m, d] = iso.split("-").map(Number);
	if (!y || !m || !d) return false;
	const date = new Date(Date.UTC(y, m - 1, d));
	return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function extractNumber(value: string | undefined): number | undefined {
	return value === undefined ? undefined : Number.parseInt(value, 10);
}

function parseIncidents(value: string | undefined): number {
	if (value === undefined) return 0;
	const trimmed = value.trim();
	if (/^[-—_]+$/.test(trimmed) || /^(ninguna|ninguno|n\/a|no|none)$/i.test(trimmed) || trimmed === "") {
		return 0;
	}
	const digitsMatch = trimmed.match(/^(\d+)/);
	return digitsMatch?.[1] ? Number.parseInt(digitsMatch[1], 10) : 0;
}