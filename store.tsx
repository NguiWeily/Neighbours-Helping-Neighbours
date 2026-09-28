import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { makeSeed } from "./seed";
import { uid } from "./logic";
import type { State, User } from "./types";

const KEY = "ntc_state_v1", UKEY = "ntc_user_v1";
export interface Notify { to: string; text: string; kind?: string }
interface Ctx {
  state: State; user: User | null; ready: boolean;
  login: (email: string, pw: string) => User | null; logout: () => void;
  mutate: (fn: (d: State) => void, audit?: string, notify?: Notify[]) => void;
  reset: () => void;
}
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => makeSeed());
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
      setUserId(localStorage.getItem(UKEY));
    } catch { /* ignore corrupt storage */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, ready]);

  const user = state.users.find((u) => u.id === userId) ?? null;

  const mutate = useCallback<Ctx["mutate"]>((fn, audit, notify) => {
    setState((prev) => {
      const d = structuredClone(prev);
      fn(d);
      const by = d.users.find((u) => u.id === localStorage.getItem(UKEY))?.name ?? "System";
      const now = new Date().toISOString();
      if (audit) d.audit.unshift({ id: uid("a"), at: now, by, action: audit });
      notify?.forEach((n) => d.notifications.unshift({ id: uid("n"), to: n.to, text: n.text, at: now, read: false, kind: n.kind ?? "update" }));
      return d;
    });
  }, []);

  const login = (email: string, pw: string) => {
    const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === pw && x.active);
    if (u) { localStorage.setItem(UKEY, u.id); setUserId(u.id); }
    return u ?? null;
  };
  const logout = () => { localStorage.removeItem(UKEY); setUserId(null); };
  const reset = () => { const s = makeSeed(); setState(s); };

  return <StoreCtx.Provider value={{ state, user, ready, login, logout, mutate, reset }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
/** user id for a person (volunteer/resident/partner) */
export const userOf = (s: State, personId?: string) => s.users.find((u) => u.personId === personId)?.id ?? "";
