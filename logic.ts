import type { HelpRequest, Slot, State, Volunteer } from "./types";

export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
export const ACTIVE: HelpRequest["status"][] = ["matched", "accepted", "in_progress"];

export function slotOf(iso: string): Slot {
  const h = new Date(iso).getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
export function dist(s: State, a: string, b: string) {
  const A = s.zones.find((z) => z.name === a), B = s.zones.find((z) => z.name === b);
  if (!A || !B) return 99;
  return Math.round(Math.hypot(A.x - B.x, A.y - B.y) * 10) / 10;
}
export function overlaps(a: string, ad: number, b: string, bd: number) {
  const as = +new Date(a), bs = +new Date(b);
  return as < bs + bd * 60000 && bs < as + ad * 60000;
}
export interface Commitment { id: string; title: string; start: string; dur: number; kind: "visit" | "event"; }
export function commitments(s: State, vid: string): Commitment[] {
  const out: Commitment[] = [];
  s.requests.forEach((r) => {
    if (r.volunteerId === vid && ACTIVE.includes(r.status)) out.push({ id: r.id, title: catName(s, r.category), start: r.date, dur: r.durationMin, kind: "visit" });
  });
  s.events.forEach((e) => { if (e.volunteerIds.includes(vid)) out.push({ id: e.id, title: e.title, start: e.date, dur: e.durationMin, kind: "event" }); });
  return out;
}
export function findConflicts(s: State, vid: string, start: string, dur: number, excludeId?: string) {
  return commitments(s, vid).filter((c) => c.id !== excludeId && overlaps(c.start, c.dur, start, dur));
}
export function workload(s: State, vid: string) {
  const now = Date.now(), wk = now + 7 * 864e5;
  const visits = s.requests.filter((r) => r.volunteerId === vid && ACTIVE.includes(r.status) && +new Date(r.date) < wk).length;
  return visits + s.befriending.filter((b) => b.volunteerId === vid && b.active).length;
}
export const catName = (s: State, id: string) => s.categories.find((c) => c.id === id)?.name ?? id;

export interface Reason { label: string; points: number; max: number; text: string; }
export interface MatchResult { v: Volunteer; score: number; reasons: Reason[]; block?: string; soft?: string; distance: number; load: number; }

export function rankVolunteers(s: State, r: HelpRequest): MatchResult[] {
  const cat = s.categories.find((c) => c.id === r.category);
  const slot = slotOf(r.date), day = String(new Date(r.date).getDay());
  return s.volunteers.map((v) => {
    const reasons: Reason[] = [];
    const d = dist(s, v.neighbourhood, r.neighbourhood);
    let p = d <= 2 ? 25 : d <= 5 ? 20 : d <= 10 ? 12 : d <= 15 ? 6 : 0;
    let t = d <= 2 ? `Lives in ${v.neighbourhood}, same area` : `${v.neighbourhood} is about ${d} km away`;
    if (d > v.maxKm) { p = 0; t += ` — beyond their ${v.maxKm} km travel limit`; }
    reasons.push({ label: "Neighbourhood", points: p, max: 25, text: t });
    const av = v.availability[day] ?? [];
    reasons.push(av.includes(slot)
      ? { label: "Availability", points: 20, max: 20, text: `Available ${slot}s on this day` }
      : av.length ? { label: "Availability", points: 8, max: 20, text: `Available this day, but not ${slot}` }
      : { label: "Availability", points: 0, max: 20, text: "Not usually available this day" });
    const cp = v.categories.includes(r.category);
    reasons.push({ label: "Preferred task", points: cp ? 15 : 0, max: 15, text: cp ? `Prefers ${cat?.name ?? "this"} tasks` : "Not one of their preferred task types" });
    const sk = v.skills.filter((x) => cat?.skills.includes(x));
    reasons.push({ label: "Skills", points: sk.length ? 10 : 0, max: 10, text: sk.length ? `Relevant skills: ${sk.join(", ")}` : "No listed matching skills" });
    const lang = v.languages.includes(r.language);
    reasons.push({ label: "Language", points: lang ? 10 : 0, max: 10, text: lang ? `Speaks ${r.language}` : `Does not list ${r.language}` });
    if (r.transportNeeded) reasons.push({ label: "Transport", points: v.transport ? 5 : 0, max: 5, text: v.transport ? "Has own transport" : "No transport — this request needs it" });
    else reasons.push({ label: "Transport", points: 5, max: 5, text: "No transport needed" });
    const cont = s.requests.some((x) => x.residentId === r.residentId && x.volunteerId === v.id && x.status === "completed" && x.id !== r.id)
      || s.befriending.some((b) => b.residentId === r.residentId && b.volunteerId === v.id);
    reasons.push({ label: "Continuity", points: cont ? 10 : 0, max: 10, text: cont ? "Has helped this resident before" : "Has not helped this resident yet" });
    const load = workload(s, v.id);
    reasons.push({ label: "Workload", points: load === 0 ? 5 : load <= 2 ? 3 : load <= 4 ? 1 : 0, max: 5, text: load >= 5 ? `Overloaded: ${load} commitments this week` : `${load} commitment(s) this week` });
    const score = reasons.reduce((a, x) => a + x.points, 0);
    let block: string | undefined, soft: string | undefined;
    const conflict = findConflicts(s, v.id, r.date, r.durationMin, r.id);
    if (!v.active) block = "Inactive volunteer";
    else if (conflict.length) block = `Double-booked: ${conflict[0].title} at the same time`;
    else if (r.transportNeeded && !v.transport) soft = "No transport available";
    if (!block && r.requiresVerified && !v.verified) soft = "Not yet verified — this request requires verified support";
    if (!block && r.declined.some((x) => x.volunteerId === v.id)) soft = "Declined this request earlier";
    return { v, score, reasons, block, soft, distance: d, load };
  }).sort((a, b) => (a.block ? 1 : 0) - (b.block ? 1 : 0) || (a.soft ? 1 : 0) - (b.soft ? 1 : 0) || b.score - a.score);
}

export function volunteerHours(s: State, vid: string) {
  const mins = s.requests.filter((r) => r.volunteerId === vid && r.status === "completed").reduce((a, r) => {
    if (r.checkIn && r.checkOut) return a + Math.max(15, (+new Date(r.checkOut) - +new Date(r.checkIn)) / 60000);
    return a + r.durationMin;
  }, 0) + s.befriending.filter((b) => b.volunteerId === vid).reduce((a, b) => a + b.contacts.length * 45, 0)
    + s.events.filter((e) => e.volunteerIds.includes(vid) && +new Date(e.date) < Date.now()).reduce((a, e) => a + e.durationMin, 0);
  return Math.round(mins / 6) / 10;
}

// ---------- formatting ----------
export const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" }) : "—";
export const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" }) : "";
export const fmtDT = (iso?: string) => iso ? `${fmtDate(iso)}, ${fmtTime(iso)}` : "—";
export const isOverdue = (iso: string) => +new Date(iso) < Date.now();
export const toLocalInput = (iso: string) => {
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ---------- ICS ----------
export interface IcsItem { id: string; title: string; start: string; dur: number; location?: string; description?: string; }
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (t = "") => t.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
export function toIcs(items: IcsItem[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Neighbourhoods That Care//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  items.forEach((i) => {
    const s = new Date(i.start), e = new Date(+s + i.dur * 60000);
    lines.push("BEGIN:VEVENT", `UID:${i.id}@ntc.demo`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(s)}`, `DTEND:${icsDate(e)}`,
      `SUMMARY:${esc(i.title)}`, `LOCATION:${esc(i.location)}`, `DESCRIPTION:${esc(i.description)}`, "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
export function downloadFile(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const exportIcs = (name: string, items: IcsItem[]) => downloadFile(name, toIcs(items), "text/calendar");
