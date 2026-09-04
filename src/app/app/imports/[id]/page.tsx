import { notFound } from "next/navigation";
import { resolveAuthorizationContext, requireCapability } from "@/lib/auth/context";
import { db } from "@/lib/db";
export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) { const context = await resolveAuthorizationContext(); requireCapability(context, "lists.import"); const item = await db.import.findFirst({ where: { id: (await params).id, tenantId: context.tenantId }, include: { summary: true, errors: true } }); if (!item) notFound(); return <><h1>{item.name}</h1><section className="card"><p>Status: {item.status}</p><p>Progresso: {item.processedRows}/{item.totalRows}</p><p>Erros: {item.errorRows}</p>{item.summary && <p>Clientes criados: {item.summary.createdCount}</p>}</section></> }
