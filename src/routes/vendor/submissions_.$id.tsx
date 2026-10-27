import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  FolderArchive,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill, Notice } from "@/components/tl/primitives";
import { getAnalysis, getSubmission, getTender } from "@/lib/api";
import { downloadCsv, downloadPdf } from "@/lib/report";
import { FINDING_TONE, STATUS_LABEL } from "@/lib/status";
import type { Analysis, Submission, Tender } from "@/lib/types";

export const Route = createFileRoute("/vendor/submissions_/$id")({
  component: VendorSubmissionDetails,
});

function VendorSubmissionDetails() {
  const { id } = useParams({ from: "/vendor/submissions_/$id" });
  const [submission, setSubmission] = useState<Submission | undefined>(undefined);
  const [tender, setTender] = useState<Tender | undefined>(undefined);
  const [analysis, setAnalysis] = useState<Analysis | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    getSubmission(id).then(async (sub) => {
      setSubmission(sub);
      if (sub) {
        const t = await getTender(sub.tenderId);
        setTender(t);
        if (sub.analysisId) {
          const a = await getAnalysis(sub.analysisId);
          setAnalysis(a);
        }
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="surface p-12 text-center">
        <p className="font-display text-lg font-semibold">Submission Not Found</p>
        <Button className="mt-4" asChild>
          <Link to="/vendor/submissions">Back to My Submissions</Link>
        </Button>
      </div>
    );
  }

  const matched = analysis?.findings.filter((f) => f.status === "MATCHED").length || 0;
  const missing = analysis?.findings.filter((f) => f.status === "MISSING_EVIDENCE").length || 0;
  const review = analysis?.findings.filter((f) => f.status === "REVIEW_REQUIRED").length || 0;

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/vendor/submissions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Submissions
        </Link>

        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase text-secondary">
                {tender?.reference || "Tender Reference"}
              </span>
              <StatusPill
                tone={
                  submission.status === "Analysis Completed"
                    ? "success"
                    : submission.status === "Review Required"
                      ? "warning"
                      : "info"
                }
              >
                {submission.status}
              </StatusPill>
            </div>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              {tender?.title || "Tender Response Submission"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted on {new Date(submission.submittedAt).toLocaleString()} • {submission.files.length} attached document(s)
            </p>
          </div>

          {analysis && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadPdf(analysis, tender)}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF Report
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadCsv(analysis, tender)}>
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Overview KPI Cards (if analyzed) */}
      {analysis ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="surface p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">Requirements Assessed</p>
            <p className="mt-1 font-display text-2xl font-semibold">{analysis.findings.length}</p>
          </div>
          <div className="surface p-4 border-l-4 border-l-primary">
            <p className="text-xs font-medium uppercase text-muted-foreground">Evidence Matched</p>
            <p className="mt-1 font-display text-2xl font-semibold text-primary">{matched}</p>
          </div>
          <div className="surface p-4 border-l-4 border-l-danger">
            <p className="text-xs font-medium uppercase text-muted-foreground">Missing Documents</p>
            <p className="mt-1 font-display text-2xl font-semibold text-danger">{missing}</p>
          </div>
          <div className="surface p-4 border-l-4 border-l-butter">
            <p className="text-xs font-medium uppercase text-muted-foreground">Items Requiring Review</p>
            <p className="mt-1 font-display text-2xl font-semibold text-butter-foreground">{review}</p>
          </div>
        </div>
      ) : (
        <Notice tone="info">
          <b>Analysis In Progress:</b> Your tender documents have been received by the procurement system. The
          compliance evaluation findings will appear here once the official review is executed.
        </Notice>
      )}

      {/* Missing Evidence Warning Alert */}
      {missing > 0 && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Action Required: Missing Documents Identified
          </div>
          <p className="text-xs leading-relaxed">
            The automated screening did not locate evidence for {missing} requirement(s). Review the detailed findings
            below to prepare supporting documents or clarification notes for the procurement official.
          </p>
        </div>
      )}

      {/* Requirement-by-Requirement Table */}
      {analysis && (
        <div className="surface p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Compliance Findings &amp; Evidence Matching</h2>
            <p className="text-xs text-muted-foreground">
              Review each tender clause, cited source document, and recommended follow-up action.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Requirement</th>
                  <th className="px-4 py-3 text-left">Finding Status</th>
                  <th className="px-4 py-3 text-left">Evidence Located</th>
                  <th className="px-4 py-3 text-left">Source Document</th>
                  <th className="px-4 py-3 text-left">Suggested Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analysis.findings.map((f, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{f.requirement}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={FINDING_TONE[f.status]}>{STATUS_LABEL[f.status]}</StatusPill>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{f.evidence}</td>
                    <td className="px-4 py-3 text-xs">
                      {f.sourceDocument ? (
                        <span className="font-mono text-secondary">
                          {f.sourceDocument} {f.page ? `(p. ${f.page})` : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{f.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expandable Breakdown for Vendor Clarity */}
          <div className="space-y-2 pt-4">
            <h3 className="text-sm font-semibold">Detailed Explanations &amp; Excerpts</h3>
            {analysis.findings.map((f, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2">
                    <StatusPill tone={FINDING_TONE[f.status]}>{STATUS_LABEL[f.status]}</StatusPill>
                    <b>{f.requirement}</b>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openIndex === i && (
                  <div className="border-t bg-muted/20 p-4 text-xs space-y-2">
                    <p>
                      <b className="text-muted-foreground">Original Requirement:</b> {f.original}
                    </p>
                    {f.extracted && (
                      <p>
                        <b className="text-muted-foreground">Extracted Passage:</b>{" "}
                        <span className="font-mono bg-card p-1 rounded border">{f.extracted}</span>
                      </p>
                    )}
                    <p>
                      <b className="text-muted-foreground">System Reason:</b> {f.explanation}
                    </p>
                    <p>
                      <b className="text-primary font-semibold">Recommended Follow-up:</b> {f.action}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Files Archive */}
      <div className="surface p-6 space-y-4">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <FolderArchive className="h-4 w-4 text-secondary" /> Submitted Response Documents
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {submission.files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-xl border bg-card p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="truncate">
                  <p className="truncate text-xs font-medium">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{file.category}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
