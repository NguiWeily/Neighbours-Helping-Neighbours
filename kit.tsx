import { useEffect, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const BV = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
  outline: "border-2 border-input bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
  hero: "bg-hero-foreground text-hero hover:bg-hero-foreground/90 shadow-md",
  heroOutline: "border-2 border-hero-foreground/60 text-hero-foreground hover:bg-hero-foreground/10",
};
const BS = { sm: "min-h-9 px-3 text-sm", md: "min-h-11 px-4 text-base", lg: "min-h-13 px-6 text-lg" };
export function Button({ variant = "primary", size = "md", className, type = "button", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BV; size?: keyof typeof BS }) {
  return <button type={type} className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50", BV[variant], BS[size], className)} {...p} />;
}

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border bg-card p-4 text-card-foreground shadow-sm sm:p-5", className)} {...p}>{children}</div>;
}

const TONES = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/12 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/25 text-warning-foreground",
  danger: "bg-destructive/12 text-destructive",
  info: "bg-info/12 text-info",
};
export type Tone = keyof typeof TONES;
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold", TONES[tone], className)}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  open: "warning", matched: "info", accepted: "primary", in_progress: "info", completed: "success", cancelled: "neutral",
  New: "warning", Submitted: "info", Accepted: "primary", "Service Started": "info", Closed: "success",
  Open: "warning", "In Progress": "info", Done: "success", resolved: "success",
  Routine: "neutral", Priority: "warning", Urgent: "danger", urgent: "danger", high: "warning", normal: "neutral", low: "neutral",
};
const LABEL: Record<string, string> = { open: "Unmatched", matched: "Awaiting volunteer", accepted: "Confirmed", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled", resolved: "Resolved" };
export function StatusBadge({ s }: { s: string }) {
  return <Badge tone={STATUS_TONE[s] ?? "neutral"}>{LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
}

export function Field({ label, error, hint, children, required }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode; required?: boolean }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-semibold">{label}{required && <span className="text-destructive" aria-hidden> *</span>}</label>
      {children(id)}
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
    </div>
  );
}
const inputCls = "w-full min-h-11 rounded-lg border-2 border-input bg-card px-3 py-2 text-base focus:border-ring focus:outline-none";
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cn(inputCls, className)} {...p} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} className={cn(inputCls, className)} {...p} />;
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn(inputCls, className)} {...p}>{children}</select>;
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={cn("max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close"><X className="size-5" /></Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="rounded-xl border-2 border-dashed p-8 text-center"><p className="font-semibold">{title}</p>{children && <div className="mt-2 text-muted-foreground">{children}</div>}</div>;
}
export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>{sub && <p className="mt-1 text-muted-foreground">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
export function Stat({ label, value, tone = "primary", onClick, hint }: { label: string; value: ReactNode; tone?: Tone; onClick?: () => void; hint?: string }) {
  const C = onClick ? "button" : "div";
  return (
    <C onClick={onClick} className={cn("rounded-xl border bg-card p-4 text-left shadow-sm", onClick && "transition hover:border-primary hover:shadow-md")}>
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-3xl font-bold", { primary: "text-primary", success: "text-success", warning: "text-warning-foreground", danger: "text-destructive", info: "text-info", neutral: "text-foreground" }[tone])}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </C>
  );
}
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { v: T; label: string }[] }) {
  return (
    <div role="tablist" className="mb-4 flex flex-wrap gap-1 rounded-xl bg-muted p-1">
      {items.map((i) => (
        <button key={i.v} role="tab" aria-selected={value === i.v} onClick={() => onChange(i.v)}
          className={cn("min-h-10 rounded-lg px-3 text-sm font-semibold", value === i.v ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{i.label}</button>
      ))}
    </div>
  );
}
export function EmergencyBanner({ compact }: { compact?: boolean }) {
  return (
    <div role="note" className={cn("flex items-start gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/8 text-foreground", compact ? "p-3 text-sm" : "p-4")}>
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
      <p><strong>This is not an emergency service.</strong> If anyone is in immediate danger or seriously unwell, call <strong>995</strong> (ambulance/fire) or <strong>999</strong> (police) right away.</p>
    </div>
  );
}
export function ScoreBar({ value }: { value: number }) {
  const tone = value >= 70 ? "bg-success" : value >= 45 ? "bg-warning" : "bg-destructive";
  return <div className="h-2.5 w-full rounded-full bg-muted" aria-hidden><div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} /></div>;
}
