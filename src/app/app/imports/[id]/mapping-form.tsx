"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MappingForm({ importId, mappings }: { importId: string; mappings: { sourceColumn: string; targetField: string }[] }) {
  const router = useRouter();
  const [values, setValues] = useState(Object.fromEntries(mappings.map((mapping) => [mapping.sourceColumn, mapping.targetField])));
  const [message, setMessage] = useState("");
  const fields = ["ignore", "fullName", "phone", "cpf", "email", "externalId", "birth_date", "current_consignado_amount", "available_amount", "available_margin", "bank", "benefit_number", "agreement_type", "income"];
  async function confirm() {
    const mapping = await fetch(`/api/imports/${importId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    if (!mapping.ok) { setMessage((await mapping.json()).error ?? "Mapping inválido"); return; }
    const started = await fetch(`/api/imports/${importId}/start`, { method: "POST" });
    if (!started.ok) { setMessage((await started.json()).error ?? "Não foi possível iniciar"); return; }
    router.refresh();
  }
  return <section className="card"><h2>Revisar mapeamento</h2>{mappings.map((mapping) => <label key={mapping.sourceColumn} style={{ display: "block" }}>{mapping.sourceColumn}<select value={values[mapping.sourceColumn]} onChange={(event) => setValues({ ...values, [mapping.sourceColumn]: event.target.value })}>{fields.map((field) => <option key={field} value={field}>{field}</option>)}</select></label>)}<button type="button" onClick={confirm}>Confirmar e iniciar</button>{message && <p role="alert">{message}</p>}</section>;
}
