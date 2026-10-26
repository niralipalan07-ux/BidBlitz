import { Link } from "@tanstack/react-router";
import { FileCheck2, FlaskConical, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";

export function Logo({ inverted = false, to = "/" }: { inverted?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="TenderLens home">
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl",
          inverted ? "bg-butter text-butter-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        <FileCheck2 className="h-5 w-5" />
      </span>
      <span className={cn("font-display text-lg font-semibold tracking-tight", inverted && "text-primary-foreground")}>
        TenderLens
      </span>
    </Link>
  );
}

const toneClass: Record<Tone, string> = {
  success: "bg-primary-soft text-primary border-primary/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  warning: "bg-pale text-butter-foreground border-butter",
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-accent text-secondary border-sage/40",
};

export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        toneClass[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const iconTone = {
    neutral: "bg-accent text-primary",
    success: "bg-primary text-primary-foreground",
    warning: "bg-butter text-butter-foreground",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return (
    <div className="surface p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl [&_svg]:h-4 [&_svg]:w-4", iconTone)}>{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

export function DemoBadge({ children = "Demo data" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-butter bg-pale px-2.5 py-0.5 text-[11px] font-medium text-butter-foreground">
      <FlaskConical className="h-3 w-3" /> {children}
    </span>
  );
}

export function Notice({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "info" }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-sm",
        tone === "warning" ? "border-butter bg-pale text-butter-foreground" : "border-border bg-accent text-accent-foreground",
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="surface leaf-pattern flex flex-col items-center px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingRows() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
