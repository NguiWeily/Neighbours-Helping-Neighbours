import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, CalendarPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { catName, exportIcs, fmtDT } from "@/lib/logic";
import type { HelpRequest } from "@/lib/types";
import { Badge, Button, Card, EmergencyBanner, Empty, Field, Modal, PageHeader, Stat, StatusBadge, Textarea } from "../kit";
import { CancelModal, ConcernModal, EventsList, MessageThread, RequestDetail, RequestForm, RequestRow, reqIcs, volName } from "../shared";
import { useGo } from "../nav";
import { cn } from "@/lib/utils";

function useRes() {
  const { state, user } = useStore();
  const me = state.residents.find((r) => r.id === user?.personId);
  return { me, rid: me?.id ?? "", state, user };
}

export function ResHome() {
  const { me, rid, state: s } = useRes();
  const go = useGo();
  if (!me) return <Empty title="Resident profile not found" />;
  const active = s.requests.filter((r) => r.residentId === rid && ["open", "matched", "accepted", "in_progress"].includes(r.status)).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const toConfirm = s.requests.filter((r) => r.residentId === rid && r.status === "completed" && !r.feedback);
  const next = active.find((r) => r.volunteerId && r.status !== "matched");
  const vol = s.volunteers.find((v) => v.id === next?.volunteerId);
  const events = s.events.filter((e) => +new Date(e.date) > Date.now()).sort((a, b) => +new Date(a.date) - +new Date(b.date)).slice(0, 2);
  const coord = s.users.find((u) => u.role === "coordinator");
  return (
    <div className="space-y-5">
      <PageHeader title={`Good day, ${me.name.split(" ")[0]}`} sub="Your neighbours are here to help." />
      <Button size="lg" className="w-full py-4 text-xl sm:w-auto" onClick={() => go("request-help")}>I need a helping hand</Button>
      {toConfirm.length > 0 && <Card className="border-success bg-success/10"><p className="font-semibold">{toConfirm.length} visit(s) finished — please confirm and say thanks.</p><Button className="mt-2" variant="success" onClick={() => go("my-requests")}>Confirm & give feedback</Button></Card>}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Active requests" value={active.length} onClick={() => go("my-requests")} />
        <Stat label="Upcoming help" value={active.filter((r) => r.volunteerId).length} tone="success" onClick={() => go("upcoming")} />
      </div>
      <Card>
        <h2 className="mb-2 text-lg font-bold">Your next helper</h2>
        {next && vol ? <><p className="text-xl font-bold">{vol.name}</p><p>{catName(s, next.category)} · <strong>{fmtDT(next.date)}</strong></p><p className="text-muted-foreground">Speaks {vol.languages.join(", ")} · {vol.verified ? "Verified volunteer" : "Volunteer"}</p></> : <p className="text-muted-foreground">No confirmed visit yet. We'll let you know as soon as a volunteer is matched.</p>}
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-bold">Your requests</h2>
        {active.length === 0 ? <p className="text-muted-foreground">No active requests.</p> : active.map((r) => <div key={r.id} className="flex items-center justify-between gap-2 border-b py-2 last:border-0"><span><strong>{catName(s, r.category)}</strong><br /><span className="text-sm text-muted-foreground">{fmtDT(r.date)}</span></span><StatusBadge s={r.status} /></div>)}
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-bold">Community activities</h2>
        {events.map((e) => <p key={e.id} className="border-b py-2 last:border-0"><strong>{e.title}</strong> — {fmtDT(e.date)}{e.residentIds.includes(rid) && <Badge tone="info" className="ml-2">Joined</Badge>}</p>)}
        <Button variant="outline" className="mt-2" onClick={() => go("community-activities")}>See all activities</Button>
      </Card>
      {coord && <Card className="bg-secondary"><h2 className="text-lg font-bold">Your coordinator: {coord.name}</h2><p className="flex items-center gap-2"><Phone className="size-4" />6123 4567 (Mon–Fri, 9am–6pm)</p><Button className="mt-2" variant="outline" onClick={() => go("contact")}>Send a message</Button></Card>}
      <EmergencyBanner />
    </div>
  );
}

export function ResRequestHelp() {
  const { rid } = useRes();
  const go = useGo();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Request help" sub="Tell us what you need. A coordinator will match you with a friendly neighbour." />
      <EmergencyBanner compact />
      <Card className="mt-4">{rid ? <RequestForm residentId={rid} onDone={() => go("my-requests")} /> : <Empty title="Resident profile not found" />}</Card>
    </div>
  );
}

export function ResMyRequests() {
  const { rid, state: s } = useRes();
  const { mutate } = useStore();
  const [detail, setDetail] = useState<HelpRequest | null>(null);
  const [cancel, setCancel] = useState<HelpRequest | null>(null);
  const [fb, setFb] = useState<HelpRequest | null>(null);
  const [rating, setRating] = useState(5); const [comment, setComment] = useState("");
  const list = s.requests.filter((r) => r.residentId === rid).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const submitFb = () => {
    if (!fb) return;
    mutate((d) => { d.requests.find((x) => x.id === fb.id)!.feedback = { rating, comment: comment.trim() }; }, `Resident confirmed completion of ${catName(s, fb.category)} and rated ${rating}/5`,
      [{ to: s.users.find((u) => u.personId === fb.volunteerId)?.id ?? "", text: `${"★".repeat(rating)} Thank-you from your neighbour: "${comment.trim() || "Thank you!"}"`, kind: "feedback" }].filter((n) => n.to));
    toast.success("Thank you for your feedback!"); setFb(null); setComment(""); setRating(5);
  };
  return (
    <div>
      <PageHeader title="My requests" />
      <div className="space-y-3">{list.length === 0 ? <Empty title="You haven't asked for help yet" /> : list.map((r) => (
        <RequestRow key={r.id} r={r} onOpen={() => setDetail(r)} right={<>
          {r.status === "completed" && !r.feedback && <Button variant="success" onClick={() => setFb(r)}>Confirm done & feedback</Button>}
          {r.feedback && <Badge tone="success">{"★".repeat(r.feedback.rating)}</Badge>}
          {["open", "matched", "accepted"].includes(r.status) && <Button variant="outline" onClick={() => setCancel(r)}>Cancel</Button>}
        </>} />))}</div>
      <RequestDetail req={detail} onClose={() => setDetail(null)} />
      {cancel && <CancelModal req={cancel} mode="cancel" onClose={() => setCancel(null)} />}
      <Modal open={!!fb} onClose={() => setFb(null)} title="Was your help completed?">
        <p className="mb-3">{fb && `${volName(s, fb.volunteerId)} helped with ${catName(s, fb.category)}.`} How was it?</p>
        <div className="mb-3 flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)} className={cn("size-12 rounded-lg text-3xl", n <= rating ? "text-warning" : "text-muted-foreground")}>★</button>))}</div>
        <Field label="A few words (optional)">{(id) => <Textarea id={id} value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
        <Button className="mt-4 w-full" variant="success" onClick={submitFb}>Yes, it was done — send thanks</Button>
      </Modal>
    </div>
  );
}

export function ResUpcoming() {
  const { rid, state: s } = useRes();
  const list = s.requests.filter((r) => r.residentId === rid && ["matched", "accepted", "in_progress"].includes(r.status)).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const ev = s.events.filter((e) => e.residentIds.includes(rid) && +new Date(e.date) > Date.now());
  const items = [...list.map((r) => reqIcs(s, r)), ...ev.map((e) => ({ id: e.id, title: e.title, start: e.date, dur: e.durationMin, location: e.location, description: e.description }))];
  return (
    <div>
      <PageHeader title="Upcoming help" actions={<Button variant="outline" disabled={!items.length} onClick={() => { exportIcs("my-upcoming-help.ics", items); toast.success("Calendar file downloaded"); }}><CalendarPlus className="size-4" />Add all to my calendar</Button>} />
      {items.length === 0 ? <Empty title="Nothing scheduled yet" /> : <div className="space-y-3">
        {list.map((r) => { const v = s.volunteers.find((x) => x.id === r.volunteerId); return (
          <Card key={r.id}><div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold">{fmtDT(r.date)}</span><StatusBadge s={r.status} /></div>
            <p>{catName(s, r.category)} with <strong>{v?.name}</strong>{r.status === "matched" && " (waiting for them to confirm)"}</p>
            {v && <p className="text-sm text-muted-foreground">Speaks {v.languages.join(", ")}</p>}
            <Button className="mt-2" size="sm" variant="outline" onClick={() => exportIcs(`help-${r.id}.ics`, [reqIcs(s, r)])}><CalendarPlus className="size-4" />Add to calendar</Button></Card>); })}
        {ev.map((e) => <Card key={e.id}><span className="text-lg font-bold">{fmtDT(e.date)}</span><p>{e.title} · {e.location}</p></Card>)}
      </div>}
    </div>
  );
}

export function ResActivities() {
  return <div><PageHeader title="Community activities" sub="Meet your neighbours — walks, kopi mornings, workshops and more" /><EventsList mode="resident" /></div>;
}

export function ResContact() {
  const { user, state: s } = useStore();
  const [concern, setConcern] = useState(false);
  const coord = s.users.find((u) => u.role === "coordinator");
  if (!user || !coord) return <Empty title="No coordinator available" />;
  return (
    <div className="space-y-4">
      <PageHeader title="Contact your coordinator" />
      <EmergencyBanner />
      <Card className="bg-secondary">
        <h2 className="text-xl font-bold">{coord.name}</h2><p>Community Coordinator, Neighbourhoods That Care</p>
        <p className="mt-2 flex items-center gap-2"><Phone className="size-4" />6123 4567 · Mon–Fri, 9am–6pm</p>
        <p className="flex items-center gap-2"><Mail className="size-4" />{coord.email}</p>
        <Button className="mt-3" variant="outline" onClick={() => setConcern(true)}>Tell us about a worry</Button>
      </Card>
      <MessageThread me={user.id} other={coord.id} otherName={coord.name} />
      <ConcernModal open={concern} onClose={() => setConcern(false)} residentId={user.personId} />
    </div>
  );
}
