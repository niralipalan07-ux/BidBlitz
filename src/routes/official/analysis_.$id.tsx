import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  HelpCircle,
  Search,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusPill, Notice } from "@/components/tl/primitives";
import { getAnalysis, getTender, updateFindingStatus } from "@/lib/api";
import { downloadCsv, downloadPdf } from "@/lib/report";
import { FINDING_TONE, STATUS_LABEL } from "@/lib/status";
import type { Analysis, FindingStatus, Tender } from "@/lib/types";

export const Route = createFileRoute("/official/analysis_/$id")({
  component: OfficialAnalysisDetails,
});

const STATUS_FILTERS: (FindingStatus | "ALL")[] = [
  "ALL",
  "MATCHED",
  "MISSING_EVIDENCE",
  "REVIEW_REQUIRED",
  "NOT_ASSESSED",
];

function OfficialAnalysisDetails() {
  const { id } = useParams({ from: "/official/analysis_/$id" });
  const [analysis, setAnalysis] = useState<Analysis | undefined>(undefined);
  const [tender, setTender] = useState<Tender | undefined>(undefined);
  const [filter, setFilter] = useState<FindingStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalysis(id).then(async (a) => {
      setAnalysis(a);
      if (a) {
        const t = await getTender(a.tenderId);
        setTender(t);
      }
      setLoading(false);
    });
  }, [id]);

  const handleStatusOverride = async (index: number, newStatus: FindingStatus) => {
    if (!analysis) return;
    const updated = await updateFindingStatus(analysis.id, index, newStatus);
    if (updated) {
      setAnalysis({ ...updated });
      toast.success(`Requirement marked as ${STATUS_LABEL[newStatus]}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="surface p-12 text-center">
        <p className="font-display text-lg font-semibold">Analysis Record Not Found</p>
        <p className="mt-1 text-sm text-muted-foreground">The requested analysis run does not exist.</p>
        <Button className="mt-4" asChild>
          <Link to="/official/dashboard">Back to Overview</Link>
        </Button>
      </div>
    );
  }

  const matched = analysis.findings.filter((f) => f.status === "MATCHED").length;
  const missing = analysis.findings.filter((f) => f.status === "MISSING_EVIDENCE").length;
  const review = analysis.findings.filter((f) => f.status === "REVIEW_REQUIRED").length;

  const filteredFindings = analysis.findings
    .map((f, originalIndex) => ({ f, originalIndex }))
    .filter(({ f }) => {
      const matchesFilter = filter === "ALL" || f.status === filter;
      const matchesQuery =
        f.requirement.toLowerCase().includes(query.toLowerCase()) ||
        f.explanation.toLowerCase().includes(query.toLowerCase()) ||
        f.evidence.toLowerCase().includes(query.toLowerCase()) ||
        (f.sourceDocument || "").toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/official/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Procurement Overview
        </Link>

        {/* Top Header */}
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase text-secondary">
                {tender?.reference || "TENDER/REF"}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                Evaluated Vendor: <b className="text-foreground">{analysis.vendorName}</b>
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              {tender?.title || "Tender Compliance Evaluation"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Analysis Date: {new Date(analysis.createdAt).toLocaleString()} • Audit Record ID: {analysis.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => downloadPdf(analysis, tender)}>
              <Download className="mr-1.5 h-4 w-4" /> Download PDF Report
            </Button>
            <Button variant="outline" onClick={() => downloadCsv(analysis, tender)}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="surface p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Requirements Checked</p>
          <p className="mt-1 font-display text-2xl font-semibold">{analysis.findings.length}</p>
        </div>
        <div className="surface p-4 border-l-4 border-l-primary">
          <p className="text-xs font-medium uppercase text-primary">Evidence Found</p>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">{matched}</p>
        </div>
        <div className="surface p-4 border-l-4 border-l-danger">
          <p className="text-xs font-medium uppercase text-danger">Missing Evidence</p>
          <p className="mt-1 font-display text-2xl font-semibold text-danger">{missing}</p>
        </div>
        <div className="surface p-4 border-l-4 border-l-butter">
          <p className="text-xs font-medium uppercase text-butter-foreground">Requires Manual Review</p>
          <p className="mt-1 font-display text-2xl font-semibold text-butter-foreground">{review}</p>
        </div>
      </div>

      {/* Prominent Official Disclaimer Notice */}
      <div className="rounded-2xl border border-secondary/20 bg-primary-soft p-4 text-sm text-foreground space-y-1">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <ShieldCheck className="h-4 w-4" /> AI-Assisted Findings
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Final compliance decisions require review by an authorized official. Evidence matching does not verify document
          authenticity. A missing document citation does not automatically disqualify a vendor without official determination.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
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
              {s === "ALL" ? "All Requirements" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clauses or findings..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Compliance Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Requirement</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Evidence Found</th>
                <th className="px-4 py-3 font-medium">Source Document</th>
                <th className="px-4 py-3 font-medium">Page Reference</th>
                <th className="px-4 py-3 font-medium">Explanation</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredFindings.map(({ f, originalIndex }) => (
                <tr key={originalIndex} className="hover:bg-muted/30 align-top">
                  <td className="px-4 py-3.5 font-medium text-foreground max-w-[180px]">
                    {f.requirement}
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusPill tone={FINDING_TONE[f.status]}>{STATUS_LABEL[f.status]}</StatusPill>
                  </td>

                  <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[180px]">
                    {f.evidence}
                  </td>

                  <td className="px-4 py-3.5 text-xs font-mono text-secondary">
                    {f.sourceDocument || "—"}
                  </td>

                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {f.page ? `Page ${f.page}` : "—"}
                  </td>

                  <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
                    {f.explanation}
                  </td>

                  <td className="px-4 py-3.5 text-xs text-foreground max-w-[190px] leading-relaxed">
                    {f.action}
                  </td>
                </tr>
              ))}

              {filteredFindings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No compliance findings match your active filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Requirement Sections with Official Override Controls */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Detailed Clause Findings &amp; Official Overrides</h2>
        <p className="text-xs text-muted-foreground">
          Expand any requirement below to inspect original text, extracted evidence citations, and adjust official determination.
        </p>

        {filteredFindings.map(({ f, originalIndex }) => {
          const isOpen = openIndex === originalIndex;
          return (
            <div key={originalIndex} className="surface overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : originalIndex)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill tone={FINDING_TONE[f.status]}>{STATUS_LABEL[f.status]}</StatusPill>
                  <span className="font-semibold text-sm">{f.requirement}</span>
                  <span className="text-xs text-muted-foreground">
                    {f.sourceDocument ? `· ${f.sourceDocument}` : "· No file cited"}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="border-t bg-muted/20 p-5 space-y-4 text-xs">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Original Tender Requirement
                      </span>
                      <p className="mt-1 font-medium text-foreground">{f.original}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Extracted Document Evidence
                      </span>
                      <p className="mt-1 font-mono bg-card p-2 rounded-lg border text-foreground">
                        {f.extracted || f.evidence}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Source Document &amp; Reference
                      </span>
                      <p className="mt-1 text-foreground">
                        {f.sourceDocument ? `${f.sourceDocument} (Page ${f.page || 1})` : "No document located"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Analysis Reason
                      </span>
                      <p className="mt-1 text-foreground">{f.explanation}</p>
                    </div>
                  </div>

                  {/* Official Action & Status Override Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-3 bg-card p-3 rounded-xl border">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Recommended Official Action
                      </span>
                      <p className="text-foreground font-medium mt-0.5">{f.action}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Official Override:</span>
                      <select
                        value={f.status}
                        onChange={(e) => handleStatusOverride(originalIndex, e.target.value as FindingStatus)}
                        className="h-8 rounded-lg border bg-card px-2 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                      >
                        <option value="MATCHED">Mark MATCHED</option>
                        <option value="REVIEW_REQUIRED">Mark REVIEW REQUIRED</option>
                        <option value="MISSING_EVIDENCE">Mark MISSING EVIDENCE</option>
                        <option value="NOT_ASSESSED">Mark NOT ASSESSED</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
