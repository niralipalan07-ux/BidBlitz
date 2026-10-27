import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileSearch,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Building,
  UploadCloud,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatCard, StatusPill, PageHeader } from "@/components/tl/primitives";
import { getSession } from "@/lib/auth";
import { listTenders, listMySubmissions } from "@/lib/api";
import { FINDING_TONE, STATUS_LABEL } from "@/lib/status";
import type { Submission, Tender } from "@/lib/types";

export const Route = createFileRoute("/vendor/dashboard")({
  component: VendorDashboard,
});

function VendorDashboard() {
  const session = getSession();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listTenders(), listMySubmissions()]).then(([t, s]) => {
      setTenders(t);
      setSubmissions(s);
      setLoading(false);
    });
  }, []);

  const activeSubmissions = submissions.filter(
    (s) => s.status === "Submitted" || s.status === "Analysis in Progress",
  ).length;
  const reviewRequired = submissions.filter((s) => s.status === "Review Required").length;
  const completed = submissions.filter((s) => s.status === "Analysis Completed").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${session?.name || "Vendor"}`}
        subtitle="Manage your tender submissions and track your compliance status."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/vendor/documents">
                <UploadCloud className="mr-2 h-4 w-4" /> Document Vault
              </Link>
            </Button>
            <Button asChild>
              <Link to="/vendor/tenders">
                Browse Tenders <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available Tenders"
          value={loading ? "…" : tenders.length}
          icon={<FileSearch />}
          tone="neutral"
        />
        <StatCard
          label="Active Submissions"
          value={loading ? "…" : activeSubmissions}
          icon={<Clock />}
          tone="success"
        />
        <StatCard
          label="Documents Requiring Attention"
          value={loading ? "…" : reviewRequired}
          icon={<AlertTriangle />}
          tone="warning"
        />
        <StatCard
          label="Completed Reviews"
          value={loading ? "…" : completed}
          icon={<CheckCircle2 />}
          tone="success"
        />
      </div>

      {/* Main Sections Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Active Submissions */}
        <div className="surface p-6">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">My Recent Submissions</h2>
              <p className="text-xs text-muted-foreground">Track review progress and document findings</p>
            </div>
            <Link
              to="/vendor/submissions"
              className="text-xs font-medium text-secondary hover:underline"
            >
              View all ({submissions.length})
            </Link>
          </div>

          <div className="divide-y">
            {submissions.slice(0, 3).map((sub) => {
              const tender = tenders.find((t) => t.id === sub.tenderId);
              return (
                <div key={sub.id} className="flex items-center justify-between py-4">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="truncate text-sm font-medium">{tender?.title || sub.id}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Ref: {tender?.reference || "Pending"}</span>
                      <span>•</span>
                      <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{sub.files.length} document(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill
                      tone={
                        sub.status === "Analysis Completed"
                          ? "success"
                          : sub.status === "Review Required"
                            ? "warning"
                            : "info"
                      }
                    >
                      {sub.status}
                    </StatusPill>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/vendor/submissions/$id" params={{ id: sub.id }}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}

            {submissions.length === 0 && !loading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tender submissions yet. Explore available tenders below to submit your first bid.
              </p>
            )}
          </div>
        </div>

        {/* Available Tenders Preview */}
        <div className="surface p-6">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Latest Tenders</h2>
              <p className="text-xs text-muted-foreground">Recently published procurement opportunities</p>
            </div>
            <Link to="/vendor/tenders" className="text-xs font-medium text-secondary hover:underline">
              Browse all ({tenders.length})
            </Link>
          </div>

          <div className="divide-y">
            {tenders.slice(0, 3).map((tender) => (
              <div key={tender.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium leading-snug">{tender.title}</h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Building className="h-3 w-3" /> {tender.department}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Due {new Date(tender.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-secondary font-mono">{tender.reference}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/vendor/tenders/$id" params={{ id: tender.id }}>
                        Details
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to="/vendor/submit/$id" params={{ id: tender.id }}>
                        Submit Bid
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
