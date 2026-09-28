import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — Neighbourhoods That Care" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  const { ready, user } = useStore();
  const nav = useNavigate();
  useEffect(() => { if (ready && !user) nav({ to: "/login" }); }, [ready, user, nav]);
  if (!ready || !user) return <div className="grid min-h-screen place-items-center text-muted-foreground" role="status">Loading your neighbourhood…</div>;
  return <AppShell><Outlet /></AppShell>;
}
