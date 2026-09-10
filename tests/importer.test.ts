import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
	parseZipCentralDirectory,
	extractZipTextFiles,
	parseCSVDeliveries,
	processUploadedFile,
} from "../src/domain/importer";

describe("Universal Importer Engine", () => {
	it("decompresses and extracts real WhatsApp chat from ZIP archive", async () => {
		const zipPath = path.resolve(__dirname, "../data/Chat de WhatsApp con REPORTE FINAL COD_ 08918 Y 08930.zip");
		const buf = fs.readFileSync(zipPath);
		const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

		const entries = parseZipCentralDirectory(arrayBuf);
		expect(entries.length).toBeGreaterThan(0);
		expect(entries[0]?.filename).toContain("Chat de WhatsApp");

		const files = await extractZipTextFiles(arrayBuf);
		expect(files.length).toBe(1);
		expect(files[0]?.content).toContain("REPORTE FINAL");
	});

	it("processes uploaded WhatsApp ZIP file for target courier", async () => {
		const zipPath = path.resolve(__dirname, "../data/Chat de WhatsApp con REPORTE FINAL COD_ 08918 Y 08930.zip");
		const buf = fs.readFileSync(zipPath);
		const file = new File([buf], "reportes.zip", { type: "application/zip" });

		const result = await processUploadedFile(file, {
			targetCourier: "Claudio",
			currentMonth: "2026-08",
		});

		expect(result.success).toBe(true);
		expect(result.format).toBe("whatsapp");
		expect(result.deliveries.length).toBe(39);
		expect(result.deliveries.every((d) => d.courier.toLowerCase() === "claudio")).toBe(true);
		expect(result.otherCouriersOmitted).toBeGreaterThan(0);
	});

	it("parses CSV deliveries table with semicolon and comma delimiters", () => {
		const csvSemicolon = `Fecha;Repartidor;Ruta;Entregas;Incidencias\n2026-08-01;Claudio;08918;45;2\n2026-08-02;Claudio;08918;50;1`;
		const res1 = parseCSVDeliveries(csvSemicolon, "Claudio");
		expect(res1).toHaveLength(2);
		expect(res1[0]?.date).toBe("2026-08-01");
		expect(res1[0]?.delivered).toBe(45);
		expect(res1[0]?.incidents).toBe(2);

		const csvComma = `date,route,delivered,incidents\n03/08/2026,08918,48,0`;
		const res2 = parseCSVDeliveries(csvComma, "Alexander");
		expect(res2).toHaveLength(1);
		expect(res2[0]?.date).toBe("2026-08-03");
		expect(res2[0]?.delivered).toBe(48);
		expect(res2[0]?.courier).toBe("Alexander");
	});

	it("processes CLD (NDJSON) and JSON files correctly", async () => {
		const ndjsonContent = `{"date":"2026-08-10","courier":"Claudio","route":"08918","delivered":40,"incidents":1}\n{"date":"2026-08-11","courier":"Claudio","route":"08918","delivered":42,"incidents":0}`;
		const cldFile = new File([ndjsonContent], "backup.cld", { type: "application/x-ndjson" });

		const resultCld = await processUploadedFile(cldFile, {
			targetCourier: "Claudio",
			currentMonth: "2026-08",
		});
		expect(resultCld.success).toBe(true);
		expect(resultCld.format).toBe("cld");
		expect(resultCld.deliveries).toHaveLength(2);

		const jsonContent = JSON.stringify([
			{ date: "2026-08-15", courier: "Omar", route: "08930", delivered: 35, incidents: 2 },
		]);
		const jsonFile = new File([jsonContent], "data.json", { type: "application/json" });
		const resultJson = await processUploadedFile(jsonFile, {
			targetCourier: "Omar",
			currentMonth: "2026-08",
		});
		expect(resultJson.success).toBe(true);
		expect(resultJson.deliveries).toHaveLength(1);
		expect(resultJson.deliveries[0]?.courier).toBe("Omar");
	});

	it("returns error on empty or invalid file", async () => {
		const emptyFile = new File([""], "vacio.txt", { type: "text/plain" });
		const result = await processUploadedFile(emptyFile, {
			targetCourier: "Claudio",
			currentMonth: "2026-08",
		});
		expect(result.success).toBe(false);
	});
});
