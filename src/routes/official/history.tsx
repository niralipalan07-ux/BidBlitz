import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckCircle2, Eye, History, Shield, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/tl/primitives";
import { listAnalyses, listTenders } from "@/lib/api";
import type { Analysis, Tender } from "@/lib/types";

export const Route = createFileRoute("/official/history")({
  component: OfficialHistory,
});

function OfficialHistory() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAnalyses(), listTenders()]).then(([a, t]) => {
      setAnalyses(a);
      setTenders(t);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analysis History &amp; Audit Trail"
        subtitle="Chronological audit records of all compliance runs executed by procurement evaluation officers."
      />

      <div className="surface p-6 space-y-6">
        <div className="flex items-center gap-2 border-b pb-3">
          <History className="h-5 w-5 text-secondary" />
          <h2 className="font-display text-base font-semibold">Evaluation Run Timeline</h2>
        </div>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {analyses.map((a) => {
            const tender = tenders.find((t) => t.id === a.tenderId);
            const matched = a.findings.filter((f) => f.status === "MATCHED").length;
            const missing = a.findings.filter((f) => f.status === "MISSING_EVIDENCE").length;
            const review = a.findings.filter((f) => f.status === "REVIEW_REQUIRED").length;

            return (
              <div key={a.id} className="relative group">
                <span className="absolute -left-[29px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary-soft" />

                <div className="surface p-5 transition-shadow hover:shadow-[var(--shadow-soft)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold uppercase text-secondary">
                          {tender?.reference || "REF/AUDIT"}
                        </span>
                        <StatusPill tone={a.status === "Analysis Completed" ? "success" : "warning"}>
                          {a.status}
                        </StatusPill>
                      </div>
                      <h3 className="mt-1 font-semibold text-foreground text-base">
                        {tender?.title || "Tender Analysis Run"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Vendor Evaluated: <b className="text-foreground">{a.vendorName}</b> • Run Date:{" "}
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <Button size="sm" variant="outline" asChild>
                      <Link to="/official/analysis/$id" params={{ id: a.id }}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View Findings
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-primary font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {matched} Matched
                    </span>
                    <span className="flex items-center gap-1.5 text-danger font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" /> {missing} Missing Evidence
                    </span>
                    <span className="flex items-center gap-1.5 text-butter-foreground font-medium">
                      <Shield className="h-3.5 w-3.5" /> {review} Review Required
                    </span>
                    <span className="ml-auto font-mono text-[11px]">Audit ID: {a.id}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {analyses.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground">No historical analyses recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
