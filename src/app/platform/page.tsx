import { requirePlatformAdmin } from "@/lib/auth/context";
export default async function PlatformPage() { await requirePlatformAdmin(); return <main className="content"><h1>Platform Admin</h1><p>Contexto interno reservado. Console não habilitado nesta fase.</p></main>; }
