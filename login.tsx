import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import { Button, Card, Field, Input } from "@/components/kit";
import { DEMO_ACCOUNTS } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Neighbourhoods That Care" },
      { name: "description", content: "Sign in as a resident, volunteer, coordinator, community partner or administrator." },
      { property: "og:title", content: "Sign in — Neighbourhoods That Care" },
      { property: "og:description", content: "Sign in to Neighbourhoods That Care." },
    ],
  }),
  component: Login,
});

function Login() {
  const { login, user, ready } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { if (ready && user) nav({ to: "/app" }); }, [ready, user, nav]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pw) { setErr("Please enter your email and password"); return; }
    const u = login(email, pw);
    if (!u) { setErr("That email and password don't match an active account"); return; }
    toast.success(`Welcome, ${u.name.split(" ")[0]}!`);
  };
  const quick = (em: string) => { const u = login(em, "demo123"); if (u) toast.success(`Signed in as ${u.name}`); };
  return (
    <PublicLayout>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-2">
        <Card>
          <h1 className="text-3xl font-bold">Sign in</h1>
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <Field label="Email" required>{(id) => <Input id={id} type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} />}</Field>
            <Field label="Password" required>{(id) => <Input id={id} type="password" autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} />}</Field>
            {err && <p role="alert" className="font-semibold text-destructive">{err}</p>}
            <Button type="submit" size="lg" className="w-full">Sign in</Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">New residents and volunteers are registered by a coordinator or administrator — call 6123 4567 to join.</p>
        </Card>
        <Card className="bg-secondary">
          <h2 className="text-2xl font-bold">Demo accounts</h2>
          <p className="text-muted-foreground">One tap to explore each experience. Password for all: <code className="font-bold">demo123</code></p>
          <div className="mt-4 grid gap-2">{DEMO_ACCOUNTS.map((a) => (
            <button key={a.email} onClick={() => quick(a.email)} className="flex min-h-13 items-center justify-between rounded-lg border-2 bg-card px-4 text-left hover:border-primary">
              <span><span className="block font-bold">{a.label}</span><span className="text-sm text-muted-foreground">{a.email}</span></span><span className="font-semibold text-primary">Enter →</span>
            </button>))}</div>
        </Card>
      </div>
    </PublicLayout>
  );
}
