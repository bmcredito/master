import { describe, expect, it } from "vitest";
import { applyColumnMapping, suggestMapping } from "@/services/customer-import/normalization";
import { validateColumnMapping } from "@/services/customer-import/mapping";

describe("import mapping closure", () => {
  it("maps standard and custom Brazilian headers and preserves explicit facts", () => {
    const headers = ["CLIENTE", "CELULAR_PRINCIPAL", "DOCUMENTO", "DT_NASC", "VL_LIB", "SALDO_CONSIGNADO", "MARGEM_LIVRE", "INST_FINANCEIRA", "COD_INTERNO_OPERACAO"];
    const suggested = suggestMapping(headers);
    expect(suggested).toMatchObject({ CLIENTE: "fullName", CELULAR_PRINCIPAL: "phone", DOCUMENTO: "cpf" });
    const mapping = { ...suggested, COD_INTERNO_OPERACAO: "internal_operation_code" };
    expect(() => validateColumnMapping(mapping, headers)).toThrow("Unsupported target field");
    const confirmed = { ...suggested, COD_INTERNO_OPERACAO: "ignore" };
    validateColumnMapping(confirmed, headers);
    expect(applyColumnMapping({ CLIENTE: "Ana", COD_INTERNO_OPERACAO: "X1" }, confirmed)).toEqual({ fullName: "Ana" });
  });

  it("rejects duplicate or incompatible targets and requires a name", () => {
    expect(() => validateColumnMapping({ CPF: "phone", TELEFONE: "phone" }, ["CPF", "TELEFONE"])).toThrow();
    expect(() => validateColumnMapping({ CPF: "cpf", TELEFONE: "phone" }, ["CPF", "TELEFONE"])).toThrow("name mapping");
    expect(() => validateColumnMapping({ NOME: "fullName", CPF: "phone" }, ["NOME", "CPF"])).toThrow("CPF and phone");
  });
});
