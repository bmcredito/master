import { db } from "@/lib/db";
import { resolveAuthorizationContext, requireCapability } from "@/lib/auth/context";
import { AuditRepository } from "@/repositories/tenant-repositories";
export default async function AuditPage() { const context = await resolveAuthorizationContext(); requireCapability(context, "audit.read"); const events = await new AuditRepository(db).list(context.tenantId); return <><h1>Auditoria</h1><section className="card"><table><thead><tr><th>Data</th><th>Ator</th><th>Ação</th><th>Entidade</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.createdAt.toLocaleString("pt-BR")}</td><td>{event.actor?.name ?? "Sistema"}</td><td>{event.action}</td><td>{event.entityType} · {event.entityId}</td></tr>)}</tbody></table></section></>; }
