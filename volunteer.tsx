import { useState } from "react";
import { toast } from "sonner";
import { Award, Clock, HeartHandshake, MapPin, Star, Users } from "lucide-react";
import { useStore, userOf } from "@/lib/store";
import { catName, findConflicts, fmtDT, isOverdue, rankVolunteers, volunteerHours } from "@/lib/logic";
import type { Befriending, HelpRequest, Slot } from "@/lib/types";
import { Badge, Button, Card, Check, EmergencyBanner, Empty, Field, Input, Modal, PageHeader, Select, Stat, StatusBadge, Tabs, Textarea } from "../kit";
import { CancelModal, ConcernModal, EventsList, MessageThread, MonthCalendar, RequestDetail, resName, type CalItem } from "../shared";
import { AvailabilityGrid, LogContactModal } from "./coordinator";
import { useGo } from "../nav";
import { cn } from "@/lib/utils";

function useMe() {
  const { state, user } = useStore();
  const me = state.volunteers.find((v) => v.id === user?.personId);
  return { me, vid: me?.id ?? "", state, user };
}

export function VolHome() {
  const { me, vid, state: s } = useMe();
  const go = useGo();
  if (!me) return <Empty title="Volunteer profile not found" />;
  const assigned = s.requests.filter((r) => r.volunteerId === vid && r.status === "matched");
  const upcoming = s.requests.filter((r) => r.volunteerId === vid && ["accepted", "in_progress"].includes(r.status)).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const bf = s.befriending.filter((b) => b.volunteerId === vid && b.active);
  const opps = s.requests.filter((r) => r.status === "open" && !r.declined.some((d) => d.volunteerId === vid)).length;
  return (
    <div className="space-y-5">
      <PageHeader title={`Hello, ${me.name.split(" ")[0]} 👋`} sub={`${me.neighbourhood} · ${me.verified ? "Verified volunteer" : "Verification pending"}${me.trained ? " · Trained" : ""}`} />
      {!me.verified && <Card className="border-warning bg-warning/10">Your verification is pending — you'll see tasks that don't require verified support until a coordinator approves you.</Card>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Waiting for your reply" value={assigned.length} tone="warning" onClick={() => go("opportunities")} />
        <Stat label="Upcoming visits" value={upcoming.length} onClick={() => go("my-tasks")} />
        <Stat label="Befriending" value={bf.length} tone="info" onClick={() => go("my-befriending")} />
        <Stat label="Hours given" value={volunteerHours(s, vid)} tone="success" onClick={() => go("my-impact")} />
      </div>
      {assigned.length > 0 && <Card className="border-primary"><h2 className="mb-2 text-lg font-bold">New assignments for you</h2>{assigned.map((r) => <div key={r.id} className="flex items-center justify-between gap-2 border-b py-2 last:border-0"><span><strong>{catName(s, r.category)}</strong> for {resName(s, r.residentId)}<br /><span className="text-sm text-muted-foreground">{fmtDT(r.date)}</span></span><Button size="sm" onClick={() => go("opportunities")}>Respond</Button></div>)}</Card>}
      <Card>
        <h2 className="mb-2 text-lg font-bold">Next up</h2>
        {upcoming.length === 0 ? <p className="text-muted-foreground">No visits scheduled. <button className="font-semibold text-primary underline" onClick={() => go("opportunities")}>Browse {opps} opportunities</button></p> : upcoming.slice(0, 4).map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 border-b py-2 last:border-0"><span><strong>{fmtDT(r.date)}</strong> — {catName(s, r.category)} with {resName(s, r.residentId)}</span><StatusBadge s={r.status} /></div>))}
      </Card>
      {bf.length > 0 && <Card><h2 className="mb-2 text-lg font-bold">Befriending contacts due</h2>{bf.map((b) => <p key={b.id} className={cn(isOverdue(b.nextContact) && "font-semibold text-destructive")}>{resName(s, b.residentId)} — {b.contactType}, {fmtDT(b.nextContact)}</p>)}</Card>}
      <EmergencyBanner compact />
      <p className="text-sm text-muted-foreground">Please stay within your volunteer role — no personal care, medication handling, lifting beyond light help, or financial transactions on a resident's behalf. If in doubt, raise a concern.</p>
    </div>
  );
}

export function VolOpportunities() {
  const { me, vid, state: s } = useMe();
  const { mutate } = useStore();
  const [decline, setDecline] = useState<HelpRequest | null>(null);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState<HelpRequest | null>(null);
  if (!me) return <Empty title="Volunteer profile not found" />;
  const assigned = s.requests.filter((r) => r.volunteerId === vid && r.status === "matched");
  const open = s.requests.filter((r) => r.status === "open" && !r.declined.some((d) => d.volunteerId === vid) && +new Date(r.date) > Date.now())
    .map((r) => ({ r, m: rankVolunteers(s, r).find((x) => x.v.id === vid)! }))
    .filter(({ m }) => m && !m.block && !(m.soft && m.soft.startsWith("Not yet verified")) && m.score >= 35)
    .sort((a, b) => b.m.score - a.m.score);
  const accept = (r: HelpRequest) => {
    const c = findConflicts(s, vid, r.date, r.durationMin, r.id);
    if (c.length) { toast.error(`You're already booked for ${c[0].title} at ${fmtDT(c[0].start)}`); return; }
    mutate((d) => { const x = d.requests.find((y) => y.id === r.id)!; x.volunteerId = vid; x.status = "accepted"; x.matchedAt = x.matchedAt ?? new Date().toISOString(); },
      `${me.name} accepted ${catName(s, r.category)} for ${resName(s, r.residentId)}`,
      [{ to: "coordinator", text: `${me.name} accepted ${catName(s, r.category)} for ${resName(s, r.residentId)}`, kind: "accepted" }, { to: userOf(s, r.residentId), text: `${me.name} will help with your ${catName(s, r.category)} request on ${fmtDT(r.date)}`, kind: "accepted" }].filter((n) => n.to));
    toast.success("Thank you! Added to My Tasks");
  };
  const doDecline = () => {
    if (!decline || reason.trim().length < 3) return;
    mutate((d) => { const x = d.requests.find((y) => y.id === decline.id)!; x.declined.push({ volunteerId: vid, reason: reason.trim() }); if (x.volunteerId === vid) { x.volunteerId = undefined; x.status = "open"; } },
      `${me.name} declined ${catName(s, decline.category)} for ${resName(s, decline.residentId)}: ${reason}`,
      decline.volunteerId === vid ? [{ to: "coordinator", text: `${me.name} declined ${catName(s, decline.category)} — needs rematch (${reason})`, kind: "cancellation" }] : []);
    toast.success("Declined — thanks for letting us know"); setDecline(null); setReason("");
  };
  const Opp = ({ r, score, reasons, isAssigned }: { r: HelpRequest; score?: number; reasons?: string[]; isAssigned?: boolean }) => (
    <Card className={cn(isAssigned && "border-primary", r.urgency === "urgent" && "border-destructive/50")}>
      <button className="w-full text-left" onClick={() => setDetail(r)}>
        <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{catName(s, r.category)}</span>{isAssigned && <Badge tone="primary">Assigned to you</Badge>}<StatusBadge s={r.urgency} />{score !== undefined && <Badge tone="success">{score}% match</Badge>}</div>
        <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-4" />{r.neighbourhood} · {fmtDT(r.date)} · {r.durationMin} min</p>
        <p className="mt-1">{r.description}</p>
        {reasons && <p className="mt-1 text-sm text-success">{reasons.join(" · ")}</p>}
      </button>
      <div className="mt-3 flex gap-2"><Button onClick={() => accept(r)}>Accept</Button><Button variant="outline" onClick={() => setDecline(r)}>Decline</Button></div>
    </Card>
  );
  return (
    <div className="space-y-4">
      <PageHeader title="Opportunities" sub="Help requests suited to you" />
      {assigned.length > 0 && <><h2 className="text-lg font-bold">Assigned by your coordinator</h2>{assigned.map((r) => <Opp key={r.id} r={r} isAssigned />)}</>}
      <h2 className="text-lg font-bold">Open requests near you</h2>
      {open.length === 0 ? <Empty title="No new opportunities right now">We'll notify you when something suitable comes up.</Empty> : open.map(({ r, m }) => <Opp key={r.id} r={r} score={m.score} reasons={m.reasons.filter((x) => x.points === x.max).map((x) => x.text).slice(0, 3)} />)}
      <Modal open={!!decline} onClose={() => setDecline(null)} title="Decline this request">
        <Field label="Reason" required hint="Helps your coordinator rematch quickly">{(id) => <Select id={id} value={reason} onChange={(e) => setReason(e.target.value)}><option value="">Choose…</option><option>Not available at that time</option><option>Too far to travel</option><option>Outside my skills or comfort</option><option>Already have too many commitments</option><option>Personal reasons</option></Select>}</Field>
        <Button className="mt-4 w-full" disabled={!reason} onClick={doDecline}>Decline</Button>
      </Modal>
      <RequestDetail req={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

export function VolTasks() {
  const { me, vid, state: s, user } = useMe();
  const { mutate } = useStore();
  const [tab, setTab] = useState<"upcoming" | "done">("upcoming");
  const [complete, setComplete] = useState<HelpRequest | null>(null);
  const [cf, setCf] = useState({ notes: "", wellbeing: "", followUp: "" });
  const [err, setErr] = useState("");
  const [withdraw, setWithdraw] = useState<HelpRequest | null>(null);
  const [concern, setConcern] = useState<string | null>(null);
  const [detail, setDetail] = useState<HelpRequest | null>(null);
  if (!me) return <Empty title="Volunteer profile not found" />;
  const mine = s.requests.filter((r) => r.volunteerId === vid);
  const list = tab === "upcoming" ? mine.filter((r) => ["accepted", "in_progress"].includes(r.status)).sort((a, b) => +new Date(a.date) - +new Date(b.date)) : mine.filter((r) => r.status === "completed").sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const checkIn = (r: HelpRequest) => {
    mutate((d) => { const x = d.requests.find((y) => y.id === r.id)!; x.status = "in_progress"; x.checkIn = new Date().toISOString(); }, `${me.name} checked in: ${catName(s, r.category)} with ${resName(s, r.residentId)}`);
    toast.success("Checked in — have a lovely visit");
  };
  const finish = (e: React.FormEvent) => {
    e.preventDefault(); if (!complete) return;
    if (cf.notes.trim().length < 5) { setErr("Please add a short completion note (at least 5 characters)"); return; }
    const r = complete, cg = s.caregivers.filter((c) => c.residentId === r.residentId && c.notifyOnVisit);
    mutate((d) => {
      const x = d.requests.find((y) => y.id === r.id)!; x.status = "completed"; x.checkOut = new Date().toISOString(); x.checkIn = x.checkIn ?? r.date;
      x.completion = { notes: cf.notes.trim(), wellbeing: cf.wellbeing.trim(), followUp: cf.followUp.trim() };
      if (cf.followUp.trim()) { const due = new Date(); due.setDate(due.getDate() + 2); d.tasks.unshift({ id: `t_${r.id}_fu`, title: `Follow-up for ${resName(s, r.residentId)}: ${cf.followUp.trim()}`, due: due.toISOString(), priority: "normal", assignee: "u_coord", status: "Open", related: r.id }); }
      cg.forEach((c) => d.caregivers.find((y) => y.id === c.id)!.actions.unshift({ at: new Date().toISOString(), by: "System", text: `Non-sensitive notice sent: ${catName(s, r.category)} visit completed.` }));
    }, `${me.name} checked out and completed ${catName(s, r.category)} for ${resName(s, r.residentId)}`,
      [{ to: userOf(s, r.residentId), text: `${me.name} marked your ${catName(s, r.category)} as done — please confirm and leave feedback`, kind: "completed" }, { to: "coordinator", text: `Completed: ${catName(s, r.category)} for ${resName(s, r.residentId)}${cf.followUp.trim() ? " (follow-up recommended)" : ""}`, kind: "completed" }].filter((n) => n.to));
    toast.success("Checked out — thank you for helping!"); setComplete(null); setCf({ notes: "", wellbeing: "", followUp: "" }); setErr("");
  };
  return (
    <div>
      <PageHeader title="My tasks" actions={<Button variant="outline" onClick={() => setConcern("")}>Raise a concern</Button>} />
      <Tabs value={tab} onChange={setTab} items={[{ v: "upcoming", label: "Upcoming & active" }, { v: "done", label: "Completed" }]} />
      <div className="space-y-3">{list.length === 0 ? <Empty title={tab === "upcoming" ? "No upcoming tasks" : "No completed tasks yet"} /> : list.map((r) => {
        const res = s.residents.find((x) => x.id === r.residentId);
        return (
          <Card key={r.id} className={cn(r.status === "in_progress" && "border-info")}>
            <button className="w-full text-left" onClick={() => setDetail(r)}>
              <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{catName(s, r.category)}</span><StatusBadge s={r.status} /></div>
              <p className="font-semibold">{fmtDT(r.date)} · {r.durationMin} min</p>
              <p className="text-muted-foreground">{res?.name} · {res?.address} · {res?.phone}</p>
              <p className="mt-1">{r.description}</p>
              {r.accessibility && <p className="text-sm"><strong>Accessibility:</strong> {r.accessibility}</p>}
              {r.checkIn && <p className="text-sm text-info">Checked in {fmtDT(r.checkIn)}</p>}
              {r.completion && <p className="text-sm text-muted-foreground">Notes: {r.completion.notes}</p>}
              {r.feedback && <p className="text-sm">Feedback: {"★".repeat(r.feedback.rating)} {r.feedback.comment}</p>}
            </button>
            {r.status !== "completed" && <div className="mt-3 flex flex-wrap gap-2">
              {r.status === "accepted" && <Button size="lg" onClick={() => checkIn(r)}>Check in</Button>}
              {r.status === "in_progress" && <Button size="lg" variant="success" onClick={() => setComplete(r)}>Check out & complete</Button>}
              <Button variant="outline" onClick={() => setConcern(r.residentId)}>Concern</Button>
              {r.status === "accepted" && <Button variant="ghost" onClick={() => setWithdraw(r)}>Can't make it</Button>}
            </div>}
          </Card>);
      })}</div>
      <Modal open={!!complete} onClose={() => setComplete(null)} title="Check out & complete">
        <form onSubmit={finish} className="space-y-3" noValidate>
          <Field label="What did you do?" required error={err}>{(id) => <Textarea id={id} value={cf.notes} onChange={(e) => { setCf({ ...cf, notes: e.target.value }); setErr(""); }} />}</Field>
          <Field label="Wellbeing observation" hint="How did they seem? Brief, non-clinical">{(id) => <Input id={id} value={cf.wellbeing} onChange={(e) => setCf({ ...cf, wellbeing: e.target.value })} />}</Field>
          <Field label="Follow-up recommendation (optional)" hint="Creates a task for your coordinator">{(id) => <Input id={id} value={cf.followUp} onChange={(e) => setCf({ ...cf, followUp: e.target.value })} />}</Field>
          <Button type="submit" className="w-full" variant="success">Complete</Button>
        </form>
      </Modal>
      {withdraw && <CancelModal req={withdraw} mode="withdraw" onClose={() => setWithdraw(null)} />}
      <ConcernModal open={concern !== null} onClose={() => setConcern(null)} residentId={concern || undefined} />
      <RequestDetail req={detail} onClose={() => setDetail(null)} />
      {user && null}
    </div>
  );
}

export function VolCalendar() {
  const { me, vid, state: s } = useMe();
  const { mutate } = useStore();
  const go = useGo();
  if (!me) return <Empty title="Volunteer profile not found" />;
  const items: CalItem[] = [
    ...s.requests.filter((r) => r.volunteerId === vid && r.status !== "cancelled").map((r) => ({ id: r.id, title: `${catName(s, r.category)} — ${resName(s, r.residentId)}`, start: r.date, dur: r.durationMin, tone: (r.status === "completed" ? "neutral" : "primary") as CalItem["tone"], sub: s.residents.find((x) => x.id === r.residentId)?.address, location: s.residents.find((x) => x.id === r.residentId)?.address, onClick: () => go("my-tasks") })),
    ...s.events.filter((e) => e.volunteerIds.includes(vid)).map((e) => ({ id: e.id, title: `Helping: ${e.title}`, start: e.date, dur: e.durationMin, tone: "success" as const, sub: e.location, location: e.location })),
    ...s.befriending.filter((b) => b.volunteerId === vid && b.active).map((b) => ({ id: `${b.id}-next`, title: `Befriending: ${resName(s, b.residentId)}`, start: b.nextContact, dur: 45, tone: "info" as const, sub: b.contactType, onClick: () => go("my-befriending") })),
  ];
  const toggle = (day: string, slot: Slot) => mutate((d) => { const v = d.volunteers.find((x) => x.id === vid)!; const cur = v.availability[day] ?? []; v.availability[day] = cur.includes(slot) ? cur.filter((x) => x !== slot) : [...cur, slot]; }, `${me.name} updated availability`);
  return (
    <div className="space-y-4">
      <PageHeader title="My calendar" />
      <MonthCalendar items={items} icsName="my-volunteering.ics" />
      <Card><h2 className="mb-1 text-lg font-bold">My weekly availability</h2><p className="mb-3 text-sm text-muted-foreground">Tap to switch a time slot on or off. Coordinators use this for matching.</p><AvailabilityGrid availability={me.availability} onToggle={toggle} /></Card>
      <h2 className="text-lg font-bold">Help at community events</h2>
      <EventsList mode="volunteer" />
    </div>
  );
}

export function VolBefriending() {
  const { vid, state: s } = useMe();
  const [log, setLog] = useState<Befriending | null>(null);
  const [esc, setEsc] = useState<string | null>(null);
  const list = s.befriending.filter((b) => b.volunteerId === vid);
  return (
    <div>
      <PageHeader title="My befriending" sub="Regular companionship — the same friendly face each time" />
      {list.length === 0 ? <Empty title="No befriending matches yet">Your coordinator will match you with a neighbour.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">{list.map((b) => {
          const r = s.residents.find((x) => x.id === b.residentId);
          return (
            <Card key={b.id}>
              <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{r?.name}</span><Badge tone={b.wellbeing <= 2 ? "danger" : b.wellbeing === 3 ? "warning" : "success"}>Wellbeing {b.wellbeing}/5</Badge>{isOverdue(b.nextContact) && <Badge tone="danger">Due</Badge>}</div>
              <p className="text-muted-foreground">{b.frequency} · {b.contactType} · {r?.phone}</p>
              <p className="text-sm">Talk about: {b.interests}</p>
              <p className="text-sm">Next contact: <strong>{fmtDT(b.nextContact)}</strong></p>
              <ul className="mt-2 space-y-1 text-sm">{b.contacts.slice(0, 3).map((c, i) => <li key={i} className="rounded bg-muted p-2">{fmtDT(c.at)}: {c.notes}</li>)}</ul>
              <div className="mt-3 flex gap-2"><Button onClick={() => setLog(b)}>Record contact</Button><Button variant="outline" onClick={() => setEsc(b.residentId)}>Raise concern</Button></div>
            </Card>);
        })}</div>
      )}
      {log && <LogContactModal pair={log} onClose={() => setLog(null)} />}
      <ConcernModal open={!!esc} onClose={() => setEsc(null)} residentId={esc ?? undefined} />
    </div>
  );
}

export function VolMessages() {
  const { user, state: s } = useStore();
  const coord = s.users.find((u) => u.role === "coordinator");
  if (!user || !coord) return <Empty title="No coordinator available" />;
  return <div><PageHeader title="Messages" sub={`Chat with ${coord.name}, your community coordinator`} /><MessageThread me={user.id} other={coord.id} otherName={coord.name} /></div>;
}

export function VolImpact() {
  const { me, vid, state: s } = useMe();
  if (!me) return <Empty title="Volunteer profile not found" />;
  const done = s.requests.filter((r) => r.volunteerId === vid && r.status === "completed");
  const hours = volunteerHours(s, vid);
  const residents = new Set([...done.map((r) => r.residentId), ...s.befriending.filter((b) => b.volunteerId === vid).map((b) => b.residentId)]).size;
  const contacts = s.befriending.filter((b) => b.volunteerId === vid).reduce((a, b) => a + b.contacts.length, 0);
  const rated = done.filter((r) => r.feedback);
  const avg = rated.length ? (rated.reduce((a, r) => a + r.feedback!.rating, 0) / rated.length).toFixed(1) : "—";
  const badges = [
    { name: "First helping hand", got: done.length >= 1, icon: HeartHandshake, desc: "Complete your first request" },
    { name: "Five neighbours helped", got: done.length >= 5, icon: Users, desc: "Complete 5 requests" },
    { name: "10 hours given", got: hours >= 10, icon: Clock, desc: "Volunteer 10 hours" },
    { name: "Befriender", got: contacts >= 1, icon: HeartHandshake, desc: "Record a befriending contact" },
    { name: "Event helper", got: s.events.some((e) => e.volunteerIds.includes(vid)), icon: Award, desc: "Help at a community event" },
    { name: "Five-star neighbour", got: rated.some((r) => r.feedback!.rating === 5), icon: Star, desc: "Receive a 5-star thank you" },
    { name: "Verified & trained", got: me.verified && me.trained, icon: Award, desc: "Complete verification and training" },
  ];
  return (
    <div className="space-y-5">
      <PageHeader title="My impact" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Hours" value={hours} tone="success" /><Stat label="Requests completed" value={done.length} />
        <Stat label="Neighbours helped" value={residents} tone="info" /><Stat label="Befriending contacts" value={contacts} tone="info" /><Stat label="Avg. rating" value={avg} tone="warning" />
      </div>
      <Card><h2 className="mb-3 text-lg font-bold">Milestones & badges</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{badges.map((b) => (
          <div key={b.name} className={cn("rounded-xl border-2 p-3 text-center", b.got ? "border-success bg-success/10" : "opacity-50")}>
            <b.icon className={cn("mx-auto size-8", b.got ? "text-success" : "text-muted-foreground")} aria-hidden /><p className="mt-1 font-bold">{b.name}</p><p className="text-sm text-muted-foreground">{b.got ? "Earned!" : b.desc}</p></div>))}</div>
      </Card>
      <Card><h2 className="mb-2 text-lg font-bold">Thank-you notes</h2>{rated.length === 0 ? <p className="text-muted-foreground">No feedback yet.</p> : rated.map((r) => <p key={r.id} className="border-b py-2 last:border-0">{"★".repeat(r.feedback!.rating)} “{r.feedback!.comment}” — {resName(s, r.residentId)}</p>)}</Card>
    </div>
  );
}

export function VolProfile() {
  const { me, state: s } = useMe();
  const { mutate } = useStore();
  const [f, setF] = useState(() => me ? { phone: me.phone, neighbourhood: me.neighbourhood, languages: me.languages, skills: me.skills.join(", "), interests: me.interests.join(", "), categories: me.categories, transport: me.transport, maxKm: String(me.maxKm) } : null);
  if (!me || !f) return <Empty title="Volunteer profile not found" />;
  const toggleIn = (k: "languages" | "categories", v: string) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.languages.length || !f.categories.length) { toast.error("Choose at least one language and one type of help"); return; }
    mutate((d) => { const v = d.volunteers.find((x) => x.id === me.id)!; Object.assign(v, { phone: f.phone, neighbourhood: f.neighbourhood, languages: f.languages, skills: f.skills.split(",").map((x) => x.trim()).filter(Boolean), interests: f.interests.split(",").map((x) => x.trim()).filter(Boolean), categories: f.categories, transport: f.transport, maxKm: Number(f.maxKm) || 5 }); }, `${me.name} updated their profile`);
    toast.success("Profile saved");
  };
  return (
    <div>
      <PageHeader title="My profile" />
      <Card className="mb-4 flex flex-wrap gap-2">{me.verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Verification pending</Badge>}{me.trained ? <Badge tone="info">Training complete</Badge> : <Badge tone="warning">Training outstanding</Badge>}<Badge>Joined {fmtDT(me.joined).split(",")[0]}</Badge><span className="text-sm text-muted-foreground">Verification and training are managed by your coordinator.</span></Card>
      <form onSubmit={save} className="space-y-4">
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">{(id) => <Input id={id} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}</Field>
          <Field label="Neighbourhood">{(id) => <Select id={id} value={f.neighbourhood} onChange={(e) => setF({ ...f, neighbourhood: e.target.value })}>{s.zones.map((z) => <option key={z.name}>{z.name}</option>)}</Select>}</Field>
          <Field label="Maximum travel distance (km)">{(id) => <Input id={id} type="number" min={1} value={f.maxKm} onChange={(e) => setF({ ...f, maxKm: e.target.value })} />}</Field>
          <div className="pt-7"><Check label="I have my own transport (car)" checked={f.transport} onChange={(v) => setF({ ...f, transport: v })} /></div>
          <Field label="Skills (comma separated)" hint="e.g. tech, shopping, driving, paperwork, listening">{(id) => <Input id={id} value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} />}</Field>
          <Field label="Interests (comma separated)">{(id) => <Input id={id} value={f.interests} onChange={(e) => setF({ ...f, interests: e.target.value })} />}</Field>
        </Card>
        <Card><h2 className="mb-2 font-bold">Languages</h2><div className="grid grid-cols-2 sm:grid-cols-3">{["English", "Mandarin", "Malay", "Tamil", "Hokkien", "Cantonese", "Teochew", "Hindi"].map((l) => <Check key={l} label={l} checked={f.languages.includes(l)} onChange={() => toggleIn("languages", l)} />)}</div></Card>
        <Card><h2 className="mb-2 font-bold">Preferred types of help</h2><div className="grid sm:grid-cols-2">{s.categories.filter((c) => c.active).map((c) => <Check key={c.id} label={c.name} checked={f.categories.includes(c.id)} onChange={() => toggleIn("categories", c.id)} />)}</div></Card>
        <Button type="submit" size="lg">Save profile</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">Manage your weekly availability in <strong>My Calendar</strong>.</p>
      {s && null}
    </div>
  );
}
export { Textarea };
