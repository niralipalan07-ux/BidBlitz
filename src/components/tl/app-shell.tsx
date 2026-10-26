import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { signOut, getSession } from "@/lib/auth";
import { IS_DEMO } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DemoBadge, Logo } from "./primitives";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function AppShell({ items, portal, children }: { items: NavItem[]; portal: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const session = getSession();

  const logout = () => {
    signOut();
    navigate({ to: "/login", replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6">
        <Logo to={items[0].to} />
        <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">{portal}</p>
      </div>
      <nav className="mt-6 flex-1 space-y-1 px-3" aria-label={`${portal} navigation`}>
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{ className: "!bg-primary !text-primary-foreground font-medium" }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </nav>
      <div className="m-3 rounded-2xl bg-pale p-4 text-xs text-butter-foreground">
        <p className="font-semibold">{session?.name}</p>
        <p className="truncate opacity-80">{session?.company ?? session?.email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-xl">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-5 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Open navigation">
            {open ? <X /> : <Menu />}
          </button>
          <div className="ml-auto">{IS_DEMO && <DemoBadge>Demo mode · simulated sign-in &amp; data</DemoBadge>}</div>
        </header>
        <main className={cn("mx-auto max-w-6xl px-5 py-8 fade-up")}>{children}</main>
      </div>
    </div>
  );
}
