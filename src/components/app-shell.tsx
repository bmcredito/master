import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="shell"><aside className="sidebar"><strong>BM Crédito</strong><nav>
    <Link href="/app">Visão Geral</Link><Link href="/app/users">Usuários</Link><Link href="/app/teams">Equipes</Link><Link href="/app/audit">Auditoria</Link><Link href="/app/settings">Configurações</Link>
  </nav></aside><main className="content">{children}</main></div>;
}
