import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Bell, LogOut, HeartHandshake } from "lucide-react";
import { useStore } from "@/lib/store";
import { NAV, ROLE_LABEL } from "./registry";
import { useMyNotifications } from "./notifications";
import { Select } from "./kit";
import { cn } from "@/lib/utils";

export const DEMO_ACCOUNTS = [
  { email: "coordinator@ntc.demo", label: "Mei Ling — Coordinator" },
  { email: "sarah@ntc.demo", label: "Sarah — Volunteer" },
  { email: "rajesh@ntc.demo", label: "Rajesh — Volunteer" },
  { email: "aisha@ntc.demo", label: "Aisha — Resident" },
  { email: "partner@ntc.demo", label: "Grace — Community Partner" },
  { email: "admin@ntc.demo", label: "Daniel — Administrator" },
];

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-display text-lg font-bold leading-tight", light ? "text-hero-foreground" : "text-primary")}>
      <span className={cn("grid size-9 place-items-center rounded-xl", light ? "bg-hero-foreground text-hero" : "bg-primary text-primary-foreground")}><HeartHandshake className="size-5" aria-hidden /></span>
      <span>Neighbourhoods<br className="sm:hidden" /> That Care</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, login, logout } = useStore();
  const nav = useNavigate();
  const params = useParams({ strict: false }) as { page?: string };
  const unread = useMyNotifications().filter((n) => !n.read).length;
  if (!user) return null;
  const items = NAV[user.role].filter((i) => !i.hidden);
  const switchTo = (email: string) => { if (login(email, "demo123")) nav({ to: "/app" }); };
  const NavLinks = ({ mobile }: { mobile?: boolean }) => (
    <>{items.map((i) => {
      const active = params.page === i.slug;
      return (
        <Link key={i.slug} to="/app/$page" params={{ page: i.slug }} search={{}} aria-current={active ? "page" : undefined}
          className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 font-semibold transition-colors", mobile && "shrink-0 whitespace-nowrap text-sm",
            active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted")}>
          <i.icon className="size-5 shrink-0" />{i.label}
        </Link>);
    })}</>
  );
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            <label className="hidden items-center gap-2 text-sm md:flex"><span className="text-muted-foreground">Demo:</span>
              <Select aria-label="Switch demo account" className="min-h-9 w-56 py-1 text-sm" value={user.email} onChange={(e) => switchTo(e.target.value)}>
                {!DEMO_ACCOUNTS.some((a) => a.email === user.email) && <option value={user.email}>{user.name}</option>}
                {DEMO_ACCOUNTS.map((a) => <option key={a.email} value={a.email}>{a.label}</option>)}
              </Select></label>
            <Link to="/app/$page" params={{ page: "notifications" }} search={{}} className="relative grid size-11 place-items-center rounded-lg hover:bg-muted" aria-label={`Notifications, ${unread} unread`}>
              <Bell className="size-5" />{unread > 0 && <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">{unread}</span>}
            </Link>
            <div className="hidden text-right text-sm leading-tight sm:block"><div className="font-semibold">{user.name}</div><div className="text-muted-foreground">{ROLE_LABEL[user.role]}</div></div>
            <button onClick={() => { logout(); nav({ to: "/login" }); }} className="grid size-11 place-items-center rounded-lg hover:bg-muted" aria-label="Sign out"><LogOut className="size-5" /></button>
          </div>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden"><NavLinks mobile /></nav>
        <div className="px-3 pb-2 md:hidden">
          <Select aria-label="Switch demo account" className="min-h-9 py-1 text-sm" value={user.email} onChange={(e) => switchTo(e.target.value)}>
            {!DEMO_ACCOUNTS.some((a) => a.email === user.email) && <option value={user.email}>{user.name}</option>}
            {DEMO_ACCOUNTS.map((a) => <option key={a.email} value={a.email}>Demo: {a.label}</option>)}
          </Select>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-64 shrink-0 overflow-y-auto border-r bg-card p-3 lg:block">
          <nav aria-label="Main" className="flex flex-col gap-1"><NavLinks /></nav>
          <div className="mt-6 rounded-lg bg-destructive/8 p-3 text-xs">Not an emergency service. In danger? Call <strong>995</strong> / <strong>999</strong>.</div>
          <div className="mt-3 flex gap-3 px-1 text-xs text-muted-foreground"><Link to="/about">How it works</Link><Link to="/privacy">Privacy & safety</Link></div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
