import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { FINDING_TONE, STATUS_LABEL } from "@/lib/status";
import type { Finding, FindingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusPill } from "./primitives";

const FILTERS: (FindingStatus | "ALL")[] = ["ALL", "MATCHED", "MISSING_EVIDENCE", "REVIEW_REQUIRED", "NOT_ASSESSED"];

export function ComplianceView({ findings }: { findings: Finding[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FindingStatus | "ALL">("ALL");
  const [open, setOpen] = useState<number | null>(null);

  const rows = useMemo(
    () =>
      findings
        .map((f, i) => ({ f, i }))
        .filter(
          ({ f }) =>
            (filter === "ALL" || f.status === filter) &&
            (f.requirement + f.explanation).toLowerCase().includes(q.toLowerCase()),
        ),
    [findings, q, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
              )}
            >
              {s === "ALL" ? "All" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search requirements" className="pl-9" aria-label="Search requirements" />
        </div>
      </div>

      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Requirement", "Status", "Evidence Found", "Source Document", "Page", "Explanation", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ f, i }) => (
              <tr key={i} className="border-t align-top">
                <td className="px-4 py-3 font-medium">{f.requirement}</td>
                <td className="px-4 py-3"><StatusPill tone={FINDING_TONE[f.status]}>{STATUS_LABEL[f.status]}</StatusPill></td>
                <td className="px-4 py-3 text-muted-foreground">{f.evidence}</td>
                <td className="px-4 py-3">{f.sourceDocument ?? "—"}</td>
                <td className="px-4 py-3">{f.page ? `Page ${f.page}` : "—"}</td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">{f.explanation}</td>
                <td className="max-w-[220px] px-4 py-3 text-muted-foreground">{f.action}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No requirements match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <h2 className="pt-4 text-lg font-semibold">Requirement details</h2>
        {rows.map(({ f, i }) => (
          <div key={i} className="surface overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/50"
            >
              <span className="flex flex-wrap items-center gap-3 font-medium">
                {f.requirement} <StatusPill tone={FINDING_TONE[f.status]}>{STATUS_LABEL[f.status]}</StatusPill>
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", open === i && "rotate-180")} />
            </button>
            {open === i && (
              <dl className="grid gap-4 border-t px-5 py-4 text-sm md:grid-cols-2">
                <Detail k="Original tender requirement" v={f.original} />
                <Detail k="Extracted evidence" v={f.extracted ?? "No text extracted."} />
                <Detail k="Source document and page" v={f.sourceDocument ? `${f.sourceDocument}${f.page ? ` · Page ${f.page}` : ""}` : "—"} />
                <Detail k="Reason for status" v={f.explanation} />
                <Detail k="Recommended follow-up" v={f.action} />
              </dl>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="mt-1">{v}</dd>
    </div>
  );
}
