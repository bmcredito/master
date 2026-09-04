import type { NormalizedCustomerRow } from "./normalization";

export type ExistingCustomer = { id: string; cpf?: string | null; phone?: string | null; email?: string | null };

export function findDeterministicMatch(row: NormalizedCustomerRow, existing: ExistingCustomer[]) {
  for (const [level, value] of [["CPF", row.cpf], ["PHONE", row.phone], ["EMAIL", row.email]] as const) {
    if (!value) continue;
    const matches = existing.filter((customer) => customer[level.toLowerCase() as "cpf" | "phone" | "email"] === value);
    if (matches.length === 1) return { level, customer: matches[0] };
    if (matches.length > 1) return { level: "AMBIGUOUS" as const, customer: null };
  }
  return { level: "NONE" as const, customer: null };
}

export function hasConflictingIdentifiers(row: NormalizedCustomerRow, existing: ExistingCustomer) {
  return [row.cpf && existing.cpf && row.cpf !== existing.cpf, row.phone && existing.phone && row.phone !== existing.phone, row.email && existing.email && row.email !== existing.email].some(Boolean);
}
