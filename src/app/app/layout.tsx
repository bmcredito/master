import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { resolveAuthorizationContext } from "@/lib/auth/context";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  try { await resolveAuthorizationContext(); } catch { redirect("/login"); }
  return <AppShell>{children}</AppShell>;
}
