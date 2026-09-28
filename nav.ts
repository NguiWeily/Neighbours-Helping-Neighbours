import { useNavigate, useSearch } from "@tanstack/react-router";

export function useGo() {
  const nav = useNavigate();
  return (page: string, id?: string) => nav({ to: "/app/$page", params: { page }, search: id ? { id } : {} });
}
export function useFocusId() {
  const s = useSearch({ strict: false }) as { id?: string };
  return s.id;
}
