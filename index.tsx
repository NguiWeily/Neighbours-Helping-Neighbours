import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBasket, Utensils, Car, Laptop, FileText, Coffee, Footprints, PawPrint, Phone, Home, HandHeart, Users, ShieldCheck, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neighbourhoods That Care — Neighbours helping neighbours" },
      { name: "description", content: "Connecting neighbours who can help with neighbours who need a helping hand: groceries, escorts, tech help, companionship and more." },
      { property: "og:title", content: "Neighbourhoods That Care" },
      { property: "og:description", content: "Connecting neighbours who can help with neighbours who need a helping hand." },
    ],
  }),
  component: Index,
});

const CATS = [
  [ShoppingBasket, "Grocery shopping"], [Utensils, "Meal collection"], [Car, "Transport & appointment escorts"], [Laptop, "Technology help"],
  [FileText, "Paperwork help"], [Coffee, "Companionship & befriending"], [Footprints, "Walking companion"], [PawPrint, "Pet assistance"],
  [Home, "Light home help & errands"], [Phone, "Befriending calls"],
] as const;

function Index() {
  return (
    <PublicLayout>
      <section className="bg-hero text-hero-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-3 inline-block rounded-full bg-hero-foreground/15 px-3 py-1 text-sm font-semibold">Jurong · Tampines · Bedok · Toa Payoh · Woodlands</p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Neighbourhoods That Care</h1>
            <p className="mt-4 text-xl opacity-90">Connecting neighbours who can help with neighbours who need a helping hand.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex min-h-13 items-center rounded-lg bg-hero-foreground px-6 text-lg font-bold text-hero shadow-md hover:bg-hero-foreground/90">I need a helping hand</Link>
              <Link to="/login" className="inline-flex min-h-13 items-center rounded-lg border-2 border-hero-foreground/60 px-6 text-lg font-bold hover:bg-hero-foreground/10">I'd like to volunteer</Link>
            </div>
            <p className="mt-4 text-sm opacity-80">Try the demo: sign in with any demo account (password <code>demo123</code>).</p>
          </div>
          <img src={hero} alt="A volunteer walking with an elderly neighbour carrying groceries while another volunteer helps an older man with his phone" width={1600} height={1008} className="rounded-2xl shadow-2xl" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[[HandHeart, "1. Ask for help", "Residents or family request everyday help — shopping, a lift, tech help, a friendly chat."], [Sparkles, "2. We find the right neighbour", "Coordinators use transparent matching: nearby, available, speaks your language, and ideally someone you already know."], [Users, "3. Neighbours connect", "Verified volunteers check in and out, share how the visit went, and flag any worries to a coordinator."]].map(([I, t, d]) => {
            const Icon = I as typeof HandHeart;
            return <div key={t as string} className="rounded-xl border bg-card p-5 shadow-sm"><Icon className="size-8 text-primary" aria-hidden /><h3 className="mt-3 text-xl font-bold">{t as string}</h3><p className="mt-1 text-muted-foreground">{d as string}</p></div>;
          })}
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl font-bold">Everyday help, from people nearby</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">{CATS.map(([I, t]) => <div key={t} className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 text-center shadow-sm"><I className="size-7 text-primary" aria-hidden /><span className="font-semibold">{t}</span></div>)}</div>
          <p className="mt-4 text-muted-foreground">We are a community-help service — volunteers do not provide medical, nursing or personal care.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6"><ShieldCheck className="size-8 text-success" aria-hidden /><h2 className="mt-2 text-2xl font-bold">Safe and trusted</h2><p className="mt-2 text-muted-foreground">Volunteers are verified and trained. Every visit is recorded, and coordinators follow up on any concern.</p><Link to="/privacy" className="mt-3 inline-block font-semibold text-primary underline">Our privacy & safety promise</Link></div>
        <div className="rounded-xl border bg-card p-6"><Users className="size-8 text-primary" aria-hidden /><h2 className="mt-2 text-2xl font-bold">Community events</h2><p className="mt-2 text-muted-foreground">Neighbourhood walks, kopi mornings, smartphone workshops and group shopping trips — come along and meet your neighbours.</p><Link to="/about" className="mt-3 inline-block font-semibold text-primary underline">Learn more</Link></div>
      </section>
    </PublicLayout>
  );
}
