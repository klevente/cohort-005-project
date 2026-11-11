// PROTOTYPE: throwaway. Answers "The Inbox UI" (wayfinder ticket #5).
// Three variants of the Inbox, switchable via `?variant=`, mounted in the real
// app layout (`app/routes/layout.app.tsx`):
//   A: bell in the sidebar header with a dropdown
//   B: "Inbox" sidebar item with a badge that opens a slide-over drawer
//   C: "Inbox" sidebar item that opens a full-page, two-pane Inbox
// Notifications are in-memory fixtures for the current user's role; nothing
// talks to Knock or the database.

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  Archive,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CornerDownRight,
  Inbox,
  Mail,
  MessageSquare,
  Star,
  UsersRound,
  X,
  TriangleAlert,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { UserRole } from "~/db/schema";

type Kind =
  | "refund-opened"
  | "refund-decided"
  | "refund-approved-instructor"
  | "refund-issued"
  | "refund-failed"
  | "question-asked"
  | "comment-reply"
  | "seat-claimed"
  | "last-seat-claimed"
  | "course-rated"
  | "course-archived";

interface Notification {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  href: string;
  minutesAgo: number;
  read: boolean;
  alsoEmailed: boolean;
}

const kindIcon: Record<Kind, React.ReactNode> = {
  "refund-opened": <CircleDollarSign className="size-4" />,
  "refund-decided": <CircleDollarSign className="size-4" />,
  "refund-approved-instructor": <CircleDollarSign className="size-4" />,
  "refund-issued": <CircleDollarSign className="size-4" />,
  "refund-failed": <TriangleAlert className="size-4" />,
  "question-asked": <MessageSquare className="size-4" />,
  "comment-reply": <CornerDownRight className="size-4" />,
  "seat-claimed": <UsersRound className="size-4" />,
  "last-seat-claimed": <UsersRound className="size-4" />,
  "course-rated": <Star className="size-4" />,
  "course-archived": <Archive className="size-4" />,
};

const kindGroup: Record<Kind, string> = {
  "refund-opened": "Refunds",
  "refund-decided": "Refunds",
  "refund-approved-instructor": "Refunds",
  "refund-issued": "Refunds",
  "refund-failed": "Refunds",
  "question-asked": "Questions",
  "comment-reply": "Questions",
  "seat-claimed": "Team",
  "last-seat-claimed": "Team",
  "course-rated": "Courses",
  "course-archived": "Courses",
};

function fixturesFor(role: UserRole | null, isTeamAdmin: boolean): Notification[] {
  const n = (
    id: string,
    kind: Kind,
    title: string,
    body: string,
    href: string,
    minutesAgo: number,
    read: boolean,
    alsoEmailed = false
  ): Notification => ({ id, kind, title, body, href, minutesAgo, read, alsoEmailed });

  const list: Notification[] = [];
  if (role === UserRole.Admin) {
    list.push(
      n("a1", "refund-opened", "New Refund Request", "Sam Lee asked for a refund on Introduction to TypeScript: \"Not what I expected.\"", "/admin/refunds", 4, false),
      n("a2", "refund-failed", "Refund failed", "Refund to Priya Nair for Design Systems with Tailwind failed at the payment provider. Retry or refund manually.", "/admin/refunds", 55, false),
      n("a3", "refund-opened", "New Refund Request", "Acme Ltd (Team Licence, 10 Seats) asked for a refund on Building REST APIs with Node.js.", "/admin/refunds", 60 * 26, true),
      n("a4", "refund-opened", "New Refund Request", "Jo Park asked for a refund on Introduction to TypeScript.", "/admin/refunds", 60 * 24 * 4, true)
    );
  }
  if (role === UserRole.Instructor) {
    list.push(
      n("i1", "question-asked", "New question on Introduction to TypeScript", "Sam Lee on \"Generics 101\": \"Why does the constraint need extends here?\"", "/courses/introduction-to-typescript/lessons/1#comments", 12, false, true),
      n("i2", "comment-reply", "Reply to your comment", "Priya Nair replied on \"Generics 101\": \"That fixed it, thanks!\"", "/courses/introduction-to-typescript/lessons/1#comments", 90, false, true),
      n("i3", "course-rated", "New rating", "A Student rated Introduction to TypeScript ★★★★☆.", "/instructor/1", 60 * 5, true),
      n("i4", "refund-approved-instructor", "Refund approved", "A refund for Jo Park on Introduction to TypeScript was approved. Their Enrollment has ended.", "/instructor/1/students", 60 * 30, true),
      n("i5", "question-asked", "New question on Introduction to TypeScript", "Alex Kim on \"Narrowing\": \"Is `in` safe for unions of classes?\"", "/courses/introduction-to-typescript/lessons/1#comments", 60 * 24 * 3, true, true)
    );
  }
  if (role === UserRole.Student) {
    list.push(
      n("s1", "comment-reply", "Reply to your comment", "The Instructor replied on \"Generics 101\": \"Good catch, the constraint is there so that…\"", "/courses/introduction-to-typescript/lessons/1#comments", 7, false, true),
      n("s2", "refund-decided", "Refund Request approved", "Your Refund Request for Design Systems with Tailwind was approved. You'll get the money back in 5–10 days.", "/courses/design-systems-with-tailwind", 60 * 3, false, true),
      n("s3", "course-archived", "Course archived", "Building REST APIs with Node.js has been archived. You keep access to the lessons you've already got.", "/courses/building-rest-apis-with-nodejs", 60 * 28, true, true),
      n("s4", "refund-issued", "Refund issued", "$49.00 was refunded for Design Systems with Tailwind.", "/courses/design-systems-with-tailwind", 60 * 24 * 6, true, true)
    );
  }
  if (isTeamAdmin) {
    list.push(
      n("t1", "last-seat-claimed", "All Seats claimed", "The last Unclaimed Seat on your Introduction to TypeScript Team Licence was claimed by Morgan Diaz.", "/team", 20, false),
      n("t2", "seat-claimed", "Seat claimed", "Chris Wu claimed a Seat on your Introduction to TypeScript Team Licence (9 of 10).", "/team", 60 * 8, true)
    );
  }
  return list.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

function ago(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / (60 * 24))}d`;
}

function useNotifications(role: UserRole | null, isTeamAdmin: boolean) {
  const [items, setItems] = useState(() => fixturesFor(role, isTeamAdmin));
  useEffect(() => setItems(fixturesFor(role, isTeamAdmin)), [role, isTeamAdmin]);
  return {
    items,
    unread: items.filter((i) => !i.read).length,
    markRead: (id: string) =>
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x))),
    toggleRead: (id: string) =>
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: !x.read } : x))),
    markAllRead: () => setItems((xs) => xs.map((x) => ({ ...x, read: true }))),
  };
}

type Store = ReturnType<typeof useNotifications>;

function Badge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-5 text-primary-foreground",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
      <Inbox className="size-6" />
      You're all caught up.
    </div>
  );
}

// ─── Variant A: bell + dropdown ────────────────────────────────────────────

function BellDropdown({ store }: { store: Store }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
        title="Inbox"
      >
        <Bell className="size-4" />
        {store.unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-sidebar" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-9 z-50 w-96 rounded-lg border bg-popover text-popover-foreground shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <span className="text-sm font-semibold">Inbox</span>
              <button
                onClick={store.markAllRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Mark all as read
              </button>
            </div>
            <div className="max-h-[28rem] overflow-y-auto">
              {store.items.length === 0 && <Empty />}
              {store.items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    store.markRead(n.id);
                    setOpen(false);
                    navigate(n.href);
                  }}
                  className={cn(
                    "flex w-full gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-accent",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="mt-0.5 text-muted-foreground">{kindIcon[n.kind]}</div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-sm", !n.read ? "font-semibold" : "text-muted-foreground")}>
                      {n.title}
                    </div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground/70">{ago(n.minutesAgo)} ago</div>
                  </div>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Variant B: sidebar item + slide-over drawer ───────────────────────────

function DrawerNavItem({ store, onOpen }: { store: Store; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Inbox className="size-4" />
      Inbox
      <Badge count={store.unread} className="ml-auto" />
    </button>
  );
}

function Drawer({ store, onClose }: { store: Store; onClose: () => void }) {
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const navigate = useNavigate();
  const shown = tab === "unread" ? store.items.filter((i) => !i.read) : store.items;
  const today = shown.filter((i) => i.minutesAgo < 60 * 24);
  const earlier = shown.filter((i) => i.minutesAgo >= 60 * 24);
  const section = (label: string, rows: Notification[]) =>
    rows.length > 0 && (
      <div>
        <div className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {rows.map((n) => (
          <div
            key={n.id}
            className={cn(
              "group mx-2 flex gap-3 rounded-md border-l-2 px-3 py-3",
              n.read ? "border-transparent" : "border-primary bg-primary/5"
            )}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {kindIcon[n.kind]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{ago(n.minutesAgo)}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <button
                  onClick={() => {
                    store.markRead(n.id);
                    onClose();
                    navigate(n.href);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Open
                </button>
                <button
                  onClick={() => store.toggleRead(n.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Mark as {n.read ? "unread" : "read"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[26rem] flex-col border-l bg-background shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b px-5">
          <span className="font-semibold">Inbox</span>
          <button onClick={onClose} className="rounded p-1 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 border-b px-4 py-2 text-sm">
          {(["unread", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1 capitalize",
                tab === t ? "bg-accent font-medium" : "text-muted-foreground"
              )}
            >
              {t} {t === "unread" && store.unread > 0 && `(${store.unread})`}
            </button>
          ))}
          <button
            onClick={store.markAllRead}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Mark all as read
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pb-6">
          {shown.length === 0 && <Empty />}
          {section("Today", today)}
          {section("Earlier", earlier)}
        </div>
      </aside>
    </>
  );
}

// ─── Variant C: full-page two-pane Inbox ───────────────────────────────────

function PageNavItem({ store, active, onOpen }: { store: Store; active: boolean; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Inbox className="size-4" />
      Inbox
      <Badge count={store.unread} className="ml-auto" />
    </button>
  );
}

function InboxPage({ store }: { store: Store }) {
  const navigate = useNavigate();
  const groups = useMemo(
    () => ["All", ...Array.from(new Set(store.items.map((i) => kindGroup[i.kind])))],
    [store.items]
  );
  const [group, setGroup] = useState("All");
  const shown = group === "All" ? store.items : store.items.filter((i) => kindGroup[i.kind] === group);
  const [selectedId, setSelectedId] = useState<string | null>(shown[0]?.id ?? null);
  const selected = store.items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">Inbox</h1>
        <button onClick={store.markAllRead} className="text-sm text-muted-foreground hover:text-foreground">
          <Check className="mr-1 inline size-4" />
          Mark all as read
        </button>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-96 shrink-0 overflow-y-auto border-r">
          <div className="flex flex-wrap gap-1 border-b p-3">
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={cn(
                  "rounded-full border px-3 py-0.5 text-xs",
                  group === g ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {g}
              </button>
            ))}
          </div>
          {shown.length === 0 && <Empty />}
          {shown.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setSelectedId(n.id);
                store.markRead(n.id);
              }}
              className={cn(
                "flex w-full items-start gap-3 border-b px-4 py-3 text-left",
                selectedId === n.id ? "bg-accent" : "hover:bg-accent/50"
              )}
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className={cn("truncate text-sm", !n.read && "font-semibold")}>{n.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{ago(n.minutesAgo)}</span>
                </div>
                <div className="truncate text-xs text-muted-foreground">{n.body}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {selected ? (
            <div className="max-w-xl">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                {kindIcon[selected.kind]} {kindGroup[selected.kind]} · {ago(selected.minutesAgo)} ago
              </div>
              <h2 className="text-xl font-semibold">{selected.title}</h2>
              <p className="mt-3 text-muted-foreground">{selected.body}</p>
              {selected.alsoEmailed && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3.5" /> Also sent to your email.
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate(selected.href)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Go to it
                </button>
                <button
                  onClick={() => store.toggleRead(selected.id)}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Mark as {selected.read ? "unread" : "read"}
                </button>
              </div>
            </div>
          ) : (
            <Empty />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Switcher + wiring ─────────────────────────────────────────────────────

const VARIANTS = [
  { key: "A", name: "Bell + dropdown" },
  { key: "B", name: "Sidebar item + drawer" },
  { key: "C", name: "Full-page Inbox" },
] as const;

function PrototypeSwitcher({ current }: { current: string }) {
  const [params, setParams] = useSearchParams();
  const idx = Math.max(0, VARIANTS.findIndex((v) => v.key === current));
  const go = (d: number) => {
    const next = VARIANTS[(idx + d + VARIANTS.length) % VARIANTS.length];
    const p = new URLSearchParams(params);
    p.set("variant", next.key);
    setParams(p, { replace: true });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-2 py-1.5 text-sm text-white shadow-2xl ring-2 ring-yellow-400">
      <button onClick={() => go(-1)} className="rounded-full p-1 hover:bg-white/20">
        <ChevronLeft className="size-4" />
      </button>
      <span className="px-2 font-mono">
        PROTOTYPE {VARIANTS[idx].key} ({VARIANTS[idx].name})
      </span>
      <button onClick={() => go(1)} className="rounded-full p-1 hover:bg-white/20">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

export function useInboxPrototype(role: UserRole | null, isTeamAdmin: boolean) {
  const [params] = useSearchParams();
  const variant = params.get("variant") ?? "A";
  const store = useNotifications(role, isTeamAdmin);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [variant, pathname]);

  if (process.env.NODE_ENV === "production" || !role) {
    return { headerSlot: null, navSlot: null, mainOverride: null, overlay: null };
  }

  return {
    headerSlot: variant === "A" ? <BellDropdown store={store} /> : null,
    navSlot:
      variant === "B" ? (
        <DrawerNavItem store={store} onOpen={() => setOpen(true)} />
      ) : variant === "C" ? (
        <PageNavItem store={store} active={open} onOpen={() => setOpen(true)} />
      ) : null,
    mainOverride: variant === "C" && open ? <InboxPage store={store} /> : null,
    overlay: (
      <>
        {variant === "B" && open && <Drawer store={store} onClose={() => setOpen(false)} />}
        <PrototypeSwitcher current={variant} />
      </>
    ),
  };
}
