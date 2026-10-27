import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  FileText,
  Search,
  ChevronRight,
  Clock,
  ArrowRight,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusPill } from "@/components/tl/primitives";
import { listMySubmissions, listTenders } from "@/lib/api";
import type { Submission, SubmissionStatus, Tender } from "@/lib/types";

export const Route = createFileRoute("/vendor/submissions")({
  component: VendorSubmissions,
});

const STATUS_FILTERS: (SubmissionStatus | "ALL")[] = [
  "ALL",
  "Submitted",
  "Analysis in Progress",
  "Review Required",
  "Analysis Completed",
];

function VendorSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [filter, setFilter] = useState<SubmissionStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listMySubmissions(), listTenders()]).then(([subs, tens]) => {
      setSubmissions(subs);
      setTenders(tens);
      setLoading(false);
    });
  }, []);

  const filtered = submissions.filter((sub) => {
    const tender = tenders.find((t) => t.id === sub.tenderId);
    const matchesQuery =
      (tender?.title || "").toLowerCase().includes(query.toLowerCase()) ||
      (tender?.reference || "").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = filter === "ALL" || sub.status === filter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Submissions"
        subtitle="Track submitted tender bids, review AI-assisted compliance findings, and download audit reports."
        actions={
          <Button asChild>
            <Link to="/vendor/tenders">
              Submit New Bid <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-accent text-foreground"
              }`}
            >
              {s === "ALL" ? "All Submissions" : s}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search submissions..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Tender Title &amp; Reference</th>
                <th className="px-4 py-3 font-medium">Submission Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Documents</th>
                <th className="px-4 py-3 font-medium">Last Analysis</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((sub) => {
                const tender = tenders.find((t) => t.id === sub.tenderId);
                const tone =
                  sub.status === "Analysis Completed"
                    ? "success"
                    : sub.status === "Review Required"
                      ? "warning"
                      : sub.status === "Analysis in Progress"
                        ? "info"
                        : "neutral";

                return (
                  <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{tender?.title || "Tender " + sub.tenderId}</p>
                      <p className="font-mono text-xs text-secondary mt-0.5">{tender?.reference || sub.id}</p>
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-4">
                      <StatusPill tone={tone}>{sub.status}</StatusPill>
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {sub.files.length} file(s)
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {sub.lastAnalysisAt
                        ? new Date(sub.lastAnalysisAt).toLocaleDateString()
                        : "Pending evaluation"}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/vendor/submissions/$id" params={{ id: sub.id }}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> View Results
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No submissions found matching your selected filters.
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
