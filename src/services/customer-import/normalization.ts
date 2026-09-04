const formulaPrefix = /^[=+\-@\t\r]/;

export function rejectFormulaInjection(value: unknown): string {
  const text = String(value ?? "").trim();
  if (formulaPrefix.test(text)) throw new Error("Formula-like value is not allowed");
  return text;
}

export function normalizeName(value: unknown) {
  return rejectFormulaInjection(value).replace(/\s+/g, " ").trim();
}

export function normalizeDigits(value: unknown) {
  return rejectFormulaInjection(value).replace(/\D/g, "");
}

export function normalizeCpf(value: unknown) {
  const digits = normalizeDigits(value);
  return digits.length === 11 && new Set(digits).size > 1 ? digits : null;
}

export function normalizePhone(value: unknown) {
  const digits = normalizeDigits(value);
  return digits.length >= 10 && digits.length <= 13 ? digits : null;
}

export function normalizeEmail(value: unknown) {
  const email = rejectFormulaInjection(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function maskCpf(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length === 11 ? `***.***.***-${digits.slice(-2)}` : "***";
}

export function normalizeDate(value: unknown) {
  const text = rejectFormulaInjection(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function normalizeCurrency(value: unknown) {
  const text = rejectFormulaInjection(value).replace(/R\$\s?/i, "").replace(/\./g, "").replace(",", ".").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function normalizeBoolean(value: unknown) {
  const text = rejectFormulaInjection(value).toLowerCase();
  if (["true", "sim", "yes", "1"].includes(text)) return true;
  if (["false", "não", "nao", "no", "0"].includes(text)) return false;
  return null;
}

const mappingAliases: Record<string, string[]> = {
  fullName: ["nome", "cliente", "nome cliente", "name"],
  phone: ["telefone", "celular", "whatsapp", "phone"],
  cpf: ["cpf"],
  email: ["email", "e-mail"],
  birth_date: ["data nascimento", "data nasc", "nascimento", "dt nasc", "birth date"],
  current_consignado_amount: ["consignado atual"],
  available_amount: ["valor liberado", "valor disponível", "valor disponivel"],
  available_margin: ["margem disponível", "margem disponivel"],
  bank: ["banco"],
  benefit_number: ["número benefício", "numero beneficio", "benefit number"],
  agreement_type: ["convênio", "convenio"],
  income: ["renda", "income"],
};

export function suggestMapping(headers: string[]) {
  return Object.fromEntries(headers.map((header) => {
    const normalized = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    const target = Object.entries(mappingAliases).find(([, aliases]) => aliases.some((alias) => alias.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized))?.[0] ?? null;
    return [header, target];
  }));
}

export type NormalizedCustomerRow = {
  fullName: string;
  cpf?: string;
  phone?: string;
  email?: string;
  externalId?: string;
  facts: Record<string, string>;
};

export function normalizeCustomerRow(row: Record<string, unknown>): NormalizedCustomerRow {
  const fullName = normalizeName(row.fullName ?? row.name ?? row.nome);
  if (!fullName) throw new Error("Name is required");
  const facts: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!["fullName", "name", "nome", "cpf", "phone", "telefone", "email", "externalId", "id_externo"].includes(key)) {
      const normalized = rejectFormulaInjection(value);
      if (normalized) facts[key] = normalized;
    }
  }
  return {
    fullName,
    cpf: normalizeCpf(row.cpf) ?? undefined,
    phone: normalizePhone(row.phone ?? row.telefone) ?? undefined,
    email: normalizeEmail(row.email) ?? undefined,
    externalId: rejectFormulaInjection(row.externalId ?? row.id_externo) || undefined,
    facts,
  };
}
