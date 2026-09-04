import * as XLSX from "xlsx";
import { rejectFormulaInjection } from "./normalization";

export type ParsedImport = { headers: string[]; rows: Record<string, string>[] };

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) { current += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === delimiter && !quoted) { values.push(rejectFormulaInjection(current)); current = ""; continue; }
    current += character;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  values.push(rejectFormulaInjection(current));
  return values;
}

export function parseCsv(input: string, maxRows = 10000): ParsedImport {
  const lines = input.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) throw new Error("CSV is empty");
  const delimiter = (lines[0].match(/;/g) ?? []).length > (lines[0].match(/,/g) ?? []).length ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map((header) => header.trim());
  if (!headers.length || headers.some((header) => !header)) throw new Error("CSV header is invalid");
  if (new Set(headers.map((header) => header.toLowerCase())).size !== headers.length) throw new Error("CSV headers must be unique");
  const rows = lines.slice(1, maxRows + 1).map((line) => Object.fromEntries(headers.map((header, index) => [header, splitCsvLine(line, delimiter)[index] ?? ""])));
  if (lines.length - 1 > maxRows) throw new Error("Import row limit exceeded");
  return { headers, rows };
}

export function parseXlsx(input: Buffer, maxRows = 10000): ParsedImport {
  const workbook = XLSX.read(input, { type: "buffer", cellDates: true, sheetStubs: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error("XLSX has no sheets");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: "", raw: false });
  if (rows.length > maxRows) throw new Error("Import row limit exceeded");
  const headers = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheet], { header: 1, defval: "", raw: false })[0] as unknown[] | undefined;
  if (!headers?.length) throw new Error("XLSX header is invalid");
  return { headers: headers.map((header) => rejectFormulaInjection(header).trim()), rows: rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, rejectFormulaInjection(value)]))) };
}

export function parseImportFile(input: Buffer | string, fileType: "CSV" | "XLSX", maxRows = 10000) {
  return fileType === "CSV" ? parseCsv(String(input), maxRows) : parseXlsx(Buffer.isBuffer(input) ? input : Buffer.from(input), maxRows);
}
