import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  FileCheck,
  FileText,
  Upload,
  UploadCloud,
  X,
  AlertCircle,
  FolderPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FileDropzone, type QueuedFile } from "@/components/tl/file-dropzone";
import { PageHeader, Notice } from "@/components/tl/primitives";
import { createSubmission, getTender, getVendorDocuments } from "@/lib/api";
import { DOCUMENT_CATEGORIES, type SubmittedFile, type Tender, type VendorDocument } from "@/lib/types";

export const Route = createFileRoute("/vendor/submit_/$id")({
  component: VendorSubmit,
});

function VendorSubmit() {
  const { id } = useParams({ from: "/vendor/submit_/$id" });
  const navigate = useNavigate();

  const [tender, setTender] = useState<Tender | undefined>(undefined);
  const [vaultDocs, setVaultDocs] = useState<VendorDocument[]>([]);
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    getTender(id).then(setTender);
    getVendorDocuments().then(setVaultDocs);
  }, [id]);

  const handleAddFromVault = (doc: VendorDocument) => {
    // Avoid duplicates
    if (files.some((f) => f.file.name === doc.name)) {
      toast.info(`${doc.name} is already attached.`);
      return;
    }
    // Create a simulated File object
    const blob = new Blob(["Simulated PDF file content for " + doc.name], {
      type: "application/pdf",
    });
    const simulatedFile = new File([blob], doc.name, { type: "application/pdf" });

    setFiles((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        file: simulatedFile,
        category: doc.category,
        progress: 100,
      },
    ]);
    toast.success(`Attached ${doc.name} from vault.`);
  };

  const handleSubmit = async () => {
    if (!tender) return;
    if (files.length === 0) {
      toast.error("Please attach at least one supporting PDF document.");
      return;
    }
    if (!declaration) {
      toast.error("Please certify the accuracy declaration before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const submittedFiles: SubmittedFile[] = files.map((f) => ({
        name: f.file.name,
        size: f.file.size,
        category: f.category,
      }));

      const sub = await createSubmission(tender.id, submittedFiles);
      toast.success("Tender bid submitted successfully!");
      navigate({ to: "/vendor/submissions/$id", params: { id: sub.id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!tender) {
    return (
      <div className="surface p-12 text-center">
        <p className="font-display text-lg font-semibold">Tender Not Found</p>
        <Button className="mt-4" asChild>
          <Link to="/vendor/tenders">Back to Available Tenders</Link>
        </Button>
      </div>
    );
  }

  // Calculate requirement coverage
  const attachedCategories = new Set(files.map((f) => f.category));
  const missingCategories = tender.requiredDocuments.filter((c) => !attachedCategories.has(c));

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/vendor/tenders/$id"
          params={{ id: tender.id }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Tender Details
        </Link>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Submit Tender Response</h1>
            <p className="text-sm text-muted-foreground">
              {tender.title} ({tender.reference})
            </p>
          </div>
          {/* Stepper Tabs */}
          <div className="flex gap-2 rounded-xl border bg-card p-1">
            <button
              onClick={() => setStep(1)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                step === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              1. Upload Documents ({files.length})
            </button>
            <button
              onClick={() => setStep(2)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                step === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              2. Review &amp; Confirm
            </button>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          {/* Required Documents Checklist Card */}
          <div className="surface p-5">
            <div className="flex items-center justify-between pb-3">
              <h2 className="font-display text-base font-semibold">Mandatory Tender Documents Checklist</h2>
              <span className="text-xs text-muted-foreground">
                {attachedCategories.size} of {tender.requiredDocuments.length} covered
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {tender.requiredDocuments.map((doc) => {
                const covered = attachedCategories.has(doc);
                return (
                  <div
                    key={doc}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium ${
                      covered
                        ? "border-primary/20 bg-primary-soft text-primary"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${covered ? "text-primary" : "text-muted-foreground/40"}`} />
                    <span className="truncate">{doc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Attach from Vault */}
          {vaultDocs.length > 0 && (
            <div className="surface p-5">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="font-display text-sm font-semibold">Quick-Attach from Company Vault</h3>
                  <p className="text-xs text-muted-foreground">Select pre-verified certificates to add instantly</p>
                </div>
                <Link to="/vendor/documents" className="text-xs font-medium text-secondary hover:underline">
                  Manage Vault
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {vaultDocs.map((doc) => {
                  const isAttached = files.some((f) => f.file.name === doc.name);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => handleAddFromVault(doc)}
                      disabled={isAttached}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
                        isAttached
                          ? "border-primary/30 bg-primary-soft text-primary opacity-60 cursor-default"
                          : "border-border bg-card hover:border-secondary hover:bg-accent"
                      }`}
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span>{doc.name}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {doc.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div className="surface p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Upload Response Files</h2>
              <p className="text-xs text-muted-foreground">
                Drag and drop PDF files and categorize them to match tender requirements.
              </p>
            </div>

            <FileDropzone files={files} onChange={setFiles} multiple={true} withCategory={true} />

            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                onClick={() => {
                  if (files.length === 0) {
                    toast.error("Please add at least one document before continuing.");
                    return;
                  }
                  setStep(2);
                }}
              >
                Proceed to Review ({files.length} attached)
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Step 2: Review & Submit */
        <div className="surface p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Final Review Before Submission</h2>
            <p className="text-xs text-muted-foreground">
              Verify your uploaded documents and requirement coverage before submitting to the procurement department.
            </p>
          </div>

          {/* Missing warnings if any */}
          {missingCategories.length > 0 && (
            <div className="rounded-2xl border border-butter bg-pale p-4 text-sm text-butter-foreground">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-butter-foreground" />
                <div>
                  <p className="font-semibold">Notice: Some required documents appear unattached</p>
                  <p className="mt-0.5 text-xs">
                    You have not tagged documents for: <b>{missingCategories.join(", ")}</b>. You may still submit,
                    but this will be flagged as missing evidence during compliance review.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attached Files Summary Table */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">Document Name</th>
                  <th className="px-4 py-2.5 text-left">Category Tag</th>
                  <th className="px-4 py-2.5 text-left">File Size</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {files.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {f.file.name}
                    </td>
                    <td className="px-4 py-3 text-secondary font-medium">{f.category}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {(f.file.size / 1024).toFixed(0)} KB
                    </td>
                    <td className="px-4 py-3 text-xs text-primary font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ready for Analysis
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Declaration Checkbox */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={declaration}
                onCheckedChange={(checked) => setDeclaration(!!checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-foreground leading-relaxed">
                I hereby certify that all documents submitted are true copies and comply with the specifications
                outlined in tender <b>{tender.reference}</b>. I understand that TenderLens performs AI-assisted
                compliance matching for review by the authorized procurement committee.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back to Edit Files
            </Button>
            <Button size="lg" onClick={handleSubmit} disabled={submitting || !declaration}>
              {submitting ? "Submitting Bid…" : "Submit Tender Bid"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
