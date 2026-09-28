import { useStore } from "@/lib/store";
import { fmtDT, isOverdue } from "@/lib/logic";
import { Badge, Button, Card, Empty, PageHeader } from "./kit";
import { cn } from "@/lib/utils";

export function useMyNotifications() {
  const { state: s, user } = useStore();
  if (!user) return [];
  const list = s.notifications.filter((n) => n.to === user.id || n.to === user.role);
  const derived = user.role === "coordinator" || user.role === "admin"
    ? s.tasks.filter((t) => t.status !== "Done" && isOverdue(t.due) && t.assignee === user.id).map((t) => ({ id: `od_${t.id}`, to: user.id, text: `Overdue task: ${t.title}`, at: t.due, read: false, kind: "overdue" }))
    : [];
  return [...derived, ...list].sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

const KIND: Record<string, string> = { assignment: "New assignment", accepted: "Accepted", schedule: "Schedule change", cancellation: "Cancellation", overdue: "Overdue", concern: "Concern", referral: "Referral", request: "New request", completed: "Completed", message: "Message", event: "Event", feedback: "Feedback", update: "Update" };

export function NotificationsPage() {
  const { mutate, user } = useStore();
  const list = useMyNotifications();
  const unread = list.filter((n) => !n.read && !n.id.startsWith("od_"));
  const markAll = () => mutate((d) => { d.notifications.forEach((n) => { if (n.to === user?.id || n.to === user?.role) n.read = true; }); });
  return (
    <div>
      <PageHeader title="Notifications" sub={`${unread.length} unread`} actions={<Button variant="outline" disabled={!unread.length} onClick={markAll}>Mark all as read</Button>} />
      {list.length === 0 ? <Empty title="You're all caught up" /> : (
        <Card className="p-0"><ul className="divide-y">{list.map((n) => (
          <li key={n.id} className={cn("flex items-start gap-3 p-3", !n.read && "bg-secondary/60")}>
            <span className={cn("mt-2 size-2.5 shrink-0 rounded-full", n.read ? "bg-transparent" : n.kind === "overdue" || n.kind === "concern" ? "bg-destructive" : "bg-primary")} aria-hidden />
            <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone={n.kind === "overdue" || n.kind === "cancellation" || n.kind === "concern" ? "danger" : "primary"}>{KIND[n.kind] ?? n.kind}</Badge><span className="text-sm text-muted-foreground">{fmtDT(n.at)}</span></div><p>{n.text}</p></div>
            {!n.read && !n.id.startsWith("od_") && <Button size="sm" variant="ghost" onClick={() => mutate((d) => { const x = d.notifications.find((y) => y.id === n.id); if (x) x.read = true; })}>Mark read</Button>}
          </li>))}</ul></Card>
      )}
    </div>
  );
}
