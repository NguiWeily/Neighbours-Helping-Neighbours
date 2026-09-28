import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, CalendarPlus } from "lucide-react";
import { useStore, userOf } from "@/lib/store";
import { ACTIVE, catName, exportIcs, findConflicts, fmtDT, fmtDate, fmtTime, toLocalInput, uid, dist } from "@/lib/logic";
import type { HelpRequest, State, ConcernLevel } from "@/lib/types";
import { Badge, Button, Card, Check, Empty, Field, Input, Modal, Select, StatusBadge, Textarea, Stat, type Tone } from "./kit";
import { cn } from "@/lib/utils";

export const resName = (s: State, id?: string) => s.residents.find((r) => r.id === id)?.name ?? "—";
export const volName = (s: State, id?: string) => s.volunteers.find((v) => v.id === id)?.name ?? "Not yet matched";
export const reqIcs = (s: State, r: HelpRequest) => ({
  id: r.id, title: `${catName(s, r.category)} — ${resName(s, r.residentId)}`, start: r.date, dur: r.durationMin,
  location: s.residents.find((x) => x.id === r.residentId)?.address ?? r.neighbourhood,
  description: `${r.description}\nVolunteer: ${volName(s, r.volunteerId)}\nNeighbourhoods That Care (not an emergency service)`,
});

// ---------------- Request form ----------------
export function RequestForm({ residentId, onDone }: { residentId?: string; onDone: () => void }) {
  const { state, mutate } = useStore();
  const [rid, setRid] = useState(residentId ?? "");
  const res = state.residents.find((r) => r.id === rid);
  const [f, setF] = useState({ category: "", description: "", urgency: "normal", date: "", durationMin: "60", neighbourhood: res?.neighbourhood ?? "", accessibility: res?.accessibility ?? "", language: res?.languages[0] ?? "English", recurrence: "none", prefs: "", requiresVerified: true, transportNeeded: false });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const pickRes = (id: string) => {
    setRid(id); const r = state.residents.find((x) => x.id === id);
    if (r) setF((p) => ({ ...p, neighbourhood: r.neighbourhood, accessibility: r.accessibility, language: r.languages[0] }));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!rid) er.rid = "Please choose who needs help";
    if (!f.category) er.category = "Please choose a type of help";
    if (f.description.trim().length < 10) er.description = "Please describe what help is needed (at least 10 characters)";
    if (!f.date) er.date = "Please choose a preferred date and time";
    else if (+new Date(f.date) < Date.now() - 3600000) er.date = "Please choose a time in the future";
    if (!f.neighbourhood) er.neighbourhood = "Please choose a neighbourhood";
    setErr(er);
    if (Object.keys(er).length) return;
    const count = f.recurrence === "none" ? 1 : 4, gap = f.recurrence === "weekly" ? 7 : 14;
    const name = resName(state, rid);
    mutate((d) => {
      for (let i = 0; i < count; i++) {
        const dt = new Date(f.date); dt.setDate(dt.getDate() + i * gap);
        d.requests.unshift({ id: uid("q"), residentId: rid, category: f.category, description: f.description.trim(), urgency: f.urgency as HelpRequest["urgency"], date: dt.toISOString(), durationMin: Number(f.durationMin), neighbourhood: f.neighbourhood, accessibility: f.accessibility, language: f.language, recurrence: f.recurrence as HelpRequest["recurrence"], prefs: f.prefs, requiresVerified: f.requiresVerified, transportNeeded: f.transportNeeded, status: "open", declined: [], createdAt: new Date().toISOString() });
      }
    }, `Created ${catName(state, f.category)} request for ${name}${count > 1 ? ` (${count} recurring visits)` : ""}`, [{ to: "coordinator", text: `New ${f.urgency === "urgent" ? "URGENT " : ""}help request: ${catName(state, f.category)} for ${name}`, kind: "request" }]);
    toast.success(count > 1 ? `${count} recurring visits requested` : "Help request sent — a coordinator will find a volunteer");
    onDone();
  };
  const langs = Array.from(new Set(["English", "Mandarin", "Malay", "Tamil", "Hokkien", "Cantonese", ...(res?.languages ?? [])]));
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!residentId && (
        <Field label="Resident needing help" required error={err.rid}>{(id) => (
          <Select id={id} value={rid} onChange={(e) => pickRes(e.target.value)}><option value="">Choose resident…</option>{state.residents.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.neighbourhood})</option>)}</Select>)}</Field>
      )}
      <Field label="Type of help" required error={err.category}>{(id) => (
        <Select id={id} value={f.category} onChange={(e) => set("category", e.target.value)}><option value="">Choose…</option>{state.categories.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>)}</Field>
      <Field label="What do you need help with?" required error={err.description}>{(id) => <Textarea id={id} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Buy groceries from the market — I will prepare a list" />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="How soon?" required>{(id) => <Select id={id} value={f.urgency} onChange={(e) => set("urgency", e.target.value)}><option value="low">Whenever convenient</option><option value="normal">This week</option><option value="high">Within 2 days</option><option value="urgent">Today (urgent)</option></Select>}</Field>
        <Field label="Preferred date & time" required error={err.date}>{(id) => <Input id={id} type="datetime-local" value={f.date} onChange={(e) => set("date", e.target.value)} />}</Field>
        <Field label="About how long?">{(id) => <Select id={id} value={f.durationMin} onChange={(e) => set("durationMin", e.target.value)}>{[30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m} minutes</option>)}</Select>}</Field>
        <Field label="Neighbourhood" required error={err.neighbourhood}>{(id) => <Select id={id} value={f.neighbourhood} onChange={(e) => set("neighbourhood", e.target.value)}><option value="">Choose…</option>{state.zones.map((z) => <option key={z.name}>{z.name}</option>)}</Select>}</Field>
        <Field label="Preferred language">{(id) => <Select id={id} value={f.language} onChange={(e) => set("language", e.target.value)}>{langs.map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
        <Field label="One-off or recurring?">{(id) => <Select id={id} value={f.recurrence} onChange={(e) => set("recurrence", e.target.value)}><option value="none">One-off</option><option value="weekly">Every week (next 4 weeks)</option><option value="fortnightly">Every 2 weeks (next 4 visits)</option></Select>}</Field>
      </div>
      <Field label="Accessibility notes" hint="e.g. wheelchair user, hard of hearing, no lift">{(id) => <Input id={id} value={f.accessibility} onChange={(e) => set("accessibility", e.target.value)} />}</Field>
      <Field label="Preferred volunteer characteristics" hint="e.g. female volunteer, patient, speaks slowly">{(id) => <Input id={id} value={f.prefs} onChange={(e) => set("prefs", e.target.value)} />}</Field>
      <Check label="Transport needed (volunteer with a car)" checked={f.transportNeeded} onChange={(v) => set("transportNeeded", v)} />
      <Check label="Only verified, background-checked volunteers" checked={f.requiresVerified} onChange={(v) => set("requiresVerified", v)} />
      <Button type="submit" size="lg" className="w-full">Send help request</Button>
    </form>
  );
}

// ---------------- Reschedule / cancel ----------------
export function RescheduleModal({ req, onClose }: { req: HelpRequest | null; onClose: () => void }) {
  const { state, mutate } = useStore();
  const [date, setDate] = useState(req ? toLocalInput(req.date) : "");
  const [conf, setConf] = useState<string[]>([]);
  if (!req) return null;
  const save = (release: boolean) => {
    if (!date) return;
    const iso = new Date(date).toISOString();
    if (req.volunteerId && !release) {
      const c = findConflicts(state, req.volunteerId, iso, req.durationMin, req.id);
      if (c.length) { setConf(c.map((x) => `${x.title} at ${fmtDT(x.start)}`)); return; }
    }
    const vu = userOf(state, req.volunteerId), ru = userOf(state, req.residentId);
    mutate((d) => {
      const r = d.requests.find((x) => x.id === req.id)!;
      r.date = iso;
      if (release) { r.volunteerId = undefined; r.status = "open"; }
    }, `Rescheduled ${catName(state, req.category)} for ${resName(state, req.residentId)} to ${fmtDT(iso)}${release ? " and released volunteer for rematch" : ""}`,
      [...(vu ? [{ to: vu, text: release ? `Schedule change: you were released from ${catName(state, req.category)} (new time clashed)` : `Schedule change: ${catName(state, req.category)} moved to ${fmtDT(iso)}`, kind: "schedule" }] : []),
       ...(ru ? [{ to: ru, text: `Your ${catName(state, req.category)} help moved to ${fmtDT(iso)}`, kind: "schedule" }] : []), { to: "coordinator", text: `Rescheduled: ${catName(state, req.category)} for ${resName(state, req.residentId)}`, kind: "schedule" }]);
    toast.success(release ? "Rescheduled — request now needs a new volunteer" : "Rescheduled");
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Reschedule help visit">
      <div className="space-y-4">
        <Field label="New date and time" required>{(id) => <Input id={id} type="datetime-local" value={date} onChange={(e) => { setDate(e.target.value); setConf([]); }} />}</Field>
        {conf.length > 0 && (
          <div className="rounded-lg border-2 border-warning bg-warning/15 p-3 text-sm" role="alert">
            <strong>Conflict detected</strong> — {volName(state, req.volunteerId)} is already booked: {conf.join("; ")}.
            <div className="mt-2"><Button size="sm" variant="outline" onClick={() => save(true)}>Keep new time and find a substitute volunteer</Button></div>
          </div>
        )}
        <Button className="w-full" onClick={() => save(false)} disabled={!date}>Save new time</Button>
      </div>
    </Modal>
  );
}

export function CancelModal({ req, onClose, mode }: { req: HelpRequest | null; onClose: () => void; mode: "cancel" | "withdraw" }) {
  const { state, mutate } = useStore();
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  if (!req) return null;
  const go = (substitute: boolean) => {
    if (reason.trim().length < 3) { setErr("Please give a short reason"); return; }
    const vu = userOf(state, req.volunteerId), ru = userOf(state, req.residentId), label = catName(state, req.category);
    const release = mode === "withdraw" || substitute;
    mutate((d) => {
      const r = d.requests.find((x) => x.id === req.id)!;
      if (release) { if (r.volunteerId) r.declined.push({ volunteerId: r.volunteerId, reason: reason.trim() }); r.volunteerId = undefined; r.status = "open"; r.checkIn = undefined; }
      else { r.status = "cancelled"; r.cancelReason = reason.trim(); }
    }, release ? `Volunteer released from ${label} for ${resName(state, req.residentId)} — substitute needed (${reason})` : `Cancelled ${label} for ${resName(state, req.residentId)} (${reason})`,
      [{ to: "coordinator", text: release ? `Substitute needed: ${label} for ${resName(state, req.residentId)} on ${fmtDT(req.date)}` : `Cancelled: ${label} for ${resName(state, req.residentId)}`, kind: "cancellation" },
       ...(vu && mode !== "withdraw" ? [{ to: vu, text: `Cancellation: ${label} on ${fmtDT(req.date)} is no longer assigned to you`, kind: "cancellation" }] : []),
       ...(ru ? [{ to: ru, text: release ? `Your ${label} volunteer changed — we're finding a substitute` : `Your ${label} request was cancelled`, kind: "cancellation" }] : [])]);
    toast.success(release ? "Released — request is back in the matching queue" : "Request cancelled");
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={mode === "withdraw" ? "Withdraw from this task" : "Cancel help request"}>
      <div className="space-y-4">
        <Field label="Reason" required error={err}>{(id) => <Textarea id={id} value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} />}</Field>
        {mode === "withdraw" ? <Button className="w-full" variant="danger" onClick={() => go(true)}>Withdraw — coordinator will find a substitute</Button> : (
          <div className="grid gap-2">
            {req.volunteerId && <Button variant="outline" onClick={() => go(true)}>Keep request, find a substitute volunteer</Button>}
            <Button variant="danger" onClick={() => go(false)}>Cancel the request entirely</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------------- Request detail ----------------
export function RequestDetail({ req, onClose, actions }: { req: HelpRequest | null; onClose: () => void; actions?: ReactNode }) {
  const { state } = useStore();
  if (!req) return null;
  const r = state.requests.find((x) => x.id === req.id) ?? req;
  const Row = ({ k, v }: { k: string; v: ReactNode }) => v ? <div className="grid grid-cols-3 gap-2 border-b py-2 last:border-0"><dt className="font-semibold text-muted-foreground">{k}</dt><dd className="col-span-2">{v}</dd></div> : null;
  return (
    <Modal open onClose={onClose} title={catName(state, r.category)} wide>
      <div className="mb-3 flex flex-wrap gap-2"><StatusBadge s={r.status} /><StatusBadge s={r.urgency} />{r.recurrence !== "none" && <Badge tone="info">Recurring {r.recurrence}</Badge>}{r.requiresVerified && <Badge tone="primary">Verified volunteers only</Badge>}</div>
      <dl>
        <Row k="Resident" v={`${resName(state, r.residentId)} · ${r.neighbourhood}`} />
        <Row k="When" v={`${fmtDT(r.date)} (${r.durationMin} min)`} />
        <Row k="Details" v={r.description} />
        <Row k="Volunteer" v={volName(state, r.volunteerId)} />
        <Row k="Language" v={r.language} />
        <Row k="Accessibility" v={r.accessibility} />
        <Row k="Preferences" v={r.prefs} />
        <Row k="Transport" v={r.transportNeeded ? "Needed" : ""} />
        <Row k="Checked in" v={r.checkIn && fmtDT(r.checkIn)} />
        <Row k="Checked out" v={r.checkOut && fmtDT(r.checkOut)} />
        <Row k="Completion notes" v={r.completion?.notes} />
        <Row k="Wellbeing" v={r.completion?.wellbeing} />
        <Row k="Follow-up" v={r.completion?.followUp} />
        <Row k="Feedback" v={r.feedback && `${"★".repeat(r.feedback.rating)}${"☆".repeat(5 - r.feedback.rating)} ${r.feedback.comment}`} />
        <Row k="Override reason" v={r.override} />
        <Row k="Cancelled" v={r.cancelReason} />
        <Row k="Declined by" v={r.declined.length ? r.declined.map((x) => `${volName(state, x.volunteerId)}: "${x.reason}"`).join("; ") : ""} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {actions}
        {r.status !== "cancelled" && <Button variant="outline" onClick={() => exportIcs(`help-${r.id}.ics`, [reqIcs(state, r)])}><CalendarPlus className="size-4" />Add to calendar</Button>}
      </div>
    </Modal>
  );
}

export function RequestRow({ r, onOpen, right }: { r: HelpRequest; onOpen: () => void; right?: ReactNode }) {
  const { state } = useStore();
  const overdue = ACTIVE.includes(r.status) && +new Date(r.date) + r.durationMin * 60000 < Date.now();
  return (
    <Card className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", r.urgency === "urgent" && r.status === "open" && "border-destructive/50", overdue && "border-warning")}>
      <button className="flex-1 text-left" onClick={onOpen}>
        <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{catName(state, r.category)}</span><StatusBadge s={r.status} />{(r.urgency === "urgent" || r.urgency === "high") && <StatusBadge s={r.urgency} />}{overdue && <Badge tone="warning">Overdue</Badge>}</div>
        <div className="text-muted-foreground">{resName(state, r.residentId)} · {r.neighbourhood} · {fmtDT(r.date)}</div>
        <div className="text-sm">Volunteer: <strong>{volName(state, r.volunteerId)}</strong></div>
      </button>
      {right && <div className="flex flex-wrap gap-2">{right}</div>}
    </Card>
  );
}

// ---------------- Calendar ----------------
export interface CalItem { id: string; title: string; start: string; dur: number; tone: Tone; sub?: string; onClick?: () => void; location?: string; }
export function MonthCalendar({ items, icsName }: { items: CalItem[]; icsName: string }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [sel, setSel] = useState(() => new Date().toDateString());
  const days = useMemo(() => {
    const first = new Date(cursor); const off = (first.getDay() + 6) % 7; first.setDate(1 - off);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(first); d.setDate(first.getDate() + i); return d; });
  }, [cursor]);
  const byDay = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    items.forEach((i) => { const k = new Date(i.start).toDateString(); m.set(k, [...(m.get(k) ?? []), i]); });
    m.forEach((v) => v.sort((a, b) => +new Date(a.start) - +new Date(b.start)));
    return m;
  }, [items]);
  const agenda = byDay.get(sel) ?? [];
  const upcoming = items.filter((i) => +new Date(i.start) >= Date.now() - 3600000);
  const dot: Record<Tone, string> = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-destructive", info: "bg-info", neutral: "bg-muted-foreground" };
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" aria-label="Previous month" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}><ChevronLeft /></Button>
          <h2 className="text-xl font-bold">{cursor.toLocaleDateString("en-SG", { month: "long", year: "numeric" })}</h2>
          <Button variant="ghost" aria-label="Next month" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}><ChevronRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const k = d.toDateString(), list = byDay.get(k) ?? [], inMonth = d.getMonth() === cursor.getMonth(), today = k === new Date().toDateString();
            return (
              <button key={k} onClick={() => setSel(k)} aria-label={`${d.toDateString()}, ${list.length} items`}
                className={cn("flex min-h-16 flex-col items-start rounded-lg border p-1 text-left text-sm sm:min-h-20", !inMonth && "opacity-40", sel === k && "border-primary ring-2 ring-primary/30", today && "bg-secondary")}>
                <span className="font-bold">{d.getDate()}</span>
                <div className="mt-auto flex flex-wrap gap-0.5">{list.slice(0, 4).map((i) => <span key={i.id} className={cn("size-2 rounded-full", dot[i.tone])} />)}</div>
                <span className="hidden truncate text-[11px] text-muted-foreground sm:block w-full">{list[0]?.title}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />Help visit</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" />Event</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-info" />Befriending</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warning" />Unmatched</span>
        </div>
      </Card>
      <div className="space-y-3">
        <Card>
          <h3 className="mb-2 font-bold">{new Date(sel).toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}</h3>
          {agenda.length === 0 ? <p className="text-muted-foreground">Nothing scheduled.</p> : (
            <ul className="space-y-2">{agenda.map((i) => (
              <li key={i.id} className="flex items-start gap-2 rounded-lg border p-2">
                <span className={cn("mt-2 size-2.5 shrink-0 rounded-full", dot[i.tone])} />
                <button className="flex-1 text-left" onClick={i.onClick} disabled={!i.onClick}><div className="font-semibold">{fmtTime(i.start)} · {i.title}</div>{i.sub && <div className="text-sm text-muted-foreground">{i.sub}</div>}</button>
                <Button size="sm" variant="ghost" aria-label={`Export ${i.title} to calendar`} onClick={() => exportIcs(`${i.id}.ics`, [{ id: i.id, title: i.title, start: i.start, dur: i.dur, location: i.location, description: i.sub }])}><Download className="size-4" /></Button>
              </li>))}</ul>
          )}
        </Card>
        <Button variant="outline" className="w-full" disabled={!upcoming.length}
          onClick={() => { exportIcs(icsName, upcoming.map((i) => ({ id: i.id, title: i.title, start: i.start, dur: i.dur, location: i.location, description: i.sub }))); toast.success(`Exported ${upcoming.length} upcoming items (.ics)`); }}>
          <Download className="size-4" />Export all upcoming ({upcoming.length}) to .ics
        </Button>
      </div>
    </div>
  );
}

// ---------------- Concern form ----------------
export function ConcernModal({ open, onClose, residentId }: { open: boolean; onClose: () => void; residentId?: string }) {
  const { state, user, mutate } = useStore();
  const [f, setF] = useState({ level: "Routine" as ConcernLevel, title: "", details: "", residentId: residentId ?? "" });
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.title.trim().length < 4) { setErr("Please add a short summary"); return; }
    mutate((d) => { d.concerns.unshift({ id: uid("k"), level: f.level, title: f.title.trim(), details: f.details.trim(), residentId: f.residentId || undefined, raisedBy: user?.name ?? "Unknown", status: "open", actions: [], createdAt: new Date().toISOString() }); },
      `Raised ${f.level} concern: ${f.title}`, [{ to: "coordinator", text: `${f.level} concern raised: ${f.title}`, kind: "concern" }]);
    toast.success("Concern sent to your coordinator"); setF({ level: "Routine", title: "", details: "", residentId: residentId ?? "" }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Raise a community concern">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="rounded-lg bg-destructive/8 p-3 text-sm"><strong>Not for emergencies.</strong> If someone is in danger or seriously unwell, call 995 or 999 first, then log it here.</p>
        <Field label="Level">{(id) => <Select id={id} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as ConcernLevel })}><option>Routine</option><option>Priority</option><option>Urgent</option></Select>}</Field>
        {!residentId && <Field label="About resident (optional)">{(id) => <Select id={id} value={f.residentId} onChange={(e) => setF({ ...f, residentId: e.target.value })}><option value="">Not about a specific resident</option>{state.residents.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>}</Field>}
        <Field label="Summary" required error={err}>{(id) => <Input id={id} value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setErr(""); }} />}</Field>
        <Field label="What did you notice?" hint="Stick to what you saw or heard. Do not attempt anything outside your volunteer role.">{(id) => <Textarea id={id} value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} />}</Field>
        <Button type="submit" className="w-full">Send concern</Button>
      </form>
    </Modal>
  );
}

// ---------------- Messages ----------------
export function MessageThread({ me, other, otherName }: { me: string; other: string; otherName: string }) {
  const { state, mutate } = useStore();
  const [text, setText] = useState("");
  const msgs = state.messages.filter((m) => (m.from === me && m.to === other) || (m.from === other && m.to === me)).sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const send = (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim()) return;
    const meName = state.users.find((u) => u.id === me)?.name;
    mutate((d) => { d.messages.push({ id: uid("m"), from: me, to: other, text: text.trim(), at: new Date().toISOString() }); }, undefined, [{ to: other, text: `New message from ${meName}`, kind: "message" }]);
    setText("");
  };
  return (
    <Card>
      <div className="mb-3 max-h-96 space-y-2 overflow-y-auto" aria-live="polite">
        {msgs.length === 0 && <p className="text-muted-foreground">No messages yet. Say hello to {otherName}!</p>}
        {msgs.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-2", m.from === me ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
            <p>{m.text}</p><p className="text-xs opacity-75">{fmtDT(m.at)}</p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <label className="sr-only" htmlFor="msg">Message</label>
        <Input id="msg" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${otherName}…`} />
        <Button type="submit" disabled={!text.trim()}>Send</Button>
      </form>
    </Card>
  );
}

// ---------------- Timeline ----------------
export function ResidentTimeline({ residentId }: { residentId: string }) {
  const { state } = useStore();
  const items: { at: string; label: string; text: string; tone: Tone }[] = [];
  state.requests.filter((r) => r.residentId === residentId).forEach((r) => {
    items.push({ at: r.createdAt, label: "Request", text: `${catName(state, r.category)} requested`, tone: "neutral" });
    if (r.matchedAt && r.volunteerId) items.push({ at: r.matchedAt, label: "Match", text: `Matched with ${volName(state, r.volunteerId)}`, tone: "info" });
    if (r.checkIn) items.push({ at: r.checkIn, label: "Visit", text: `${volName(state, r.volunteerId)} checked in`, tone: "primary" });
    if (r.status === "completed") items.push({ at: r.checkOut ?? r.date, label: "Outcome", text: `${catName(state, r.category)} completed${r.completion?.notes ? ` — ${r.completion.notes}` : ""}`, tone: "success" });
    if (r.status === "cancelled") items.push({ at: r.date, label: "Cancelled", text: `${catName(state, r.category)} cancelled: ${r.cancelReason ?? ""}`, tone: "neutral" });
  });
  state.referrals.filter((f) => f.residentId === residentId).forEach((f) => {
    items.push({ at: f.createdAt, label: "Referral", text: `Referred for ${f.category} to ${state.partners.find((p) => p.id === f.partnerId)?.name} (now ${f.status})`, tone: "info" });
    f.notes.forEach((n) => items.push({ at: n.at, label: "Referral note", text: `${n.by}: ${n.text}`, tone: "neutral" }));
  });
  state.befriending.filter((b) => b.residentId === residentId).forEach((b) => b.contacts.forEach((c) => items.push({ at: c.at, label: "Befriending", text: `${volName(state, b.volunteerId)}: ${c.notes} (wellbeing ${c.wellbeing}/5)`, tone: "primary" })));
  state.concerns.filter((c) => c.residentId === residentId).forEach((c) => {
    items.push({ at: c.createdAt, label: `${c.level} concern`, text: `${c.title} — raised by ${c.raisedBy}`, tone: c.level === "Urgent" ? "danger" : "warning" });
    c.actions.forEach((a) => items.push({ at: a.at, label: "Concern action", text: `${a.by}: ${a.text}`, tone: "neutral" }));
  });
  items.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  if (!items.length) return <Empty title="No history yet" />;
  return (
    <ol className="relative space-y-3 border-l-2 pl-5">
      {items.map((i, n) => (
        <li key={n}><span className="absolute -left-[7px] mt-2 size-3 rounded-full bg-primary" /><div className="flex flex-wrap items-center gap-2"><Badge tone={i.tone}>{i.label}</Badge><span className="text-sm text-muted-foreground">{fmtDT(i.at)}</span></div><p>{i.text}</p></li>
      ))}
    </ol>
  );
}

// ---------------- Impact analytics ----------------
function Bars({ data, tone = "bg-primary" }: { data: [string, number][]; tone?: string }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  if (!data.length) return <p className="text-muted-foreground">No data.</p>;
  return <ul className="space-y-2">{data.map(([k, v]) => <li key={k}><div className="flex justify-between text-sm"><span>{k}</span><strong>{v}</strong></div><div className="h-3 rounded-full bg-muted"><div className={cn("h-full rounded-full", tone)} style={{ width: `${(v / max) * 100}%` }} /></div></li>)}</ul>;
}
export function ImpactAnalytics() {
  const { state: s } = useStore();
  const completed = s.requests.filter((r) => r.status === "completed");
  const supported = new Set(completed.map((r) => r.residentId).concat(s.befriending.map((b) => b.residentId))).size;
  const activeVols = s.volunteers.filter((v) => v.active).length;
  const hours = Math.round(completed.reduce((a, r) => a + (r.checkIn && r.checkOut ? (+new Date(r.checkOut) - +new Date(r.checkIn)) / 60000 : r.durationMin), 0) / 6 + s.befriending.reduce((a, b) => a + b.contacts.length * 45, 0) / 6) / 10;
  const matched = s.requests.filter((r) => r.matchedAt);
  const avgResp = matched.length ? Math.round(matched.reduce((a, r) => a + (+new Date(r.matchedAt!) - +new Date(r.createdAt)) / 3600000, 0) / matched.length) : 0;
  const open = s.requests.filter((r) => r.status === "open");
  const count = (arr: string[]) => Object.entries(arr.reduce<Record<string, number>>((a, k) => ((a[k] = (a[k] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
  const load = s.volunteers.filter((v) => v.active).map((v) => [v.name, s.requests.filter((r) => r.volunteerId === v.id && ACTIVE.includes(r.status)).length + s.befriending.filter((b) => b.volunteerId === v.id && b.active).length] as [string, number]).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Residents supported" value={supported} /><Stat label="Requests completed" value={completed.length} tone="success" />
        <Stat label="Active volunteers" value={activeVols} tone="info" /><Stat label="Volunteer hours" value={hours} />
        <Stat label="Avg. response time" value={`${avgResp}h`} tone="neutral" hint="request → match" /><Stat label="Unmatched demand" value={open.length} tone="warning" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h3 className="mb-3 font-bold">Open demand by category</h3><Bars data={count(open.map((r) => catName(s, r.category)))} tone="bg-warning" /></Card>
        <Card><h3 className="mb-3 font-bold">Open demand by neighbourhood</h3><Bars data={count(open.map((r) => r.neighbourhood))} tone="bg-warning" /></Card>
        <Card><h3 className="mb-3 font-bold">Volunteer capacity (active commitments)</h3><Bars data={load} tone="bg-info" /><p className="mt-2 text-sm text-muted-foreground">Overloaded (5+): {load.filter((l) => l[1] >= 5).map((l) => l[0]).join(", ") || "none"}</p></Card>
        <Card><h3 className="mb-3 font-bold">Community event participation</h3><Bars data={s.events.map((e) => [e.title, e.residentIds.length] as [string, number])} tone="bg-success" /></Card>
        <Card><h3 className="mb-3 font-bold">Referrals by status</h3><Bars data={(["New", "Submitted", "Accepted", "Service Started", "Closed"] as const).map((k) => [k, s.referrals.filter((f) => f.status === k).length] as [string, number])} /></Card>
        <Card><h3 className="mb-3 font-bold">Completed help by category</h3><Bars data={count(completed.map((r) => catName(s, r.category)))} tone="bg-success" /></Card>
      </div>
    </div>
  );
}

// ---------------- Events list ----------------
export function EventsList({ mode }: { mode: "resident" | "volunteer" }) {
  const { state, user, mutate } = useStore();
  const pid = user?.personId ?? "";
  const list = state.events.filter((e) => +new Date(e.date) > Date.now() - 3600000).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const toggle = (eid: string) => {
    const e = state.events.find((x) => x.id === eid)!;
    const key = mode === "resident" ? "residentIds" : "volunteerIds";
    const joined = e[key].includes(pid);
    if (!joined) {
      if (mode === "resident" && e.residentIds.length >= e.capacity) { toast.error("Sorry, this activity is full"); return; }
      if (mode === "volunteer") {
        if (e.volunteerIds.length >= e.volunteerSlots) { toast.error("All volunteer helper spots are filled"); return; }
        const c = findConflicts(state, pid, e.date, e.durationMin, e.id);
        if (c.length) { toast.error(`Conflict: you're booked for ${c[0].title} at that time`); return; }
      }
    }
    mutate((d) => { const ev = d.events.find((x) => x.id === eid)!; ev[key] = joined ? ev[key].filter((x) => x !== pid) : [...ev[key], pid]; },
      `${user?.name} ${joined ? "left" : "joined"} ${e.title}${mode === "volunteer" ? " as helper" : ""}`, [{ to: "coordinator", text: `${user?.name} ${joined ? "left" : "signed up for"} ${e.title}`, kind: "event" }]);
    toast.success(joined ? "You've been removed from this activity" : "You're signed up — see you there!");
  };
  if (!list.length) return <Empty title="No upcoming activities right now" />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((e) => {
        const joined = (mode === "resident" ? e.residentIds : e.volunteerIds).includes(pid);
        const near = s_near(state, pid, e.neighbourhood, mode);
        return (
          <Card key={e.id} className="flex flex-col">
            <div className="flex flex-wrap gap-2"><Badge tone="success">{e.category}</Badge>{near && <Badge tone="primary">Near you</Badge>}{joined && <Badge tone="info">Signed up</Badge>}</div>
            <h3 className="mt-2 text-xl font-bold">{e.title}</h3>
            <p className="text-muted-foreground">{fmtDate(e.date)} · {fmtTime(e.date)} · {e.location}</p>
            <p className="mt-1">{e.description}</p>
            <p className="mt-2 text-sm">{mode === "resident" ? `${e.capacity - e.residentIds.length} of ${e.capacity} places left` : `${e.volunteerSlots - e.volunteerIds.length} of ${e.volunteerSlots} helper spots left`}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant={joined ? "outline" : "primary"} onClick={() => toggle(e.id)}>{joined ? (mode === "resident" ? "Cancel my place" : "Withdraw as helper") : mode === "resident" ? "Join activity" : "Sign up to help"}</Button>
              <Button variant="ghost" onClick={() => exportIcs(`${e.id}.ics`, [{ id: e.id, title: e.title, start: e.date, dur: e.durationMin, location: e.location, description: e.description }])}><CalendarPlus className="size-4" />Calendar</Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
function s_near(s: State, pid: string, n: string, mode: string) {
  const home = mode === "resident" ? s.residents.find((r) => r.id === pid)?.neighbourhood : s.volunteers.find((v) => v.id === pid)?.neighbourhood;
  return home ? dist(s, home, n) <= 5 : false;
}
