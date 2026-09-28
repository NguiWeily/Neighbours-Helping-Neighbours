import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { NAV } from "@/components/registry";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
});

function AppIndex() {
  const { user } = useStore();
  if (!user) return null;
  return <Navigate to="/app/$page" params={{ page: NAV[user.role][0].slug }} search={{}} replace />;
}
