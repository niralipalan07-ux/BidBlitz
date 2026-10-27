import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  FileCheck2,
  FilePlus,
  FolderKanban,
  PlusCircle,
  Search,
  Users,
  AlertTriangle,
  ArrowRight,
  Eye,
  Filter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatCard, StatusPill, DemoBadge } from "@/components/tl/primitives";
import { listAllSubmissions, listAnalyses, listTenders } from "@/lib/api";
import { getSession } from "@/lib/auth";
import type { Analysis, Submission, SubmissionStatus, Tender } from "@/lib/types";

export const Route = createFileRoute("/official/dashboard")({
  component: OfficialDashboard,
});

function OfficialDashboard() {
  const session = getSession();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedTender, setSelectedTender] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listTenders(), listAllSubmissions(), listAnalyses()]).then(
      ([t, s, a]) => {
        setTenders(t);
        setSubmissions(s);
        setAnalyses(a);
        setLoading(false);
      },
    );
  }, []);

  // Aggregated KPIs
  const totalAnalyzed = analyses.length;
  const totalSubmissions = submissions.length;

  const totalMatched = analyses.reduce(
    (acc, a) => acc + a.findings.filter((f) => f.status === "MATCHED").length,
    0,
  );
  const totalPendingReviews = submissions.filter(
    (s) => s.status === "Review Required" || s.status === "Submitted",
  ).length;

  // Filtered recent activity
  const filteredSubmissions = submissions.filter((sub) => {
    const tender = tenders.find((t) => t.id === sub.tenderId);
    const matchesTender = selectedTender === "ALL" || sub.tenderId === selectedTender;
    const matchesStatus = selectedStatus === "ALL" || sub.status === selectedStatus;
    const matchesSearch =
      sub.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tender?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tender?.reference || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTender && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Procurement Overview"
        subtitle="Review vendor submissions, monitor clause compliance findings, and issue audit reports."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/official/tenders">
                <FolderKanban className="mr-1.5 h-4 w-4" /> Manage Tenders
              </Link>
            </Button>
            <Button asChild>
              <Link to="/official/new-analysis">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Create New Analysis
              </Link>
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tenders Analyzed"
          value={loading ? "…" : totalAnalyzed}
          icon={<FileCheck2 />}
          tone="neutral"
        />
        <StatCard
          label="Vendor Submissions Received"
          value={loading ? "…" : totalSubmissions}
          icon={<Users />}
          tone="neutral"
        />
        <StatCard
          label="Requirements Matched"
          value={loading ? "…" : totalMatched}
          icon={<CheckCircle2 />}
          tone="success"
        />
        <StatCard
          label="Reviews Pending"
          value={loading ? "…" : totalPendingReviews}
          icon={<AlertTriangle />}
          tone="warning"
        />
      </div>

      {/* Recent Activity Table with Filters */}
      <div className="surface p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Vendor Submission Activity</h2>
            <p className="text-xs text-muted-foreground">
              Monitor incoming vendor responses and compliance evaluation outcomes
            </p>
          </div>
          <Link
            to="/official/submissions"
            className="text-xs font-medium text-secondary hover:underline"
          >
            View all submissions ({submissions.length})
          </Link>
        </div>

        {/* Filters bar */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vendor, title, or ref..."
              className="pl-9"
            />
          </div>

          <div>
            <select
              value={selectedTender}
              onChange={(e) => setSelectedTender(e.target.value)}
              className="w-full h-10 rounded-xl border bg-card px-3 text-sm focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Tenders</option>
              {tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.reference} — {t.title.slice(0, 32)}…
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 rounded-xl border bg-card px-3 text-sm focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted (Pending Review)</option>
              <option value="Review Required">Review Required</option>
              <option value="Analysis Completed">Analysis Completed</option>
              <option value="Analysis in Progress">Analysis in Progress</option>
            </select>
          </div>
        </div>

        {/* Activity Table */}
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tender Reference</th>
                <th className="px-4 py-3 font-medium">Tender Title</th>
                <th className="px-4 py-3 font-medium">Vendor Name</th>
                <th className="px-4 py-3 font-medium">Submission Date</th>
                <th className="px-4 py-3 font-medium">Analysis Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubmissions.map((sub) => {
                const tender = tenders.find((t) => t.id === sub.tenderId);
                const hasAnalysis = !!sub.analysisId;

                return (
                  <tr key={sub.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-secondary">
                      {tender?.reference || "REF/DEMO"}
                    </td>

                    <td className="px-4 py-3.5 font-medium max-w-xs truncate text-foreground">
                      {tender?.title || sub.tenderId}
                    </td>

                    <td className="px-4 py-3.5 text-xs font-medium text-foreground">
                      {sub.vendorName}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusPill
                        tone={
                          sub.status === "Analysis Completed"
                            ? "success"
                            : sub.status === "Review Required"
                              ? "warning"
                              : sub.status === "Analysis in Progress"
                                ? "info"
                                : "neutral"
                        }
                      >
                        {sub.status}
                      </StatusPill>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {hasAnalysis ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/official/analysis/$id" params={{ id: sub.analysisId! }}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> View Analysis
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <Link to="/official/new-analysis">
                            Run Review <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredSubmissions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No submissions match your active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
