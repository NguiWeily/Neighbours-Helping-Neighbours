import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { NAV } from "@/components/registry";
import { Empty } from "@/components/kit";

export const Route = createFileRoute("/app/$page")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s.id === "string" ? { id: s.id } : {}),
  component: Page,
});

function Page() {
  const { page } = Route.useParams();
  const { id } = Route.useSearch();
  const { user } = useStore();
  if (!user) return null;
  const item = NAV[user.role].find((i) => i.slug === page);
  if (!item) return (
    <Empty title="This page isn't part of your account">
      <Link to="/app" className="font-semibold text-primary underline">Go to your home page</Link>
    </Empty>
  );
  const C = item.component;
  return <C key={`${page}-${id ?? ""}`} />;
}
