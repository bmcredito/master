import { describe, expect, it } from "vitest";
import { findDeterministicMatch } from "@/services/customer-import/deduplication";
import { maskCpf, normalizeCurrency, normalizeCustomerRow, suggestMapping } from "@/services/customer-import/normalization";
import { parseCsv } from "@/services/customer-import/parser";

describe("customer import core", () => {
  it("parses quoted CSV and normalizes identifiers without implying contact", () => {
    const parsed = parseCsv('nome,cpf,telefone,email\n"Ana, Silva",123.456.789-09,(11) 99999-1111,ANA@EXAMPLE.COM');
    const row = normalizeCustomerRow(parsed.rows[0]);
    expect(row).toMatchObject({ fullName: "Ana, Silva", cpf: "12345678909", phone: "11999991111", email: "ana@example.com" });
    expect(maskCpf(row.cpf)).toBe("***.***.***-09");
  });

  it("deduplicates only by exact valid identifiers, never by name", () => {
    const row = normalizeCustomerRow({ nome: "Ana", email: "ana@example.com" });
    expect(findDeterministicMatch(row, [{ id: "1", email: "ana@example.com" }])).toMatchObject({ level: "EMAIL" });
    expect(findDeterministicMatch(normalizeCustomerRow({ nome: "Ana" }), [{ id: "1", email: "other@example.com" }]).level).toBe("NONE");
  });

  it("rejects formula injection", () => {
    expect(() => normalizeCustomerRow({ nome: "=HYPERLINK(\"https://evil\")" })).toThrow();
  });

  it("suggests deterministic mappings and parses Brazilian currency", () => {
    expect(suggestMapping(["NOME_CLIENTE", "Data Nasc", "VALOR_LIBERADO"])).toEqual({ NOME_CLIENTE: "fullName", "Data Nasc": "birth_date", VALOR_LIBERADO: "available_amount" });
    expect(normalizeCurrency("R$ 10.000,50")).toBe(10000.5);
  });
});
