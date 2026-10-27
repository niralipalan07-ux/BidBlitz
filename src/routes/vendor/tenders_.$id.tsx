import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  FileCheck,
  FileText,
  Upload,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Notice } from "@/components/tl/primitives";
import { getTender } from "@/lib/api";
import type { Tender } from "@/lib/types";

export const Route = createFileRoute("/vendor/tenders_/$id")({
  component: TenderDetails,
});

function TenderDetails() {
  const { id } = useParams({ from: "/vendor/tenders_/$id" });
  const [tender, setTender] = useState<Tender | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTender(id).then((t) => {
      setTender(t);
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

  if (!tender) {
    return (
      <div className="surface p-12 text-center">
        <p className="font-display text-lg font-semibold">Tender Not Found</p>
        <p className="mt-1 text-sm text-muted-foreground">The requested tender does not exist or has been archived.</p>
        <Button className="mt-4" asChild>
          <Link to="/vendor/tenders">Back to Tenders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/vendor/tenders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Available Tenders
        </Link>

        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="font-mono text-xs font-semibold uppercase text-secondary">
              {tender.reference}
            </span>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{tender.title}</h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" /> {tender.department}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Button size="lg" asChild>
              <Link to="/vendor/submit/$id" params={{ id: tender.id }}>
                <Upload className="mr-2 h-4 w-4" /> Upload Documents &amp; Submit Bid
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tender Overview Meta */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Submission Deadline</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
            <Calendar className="h-4 w-4 text-secondary" />
            {new Date(tender.deadline).toLocaleString()}
          </p>
        </div>

        <div className="surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Evaluation Method</p>
          <p className="mt-1 text-sm font-semibold">AI-Assisted Multi-Factor Compliance</p>
        </div>

        <div className="surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Required Documents</p>
          <p className="mt-1 text-sm font-semibold">{tender.requiredDocuments.length} Statutory Categories</p>
        </div>
      </div>

      <Notice tone="info">
        <b>Important Submission Guidance:</b> Ensure all certificates are high-resolution PDFs. TenderLens scans
        document evidence and cross-matches clause criteria for procurement officer verification.
      </Notice>

      {/* Tender Description */}
      <div className="surface p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold">Tender Scope &amp; Overview</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{tender.description}</p>
      </div>

      {/* 2-Column Requirements Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Eligibility Criteria */}
        <div className="surface p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <CheckCircle className="h-5 w-5 text-primary" /> Eligibility Requirements
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Bidders must satisfy all statutory criteria</p>

          <ul className="mt-4 space-y-3">
            {tender.eligibility.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Required Documents */}
        <div className="surface p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileText className="h-5 w-5 text-secondary" /> Required Document Attachments
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">PDF uploads required during submission</p>

          <ul className="mt-4 space-y-2.5">
            {tender.requiredDocuments.map((doc, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-xl border bg-muted/30 px-3.5 py-2.5 text-sm"
              >
                <span className="font-medium">{doc}</span>
                <span className="text-[11px] font-medium text-secondary">Mandatory PDF</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Technical Requirements */}
      <div className="surface p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <FileCheck className="h-5 w-5 text-secondary" /> Technical Specifications &amp; Standards
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Detailed technical schedule parameters</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tender.technical.map((tech, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4">
              <span className="font-mono text-xs text-muted-foreground">Clause 0{idx + 1}</span>
              <p className="mt-1 text-sm font-medium">{tech}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="surface flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
        <div>
          <p className="font-semibold">Ready to submit your response?</p>
          <p className="text-xs text-muted-foreground">
            You can review your files and check coverage before final submission.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link to="/vendor/submit/$id" params={{ id: tender.id }}>
            <Upload className="mr-2 h-4 w-4" /> Start Tender Submission
          </Link>
        </Button>
      </div>
    </div>
  );
}
