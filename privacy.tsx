import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { EmergencyBanner } from "@/components/kit";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Safety — Neighbourhoods That Care" },
      { name: "description", content: "How Neighbourhoods That Care protects personal information and keeps residents and volunteers safe." },
      { property: "og:title", content: "Privacy & Safety — Neighbourhoods That Care" },
      { property: "og:description", content: "Our privacy promise and safety guidelines for residents and volunteers." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  const S = ({ t, children }: { t: string; children: React.ReactNode }) => <section className="rounded-xl border bg-card p-5"><h2 className="text-2xl font-bold">{t}</h2><div className="mt-2 space-y-2">{children}</div></section>;
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
        <h1 className="text-4xl font-extrabold">Privacy & safety</h1>
        <EmergencyBanner />
        <S t="What we collect">
          <p>Only what we need to arrange help: name, contact details, neighbourhood, languages, the help requested, and short non-clinical notes about visits.</p>
          <p>We do not collect diagnoses, medication lists or medical records.</p>
        </S>
        <S t="Who can see it">
          <ul className="list-disc space-y-1 pl-5">
            <li>Volunteers see only the tasks relevant or assigned to them, and only the details needed to help.</li>
            <li>Community partners see only referrals sent to their organisation.</li>
            <li>Coordinators see what they need to match, follow up and keep people safe. Every change is recorded in an audit log.</li>
            <li>Family or caregivers only receive non-sensitive visit notices if they opt in.</li>
          </ul>
        </S>
        <S t="Safety for everyone">
          <ul className="list-disc space-y-1 pl-5">
            <li>Volunteers are verified before supporting requests that require verification.</li>
            <li>Volunteers stay within their role — no personal or medical care, no handling money or medication.</li>
            <li>Anyone can raise a concern (Routine, Priority or Urgent); a coordinator reviews and follows up.</li>
            <li>If someone is in immediate danger, call 995 or 999 first.</li>
          </ul>
        </S>
        <S t="This demo"><p>All names, addresses and records in this demo are fictional and stored only in your browser. Administrators can reset or export the demo data at any time.</p></S>
      </div>
    </PublicLayout>
  );
}
