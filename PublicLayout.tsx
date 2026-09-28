import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Logo } from "./AppShell";
import { EmergencyBanner } from "./kit";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user } = useStore();
  const linkCls = "min-h-11 inline-flex items-center rounded-lg px-3 font-semibold hover:bg-muted";
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
          <Logo />
          <nav aria-label="Public" className="ml-auto flex flex-wrap items-center gap-1">
            <Link to="/about" className={linkCls} activeProps={{ className: "text-primary" }}>How it works</Link>
            <Link to="/privacy" className={linkCls} activeProps={{ className: "text-primary" }}>Privacy & safety</Link>
            {user ? <Link to="/app" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">My dashboard</Link>
              : <Link to="/login" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">Sign in</Link>}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t bg-card">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
          <EmergencyBanner compact />
          <div className="flex flex-wrap justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Neighbourhoods That Care · A community-help platform. Demo uses synthetic data only.</p>
            <div className="flex gap-4"><Link to="/about">How it works</Link><Link to="/privacy">Privacy & safety</Link><Link to="/login">Sign in</Link></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
