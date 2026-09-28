import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How It Works — Neighbourhoods That Care" },
      { name: "description", content: "How residents, volunteers, coordinators and community partners work together on Neighbourhoods That Care." },
      { property: "og:title", content: "How It Works — Neighbourhoods That Care" },
      { property: "og:description", content: "Residents ask, coordinators match, volunteers help, partners support." },
    ],
  }),
  component: About,
});

const ROLES = [
  ["Residents", "Ask for everyday help in plain language, see who is coming and when, join community activities, and say thank you when it's done."],
  ["Volunteers", "Set your neighbourhood, languages, skills and availability. Accept tasks that suit you, check in and out, and record a short note after each visit."],
  ["Community coordinators", "Review every request, match with the help of a transparent scoring engine, manage befriending, referrals, caregiver support, events and concerns."],
  ["Community partners", "Receive referrals for meals, transport, social and financial assistance, community exercise and caregiver support, and share service updates."],
];

function About() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-12">
        <header><h1 className="text-4xl font-extrabold">How Neighbourhoods That Care works</h1><p className="mt-3 text-xl text-muted-foreground">A community-help platform that connects neighbours who can help with neighbours who need a helping hand.</p></header>
        <section><h2 className="text-2xl font-bold">Who does what</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{ROLES.map(([t, d]) => <div key={t} className="rounded-xl border bg-card p-5"><h3 className="text-xl font-bold text-primary">{t}</h3><p className="mt-1">{d}</p></div>)}</div>
        </section>
        <section><h2 className="text-2xl font-bold">How matching works</h2>
          <p className="mt-2">Each suitable volunteer gets a score out of 100, with the reasons shown in plain language:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">{["Neighbourhood distance (25)", "Availability at the requested time (20)", "Preferred type of help (15)", "Relevant skills (10)", "Shared language (10)", "Continuity — helped this person before (10)", "Transport when needed (5)", "Current workload (5)"].map((x) => <li key={x} className="rounded-lg bg-secondary px-3 py-2 font-semibold">{x}</li>)}</ul>
          <p className="mt-3">Inactive volunteers and double-bookings are excluded automatically. Unverified volunteers are excluded where verified support is required. Coordinators always make the final decision and can override with a recorded reason.</p>
        </section>
        <section><h2 className="text-2xl font-bold">What we don't do</h2><p className="mt-2">We are not a hospital, clinic or emergency service. Volunteers do not provide medical care, handle medication, give personal care, or manage money. Medical appointment help is escort-only.</p></section>
        <Link to="/login" className="inline-flex min-h-13 items-center rounded-lg bg-primary px-6 text-lg font-bold text-primary-foreground">Try the demo</Link>
      </div>
    </PublicLayout>
  );
}
