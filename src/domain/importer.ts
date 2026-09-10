import type { Delivery } from "./models";
import { parseWhatsAppMessage } from "./parser";

interface ZipEntry {
	filename: string;
	compressedSize: number;
	uncompressedSize: number;
	compressionMethod: number;
	localHeaderOffset: number;
}

export interface ExtractedFile {
	name: string;
	content: string;
}

export interface ProcessedImport {
	success: boolean;
	deliveries: Delivery[];
	rawMessages: { [key: string]: string };
	error?: string;
	format: "whatsapp" | "cld" | "json" | "csv" | "unknown";
	duplicates?: number;
	otherCouriersOmitted?: number;
}

/**
 * Parsea el directorio central de un archivo ZIP para obtener sus entradas.
 */
export function parseZipCentralDirectory(buffer: ArrayBuffer): ZipEntry[] {
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);
	let eocdOffset = -1;

	for (let i = buffer.byteLength - 22; i >= 0; i--) {
		if (view.getUint32(i, true) === 0x06054b50) {
			eocdOffset = i;
			break;
		}
	}

	if (eocdOffset === -1) {
		throw new Error("No es un archivo ZIP válido.");
	}

	const entriesCount = view.getUint16(eocdOffset + 10, true);
	const cdOffset = view.getUint32(eocdOffset + 16, true);
	const entries: ZipEntry[] = [];
	let cur = cdOffset;

	for (let i = 0; i < entriesCount; i++) {
		if (cur + 46 > buffer.byteLength || view.getUint32(cur, true) !== 0x02014b50) break;
		const method = view.getUint16(cur + 10, true);
		const compSize = view.getUint32(cur + 20, true);
		const uncompSize = view.getUint32(cur + 24, true);
		const nameLen = view.getUint16(cur + 28, true);
		const extraLen = view.getUint16(cur + 30, true);
		const commLen = view.getUint16(cur + 32, true);
		const localOffset = view.getUint32(cur + 42, true);
		const nameBytes = bytes.subarray(cur + 46, cur + 46 + nameLen);
		const filename = new TextDecoder("utf-8").decode(nameBytes);

		entries.push({
			filename,
			compressedSize: compSize,
			uncompressedSize: uncompSize,
			compressionMethod: method,
			localHeaderOffset: localOffset,
		});
		cur += 46 + nameLen + extraLen + commLen;
	}
	return entries;
}

/**
 * Descomprime una entrada de ZIP utilizando streams web estándar.
 */
export async function extractZipEntry(buffer: ArrayBuffer, entry: ZipEntry): Promise<Uint8Array> {
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);
	const offset = entry.localHeaderOffset;

	if (view.getUint32(offset, true) !== 0x04034b50) {
		throw new Error("Encabezado local de archivo ZIP inválido.");
	}

	const nameLen = view.getUint16(offset + 26, true);
	const extraLen = view.getUint16(offset + 28, true);
	const dataStart = offset + 30 + nameLen + extraLen;
	const compressedData = bytes.subarray(dataStart, dataStart + entry.compressedSize);

	if (entry.compressionMethod === 0) {
		return compressedData;
	}

	if (entry.compressionMethod === 8) {
		const ds = new DecompressionStream("deflate-raw");
		const writer = ds.writable.getWriter();
		writer.write(compressedData);
		writer.close();

		const chunks: Uint8Array[] = [];
		const reader = ds.readable.getReader();
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (value) chunks.push(value);
		}
		const total = chunks.reduce((acc, c) => acc + c.length, 0);
		const result = new Uint8Array(total);
		let pos = 0;
		for (const chunk of chunks) {
			result.set(chunk, pos);
			pos += chunk.length;
		}
		return result;
	}
	throw new Error(`Método de compresión no soportado: ${entry.compressionMethod}`);
}

/**
 * Extrae los archivos de texto relevantes de un ZIP.
 */
export async function extractZipTextFiles(buffer: ArrayBuffer): Promise<ExtractedFile[]> {
	const entries = parseZipCentralDirectory(buffer);
	const results: ExtractedFile[] = [];

	for (const entry of entries) {
		const lower = entry.filename.toLowerCase();
		if (lower.endsWith(".txt") || lower.endsWith(".cld") || lower.endsWith(".json") || lower.endsWith(".csv")) {
			const data = await extractZipEntry(buffer, entry);
			const content = new TextDecoder("utf-8").decode(data);
			results.push({ name: entry.filename, content });
		}
	}
	return results;
}

/**
 * Parsea un archivo CSV en entregas.
 */
export function parseCSVDeliveries(text: string, defaultCourier: string): Delivery[] {
	const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
	if (lines.length < 2) return [];

	const headerLine = lines[0];
	if (!headerLine) return [];
	const delim = headerLine.includes(";") ? ";" : headerLine.includes("\t") ? "\t" : ",";
	const headers = headerLine.split(delim).map((h) => h.toLowerCase().trim().replace(/['"]/g, ""));

	const idxDate = headers.findIndex((h) => h.includes("fecha") || h.includes("date"));
	const idxRoute = headers.findIndex((h) => h.includes("ruta") || h.includes("route") || h.includes("cod"));
	const idxDelivered = headers.findIndex((h) => h.includes("entreg") || h.includes("deliver"));
	const idxIncidents = headers.findIndex((h) => h.includes("incid") || h.includes("fallo"));
	const idxCourier = headers.findIndex((h) => h.includes("repart") || h.includes("courier") || h.includes("nom"));

	const deliveries: Delivery[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const cols = line.split(delim).map((c) => c.trim().replace(/^["']|["']$/g, ""));
		const rawDate = idxDate >= 0 && cols[idxDate] ? cols[idxDate] : "";
		const deliveredStr = idxDelivered >= 0 && cols[idxDelivered] ? cols[idxDelivered] : "";
		const rawDelivered = Number.parseInt(deliveredStr, 10);
		if (!rawDate || Number.isNaN(rawDelivered)) continue;

		let formattedDate = rawDate;
		const dmyMatch = rawDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
		if (dmyMatch && dmyMatch[1] && dmyMatch[2] && dmyMatch[3]) {
			const day = dmyMatch[1].padStart(2, "0");
			const month = dmyMatch[2].padStart(2, "0");
			const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
			formattedDate = `${year}-${month}-${day}`;
		}

		const route = idxRoute >= 0 && cols[idxRoute] ? cols[idxRoute] : "08918";
		const incStr = idxIncidents >= 0 && cols[idxIncidents] ? cols[idxIncidents] : "0";
		const incidents = Number.parseInt(incStr, 10) || 0;
		const courier = idxCourier >= 0 && cols[idxCourier] ? cols[idxCourier] : defaultCourier;

		deliveries.push({
			id: crypto.randomUUID(),
			rawMessageId: crypto.randomUUID(),
			courier,
			route,
			date: formattedDate,
			received: rawDelivered + incidents,
			delivered: rawDelivered,
			incidents,
		});
	}
	return deliveries;
}

/**
 * Parsea contenido NDJSON o JSON de respaldo.
 */
function parseJsonDeliveries(text: string): Delivery[] {
	const trimmed = text.trim();
	if (trimmed.startsWith("[")) {
		const parsed = JSON.parse(trimmed) as Array<Partial<Delivery>>;
		return parsed
			.filter((d): d is Partial<Delivery> & { date: string; delivered: number } => Boolean(d.date && typeof d.delivered === "number"))
			.map((d) => ({
				id: d.id || crypto.randomUUID(),
				rawMessageId: d.rawMessageId || crypto.randomUUID(),
				courier: d.courier || "Usuario",
				route: d.route || "08918",
				date: d.date,
				received: d.received ?? (d.delivered + (d.incidents ?? 0)),
				delivered: d.delivered,
				incidents: d.incidents ?? 0,
			}));
	}

	// NDJSON format (.cld)
	const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
	const results: Delivery[] = [];
	for (const line of lines) {
		try {
			const d = JSON.parse(line) as Partial<Delivery>;
			if (d.date && typeof d.delivered === "number") {
				results.push({
					id: d.id || crypto.randomUUID(),
					rawMessageId: d.rawMessageId || crypto.randomUUID(),
					courier: d.courier || "Usuario",
					route: d.route || "08918",
					date: d.date,
					received: d.received ?? (d.delivered + (d.incidents ?? 0)),
					delivered: d.delivered,
					incidents: d.incidents ?? 0,
				});
			}
		} catch {
			// omit invalid line
		}
	}
	return results;
}

/**
 * Orquestador universal que procesa archivos ZIP, TXT, CLD, JSON o CSV.
 */
export async function processUploadedFile(
	file: File,
	options: { targetCourier: string; currentMonth: string },
): Promise<ProcessedImport> {
	try {
		const ext = file.name.split(".").pop()?.toLowerCase() || "";

		if (ext === "zip") {
			const buffer = await file.arrayBuffer();
			const files = await extractZipTextFiles(buffer);
			if (files.length === 0) {
				return { success: false, deliveries: [], rawMessages: {}, format: "unknown", error: "El archivo ZIP no contiene ningún archivo de texto o reporte válido." };
			}
			const chatFile = files.find((f) => f.name.toLowerCase().includes("chat") || f.name.toLowerCase().endsWith(".txt")) ?? files[0];
			if (!chatFile) {
				return { success: false, deliveries: [], rawMessages: {}, format: "unknown", error: "No se encontró ningún archivo de texto legible dentro del ZIP." };
			}
			return processTextContent(chatFile.name, chatFile.content, options);
		}

		const text = await file.text();
		return processTextContent(file.name, text, options);
	} catch (err) {
		const error = err as Error;
		return { success: false, deliveries: [], rawMessages: {}, format: "unknown", error: error.message || "Error al procesar el archivo." };
	}
}

/**
 * Clasifica y procesa el contenido de texto según su formato.
 */
function processTextContent(
	filename: string,
	text: string,
	options: { targetCourier: string; currentMonth: string },
): ProcessedImport {
	const ext = filename.split(".").pop()?.toLowerCase() || "";
	const trimmed = text.trim();

	if (ext === "csv") {
		const deliveries = parseCSVDeliveries(trimmed, options.targetCourier);
		return {
			success: deliveries.length > 0,
			deliveries,
			rawMessages: {},
			format: "csv",
			error: deliveries.length === 0 ? "No se pudieron interpretar filas de entregas en el archivo CSV." : undefined,
		};
	}

	if (ext === "cld" || ext === "json" || trimmed.startsWith("[") || (trimmed.startsWith("{") && trimmed.includes('"deliveries"'))) {
		const deliveries = parseJsonDeliveries(trimmed);
		return {
			success: deliveries.length > 0,
			deliveries,
			rawMessages: {},
			format: ext === "cld" ? "cld" : "json",
			error: deliveries.length === 0 ? "El archivo de respaldo no contiene entregas válidas." : undefined,
		};
	}

	// Por defecto intentar interpretar como reporte o chat de WhatsApp
	const parsed = parseWhatsAppMessage(trimmed, options.targetCourier);
	if (!parsed.success) {
		return {
			success: false,
			deliveries: [],
			rawMessages: {},
			format: "whatsapp",
			error: parsed.error,
		};
	}

	const deliveries = parsed.values.map((v) => v.delivery);
	const rawMessages: { [key: string]: string } = {};
	for (const v of parsed.values) {
		rawMessages[v.delivery.date] = v.rawMessage;
	}

	return {
		success: true,
		deliveries,
		rawMessages,
		format: "whatsapp",
		otherCouriersOmitted: parsed.otherCouriersOmitted,
	};
}
