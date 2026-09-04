import { resolveAuthorizationContext } from "@/lib/auth/context";
export default async function OverviewPage() { const context = await resolveAuthorizationContext(); return <><h1>Visão Geral</h1><section className="card"><p>Tenant ativo: <code>{context.tenantId}</code></p><p>Perfil: {context.role}</p><p>Escopo: {context.accessScope}</p></section></>; }
