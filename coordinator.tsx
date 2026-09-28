import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useStore, userOf } from "@/lib/store";
import { ACTIVE, catName, commitments, dist, fmtDT, fmtDate, isOverdue, rankVolunteers, uid, volunteerHours, workload } from "@/lib/logic";
import type { Befriending, CommunityEvent, Concern, HelpRequest, RefStatus, Referral, Slot } from "@/lib/types";
import { Badge, Button, Card, Check, Empty, Field, Input, Modal, PageHeader, ScoreBar, Select, Stat, StatusBadge, Tabs, Textarea } from "../kit";
import { CancelModal, ConcernModal, ImpactAnalytics, MonthCalendar, RequestDetail, RequestForm, RequestRow, RescheduleModal, ResidentTimeline, resName, volName, type CalItem } from "../shared";
import { useFocusId, useGo } from "../nav";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS: Slot[] = ["morning", "afternoon", "evening"];

// ================= Dashboard =================
export function CoordDashboard() {
  const { state: s } = useStore();
  const go = useGo();
  const open = s.requests.filter((r) => r.status === "open");
  const urgent = open.filter((r) => r.urgency === "urgent" || r.urgency === "high");
  const today = s.requests.filter((r) => new Date(r.date).toDateString() === new Date().toDateString() && r.status !== "cancelled");
  const overdueTasks = s.tasks.filter((t) => t.status !== "Done" && isOverdue(t.due));
  const concerns = s.concerns.filter((c) => c.status !== "resolved");
  const pendingRefs = s.referrals.filter((f) => f.status === "New" || f.status === "Submitted");
  const availVols = s.volunteers.filter((v) => v.active && v.verified && workload(s, v.id) < 5);
  const activeReqs = s.requests.filter((r) => r.status !== "completed" && r.status !== "cancelled");
  return (
    <div className="space-y-6">
      <PageHeader title="Coordinator dashboard" sub={new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })} actions={<Button onClick={() => go("requests", "new")}><Plus className="size-4" />New request</Button>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open requests" value={activeReqs.length} onClick={() => go("requests")} />
        <Stat label="Unmatched" value={open.length} tone="warning" onClick={() => go("matching")} />
        <Stat label="Urgent / high" value={urgent.length} tone="danger" onClick={() => go("matching")} />
        <Stat label="Available volunteers" value={availVols.length} tone="success" onClick={() => go("volunteers")} />
        <Stat label="Today's visits" value={today.length} tone="info" onClick={() => go("calendar")} />
        <Stat label="Overdue tasks" value={overdueTasks.length} tone={overdueTasks.length ? "danger" : "neutral"} onClick={() => go("tasks")} />
        <Stat label="Open concerns" value={concerns.length} tone="warning" onClick={() => go("concerns")} />
        <Stat label="Pending referrals" value={pendingRefs.length} tone="info" onClick={() => go("referrals")} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-bold">Needs matching now</h2>
          {open.length === 0 ? <p className="text-muted-foreground">Every request has a volunteer. 🎉</p> : (
            <ul className="space-y-2">{[...open].sort((a, b) => ["urgent", "high", "normal", "low"].indexOf(a.urgency) - ["urgent", "high", "normal", "low"].indexOf(b.urgency)).slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                <div><div className="font-semibold">{catName(s, r.category)} <StatusBadge s={r.urgency} /></div><div className="text-sm text-muted-foreground">{resName(s, r.residentId)} · {fmtDT(r.date)}</div></div>
                <Button size="sm" onClick={() => go("matching", r.id)}>Match</Button>
              </li>))}</ul>)}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Today's visits</h2>
          {today.length === 0 ? <p className="text-muted-foreground">No visits today.</p> : (
            <ul className="space-y-2">{today.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                <div><div className="font-semibold">{new Date(r.date).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })} · {catName(s, r.category)}</div><div className="text-sm text-muted-foreground">{resName(s, r.residentId)} with {volName(s, r.volunteerId)}</div></div>
                <StatusBadge s={r.status} />
              </li>))}</ul>)}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Open concerns</h2>
          {concerns.length === 0 ? <p className="text-muted-foreground">No open concerns.</p> : <ul className="space-y-2">{concerns.map((c) => (
            <li key={c.id}><button onClick={() => go("concerns", c.id)} className="flex w-full items-center justify-between gap-2 rounded-lg border p-2 text-left hover:bg-muted"><span><strong>{c.title}</strong><br /><span className="text-sm text-muted-foreground">{resName(s, c.residentId)} · {fmtDT(c.createdAt)}</span></span><StatusBadge s={c.level} /></button></li>))}</ul>}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Overdue tasks & pending referrals</h2>
          <ul className="space-y-2">
            {overdueTasks.map((t) => <li key={t.id}><button onClick={() => go("tasks")} className="w-full rounded-lg border border-destructive/40 p-2 text-left hover:bg-muted"><strong>{t.title}</strong><br /><span className="text-sm text-destructive">Overdue since {fmtDT(t.due)}</span></button></li>)}
            {pendingRefs.map((f) => <li key={f.id}><button onClick={() => go("referrals")} className="w-full rounded-lg border p-2 text-left hover:bg-muted"><strong>{resName(s, f.residentId)}</strong> — {f.category} <StatusBadge s={f.status} /></button></li>)}
            {!overdueTasks.length && !pendingRefs.length && <li className="text-muted-foreground">All caught up.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ================= Requests =================
export function CoordRequests() {
  const { state: s } = useStore();
  const go = useGo();
  const focus = useFocusId();
  const [status, setStatus] = useState("active");
  const [cat, setCat] = useState(""); const [hood, setHood] = useState(""); const [q, setQ] = useState("");
  const [creating, setCreating] = useState(focus === "new");
  const [detail, setDetail] = useState<HelpRequest | null>(null);
  const [resched, setResched] = useState<HelpRequest | null>(null);
  const [cancel, setCancel] = useState<HelpRequest | null>(null);
  const list = s.requests.filter((r) => (status === "all" || (status === "active" ? !["completed", "cancelled"].includes(r.status) : r.status === status))
    && (!cat || r.category === cat) && (!hood || r.neighbourhood === hood)
    && (!q || `${resName(s, r.residentId)} ${r.description} ${volName(s, r.volunteerId)}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const actions = (r: HelpRequest) => r.status === "completed" || r.status === "cancelled" ? null : <>
    <Button size="sm" onClick={() => go("matching", r.id)}>{r.volunteerId ? "Reassign" : "Match"}</Button>
    <Button size="sm" variant="outline" onClick={() => setResched(r)}>Reschedule</Button>
    <Button size="sm" variant="ghost" onClick={() => setCancel(r)}>Cancel</Button>
  </>;
  return (
    <div>
      <PageHeader title="Help requests" sub={`${list.length} shown`} actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" />New request</Button>} />
      <Card className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input aria-label="Search requests" className="pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="active">All active</option><option value="all">Everything</option><option value="open">Unmatched</option><option value="matched">Awaiting volunteer</option><option value="accepted">Confirmed</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></Select>
        <Select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{s.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select aria-label="Neighbourhood" value={hood} onChange={(e) => setHood(e.target.value)}><option value="">All neighbourhoods</option>{s.zones.map((z) => <option key={z.name}>{z.name}</option>)}</Select>
      </Card>
      <div className="space-y-3">{list.length === 0 ? <Empty title="No requests match these filters" /> : list.map((r) => <RequestRow key={r.id} r={r} onOpen={() => setDetail(r)} right={actions(r)} />)}</div>
      <Modal open={creating} onClose={() => setCreating(false)} title="New help request" wide><RequestForm onDone={() => setCreating(false)} /></Modal>
      <RequestDetail req={detail} onClose={() => setDetail(null)} actions={detail && actions(detail)} />
      {resched && <RescheduleModal req={resched} onClose={() => setResched(null)} />}
      {cancel && <CancelModal req={cancel} mode="cancel" onClose={() => setCancel(null)} />}
    </div>
  );
}

// ================= Matching =================
export function CoordMatching() {
  const { state: s, mutate } = useStore();
  const focus = useFocusId();
  const [showAll, setShowAll] = useState(false);
  const queue = s.requests.filter((r) => showAll ? ACTIVE.includes(r.status) || r.status === "open" : r.status === "open").sort((a, b) => ["urgent", "high", "normal", "low"].indexOf(a.urgency) - ["urgent", "high", "normal", "low"].indexOf(b.urgency) || +new Date(a.date) - +new Date(b.date));
  const [selId, setSelId] = useState<string | undefined>(focus && s.requests.some((r) => r.id === focus) ? focus : queue[0]?.id);
  const req = s.requests.find((r) => r.id === selId);
  const ranked = useMemo(() => (req ? rankVolunteers(s, req) : []), [s, req]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [override, setOverride] = useState<{ vid: string; why: string } | null>(null);
  const [reason, setReason] = useState("");

  const assign = (vid: string, overrideReason?: string) => {
    if (!req) return;
    const prev = req.volunteerId, label = catName(s, req.category), vname = volName(s, vid);
    mutate((d) => { const r = d.requests.find((x) => x.id === req.id)!; r.volunteerId = vid; r.status = "matched"; r.matchedAt = new Date().toISOString(); r.override = overrideReason; r.checkIn = undefined; },
      `${prev ? "Reassigned" : "Matched"} ${vname} to ${label} for ${resName(s, req.residentId)}${overrideReason ? ` (override: ${overrideReason})` : ""}`,
      [{ to: userOf(s, vid), text: `New assignment: ${label} for ${resName(s, req.residentId)} on ${fmtDT(req.date)}`, kind: "assignment" },
       ...(prev && prev !== vid ? [{ to: userOf(s, prev), text: `Reassigned: ${label} on ${fmtDT(req.date)} has moved to another volunteer`, kind: "cancellation" }] : []),
       { to: userOf(s, req.residentId), text: `We've found a volunteer for your ${label} request`, kind: "assignment" }].filter((n) => n.to));
    toast.success(`${vname} assigned — awaiting their confirmation`);
    setOverride(null); setReason("");
    const next = s.requests.find((r) => r.status === "open" && r.id !== req.id);
    if (next && !showAll) setSelId(next.id);
  };

  return (
    <div>
      <PageHeader title="Smart matching" sub="Ranked volunteer recommendations with transparent reasons" />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Queue ({queue.length})</h2></div>
          <Check label="Include matched (for reassignment)" checked={showAll} onChange={setShowAll} />
          {queue.length === 0 ? <p className="text-muted-foreground">No requests waiting. 🎉</p> : (
            <ul className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto">{queue.map((r) => (
              <li key={r.id}><button onClick={() => setSelId(r.id)} className={cn("w-full rounded-lg border p-2 text-left", selId === r.id ? "border-primary bg-secondary" : "hover:bg-muted")}>
                <div className="flex flex-wrap items-center gap-1 font-semibold">{catName(s, r.category)} <StatusBadge s={r.urgency} /></div>
                <div className="text-sm text-muted-foreground">{resName(s, r.residentId)} · {r.neighbourhood}</div>
                <div className="text-sm">{fmtDT(r.date)} {r.volunteerId && <Badge tone="info">{volName(s, r.volunteerId)}</Badge>}</div>
              </button></li>))}</ul>)}
        </Card>
        <div className="space-y-3">
          {!req ? <Empty title="Select a request to see recommendations" /> : <>
            <Card className="bg-secondary">
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{catName(s, req.category)}</h2><StatusBadge s={req.status} /><StatusBadge s={req.urgency} /></div>
              <p>{resName(s, req.residentId)} · {req.neighbourhood} · {fmtDT(req.date)} ({req.durationMin} min)</p>
              <p className="text-muted-foreground">{req.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm"><Badge>Language: {req.language}</Badge>{req.transportNeeded && <Badge tone="info">Transport needed</Badge>}{req.requiresVerified && <Badge tone="primary">Verified only</Badge>}{req.prefs && <Badge>Pref: {req.prefs}</Badge>}</div>
            </Card>
            {ranked.map((m, i) => (
              <Card key={m.v.id} className={cn(m.block && "opacity-60", req.volunteerId === m.v.id && "border-primary")}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid size-14 place-items-center rounded-full bg-primary/12 text-xl font-bold text-primary" aria-label={`Match score ${m.score}`}>{m.score}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{i === 0 && !m.block && !m.soft ? "★ " : ""}{m.v.name}</span>
                      {m.v.verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Unverified</Badge>}{!m.v.active && <Badge>Inactive</Badge>}{req.volunteerId === m.v.id && <Badge tone="info">Current</Badge>}</div>
                    <p className="text-sm text-muted-foreground">{m.v.neighbourhood} · {m.distance} km · {m.v.languages.join(", ")} · {m.load} this week</p>
                    <ScoreBar value={m.score} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === m.v.id ? null : m.v.id)} aria-expanded={expanded === m.v.id}>{expanded === m.v.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}Why</Button>
                    {m.block ? <Button size="sm" disabled title={m.block}>Unavailable</Button>
                      : m.soft || i > 0 ? <Button size="sm" variant="outline" disabled={req.volunteerId === m.v.id} onClick={() => setOverride({ vid: m.v.id, why: m.soft ?? "Choosing a lower-ranked volunteer" })}>Override & assign</Button>
                      : <Button size="sm" disabled={req.volunteerId === m.v.id} onClick={() => assign(m.v.id)}>Assign</Button>}
                  </div>
                </div>
                {(m.block || m.soft) && <p className={cn("mt-2 flex items-center gap-2 text-sm font-semibold", m.block ? "text-destructive" : "text-warning-foreground")}><AlertCircle className="size-4" />{m.block ?? m.soft}</p>}
                {expanded === m.v.id && (
                  <ul className="mt-3 grid gap-1 sm:grid-cols-2">{m.reasons.map((r) => (
                    <li key={r.label} className="flex items-start gap-2 rounded-lg bg-muted p-2 text-sm">
                      {r.points === r.max ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                      <span><strong>{r.label} {r.points}/{r.max}</strong> — {r.text}</span></li>))}</ul>
                )}
              </Card>
            ))}
          </>}
        </div>
      </div>
      <Modal open={!!override} onClose={() => setOverride(null)} title="Coordinator override">
        <p className="mb-3">{override?.why}. Please record why you are assigning <strong>{volName(s, override?.vid)}</strong>.</p>
        <Field label="Override reason" required>{(id) => <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
        <Button className="mt-4 w-full" disabled={reason.trim().length < 3} onClick={() => override && assign(override.vid, reason.trim())}>Assign with override</Button>
      </Modal>
    </div>
  );
}

// ================= People (residents) =================
export function CoordPeople() {
  const { state: s, mutate } = useStore();
  const go = useGo();
  const focus = useFocusId();
  const [q, setQ] = useState(""); const [hood, setHood] = useState("");
  const [sel, setSel] = useState<string | null>(focus ?? null);
  const [tab, setTab] = useState<"profile" | "timeline" | "family">("profile");
  const [adding, setAdding] = useState(false); const [reqFor, setReqFor] = useState<string | null>(null); const [concernFor, setConcernFor] = useState<string | null>(null);
  const [nf, setNf] = useState({ name: "", neighbourhood: "", age: "", phone: "", address: "", languages: "", interests: "", accessibility: "", lonely: false });
  const [err, setErr] = useState("");
  const list = s.residents.filter((r) => (!hood || r.neighbourhood === hood) && r.name.toLowerCase().includes(q.toLowerCase()));
  const res = s.residents.find((r) => r.id === sel);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nf.name.trim() || !nf.neighbourhood || !nf.phone.trim()) { setErr("Name, neighbourhood and phone are required"); return; }
    mutate((d) => { d.residents.push({ id: uid("r"), name: nf.name.trim(), neighbourhood: nf.neighbourhood, age: Number(nf.age) || 0, phone: nf.phone, address: nf.address, languages: nf.languages.split(",").map((x) => x.trim()).filter(Boolean).length ? nf.languages.split(",").map((x) => x.trim()).filter(Boolean) : ["English"], interests: nf.interests.split(",").map((x) => x.trim()).filter(Boolean), accessibility: nf.accessibility, lonely: nf.lonely }); }, `Added resident ${nf.name}`);
    toast.success("Resident added"); setAdding(false); setErr(""); setNf({ name: "", neighbourhood: "", age: "", phone: "", address: "", languages: "", interests: "", accessibility: "", lonely: false });
  };
  return (
    <div>
      <PageHeader title="Residents" sub={`${s.residents.length} neighbours in the directory`} actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" />Add resident</Button>} />
      <Card className="mb-4 grid gap-3 sm:grid-cols-2">
        <Input aria-label="Search residents" placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Neighbourhood" value={hood} onChange={(e) => setHood(e.target.value)}><option value="">All neighbourhoods</option>{s.zones.map((z) => <option key={z.name}>{z.name}</option>)}</Select>
      </Card>
      {list.length === 0 ? <Empty title="No residents found" /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((r) => {
          const active = s.requests.filter((x) => x.residentId === r.id && !["completed", "cancelled"].includes(x.status)).length;
          return (
            <Card key={r.id}><button className="w-full text-left" onClick={() => { setSel(r.id); setTab("profile"); }}>
              <div className="flex items-center gap-2"><span className="text-lg font-bold">{r.name}</span>{r.lonely && <Badge tone="info">Befriending</Badge>}</div>
              <p className="text-muted-foreground">{r.neighbourhood} · {r.age} yrs · {r.languages.join(", ")}</p>
              <p className="text-sm">{active} active request(s)</p></button>
            </Card>);
        })}</div>
      )}
      <Modal open={!!res} onClose={() => setSel(null)} title={res?.name ?? ""} wide>
        {res && <>
          <Tabs value={tab} onChange={setTab} items={[{ v: "profile", label: "Profile" }, { v: "timeline", label: "Timeline" }, { v: "family", label: "Family / caregiver" }]} />
          {tab === "profile" && <div className="space-y-2">
            <p><strong>Neighbourhood:</strong> {res.neighbourhood}</p><p><strong>Address:</strong> {res.address}</p><p><strong>Phone:</strong> {res.phone}</p>
            <p><strong>Languages:</strong> {res.languages.join(", ")}</p><p><strong>Interests:</strong> {res.interests.join(", ") || "—"}</p>
            <p><strong>Accessibility:</strong> {res.accessibility || "—"}</p>
            <Check label="Experiencing loneliness — suitable for befriending" checked={res.lonely} onChange={(v) => mutate((d) => { d.residents.find((x) => x.id === res.id)!.lonely = v; }, `Updated befriending flag for ${res.name}`)} />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => setReqFor(res.id)}>Create help request</Button>
              <Button variant="outline" onClick={() => go("referrals", `new:${res.id}`)}>Make referral</Button>
              <Button variant="outline" onClick={() => setConcernFor(res.id)}>Log concern</Button>
            </div></div>}
          {tab === "timeline" && <ResidentTimeline residentId={res.id} />}
          {tab === "family" && (s.caregivers.filter((c) => c.residentId === res.id).length ? s.caregivers.filter((c) => c.residentId === res.id).map((c) => (
            <Card key={c.id} className="mb-2"><strong>{c.name}</strong> ({c.relationship}) · {c.phone} · prefers {c.preferredComm}<p className="text-sm">Stress level {c.stress}/5 — {c.supportNeeds}</p></Card>)) : <Empty title="No family/caregiver linked"><Button className="mt-2" variant="outline" onClick={() => go("caregivers")}>Go to caregiver support</Button></Empty>)}
        </>}
      </Modal>
      <Modal open={!!reqFor} onClose={() => setReqFor(null)} title="New help request" wide>{reqFor && <RequestForm residentId={reqFor} onDone={() => setReqFor(null)} />}</Modal>
      <ConcernModal open={!!concernFor} onClose={() => setConcernFor(null)} residentId={concernFor ?? undefined} />
      <Modal open={adding} onClose={() => setAdding(false)} title="Add resident">
        <form onSubmit={add} className="space-y-3" noValidate>
          {err && <p className="font-semibold text-destructive" role="alert">{err}</p>}
          <Field label="Full name" required>{(id) => <Input id={id} value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />}</Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Neighbourhood" required>{(id) => <Select id={id} value={nf.neighbourhood} onChange={(e) => setNf({ ...nf, neighbourhood: e.target.value })}><option value="">Choose…</option>{s.zones.map((z) => <option key={z.name}>{z.name}</option>)}</Select>}</Field>
            <Field label="Phone" required>{(id) => <Input id={id} value={nf.phone} onChange={(e) => setNf({ ...nf, phone: e.target.value })} />}</Field>
            <Field label="Age">{(id) => <Input id={id} type="number" value={nf.age} onChange={(e) => setNf({ ...nf, age: e.target.value })} />}</Field>
            <Field label="Languages (comma separated)">{(id) => <Input id={id} value={nf.languages} onChange={(e) => setNf({ ...nf, languages: e.target.value })} />}</Field>
          </div>
          <Field label="Address">{(id) => <Input id={id} value={nf.address} onChange={(e) => setNf({ ...nf, address: e.target.value })} />}</Field>
          <Field label="Interests (comma separated)">{(id) => <Input id={id} value={nf.interests} onChange={(e) => setNf({ ...nf, interests: e.target.value })} />}</Field>
          <Field label="Accessibility notes">{(id) => <Input id={id} value={nf.accessibility} onChange={(e) => setNf({ ...nf, accessibility: e.target.value })} />}</Field>
          <Check label="Experiencing loneliness" checked={nf.lonely} onChange={(v) => setNf({ ...nf, lonely: v })} />
          <Button type="submit" className="w-full">Add resident</Button>
        </form>
      </Modal>
    </div>
  );
}

// ================= Volunteers =================
export function AvailabilityGrid({ availability, onToggle }: { availability: Record<string, Slot[]>; onToggle?: (day: string, slot: Slot) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-center text-sm">
        <thead><tr><th className="p-1" />{DAYS.map((d) => <th key={d} className="p-1">{d}</th>)}</tr></thead>
        <tbody>{SLOTS.map((sl) => (
          <tr key={sl}><th className="p-1 text-left capitalize">{sl}</th>{DAYS.map((_, di) => {
            const on = (availability[String(di)] ?? []).includes(sl);
            return <td key={di} className="p-1"><button disabled={!onToggle} aria-pressed={on} aria-label={`${DAYS[di]} ${sl}`} onClick={() => onToggle?.(String(di), sl)}
              className={cn("h-10 w-full rounded-lg border-2", on ? "border-primary bg-primary text-primary-foreground" : "bg-card", onToggle && "hover:border-primary")}>{on ? "✓" : ""}</button></td>;
          })}</tr>))}</tbody>
      </table>
    </div>
  );
}
export function CoordVolunteers() {
  const { state: s, mutate } = useStore();
  const [q, setQ] = useState(""); const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<string | null>(null);
  const list = s.volunteers.filter((v) => v.name.toLowerCase().includes(q.toLowerCase()) && (filter === "all" || (filter === "pending" ? !v.verified : filter === "inactive" ? !v.active : v.active && v.verified)));
  const v = s.volunteers.find((x) => x.id === sel);
  const toggle = (id: string, k: "verified" | "active" | "trained") => mutate((d) => { const x = d.volunteers.find((y) => y.id === id)!; x[k] = !x[k]; },
    `${s.volunteers.find((x) => x.id === id)?.[k] ? "Removed" : "Set"} ${k} status for ${s.volunteers.find((x) => x.id === id)?.name}`);
  return (
    <div>
      <PageHeader title="Volunteers" sub={`${s.volunteers.filter((x) => x.active).length} active · ${s.volunteers.filter((x) => !x.verified).length} awaiting verification`} />
      <Card className="mb-4 grid gap-3 sm:grid-cols-2">
        <Input aria-label="Search volunteers" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="ok">Active & verified</option><option value="pending">Awaiting verification</option><option value="inactive">Inactive</option></Select>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((x) => {
        const load = workload(s, x.id);
        return (
          <Card key={x.id}>
            <button className="w-full text-left" onClick={() => setSel(x.id)}>
              <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{x.name}</span>{x.verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Pending verification</Badge>}{x.trained && <Badge tone="info">Trained</Badge>}{!x.active && <Badge>Inactive</Badge>}{load >= 5 && <Badge tone="danger">Overloaded</Badge>}</div>
              <p className="text-muted-foreground">{x.neighbourhood} · {x.languages.join(", ")} · {x.transport ? "Has transport" : "No transport"}</p>
              <p className="text-sm">{load} commitments this week · {volunteerHours(s, x.id)} hrs total</p>
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant={x.verified ? "outline" : "success"} onClick={() => toggle(x.id, "verified")}>{x.verified ? "Revoke verification" : "Verify"}</Button>
              <Button size="sm" variant="outline" onClick={() => toggle(x.id, "trained")}>{x.trained ? "Mark untrained" : "Mark trained"}</Button>
              <Button size="sm" variant="ghost" onClick={() => toggle(x.id, "active")}>{x.active ? "Deactivate" : "Reactivate"}</Button>
            </div>
          </Card>);
      })}</div>
      <Modal open={!!v} onClose={() => setSel(null)} title={v?.name ?? ""} wide>
        {v && <div className="space-y-3">
          <p><strong>Contact:</strong> {v.email} · {v.phone}</p>
          <p><strong>Skills:</strong> {v.skills.join(", ")}</p><p><strong>Preferred help:</strong> {v.categories.map((c) => catName(s, c)).join(", ")}</p>
          <p><strong>Interests:</strong> {v.interests.join(", ")}</p><p><strong>Max travel:</strong> {v.maxKm} km</p>
          <h3 className="font-bold">Availability</h3><AvailabilityGrid availability={v.availability} />
          <h3 className="font-bold">Upcoming commitments</h3>
          {commitments(s, v.id).length ? <ul className="list-disc pl-5">{commitments(s, v.id).map((c) => <li key={c.id}>{fmtDT(c.start)} — {c.title}</li>)}</ul> : <p className="text-muted-foreground">None.</p>}
        </div>}
      </Modal>
    </div>
  );
}

// ================= Calendar =================
export function CoordCalendar() {
  const { state: s } = useStore();
  const [vid, setVid] = useState("");
  const [detail, setDetail] = useState<HelpRequest | null>(null);
  const [resched, setResched] = useState<HelpRequest | null>(null);
  const [cancel, setCancel] = useState<HelpRequest | null>(null);
  const go = useGo();
  const items: CalItem[] = [
    ...s.requests.filter((r) => r.status !== "cancelled" && (!vid || r.volunteerId === vid)).map((r) => ({ id: r.id, title: `${catName(s, r.category)} — ${resName(s, r.residentId)}`, start: r.date, dur: r.durationMin, tone: (r.status === "open" ? "warning" : r.status === "completed" ? "neutral" : "primary") as CalItem["tone"], sub: `Volunteer: ${volName(s, r.volunteerId)}`, location: r.neighbourhood, onClick: () => setDetail(r) })),
    ...s.events.filter((e) => !vid || e.volunteerIds.includes(vid)).map((e) => ({ id: e.id, title: e.title, start: e.date, dur: e.durationMin, tone: "success" as const, sub: `${e.residentIds.length}/${e.capacity} registered · ${e.location}`, location: e.location, onClick: () => go("events") })),
    ...s.befriending.filter((b) => b.active && (!vid || b.volunteerId === vid)).map((b) => ({ id: `${b.id}-next`, title: `Befriending: ${resName(s, b.residentId)}`, start: b.nextContact, dur: 45, tone: "info" as const, sub: `${b.contactType} with ${volName(s, b.volunteerId)}`, onClick: () => go("befriending") })),
  ];
  const v = s.volunteers.find((x) => x.id === vid);
  const actions = detail && !["completed", "cancelled"].includes(detail.status) && <>
    <Button onClick={() => { setResched(detail); setDetail(null); }}>Reschedule</Button>
    <Button variant="outline" onClick={() => { setCancel(detail); setDetail(null); }}>Cancel / substitute</Button>
    <Button variant="outline" onClick={() => go("matching", detail.id)}>{detail.volunteerId ? "Rematch" : "Match"}</Button></>;
  return (
    <div>
      <PageHeader title="Calendar & scheduling" sub="Help visits, events and befriending contacts" actions={
        <Select aria-label="Filter by volunteer" value={vid} onChange={(e) => setVid(e.target.value)} className="w-auto"><option value="">All volunteers</option>{s.volunteers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>} />
      <MonthCalendar items={items} icsName={v ? `ntc-${v.name.replace(/\s/g, "-")}.ics` : "ntc-all-upcoming.ics"} />
      {v && <Card className="mt-4"><h2 className="mb-2 font-bold">{v.name}'s weekly availability (shifts)</h2><AvailabilityGrid availability={v.availability} /></Card>}
      <RequestDetail req={detail} onClose={() => setDetail(null)} actions={actions} />
      {resched && <RescheduleModal req={resched} onClose={() => setResched(null)} />}
      {cancel && <CancelModal req={cancel} mode="cancel" onClose={() => setCancel(null)} />}
    </div>
  );
}

// ================= Befriending =================
export function LogContactModal({ pair, onClose }: { pair: Befriending | null; onClose: () => void }) {
  const { state: s, mutate } = useStore();
  const [notes, setNotes] = useState(""); const [wb, setWb] = useState("3"); const [next, setNext] = useState(""); const [err, setErr] = useState("");
  if (!pair) return null;
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim().length < 3 || !next) { setErr("Please add brief notes and the next contact date"); return; }
    mutate((d) => { const b = d.befriending.find((x) => x.id === pair.id)!; const now = new Date().toISOString(); b.contacts.unshift({ at: now, notes: notes.trim(), wellbeing: Number(wb) }); b.lastContact = now; b.wellbeing = Number(wb); b.nextContact = new Date(next).toISOString(); },
      `Logged befriending contact with ${resName(s, pair.residentId)} (wellbeing ${wb}/5)`, Number(wb) <= 2 ? [{ to: "coordinator", text: `Low wellbeing (${wb}/5) recorded for ${resName(s, pair.residentId)}`, kind: "concern" }] : []);
    toast.success("Contact recorded"); onClose();
  };
  return (
    <Modal open onClose={onClose} title={`Record contact — ${resName(s, pair.residentId)}`}>
      <form onSubmit={save} className="space-y-3" noValidate>
        {err && <p className="font-semibold text-destructive" role="alert">{err}</p>}
        <Field label="Brief notes" required hint="Non-sensitive summary only">{(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}</Field>
        <Field label="Wellbeing (1 = low, 5 = great)">{(id) => <Select id={id} value={wb} onChange={(e) => setWb(e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select>}</Field>
        <Field label="Next contact" required>{(id) => <Input id={id} type="datetime-local" value={next} onChange={(e) => setNext(e.target.value)} />}</Field>
        <Button type="submit" className="w-full">Save contact</Button>
      </form>
    </Modal>
  );
}
export function CoordBefriending() {
  const { state: s, mutate } = useStore();
  const [log, setLog] = useState<Befriending | null>(null);
  const [esc, setEsc] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [rid, setRid] = useState(""); const [freq, setFreq] = useState("Weekly"); const [ct, setCt] = useState("Home visit"); const [vid, setVid] = useState("");
  const res = s.residents.find((r) => r.id === rid);
  const candidates = res ? s.volunteers.filter((v) => v.active && v.verified).map((v) => {
    const cont = s.befriending.some((b) => b.volunteerId === v.id && b.residentId === rid) || s.requests.some((r) => r.volunteerId === v.id && r.residentId === rid && r.status === "completed");
    const lang = v.languages.some((l) => res.languages.includes(l)); const d = dist(s, v.neighbourhood, res.neighbourhood);
    const shared = v.interests.filter((i) => res.interests.some((ri) => ri.toLowerCase().includes(i.toLowerCase())));
    const score = (cont ? 35 : 0) + (lang ? 25 : 0) + (d <= 3 ? 20 : d <= 8 ? 10 : 0) + (v.categories.includes("befriending") || v.categories.includes("companionship") ? 15 : 0) + (shared.length ? 5 : 0) + Math.max(0, 5 - workload(s, v.id));
    const why = [cont && "helped before (continuity)", lang && "shared language", `${d} km away`, shared.length && `shared interest: ${shared.join(", ")}`].filter(Boolean).join(" · ");
    return { v, score, why };
  }).sort((a, b) => b.score - a.score) : [];
  const create = () => {
    if (!rid || !vid) return;
    const nx = new Date(); nx.setDate(nx.getDate() + 2); nx.setHours(15, 0, 0, 0);
    mutate((d) => { d.befriending.push({ id: uid("b"), residentId: rid, volunteerId: vid, frequency: freq, contactType: ct, interests: res?.interests.join(", ") ?? "", nextContact: nx.toISOString(), wellbeing: 3, contacts: [], active: true }); },
      `Created befriending match: ${volName(s, vid)} with ${res?.name}`, [{ to: userOf(s, vid), text: `New befriending match: ${res?.name} (${freq}, ${ct})`, kind: "assignment" }].filter((n) => n.to));
    toast.success("Befriending match created"); setCreating(false); setRid(""); setVid("");
  };
  const unpaired = s.residents.filter((r) => r.lonely && !s.befriending.some((b) => b.residentId === r.id && b.active));
  return (
    <div>
      <PageHeader title="Befriending" sub="Regular, continuous companionship for neighbours experiencing loneliness" actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" />New befriending match</Button>} />
      {unpaired.length > 0 && <Card className="mb-4 border-warning bg-warning/10"><strong>Waiting for a befriender:</strong> {unpaired.map((r) => r.name).join(", ")}</Card>}
      <div className="grid gap-3 md:grid-cols-2">{s.befriending.map((b) => {
        const late = b.active && isOverdue(b.nextContact);
        return (
          <Card key={b.id} className={cn(late && "border-destructive/50", !b.active && "opacity-60")}>
            <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{resName(s, b.residentId)}</span><Badge tone={b.wellbeing <= 2 ? "danger" : b.wellbeing === 3 ? "warning" : "success"}>Wellbeing {b.wellbeing}/5</Badge>{late && <Badge tone="danger">Contact overdue</Badge>}{!b.active && <Badge>Paused</Badge>}</div>
            <p className="text-muted-foreground">with {volName(s, b.volunteerId)} · {b.frequency} · {b.contactType}</p>
            <p className="text-sm">Interests: {b.interests}</p>
            <p className="text-sm">Last: {fmtDT(b.lastContact)} · Next: <strong>{fmtDT(b.nextContact)}</strong></p>
            {b.contacts[0] && <p className="mt-1 text-sm italic">“{b.contacts[0].notes}”</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setLog(b)}>Record contact</Button>
              <Button size="sm" variant="outline" onClick={() => setEsc(b.residentId)}>Escalate concern</Button>
              <Button size="sm" variant="ghost" onClick={() => mutate((d) => { const x = d.befriending.find((y) => y.id === b.id)!; x.active = !x.active; }, `${b.active ? "Paused" : "Resumed"} befriending for ${resName(s, b.residentId)}`)}>{b.active ? "Pause" : "Resume"}</Button>
            </div>
          </Card>);
      })}</div>
      {log && <LogContactModal pair={log} onClose={() => setLog(null)} />}
      <ConcernModal open={!!esc} onClose={() => setEsc(null)} residentId={esc ?? undefined} />
      <Modal open={creating} onClose={() => setCreating(false)} title="New befriending match" wide>
        <div className="space-y-3">
          <Field label="Resident" required>{(id) => <Select id={id} value={rid} onChange={(e) => { setRid(e.target.value); setVid(""); }}><option value="">Choose…</option>{[...s.residents].sort((a, b) => Number(b.lonely) - Number(a.lonely)).map((r) => <option key={r.id} value={r.id}>{r.name}{r.lonely ? " (loneliness flagged)" : ""}</option>)}</Select>}</Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Frequency">{(id) => <Select id={id} value={freq} onChange={(e) => setFreq(e.target.value)}><option>Weekly</option><option>Twice weekly</option><option>Fortnightly</option><option>Monthly</option></Select>}</Field>
            <Field label="Preferred contact">{(id) => <Select id={id} value={ct} onChange={(e) => setCt(e.target.value)}><option>Home visit</option><option>Phone call</option><option>Video call</option><option>Meet at community centre</option></Select>}</Field>
          </div>
          {res && <><h3 className="font-bold">Suggested befrienders (continuity preferred)</h3>
            <ul className="space-y-2">{candidates.map((c) => (
              <li key={c.v.id}><label className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-2", vid === c.v.id && "border-primary bg-secondary")}>
                <input type="radio" name="bf" checked={vid === c.v.id} onChange={() => setVid(c.v.id)} className="size-5" />
                <span className="flex-1"><strong>{c.v.name}</strong> <Badge tone="primary">{c.score}</Badge><br /><span className="text-sm text-muted-foreground">{c.why}</span></span></label></li>))}</ul></>}
          <Button className="w-full" disabled={!rid || !vid} onClick={create}>Create match</Button>
        </div>
      </Modal>
    </div>
  );
}

// ================= Referrals =================
const REF_FLOW: RefStatus[] = ["New", "Submitted", "Accepted", "Service Started", "Closed"];
export function RefStepper({ status }: { status: RefStatus }) {
  const i = REF_FLOW.indexOf(status);
  return <ol className="flex flex-wrap gap-1 text-xs">{REF_FLOW.map((st, n) => <li key={st} className={cn("rounded-full px-2 py-1 font-semibold", n <= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{st}</li>)}</ol>;
}
export function CoordReferrals() {
  const { state: s, mutate, user } = useStore();
  const focus = useFocusId();
  const [tab, setTab] = useState<"refs" | "partners">("refs");
  const preRes = focus?.startsWith("new:") ? focus.slice(4) : "";
  const [creating, setCreating] = useState(!!preRes);
  const [f, setF] = useState({ residentId: preRes, category: "", partnerId: "", reason: "" });
  const [err, setErr] = useState("");
  const [statusF, setStatusF] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});
  const res = s.residents.find((r) => r.id === f.residentId);
  const partners = s.partners.filter((p) => (!f.category || p.categories.includes(f.category)) && (!res || p.neighbourhoods.includes(res.neighbourhood)));
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.residentId || !f.category || !f.partnerId || f.reason.trim().length < 5) { setErr("All fields are required (reason at least 5 characters)"); return; }
    mutate((d) => { d.referrals.unshift({ id: uid("f"), residentId: f.residentId, category: f.category, partnerId: f.partnerId, status: "New", reason: f.reason.trim(), notes: [], createdAt: new Date().toISOString() }); },
      `Created ${f.category} referral for ${res?.name}`, [{ to: userOf(s, f.partnerId), text: `New referral: ${res?.name} — ${f.category}`, kind: "referral" }].filter((n) => n.to));
    toast.success("Referral created"); setCreating(false); setErr(""); setF({ residentId: "", category: "", partnerId: "", reason: "" });
  };
  const advance = (r: Referral) => {
    const next = REF_FLOW[REF_FLOW.indexOf(r.status) + 1]; if (!next) return;
    mutate((d) => { d.referrals.find((x) => x.id === r.id)!.status = next; }, `Referral for ${resName(s, r.residentId)} moved to ${next}`, [{ to: userOf(s, r.partnerId), text: `Referral update: ${resName(s, r.residentId)} is now ${next}`, kind: "referral" }].filter((n) => n.to));
  };
  const addNote = (r: Referral) => {
    const t = note[r.id]?.trim(); if (!t) return;
    mutate((d) => { d.referrals.find((x) => x.id === r.id)!.notes.push({ at: new Date().toISOString(), by: user?.name ?? "", text: t }); }, `Added note to referral for ${resName(s, r.residentId)}`);
    setNote({ ...note, [r.id]: "" });
  };
  const list = s.referrals.filter((r) => !statusF || r.status === statusF);
  return (
    <div>
      <PageHeader title="Community referrals" actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" />New referral</Button>} />
      <Tabs value={tab} onChange={setTab} items={[{ v: "refs", label: `Referrals (${s.referrals.length})` }, { v: "partners", label: "Partner directory" }]} />
      {tab === "refs" ? <>
        <Select aria-label="Filter by status" className="mb-3 sm:w-64" value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">All statuses</option>{REF_FLOW.map((x) => <option key={x}>{x}</option>)}</Select>
        <div className="space-y-3">{list.length === 0 ? <Empty title="No referrals" /> : list.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="text-lg font-bold">{resName(s, r.residentId)}</span> <span className="text-muted-foreground">→ {s.partners.find((p) => p.id === r.partnerId)?.name}</span></div><StatusBadge s={r.status} /></div>
            <p className="capitalize">{r.category}</p><p className="text-sm text-muted-foreground">{r.reason}</p>
            <div className="my-2"><RefStepper status={r.status} /></div>
            {r.expectedStart && <p className="text-sm">Expected start: <strong>{fmtDate(r.expectedStart)}</strong></p>}
            {r.notes.length > 0 && <ul className="mt-2 space-y-1 text-sm">{r.notes.map((n, i) => <li key={i} className="rounded bg-muted p-2"><strong>{n.by}</strong> ({fmtDT(n.at)}): {n.text}</li>)}</ul>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Input aria-label="Add note" className="flex-1" placeholder="Add a note…" value={note[r.id] ?? ""} onChange={(e) => setNote({ ...note, [r.id]: e.target.value })} />
              <Button variant="outline" onClick={() => addNote(r)} disabled={!note[r.id]?.trim()}>Add note</Button>
              {r.status !== "Closed" && <Button onClick={() => advance(r)}>Mark {REF_FLOW[REF_FLOW.indexOf(r.status) + 1]}</Button>}
            </div>
          </Card>))}</div>
      </> : (
        <div className="grid gap-3 md:grid-cols-2">{s.partners.map((p) => (
          <Card key={p.id}><h3 className="text-lg font-bold">{p.name}</h3><p>{p.services}</p><p className="text-sm text-muted-foreground">{p.phone} · {p.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">{p.categories.map((c) => <Badge key={c} tone="primary">{c}</Badge>)}</div>
            <p className="mt-2 text-sm">Covers: {p.neighbourhoods.join(", ")}</p></Card>))}</div>
      )}
      <Modal open={creating} onClose={() => setCreating(false)} title="New community referral">
        <form onSubmit={create} className="space-y-3" noValidate>
          {err && <p className="font-semibold text-destructive" role="alert">{err}</p>}
          <Field label="Resident" required>{(id) => <Select id={id} value={f.residentId} onChange={(e) => setF({ ...f, residentId: e.target.value, partnerId: "" })}><option value="">Choose…</option>{s.residents.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.neighbourhood})</option>)}</Select>}</Field>
          <Field label="Referral category" required>{(id) => <Select id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value, partnerId: "" })}><option value="">Choose…</option>{s.referralCategories.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
          <Field label="Community partner" required hint={partners.length ? "Filtered by service and neighbourhood coverage" : "No partner covers this — try another category"}>{(id) => <Select id={id} value={f.partnerId} onChange={(e) => setF({ ...f, partnerId: e.target.value })}><option value="">Choose…</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>}</Field>
          <Field label="Reason for referral" required>{(id) => <Textarea id={id} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />}</Field>
          <Button type="submit" className="w-full">Create referral</Button>
        </form>
      </Modal>
    </div>
  );
}

// ================= Caregivers =================
export function CoordCaregivers() {
  const { state: s, mutate, user } = useStore();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ residentId: "", name: "", relationship: "", phone: "", email: "", supportNeeds: "", stress: "3", preferredComm: "Phone", notifyOnVisit: false });
  const [err, setErr] = useState("");
  const [action, setAction] = useState<Record<string, string>>({});
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.residentId || !f.name.trim() || !f.relationship.trim() || !f.phone.trim()) { setErr("Resident, name, relationship and phone are required"); return; }
    mutate((d) => { d.caregivers.push({ id: uid("c"), residentId: f.residentId, name: f.name.trim(), relationship: f.relationship.trim(), phone: f.phone, email: f.email, supportNeeds: f.supportNeeds, stress: Number(f.stress), preferredComm: f.preferredComm, notifyOnVisit: f.notifyOnVisit, actions: [] }); }, `Linked caregiver ${f.name} to ${resName(s, f.residentId)}`);
    toast.success("Caregiver added"); setAdding(false); setErr("");
  };
  const addAction = (cid: string, task: boolean) => {
    const t = action[cid]?.trim(); if (!t) return;
    const c = s.caregivers.find((x) => x.id === cid)!;
    mutate((d) => {
      if (task) { const due = new Date(); due.setDate(due.getDate() + 3); d.tasks.unshift({ id: uid("t"), title: `${t} (${c.name})`, due: due.toISOString(), priority: "normal", assignee: user?.id ?? "u_coord", status: "Open", related: cid }); }
      else d.caregivers.find((x) => x.id === cid)!.actions.unshift({ at: new Date().toISOString(), by: user?.name ?? "", text: t });
    }, task ? `Created follow-up task for caregiver ${c.name}: ${t}` : `Support action logged for ${c.name}`);
    toast.success(task ? "Follow-up task created (due in 3 days)" : "Support action logged");
    setAction({ ...action, [cid]: "" });
  };
  return (
    <div>
      <PageHeader title="Caregiver & family support" actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" />Link caregiver</Button>} />
      {s.caregivers.length === 0 ? <Empty title="No caregivers linked yet" /> : (
        <div className="grid gap-3 md:grid-cols-2">{s.caregivers.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{c.name}</span><Badge>{c.relationship} of {resName(s, c.residentId)}</Badge><Badge tone={c.stress >= 4 ? "danger" : c.stress === 3 ? "warning" : "success"}>Stress {c.stress}/5</Badge></div>
            <p className="text-sm text-muted-foreground">{c.phone} · {c.email} · prefers {c.preferredComm}</p>
            <p className="mt-1">{c.supportNeeds}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">Stress level <Select aria-label="Stress level" className="w-20" value={c.stress} onChange={(e) => mutate((d) => { d.caregivers.find((x) => x.id === c.id)!.stress = Number(e.target.value); }, `Updated stress level for ${c.name} to ${e.target.value}`)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select></label>
              <Check label="Notify on visit completion (non-sensitive)" checked={c.notifyOnVisit} onChange={(v) => mutate((d) => { d.caregivers.find((x) => x.id === c.id)!.notifyOnVisit = v; }, `${v ? "Enabled" : "Disabled"} visit notifications for ${c.name}`)} />
            </div>
            {c.actions.length > 0 && <ul className="mt-2 space-y-1 text-sm">{c.actions.map((a, i) => <li key={i} className="rounded bg-muted p-2">{fmtDT(a.at)} — {a.text}</li>)}</ul>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Input aria-label="Support action" className="flex-1" placeholder="Support action or follow-up…" value={action[c.id] ?? ""} onChange={(e) => setAction({ ...action, [c.id]: e.target.value })} />
              <Button variant="outline" disabled={!action[c.id]?.trim()} onClick={() => addAction(c.id, false)}>Log action</Button>
              <Button disabled={!action[c.id]?.trim()} onClick={() => addAction(c.id, true)}>Create task</Button>
            </div>
          </Card>))}</div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Link family / caregiver">
        <form onSubmit={add} className="space-y-3" noValidate>
          {err && <p className="font-semibold text-destructive" role="alert">{err}</p>}
          <Field label="Resident" required>{(id) => <Select id={id} value={f.residentId} onChange={(e) => setF({ ...f, residentId: e.target.value })}><option value="">Choose…</option>{s.residents.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>}</Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" required>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
            <Field label="Relationship" required>{(id) => <Input id={id} value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })} />}</Field>
            <Field label="Phone" required>{(id) => <Input id={id} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}</Field>
            <Field label="Email">{(id) => <Input id={id} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
            <Field label="Stress level (1-5)">{(id) => <Select id={id} value={f.stress} onChange={(e) => setF({ ...f, stress: e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select>}</Field>
            <Field label="Preferred communication">{(id) => <Select id={id} value={f.preferredComm} onChange={(e) => setF({ ...f, preferredComm: e.target.value })}><option>Phone</option><option>WhatsApp</option><option>Email</option><option>SMS</option></Select>}</Field>
          </div>
          <Field label="Support needs">{(id) => <Textarea id={id} value={f.supportNeeds} onChange={(e) => setF({ ...f, supportNeeds: e.target.value })} />}</Field>
          <Check label="Send non-sensitive visit-completion notifications" checked={f.notifyOnVisit} onChange={(v) => setF({ ...f, notifyOnVisit: v })} />
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}

// ================= Events =================
export function CoordEvents() {
  const { state: s, mutate } = useStore();
  const [creating, setCreating] = useState(false);
  const [manage, setManage] = useState<string | null>(null);
  const [f, setF] = useState({ title: "", category: "", date: "", durationMin: "90", location: "", neighbourhood: "", capacity: "20", volunteerSlots: "3", description: "" });
  const [err, setErr] = useState("");
  const [addRes, setAddRes] = useState("");
  const ev = s.events.find((e) => e.id === manage);
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() || !f.category || !f.date || !f.location.trim() || !f.neighbourhood) { setErr("Title, category, date, location and neighbourhood are required"); return; }
    mutate((d) => { d.events.push({ id: uid("e"), title: f.title.trim(), category: f.category, date: new Date(f.date).toISOString(), durationMin: Number(f.durationMin), location: f.location, neighbourhood: f.neighbourhood, capacity: Number(f.capacity), volunteerSlots: Number(f.volunteerSlots), description: f.description, residentIds: [], volunteerIds: [], attended: [] }); }, `Created event ${f.title}`);
    toast.success("Event created"); setCreating(false); setErr("");
  };
  const upd = (fn: (e: CommunityEvent) => void, msg: string) => ev && mutate((d) => fn(d.events.find((x) => x.id === ev.id)!), msg);
  const sorted = [...s.events].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return (
    <div>
      <PageHeader title="Community events" actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" />New event</Button>} />
      <div className="grid gap-3 md:grid-cols-2">{sorted.map((e) => {
        const past = +new Date(e.date) < Date.now();
        return (
          <Card key={e.id} className={cn(past && "opacity-75")}>
            <div className="flex flex-wrap gap-2"><Badge tone="success">{e.category}</Badge>{past && <Badge>Past</Badge>}{e.residentIds.length >= e.capacity && <Badge tone="warning">Full</Badge>}</div>
            <h3 className="mt-1 text-lg font-bold">{e.title}</h3>
            <p className="text-muted-foreground">{fmtDT(e.date)} · {e.location}</p>
            <p className="text-sm">Registered {e.residentIds.length}/{e.capacity} · Helpers {e.volunteerIds.length}/{e.volunteerSlots}{past && ` · Attended ${e.attended.length}`}</p>
            <Button className="mt-3" size="sm" onClick={() => setManage(e.id)}>Manage capacity & attendance</Button>
          </Card>);
      })}</div>
      <Modal open={!!ev} onClose={() => setManage(null)} title={ev?.title ?? ""} wide>
        {ev && <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Resident capacity">{(id) => <Input id={id} type="number" min={ev.residentIds.length} value={ev.capacity} onChange={(e) => upd((x) => { x.capacity = Math.max(ev.residentIds.length, Number(e.target.value)); }, `Updated capacity for ${ev.title}`)} />}</Field>
            <Field label="Volunteer helper spots">{(id) => <Input id={id} type="number" min={ev.volunteerIds.length} value={ev.volunteerSlots} onChange={(e) => upd((x) => { x.volunteerSlots = Math.max(ev.volunteerIds.length, Number(e.target.value)); }, `Updated helper spots for ${ev.title}`)} />}</Field>
          </div>
          <div>
            <h3 className="mb-2 font-bold">Registered residents — tick attendance</h3>
            {ev.residentIds.length === 0 ? <p className="text-muted-foreground">No registrations yet.</p> : ev.residentIds.map((rid) => (
              <div key={rid} className="flex items-center justify-between gap-2 border-b py-1">
                <Check label={resName(s, rid)} checked={ev.attended.includes(rid)} onChange={(v) => upd((x) => { x.attended = v ? [...x.attended, rid] : x.attended.filter((y) => y !== rid); }, `Marked ${resName(s, rid)} ${v ? "attended" : "not attended"} at ${ev.title}`)} />
                <Button size="sm" variant="ghost" onClick={() => upd((x) => { x.residentIds = x.residentIds.filter((y) => y !== rid); x.attended = x.attended.filter((y) => y !== rid); }, `Removed ${resName(s, rid)} from ${ev.title}`)}>Remove</Button>
              </div>))}
            <div className="mt-2 flex gap-2">
              <Select aria-label="Register resident" value={addRes} onChange={(e) => setAddRes(e.target.value)}><option value="">Register a resident…</option>{s.residents.filter((r) => !ev.residentIds.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
              <Button disabled={!addRes || ev.residentIds.length >= ev.capacity} onClick={() => { upd((x) => { x.residentIds.push(addRes); }, `Registered ${resName(s, addRes)} for ${ev.title}`); setAddRes(""); }}>Add</Button>
            </div>
            {ev.residentIds.length >= ev.capacity && <p className="mt-1 text-sm text-warning-foreground">At capacity — increase capacity to add more.</p>}
          </div>
          <div><h3 className="font-bold">Volunteer helpers</h3><p>{ev.volunteerIds.map((v) => volName(s, v)).join(", ") || "None yet"}</p></div>
          <Button variant="danger" onClick={() => { mutate((d) => { d.events = d.events.filter((x) => x.id !== ev.id); }, `Deleted event ${ev.title}`, [...ev.volunteerIds.map((v) => ({ to: userOf(s, v), text: `Cancelled: ${ev.title}`, kind: "cancellation" })), ...ev.residentIds.map((r) => ({ to: userOf(s, r), text: `Cancelled: ${ev.title}`, kind: "cancellation" }))].filter((n) => n.to)); setManage(null); toast.success("Event cancelled"); }}>Cancel event</Button>
        </div>}
      </Modal>
      <Modal open={creating} onClose={() => setCreating(false)} title="New community event">
        <form onSubmit={create} className="space-y-3" noValidate>
          {err && <p className="font-semibold text-destructive" role="alert">{err}</p>}
          <Field label="Title" required>{(id) => <Input id={id} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category" required>{(id) => <Select id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">Choose…</option>{s.eventCategories.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
            <Field label="Date & time" required>{(id) => <Input id={id} type="datetime-local" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />}</Field>
            <Field label="Neighbourhood" required>{(id) => <Select id={id} value={f.neighbourhood} onChange={(e) => setF({ ...f, neighbourhood: e.target.value })}><option value="">Choose…</option>{s.zones.map((z) => <option key={z.name}>{z.name}</option>)}</Select>}</Field>
            <Field label="Duration (min)">{(id) => <Input id={id} type="number" value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: e.target.value })} />}</Field>
            <Field label="Capacity">{(id) => <Input id={id} type="number" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} />}</Field>
            <Field label="Volunteer helper spots">{(id) => <Input id={id} type="number" value={f.volunteerSlots} onChange={(e) => setF({ ...f, volunteerSlots: e.target.value })} />}</Field>
          </div>
          <Field label="Location" required>{(id) => <Input id={id} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />}</Field>
          <Field label="Description">{(id) => <Textarea id={id} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
          <Button type="submit" className="w-full">Create event</Button>
        </form>
      </Modal>
    </div>
  );
}

// ================= Concerns =================
export function CoordConcerns() {
  const { state: s, mutate, user } = useStore();
  const focus = useFocusId();
  const [filter, setFilter] = useState("active");
  const [raising, setRaising] = useState(false);
  const [text, setText] = useState<Record<string, string>>({});
  const coords = s.users.filter((u) => u.role === "coordinator");
  const list = s.concerns.filter((c) => filter === "all" || (filter === "active" ? c.status !== "resolved" : c.status === filter))
    .sort((a, b) => ["Urgent", "Priority", "Routine"].indexOf(a.level) - ["Urgent", "Priority", "Routine"].indexOf(b.level) || +new Date(b.createdAt) - +new Date(a.createdAt));
  const raiserUser = (c: Concern) => s.users.find((u) => u.name === c.raisedBy)?.id;
  const upd = (c: Concern, fn: (x: Concern) => void, msg: string) => mutate((d) => fn(d.concerns.find((x) => x.id === c.id)!), msg, raiserUser(c) ? [{ to: raiserUser(c)!, text: `Concern update: ${c.title} — ${msg.split(":")[0]}`, kind: "concern" }] : []);
  return (
    <div>
      <PageHeader title="Concerns & escalations" actions={<Button onClick={() => setRaising(true)}><Plus className="size-4" />Log concern</Button>} />
      <Select aria-label="Filter" className="mb-3 sm:w-64" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="active">Open & in progress</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="all">All</option></Select>
      <div className="space-y-3">{list.length === 0 ? <Empty title="No concerns in this view" /> : list.map((c) => (
        <Card key={c.id} className={cn(c.level === "Urgent" && c.status !== "resolved" && "border-destructive/60", focus === c.id && "ring-2 ring-primary")}>
          <div className="flex flex-wrap items-center gap-2"><StatusBadge s={c.level} /><StatusBadge s={c.status} /><span className="text-lg font-bold">{c.title}</span></div>
          <p className="text-sm text-muted-foreground">{c.residentId ? `${resName(s, c.residentId)} · ` : ""}Raised by {c.raisedBy} · {fmtDT(c.createdAt)} · Assigned: {c.assignee ?? "nobody"}</p>
          {c.details && <p className="mt-1">{c.details}</p>}
          {c.actions.length > 0 && <ul className="mt-2 space-y-1 text-sm">{c.actions.map((a, i) => <li key={i} className="rounded bg-muted p-2"><strong>{a.by}</strong> ({fmtDT(a.at)}): {a.text}</li>)}</ul>}
          {c.status !== "resolved" && <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Select aria-label="Assign to" className="w-auto" value={c.assignee ?? ""} onChange={(e) => upd(c, (x) => { x.assignee = e.target.value; if (x.status === "open") x.status = "in_progress"; }, `Assigned to ${e.target.value}: ${c.title}`)}><option value="" disabled>Assign to…</option>{coords.map((u) => <option key={u.id}>{u.name}</option>)}</Select>
              <Select aria-label="Level" className="w-auto" value={c.level} onChange={(e) => upd(c, (x) => { x.level = e.target.value as Concern["level"]; }, `Level changed to ${e.target.value}: ${c.title}`)}><option>Routine</option><option>Priority</option><option>Urgent</option></Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input aria-label="Action taken" className="flex-1" placeholder="Action taken…" value={text[c.id] ?? ""} onChange={(e) => setText({ ...text, [c.id]: e.target.value })} />
              <Button variant="outline" disabled={!text[c.id]?.trim()} onClick={() => { upd(c, (x) => { x.actions.push({ at: new Date().toISOString(), by: user?.name ?? "", text: text[c.id].trim() }); if (x.status === "open") x.status = "in_progress"; }, `Action added: ${c.title}`); setText({ ...text, [c.id]: "" }); }}>Add action</Button>
              <Button variant="success" onClick={() => { upd(c, (x) => { x.status = "resolved"; x.actions.push({ at: new Date().toISOString(), by: user?.name ?? "", text: text[c.id]?.trim() || "Resolved" }); }, `Resolved: ${c.title}`); setText({ ...text, [c.id]: "" }); toast.success("Concern resolved"); }}>Resolve</Button>
            </div></div>}
          {c.status === "resolved" && <Button className="mt-2" size="sm" variant="ghost" onClick={() => upd(c, (x) => { x.status = "open"; }, `Reopened: ${c.title}`)}>Reopen</Button>}
        </Card>))}</div>
      <ConcernModal open={raising} onClose={() => setRaising(false)} />
    </div>
  );
}

// ================= Tasks =================
export function CoordTasks() {
  const { state: s, mutate, user } = useStore();
  const [f, setF] = useState({ title: "", due: "", priority: "normal", assignee: user?.id ?? "" });
  const [err, setErr] = useState("");
  const staff = s.users.filter((u) => u.role === "coordinator" || u.role === "admin");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() || !f.due) { setErr("Title and due date are required"); return; }
    mutate((d) => { d.tasks.unshift({ id: uid("t"), title: f.title.trim(), due: new Date(f.due).toISOString(), priority: f.priority as "normal", assignee: f.assignee, status: "Open" }); }, `Created task: ${f.title}`, f.assignee !== user?.id ? [{ to: f.assignee, text: `New task assigned: ${f.title}`, kind: "assignment" }] : []);
    setF({ title: "", due: "", priority: "normal", assignee: user?.id ?? "" }); setErr(""); toast.success("Task added");
  };
  const cols = ["Open", "In Progress", "Done"] as const;
  return (
    <div>
      <PageHeader title="Tasks" sub="Follow-ups for the coordination team" />
      <Card className="mb-4">
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end" noValidate>
          <Field label="Task" required error={err}>{(id) => <Input id={id} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
          <Field label="Due" required>{(id) => <Input id={id} type="datetime-local" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />}</Field>
          <Field label="Priority">{(id) => <Select id={id} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></Select>}</Field>
          <Field label="Assignee">{(id) => <Select id={id} value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })}>{staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>}</Field>
          <Button type="submit">Add task</Button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">{cols.map((col) => (
        <div key={col}><h2 className="mb-2 font-bold">{col} ({s.tasks.filter((t) => t.status === col).length})</h2>
          <div className="space-y-2">{s.tasks.filter((t) => t.status === col).sort((a, b) => +new Date(a.due) - +new Date(b.due)).map((t) => {
            const late = t.status !== "Done" && isOverdue(t.due);
            return (
              <Card key={t.id} className={cn("p-3", late && "border-destructive/60 bg-destructive/5")}>
                <p className="font-semibold">{t.title}</p>
                <div className="my-1 flex flex-wrap gap-1"><StatusBadge s={t.priority} />{late && <Badge tone="danger">Overdue</Badge>}</div>
                <p className="text-sm text-muted-foreground">Due {fmtDT(t.due)} · {s.users.find((u) => u.id === t.assignee)?.name}</p>
                <div className="mt-2 flex gap-1">{cols.filter((c) => c !== col).map((c) => <Button key={c} size="sm" variant="outline" onClick={() => mutate((d) => { d.tasks.find((x) => x.id === t.id)!.status = c; }, `Task "${t.title}" → ${c}`)}>{c}</Button>)}</div>
              </Card>);
          })}</div></div>))}</div>
    </div>
  );
}

// ================= Impact / Activity =================
export function CoordImpact() {
  const go = useGo();
  return <div><PageHeader title="Impact" sub="How our neighbourhoods are helping each other" actions={<Button variant="outline" onClick={() => go("activity")}>View activity log</Button>} /><ImpactAnalytics /></div>;
}
export function ActivityLog() {
  const { state: s } = useStore();
  const [q, setQ] = useState("");
  const list = s.audit.filter((a) => `${a.by} ${a.action}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Activity log" sub="Who changed what, and when" />
      <Input aria-label="Search activity" className="mb-3" placeholder="Search activity…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card className="p-0">{list.length === 0 ? <div className="p-5"><Empty title="No activity found" /></div> : (
        <ul className="divide-y">{list.slice(0, 300).map((a) => <li key={a.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4"><span className="w-44 shrink-0 text-sm text-muted-foreground">{fmtDT(a.at)}</span><span><strong>{a.by}</strong> — {a.action}</span></li>)}</ul>)}</Card>
    </div>
  );
}
