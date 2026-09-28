import { useState } from "react";
import { toast } from "sonner";
import { Download, RotateCcw, Trash2, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { downloadFile, fmtDT, fmtDate, toLocalInput, uid } from "@/lib/logic";
import type { RefStatus, Referral, Role } from "@/lib/types";
import { Badge, Button, Card, Check, Empty, Field, Input, Modal, PageHeader, Select, Stat, StatusBadge, Textarea } from "../kit";
import { ImpactAnalytics, resName } from "../shared";
import { RefStepper } from "./coordinator";
import { useGo } from "../nav";

const FLOW: RefStatus[] = ["New", "Submitted", "Accepted", "Service Started", "Closed"];

// ================= Partner =================
export function PartnerReferrals() {
  const { state: s, user, mutate } = useStore();
  const pid = user?.personId;
  const partner = s.partners.find((p) => p.id === pid);
  const [filter, setFilter] = useState("active");
  const [edit, setEdit] = useState<Referral | null>(null);
  const [note, setNote] = useState(""); const [start, setStart] = useState(""); const [status, setStatus] = useState<RefStatus>("New");
  const list = s.referrals.filter((r) => r.partnerId === pid && (filter === "all" || (filter === "active" ? r.status !== "Closed" : r.status === filter)));
  const open = (r: Referral) => { setEdit(r); setStatus(r.status); setStart(r.expectedStart ? toLocalInput(r.expectedStart).slice(0, 10) : ""); setNote(""); };
  const save = () => {
    if (!edit) return;
    if (FLOW.indexOf(status) < FLOW.indexOf(edit.status)) { toast.error("Status can only move forward"); return; }
    mutate((d) => { const r = d.referrals.find((x) => x.id === edit.id)!; r.status = status; if (start) r.expectedStart = new Date(start + "T09:00").toISOString(); if (note.trim()) r.notes.push({ at: new Date().toISOString(), by: `${user?.name} (${partner?.name})`, text: note.trim() }); },
      `${partner?.name} updated referral for ${resName(s, edit.residentId)} → ${status}`, [{ to: "coordinator", text: `Referral update from ${partner?.name}: ${resName(s, edit.residentId)} is ${status}`, kind: "referral" }]);
    toast.success("Referral updated"); setEdit(null);
  };
  if (!partner) return <Empty title="Partner organisation not found" />;
  return (
    <div>
      <PageHeader title="Referral inbox" sub={partner.name} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">{FLOW.map((f) => <Stat key={f} label={f} value={s.referrals.filter((r) => r.partnerId === pid && r.status === f).length} tone={f === "New" ? "warning" : f === "Closed" ? "success" : "info"} onClick={() => setFilter(f)} />)}</div>
      <Select aria-label="Filter" className="mb-3 sm:w-64" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="active">All active</option><option value="all">All</option>{FLOW.map((f) => <option key={f}>{f}</option>)}</Select>
      <div className="space-y-3">{list.length === 0 ? <Empty title="No referrals in this view" /> : list.map((r) => {
        const res = s.residents.find((x) => x.id === r.residentId);
        return (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-lg font-bold">{res?.name}</span><StatusBadge s={r.status} /></div>
            <p className="capitalize">{r.category} · {res?.neighbourhood} · received {fmtDate(r.createdAt)}</p>
            <p className="text-muted-foreground">{r.reason}</p>
            <p className="text-sm">Contact: {res?.phone} · Languages: {res?.languages.join(", ")}</p>
            <div className="my-2"><RefStepper status={r.status} /></div>
            {r.expectedStart && <p className="text-sm">Expected start: <strong>{fmtDate(r.expectedStart)}</strong></p>}
            {r.notes.length > 0 && <ul className="mt-2 space-y-1 text-sm">{r.notes.map((n, i) => <li key={i} className="rounded bg-muted p-2"><strong>{n.by}</strong> ({fmtDT(n.at)}): {n.text}</li>)}</ul>}
            <Button className="mt-3" onClick={() => open(r)}>Update status & notes</Button>
          </Card>);
      })}</div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={`Update — ${resName(s, edit?.residentId)}`}>
        <div className="space-y-3">
          <Field label="Status">{(id) => <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as RefStatus)}>{FLOW.map((f) => <option key={f} disabled={!!edit && FLOW.indexOf(f) < FLOW.indexOf(edit.status)}>{f}</option>)}</Select>}</Field>
          <Field label="Expected service start date">{(id) => <Input id={id} type="date" value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
          <Field label="Service note">{(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
          <Button className="w-full" onClick={save}>Save update</Button>
        </div>
      </Modal>
    </div>
  );
}

export function PartnerUpdates() {
  const { state: s, user } = useStore();
  const refs = s.referrals.filter((r) => r.partnerId === user?.personId);
  const notes = refs.flatMap((r) => r.notes.map((n) => ({ ...n, r }))).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const go = useGo();
  return (
    <div>
      <PageHeader title="Service updates" sub="History of notes and status changes on your referrals" actions={<Button onClick={() => go("referrals")}>Open inbox</Button>} />
      <div className="mb-4 grid grid-cols-3 gap-3"><Stat label="Total referrals" value={refs.length} /><Stat label="Service started" value={refs.filter((r) => r.status === "Service Started").length} tone="info" /><Stat label="Closed" value={refs.filter((r) => r.status === "Closed").length} tone="success" /></div>
      {notes.length === 0 ? <Empty title="No service notes yet" /> : <Card className="p-0"><ul className="divide-y">{notes.map((n, i) => <li key={i} className="p-3"><div className="flex flex-wrap items-center gap-2"><strong>{resName(s, n.r.residentId)}</strong><StatusBadge s={n.r.status} /><span className="text-sm text-muted-foreground">{fmtDT(n.at)}</span></div><p>{n.text}</p><p className="text-sm text-muted-foreground">— {n.by}</p></li>)}</ul></Card>}
    </div>
  );
}

// ================= Admin =================
export function AdminDashboard() {
  const { state: s } = useStore();
  const go = useGo();
  return (
    <div className="space-y-5">
      <PageHeader title="Administration" sub="Platform configuration and oversight" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Users" value={s.users.length} onClick={() => go("users")} />
        <Stat label="Help categories" value={s.categories.filter((c) => c.active).length} tone="info" onClick={() => go("categories")} />
        <Stat label="Neighbourhood zones" value={s.zones.length} tone="success" onClick={() => go("neighbourhoods")} />
        <Stat label="Community partners" value={s.partners.length} tone="warning" onClick={() => go("partners")} />
      </div>
      <ImpactAnalytics />
    </div>
  );
}

export function AdminUsers() {
  const { state: s, mutate, user } = useStore();
  const [f, setF] = useState({ name: "", email: "", password: "", role: "volunteer" as Role, neighbourhood: "Tampines" });
  const [err, setErr] = useState(""); const [q, setQ] = useState("");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email) || f.password.length < 6) { setErr("Name, a valid email and a 6+ character password are required"); return; }
    if (s.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) { setErr("That email is already registered"); return; }
    mutate((d) => {
      let personId: string | undefined;
      if (f.role === "volunteer") { personId = uid("v"); d.volunteers.push({ id: personId, name: f.name, email: f.email, phone: "", neighbourhood: f.neighbourhood, languages: ["English"], skills: [], transport: false, availability: {}, interests: [], categories: [], maxKm: 5, verified: false, trained: false, active: true, joined: new Date().toISOString() }); }
      if (f.role === "resident") { personId = uid("r"); d.residents.push({ id: personId, name: f.name, neighbourhood: f.neighbourhood, age: 0, languages: ["English"], phone: "", address: "", interests: [], accessibility: "", lonely: false }); }
      if (f.role === "partner") personId = d.partners[0]?.id;
      d.users.push({ id: uid("u"), email: f.email.trim(), password: f.password, role: f.role, name: f.name.trim(), personId, active: true });
    }, `Created ${f.role} account for ${f.name}`);
    toast.success("User created — they can sign in now"); setErr(""); setF({ name: "", email: "", password: "", role: "volunteer", neighbourhood: "Tampines" });
  };
  const list = s.users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Users" />
      <Card className="mb-4">
        <h2 className="mb-3 font-bold">Add user</h2>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-3" noValidate>
          <Field label="Name" required>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
          <Field label="Email" required>{(id) => <Input id={id} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
          <Field label="Password" required>{(id) => <Input id={id} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />}</Field>
          <Field label="Role">{(id) => <Select id={id} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}><option value="resident">Resident</option><option value="volunteer">Volunteer</option><option value="coordinator">Coordinator</option><option value="partner">Community partner</option><option value="admin">Administrator</option></Select>}</Field>
          {(f.role === "resident" || f.role === "volunteer") && <Field label="Neighbourhood">{(id) => <Select id={id} value={f.neighbourhood} onChange={(e) => setF({ ...f, neighbourhood: e.target.value })}>{s.zones.map((z) => <option key={z.name}>{z.name}</option>)}</Select>}</Field>}
          <div className="flex items-end"><Button type="submit" className="w-full">Create user</Button></div>
          {err && <p className="font-semibold text-destructive md:col-span-3" role="alert">{err}</p>}
        </form>
      </Card>
      <Input aria-label="Search users" className="mb-3" placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead className="bg-muted text-sm"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
          <tbody>{list.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-3 font-semibold">{u.name}</td><td className="p-3">{u.email}</td>
              <td className="p-3"><Select aria-label={`Role for ${u.name}`} value={u.role} disabled={u.id === user?.id} onChange={(e) => mutate((d) => { d.users.find((x) => x.id === u.id)!.role = e.target.value as Role; }, `Changed ${u.name}'s role to ${e.target.value}`)}><option value="resident">Resident</option><option value="volunteer">Volunteer</option><option value="coordinator">Coordinator</option><option value="partner">Partner</option><option value="admin">Admin</option></Select></td>
              <td className="p-3">{u.active ? <Badge tone="success">Active</Badge> : <Badge>Disabled</Badge>}</td>
              <td className="p-3"><Button size="sm" variant="outline" disabled={u.id === user?.id} onClick={() => mutate((d) => { const x = d.users.find((y) => y.id === u.id)!; x.active = !x.active; }, `${u.active ? "Disabled" : "Enabled"} ${u.name}`)}>{u.active ? "Disable" : "Enable"}</Button></td>
            </tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}

export function AdminCategories() {
  const { state: s, mutate } = useStore();
  const [name, setName] = useState(""); const [skills, setSkills] = useState(""); const [evName, setEvName] = useState("");
  const addCat = (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return;
    mutate((d) => { d.categories.push({ id: uid("cat"), name: name.trim(), active: true, skills: skills.split(",").map((x) => x.trim()).filter(Boolean) }); }, `Added help category ${name}`);
    setName(""); setSkills(""); toast.success("Category added");
  };
  return (
    <div className="space-y-5">
      <PageHeader title="Categories" sub="Help categories power request forms and matching" />
      <Card>
        <h2 className="mb-3 font-bold">Help categories</h2>
        <form onSubmit={addCat} className="mb-4 grid gap-3 md:grid-cols-[2fr_2fr_auto] md:items-end">
          <Field label="New category name" required>{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          <Field label="Matching skills (comma separated)">{(id) => <Input id={id} value={skills} onChange={(e) => setSkills(e.target.value)} />}</Field>
          <Button type="submit" disabled={!name.trim()}><Plus className="size-4" />Add</Button>
        </form>
        <ul className="divide-y">{s.categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 py-2">
            <Input aria-label="Category name" className="flex-1" value={c.name} onChange={(e) => mutate((d) => { d.categories.find((x) => x.id === c.id)!.name = e.target.value; })} onBlur={() => mutate(() => {}, `Renamed category to ${c.name}`)} />
            <span className="text-sm text-muted-foreground">{c.skills.join(", ")}</span>
            <Check label={c.active ? "Active" : "Hidden"} checked={c.active} onChange={(v) => mutate((d) => { d.categories.find((x) => x.id === c.id)!.active = v; }, `${v ? "Activated" : "Deactivated"} category ${c.name}`)} />
          </li>))}</ul>
      </Card>
      <Card>
        <h2 className="mb-3 font-bold">Event categories</h2>
        <div className="mb-3 flex gap-2"><Input aria-label="New event category" value={evName} onChange={(e) => setEvName(e.target.value)} placeholder="New event category" /><Button disabled={!evName.trim()} onClick={() => { mutate((d) => { d.eventCategories.push(evName.trim()); }, `Added event category ${evName}`); setEvName(""); }}>Add</Button></div>
        <div className="flex flex-wrap gap-2">{s.eventCategories.map((c) => <span key={c} className="flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1">{c}<Button size="sm" variant="ghost" aria-label={`Remove ${c}`} onClick={() => mutate((d) => { d.eventCategories = d.eventCategories.filter((x) => x !== c); }, `Removed event category ${c}`)}><Trash2 className="size-4" /></Button></span>)}</div>
      </Card>
    </div>
  );
}

export function AdminZones() {
  const { state: s, mutate } = useStore();
  const [f, setF] = useState({ name: "", x: "", y: "" }); const [err, setErr] = useState("");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || f.x === "" || f.y === "") { setErr("Name and both coordinates are required"); return; }
    if (s.zones.some((z) => z.name.toLowerCase() === f.name.trim().toLowerCase())) { setErr("Zone already exists"); return; }
    mutate((d) => { d.zones.push({ name: f.name.trim(), x: Number(f.x), y: Number(f.y) }); }, `Added neighbourhood zone ${f.name}`);
    setF({ name: "", x: "", y: "" }); setErr(""); toast.success("Zone added");
  };
  const used = (n: string) => s.residents.some((r) => r.neighbourhood === n) || s.volunteers.some((v) => v.neighbourhood === n);
  return (
    <div>
      <PageHeader title="Neighbourhood zones" sub="Coordinates (km grid) drive distance in the matching engine" />
      <Card className="mb-4">
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end" noValidate>
          <Field label="Zone name" required error={err}>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
          <Field label="East (km)" required>{(id) => <Input id={id} type="number" value={f.x} onChange={(e) => setF({ ...f, x: e.target.value })} />}</Field>
          <Field label="North (km)" required>{(id) => <Input id={id} type="number" value={f.y} onChange={(e) => setF({ ...f, y: e.target.value })} />}</Field>
          <Button type="submit">Add zone</Button>
        </form>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{s.zones.map((z) => (
        <Card key={z.name} className="flex items-center justify-between">
          <div><p className="text-lg font-bold">{z.name}</p><p className="text-sm text-muted-foreground">({z.x}, {z.y}) · {s.residents.filter((r) => r.neighbourhood === z.name).length} residents · {s.volunteers.filter((v) => v.neighbourhood === z.name).length} volunteers</p></div>
          <Button size="sm" variant="ghost" disabled={used(z.name)} title={used(z.name) ? "In use by residents or volunteers" : "Remove"} onClick={() => mutate((d) => { d.zones = d.zones.filter((x) => x.name !== z.name); }, `Removed zone ${z.name}`)}><Trash2 className="size-4" /><span className="sr-only">Remove {z.name}</span></Button>
        </Card>))}</div>
    </div>
  );
}

export function AdminPartners() {
  const { state: s, mutate } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", services: "", phone: "", email: "", categories: [] as string[], neighbourhoods: [] as string[] });
  const [err, setErr] = useState("");
  const tog = (k: "categories" | "neighbourhoods", v: string) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.services.trim() || !f.categories.length || !f.neighbourhoods.length) { setErr("Name, services, at least one category and one neighbourhood are required"); return; }
    mutate((d) => { d.partners.push({ id: uid("p"), ...f, name: f.name.trim() }); }, `Added community partner ${f.name}`);
    toast.success("Partner added"); setOpen(false); setErr(""); setF({ name: "", services: "", phone: "", email: "", categories: [], neighbourhoods: [] });
  };
  return (
    <div>
      <PageHeader title="Community partner directory" actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" />Add partner</Button>} />
      <div className="grid gap-3 md:grid-cols-2">{s.partners.map((p) => {
        const inUse = s.referrals.some((r) => r.partnerId === p.id);
        return (
          <Card key={p.id}>
            <h3 className="text-lg font-bold">{p.name}</h3><p>{p.services}</p><p className="text-sm text-muted-foreground">{p.phone} · {p.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">{p.categories.map((c) => <Badge key={c} tone="primary">{c}</Badge>)}</div>
            <p className="mt-1 text-sm">Covers: {p.neighbourhoods.join(", ")}</p>
            <Button className="mt-2" size="sm" variant="ghost" disabled={inUse} title={inUse ? "Has referrals" : ""} onClick={() => mutate((d) => { d.partners = d.partners.filter((x) => x.id !== p.id); }, `Removed partner ${p.name}`)}><Trash2 className="size-4" />{inUse ? "Has referrals" : "Remove"}</Button>
          </Card>);
      })}</div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add community partner" wide>
        <form onSubmit={save} className="space-y-3" noValidate>
          {err && <p className="font-semibold text-destructive" role="alert">{err}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Organisation name" required>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
            <Field label="Phone">{(id) => <Input id={id} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}</Field>
            <Field label="Email">{(id) => <Input id={id} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
          </div>
          <Field label="Services" required>{(id) => <Textarea id={id} value={f.services} onChange={(e) => setF({ ...f, services: e.target.value })} />}</Field>
          <div><p className="font-semibold">Referral categories *</p><div className="grid sm:grid-cols-2">{s.referralCategories.map((c) => <Check key={c} label={c} checked={f.categories.includes(c)} onChange={() => tog("categories", c)} />)}</div></div>
          <div><p className="font-semibold">Neighbourhood coverage *</p><div className="grid grid-cols-2 sm:grid-cols-3">{s.zones.map((z) => <Check key={z.name} label={z.name} checked={f.neighbourhoods.includes(z.name)} onChange={() => tog("neighbourhoods", z.name)} />)}</div></div>
          <Button type="submit" className="w-full">Add partner</Button>
        </form>
      </Modal>
    </div>
  );
}

export function AdminAnalytics() {
  const go = useGo();
  return <div><PageHeader title="Platform analytics" actions={<Button variant="outline" onClick={() => go("activity")}>Audit history</Button>} /><ImpactAnalytics /></div>;
}

export function AdminDemo() {
  const { state: s, reset, mutate } = useStore();
  const [confirm, setConfirm] = useState(false);
  const exportJson = () => { downloadFile(`ntc-demo-data-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(s, null, 2), "application/json"); mutate(() => {}, "Exported demo data (JSON)"); toast.success("Demo data exported"); };
  const exportCsv = () => {
    const rows = [["id", "category", "resident", "neighbourhood", "date", "status", "volunteer"], ...s.requests.map((r) => [r.id, r.category, resName(s, r.residentId), r.neighbourhood, r.date, r.status, s.volunteers.find((v) => v.id === r.volunteerId)?.name ?? ""])];
    downloadFile("ntc-help-requests.csv", rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"), "text/csv"); toast.success("Requests CSV exported");
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Demo controls" sub="All data is synthetic and stored in this browser" />
      <Card>
        <h2 className="text-lg font-bold">Export demo data</h2><p className="mb-3 text-muted-foreground">{s.requests.length} requests · {s.residents.length} residents · {s.volunteers.length} volunteers · {s.audit.length} audit entries</p>
        <div className="flex flex-wrap gap-2"><Button onClick={exportJson}><Download className="size-4" />Export everything (JSON)</Button><Button variant="outline" onClick={exportCsv}><Download className="size-4" />Export requests (CSV)</Button></div>
      </Card>
      <Card className="border-destructive/40">
        <h2 className="text-lg font-bold">Reset demo data</h2><p className="mb-3 text-muted-foreground">Restores the original seeded neighbourhood data, with dates refreshed around today. All changes will be lost.</p>
        <Button variant="danger" onClick={() => setConfirm(true)}><RotateCcw className="size-4" />Reset demo data</Button>
      </Card>
      <Card><h2 className="text-lg font-bold">Demo accounts</h2><p className="text-muted-foreground">Password for all: <code>demo123</code></p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">{["coordinator", "sarah", "rajesh", "aisha", "partner", "admin"].map((n) => <li key={n}><code>{n}@ntc.demo</code></li>)}</ul></Card>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset all demo data?">
        <p className="mb-4">This cannot be undone.</p>
        <div className="flex gap-2"><Button variant="danger" onClick={() => { reset(); setConfirm(false); toast.success("Demo data reset"); }}>Yes, reset</Button><Button variant="outline" onClick={() => setConfirm(false)}>Keep my data</Button></div>
      </Modal>
    </div>
  );
}
