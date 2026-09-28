# Neighbourhoods That Care

**Connecting neighbours who can help with neighbours who need a helping hand.**

A community-help matching platform demo: residents request everyday help (groceries, meals, transport, companionship and more), coordinators match requests to volunteers with a transparent scoring engine, and partners, administrators and family caregivers stay in the loop. This is **not** an emergency or clinical service — no medical workflows are included.

> The platform is NOT an emergency service. If someone is in imminent danger, contact local emergency services.

## Live demo

- Published app: https://local-support-grid.lovable.app
- All data lives in your browser (localStorage). Use **Admin → Demo Controls** to reset or export demo data as JSON.

## Demo accounts

All demo accounts use the password `demo123`. A role switcher on the login page lets you jump between them instantly.

| Role                 | Email                 | Password  |
| -------------------- | --------------------- | --------- |
| Community Coordinator| coordinator@ntc.demo  | demo123   |
| Volunteer (Sarah)    | sarah@ntc.demo        | demo123   |
| Volunteer (Rajesh)   | rajesh@ntc.demo       | demo123   |
| Resident (Aisha)     | aisha@ntc.demo        | demo123   |
| Community Partner    | partner@ntc.demo      | demo123   |
| Administrator        | admin@ntc.demo        | demo123   |

## Features

- **Resident** — request help (category, urgency, preferred time, neighbourhood, language, accessibility notes, one-off or recurring), track status and matched volunteer, confirm completion, leave feedback, join community events, contact the coordinator.
- **Volunteer** — browse opportunities, accept/decline with reason, check in / check out, add completion notes and wellbeing observations, manage availability, raise concerns, view hours and milestones.
- **Coordinator** — open/urgent/unmatched dashboards, resident and volunteer directories, smart matching workspace with numeric scores and plain-language reasons, manual match/reassign, calendar with conflict detection, befriending, referrals, caregiver/family support, community events, concern queue, impact analytics.
- **Partner** — referral inbox (New → Submitted → Accepted → Service Started → Closed) with service notes.
- **Administrator** — manage users, help categories, neighbourhood zones, partners and event categories; platform analytics; demo reset and JSON export.
- **Cross-cutting** — deterministic matching engine, recurring requests, double-booking prevention, `.ics` calendar export (single item or all upcoming), in-app notifications, audit trail, resident timeline, empty/loading/error states, responsive mobile-first design.

## Help categories

Grocery shopping · Meal collection · Medical appointment escort (escort only) · Transport assistance · Household errands · Light home assistance · Technology help · Paperwork help · Companionship · Walking companion · Befriending call/visit · Pet assistance · Community activity escort

## Tech stack

- [TanStack Start](https://tanstack.com/start) v1 (React 19, TanStack Router) + Vite
- TypeScript
- Tailwind CSS v4 with shadcn/ui-style components
- recharts for analytics
- Browser-persisted demo store (no backend required to run)

## Getting started

Requires Node.js 20+ (or Bun).

```sh
npm install
npm run dev
```

Open http://localhost:8080 and sign in with any demo account above.

Other scripts:

```sh
npm run build     # production build
npm run preview   # serve the production build
npm run lint      # eslint
npm run format    # prettier
```

## Project structure

```
src/
  components/          UI kit, app shell, notifications, role pages
    pages/             Resident, volunteer, coordinator, partner, admin screens
  lib/
    types.ts           Domain models
    seed.ts            Synthetic seed data (Singapore-style neighbourhoods)
    store.tsx          Browser-persisted store: mutations, audit, notifications
    logic.ts           Matching engine, conflicts, .ics generation (pure functions)
  routes/              TanStack Start routes (public pages + /app/$page)
```

## Privacy & safety

All data in this demo is synthetic and stored locally in your browser — nothing is sent to a server. No real personal information is collected. The app clearly states it is not an emergency service and that volunteers should not work outside their role.

## License

Demo project — use freely as a starting point for your own community platform.
