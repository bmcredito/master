"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/imports", { method: "POST", body: form });
    const payload = await response.json();
    if (!response.ok) setMessage(payload.error ?? "Não foi possível preparar o import");
    else router.push(`/app/imports/${payload.id}`);
    setBusy(false);
  }

  return <><h1>Importar clientes</h1><section className="card"><p>Envie CSV ou XLSX para visualizar colunas, revisar o mapeamento e confirmar o processamento.</p><input type="file" accept=".csv,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><button type="button" onClick={upload} disabled={!file || busy}>{busy ? "Preparando…" : "Enviar e revisar"}</button>{message && <p role="alert">{message}</p>}<p>O processamento é assíncrono e preserva a identidade do cliente e o rastreamento de cada linha.</p></section></>;
}
