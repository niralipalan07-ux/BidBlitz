import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Eye,
  FileCheck2,
  FileText,
  Play,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusPill } from "@/components/tl/primitives";
import { listAllSubmissions, listTenders } from "@/lib/api";
import type { Submission, SubmissionStatus, Tender } from "@/lib/types";

export const Route = createFileRoute("/official/submissions")({
  component: OfficialSubmissions,
});

function OfficialSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTender, setSelectedTender] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAllSubmissions(), listTenders()]).then(([s, t]) => {
      setSubmissions(s);
      setTenders(t);
      setLoading(false);
    });
  }, []);

  const filtered = submissions.filter((sub) => {
    const t = tenders.find((item) => item.id === sub.tenderId);
    const matchesTender = selectedTender === "ALL" || sub.tenderId === selectedTender;
    const matchesStatus = selectedStatus === "ALL" || sub.status === selectedStatus;
    const matchesQuery =
      sub.vendorName.toLowerCase().includes(query.toLowerCase()) ||
      (t?.title || "").toLowerCase().includes(query.toLowerCase()) ||
      (t?.reference || "").toLowerCase().includes(query.toLowerCase());
    return matchesTender && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Submissions"
        subtitle="Manage all submitted vendor bids across published tenders and trigger compliance evaluations."
        actions={
          <Button asChild>
            <Link to="/official/new-analysis">
              <Play className="mr-1.5 h-4 w-4" /> Start Compliance Run
            </Link>
          </Button>
        }
      />

      {/* Filter Controls */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by vendor or tender..."
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
            <option value="Submitted">Submitted (Awaiting Run)</option>
            <option value="Review Required">Review Required</option>
            <option value="Analysis Completed">Analysis Completed</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Vendor Legal Name</th>
                <th className="px-4 py-3 font-medium">Tender Reference &amp; Title</th>
                <th className="px-4 py-3 font-medium">Submitted On</th>
                <th className="px-4 py-3 font-medium">Attached PDFs</th>
                <th className="px-4 py-3 font-medium">Evaluation Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((sub) => {
                const tender = tenders.find((t) => t.id === sub.tenderId);
                const hasAnalysis = !!sub.analysisId;

                return (
                  <tr key={sub.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {sub.vendorName}
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-mono text-xs font-semibold uppercase text-secondary">
                        {tender?.reference || "REF/DEMO"}
                      </span>
                      <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                        {tender?.title || sub.tenderId}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-4 text-xs font-medium">
                      {sub.files.length} document(s)
                    </td>

                    <td className="px-4 py-4">
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
                    </td>

                    <td className="px-4 py-4 text-right">
                      {hasAnalysis ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/official/analysis/$id" params={{ id: sub.analysisId! }}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> View Analysis
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <Link to="/official/new-analysis">
                            Run Analysis <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No vendor submissions match your filter selections.
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
