import { supportedMappingFields } from "./normalization";

export type MappingInput = Record<string, string | null>;

export function validateColumnMapping(mapping: MappingInput, headers: string[]) {
  const headerSet = new Set(headers);
  const targets = new Map<string, string>();
  for (const [source, rawTarget] of Object.entries(mapping)) {
    if (!headerSet.has(source)) throw new Error(`Unknown source column: ${source}`);
    const target = rawTarget ?? "ignore";
    if (!supportedMappingFields.has(target)) throw new Error(`Unsupported target field: ${target}`);
    if (target !== "ignore" && targets.has(target)) throw new Error(`Target field mapped more than once: ${target}`);
    if (target !== "ignore") targets.set(target, source);
  }
  if (!Object.entries(mapping).some(([, target]) => target === "fullName")) throw new Error("A name mapping is required");
  const normalizeSource = (source: string) => source.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ").trim();
  for (const [source, rawTarget] of Object.entries(mapping)) {
    const target = rawTarget ?? "ignore";
    const normalizedSource = normalizeSource(source);
    if ((normalizedSource === "cpf" || normalizedSource === "documento") && target === "phone") throw new Error("CPF and phone mappings are incompatible");
    if ((normalizedSource === "telefone" || normalizedSource === "celular") && target === "cpf") throw new Error("CPF and phone mappings are incompatible");
  }
  return mapping;
}
