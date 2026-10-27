import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  Play,
  Upload,
  UploadCloud,
  X,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone, type QueuedFile } from "@/components/tl/file-dropzone";
import { PageHeader, Notice } from "@/components/tl/primitives";
import { listAllSubmissions, listTenders, runAnalysis } from "@/lib/api";
import { DOCUMENT_CATEGORIES, type Submission, type SubmittedFile, type Tender } from "@/lib/types";

export const Route = createFileRoute("/official/new-analysis")({
  component: OfficialNewAnalysis,
});

const STEPS = [
  "1. Tender Information",
  "2. Upload Tender PDF",
  "3. Vendor Documents",
  "4. Run Analysis",
];

function OfficialNewAnalysis() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Available database objects
  const [existingTenders, setExistingTenders] = useState<Tender[]>([]);
  const [existingSubmissions, setExistingSubmissions] = useState<Submission[]>([]);

  // Step 1: Tender Information
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [tenderInfo, setTenderInfo] = useState({
    title: "",
    reference: "",
    department: "",
    deadline: "2026-12-15T17:00",
    description: "",
    requiredDocs: ["GST Certificate", "PAN Document", "OEM Authorization", "Technical Specifications"],
  });

  // Step 2: Tender Document
  const [tenderFiles, setTenderFiles] = useState<QueuedFile[]>([]);

  // Step 3: Vendor Selection & Documents
  const [vendorMode, setVendorMode] = useState<"select_submission" | "upload_bundle">("select_submission");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [manualVendorName, setManualVendorName] = useState("");
  const [vendorFiles, setVendorFiles] = useState<QueuedFile[]>([]);

  // Step 4: Analysis execution & Stepped Progress
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStepText, setAnalysisStepText] = useState("");
  const [analysisStepIdx, setAnalysisStepIdx] = useState(0);

  useEffect(() => {
    Promise.all([listTenders(), listAllSubmissions()]).then(([t, s]) => {
      setExistingTenders(t);
      setExistingSubmissions(s);
      if (t.length > 0) {
        handlePickTender(t[0].id, t);
      }
    });
  }, []);

  const handlePickTender = (id: string, tendersList = existingTenders) => {
    setSelectedTenderId(id);
    const found = tendersList.find((t) => t.id === id);
    if (found) {
      setTenderInfo({
        title: found.title,
        reference: found.reference,
        department: found.department,
        deadline: found.deadline.slice(0, 16),
        description: found.description,
        requiredDocs: found.requiredDocuments,
      });
      // Pre-select related submissions if any
      const relatedSubs = existingSubmissions.filter((s) => s.tenderId === id);
      if (relatedSubs.length > 0) {
        setSelectedSubmissionId(relatedSubs[0].id);
      }
    }
  };

  const handleRunAnalysis = async () => {
    let vendorName = "";
    let filesToAssess: SubmittedFile[] = [];
    let submissionId: string | undefined = undefined;

    if (vendorMode === "select_submission") {
      const sub = existingSubmissions.find((s) => s.id === selectedSubmissionId);
      if (!sub) {
        toast.error("Please select a vendor submission to analyze.");
        return;
      }
      vendorName = sub.vendorName;
      filesToAssess = sub.files;
      submissionId = sub.id;
    } else {
      if (!manualVendorName.trim()) {
        toast.error("Please specify the vendor's company name.");
        return;
      }
      if (vendorFiles.length === 0) {
        toast.error("Please upload at least one vendor PDF document.");
        return;
      }
      vendorName = manualVendorName.trim();
      filesToAssess = vendorFiles.map((f) => ({
        name: f.file.name,
        size: f.file.size,
        category: f.category,
      }));
    }

    // Stepped honest progress
    setAnalyzing(true);
    const steps = [
      "Uploading and verifying document bundles…",
      "Extracting text from tender and vendor PDF pages…",
      "Identifying tender statutory & technical requirements…",
      "Matching evidence citations across document pages…",
      "Preparing comprehensive compliance audit report…",
    ];

    for (let i = 0; i < steps.length; i++) {
      setAnalysisStepIdx(i + 1);
      setAnalysisStepText(steps[i]);
      await new Promise((r) => setTimeout(r, 650));
    }

    try {
      const targetTender: Tender = {
        id: selectedTenderId || "custom-tender",
        title: tenderInfo.title,
        reference: tenderInfo.reference,
        department: tenderInfo.department,
        deadline: tenderInfo.deadline,
        description: tenderInfo.description,
        eligibility: ["Registered entity", "Turnover requirement", "Past experience"],
        requiredDocuments: tenderInfo.requiredDocs,
        technical: ["Compliance with tender specifications"],
      };

      const result = await runAnalysis({
        tender: targetTender,
        submissionId,
        vendorName,
        files: filesToAssess,
      });

      toast.success("Compliance analysis completed!");
      navigate({ to: "/official/analysis/$id", params: { id: result.id } });
    } catch (err) {
      toast.error((err as Error).message);
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Create New Tender Compliance Analysis"
        subtitle="Guided multi-step evaluation: match vendor submissions against tender requirements."
      />

      {/* Stepper Navigation */}
      <div className="surface p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        {STEPS.map((s, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isPassed = currentStep > stepNum;

          return (
            <button
              key={s}
              onClick={() => {
                if (stepNum <= currentStep || stepNum === currentStep + 1) {
                  setCurrentStep(stepNum);
                }
              }}
              disabled={analyzing}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isPassed
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-primary-foreground text-primary"
                    : isPassed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isPassed ? "✓" : stepNum}
              </span>
              <span className="truncate">{s}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: Tender Information */}
      {currentStep === 1 && (
        <div className="surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Step 1 — Tender Information</h2>
              <p className="text-xs text-muted-foreground">Select an existing tender or enter tender specifications</p>
            </div>
            {existingTenders.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Quick-fill from:</span>
                <select
                  value={selectedTenderId}
                  onChange={(e) => handlePickTender(e.target.value)}
                  className="h-9 rounded-lg border bg-card px-2.5 text-xs focus:ring-1 focus:ring-primary"
                >
                  {existingTenders.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.reference} — {t.title.slice(0, 30)}…
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s1-title">Tender Title</Label>
              <Input
                id="s1-title"
                value={tenderInfo.title}
                onChange={(e) => setTenderInfo({ ...tenderInfo, title: e.target.value })}
                placeholder="e.g. Supply of Desktop Computers for District Offices"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s1-ref">Tender Reference Number</Label>
              <Input
                id="s1-ref"
                value={tenderInfo.reference}
                onChange={(e) => setTenderInfo({ ...tenderInfo, reference: e.target.value })}
                placeholder="e.g. DEMO/IT/2026/014"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s1-dept">Procuring Department</Label>
              <Input
                id="s1-dept"
                value={tenderInfo.department}
                onChange={(e) => setTenderInfo({ ...tenderInfo, department: e.target.value })}
                placeholder="e.g. Department of Information Technology"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s1-deadline">Submission Deadline</Label>
              <Input
                id="s1-deadline"
                type="datetime-local"
                value={tenderInfo.deadline}
                onChange={(e) => setTenderInfo({ ...tenderInfo, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s1-desc">Tender Description</Label>
              <Textarea
                id="s1-desc"
                rows={3}
                value={tenderInfo.description}
                onChange={(e) => setTenderInfo({ ...tenderInfo, description: e.target.value })}
                placeholder="Brief summary of required services, works, or items..."
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Statutory Requirements to Verify</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl border p-3 bg-muted/20">
                {DOCUMENT_CATEGORIES.map((cat) => {
                  const checked = tenderInfo.requiredDocs.includes(cat);
                  return (
                    <label key={cat} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTenderInfo({
                              ...tenderInfo,
                              requiredDocs: [...tenderInfo.requiredDocs, cat],
                            });
                          } else {
                            setTenderInfo({
                              ...tenderInfo,
                              requiredDocs: tenderInfo.requiredDocs.filter((c) => c !== cat),
                            });
                          }
                        }}
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => {
                if (!tenderInfo.title.trim() || !tenderInfo.reference.trim()) {
                  toast.error("Please fill in the tender title and reference number.");
                  return;
                }
                setCurrentStep(2);
              }}
            >
              Continue to Tender PDF <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Upload Tender PDF */}
      {currentStep === 2 && (
        <div className="surface p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="font-display text-lg font-semibold">Step 2 — Upload Tender PDF</h2>
            <p className="text-xs text-muted-foreground">
              Attach the official tender document (NIT / RFP) for requirement extraction.
            </p>
          </div>

          <Notice tone="info">
            <b>File Requirements:</b> Tender documents must be PDF format (up to 10 MB). The compliance engine extracts
            clauses, clauses tables, and evaluation rules.
          </Notice>

          <FileDropzone
            files={tenderFiles}
            onChange={setTenderFiles}
            multiple={false}
            withCategory={false}
          />

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(3)}>
              Continue to Vendor Documents <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Vendor Documents */}
      {currentStep === 3 && (
        <div className="surface p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="font-display text-lg font-semibold">Step 3 — Vendor Submission Documents</h2>
            <p className="text-xs text-muted-foreground">
              Select an existing vendor bid or upload a bundle of submitted certificates and datasheets.
            </p>
          </div>

          <div className="flex gap-2 rounded-xl border bg-card p-1">
            <button
              onClick={() => setVendorMode("select_submission")}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                vendorMode === "select_submission"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Select Existing Vendor Bid ({existingSubmissions.length} Available)
            </button>
            <button
              onClick={() => setVendorMode("upload_bundle")}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                vendorMode === "upload_bundle"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Upload New Vendor PDF Bundle
            </button>
          </div>

          {vendorMode === "select_submission" ? (
            <div className="space-y-4">
              <Label>Select Vendor Submission</Label>
              <div className="divide-y rounded-xl border">
                {existingSubmissions.map((sub) => {
                  const isSelected = selectedSubmissionId === sub.id;
                  const t = existingTenders.find((item) => item.id === sub.tenderId);
                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                        isSelected ? "bg-primary-soft/60" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="sub-select"
                          checked={isSelected}
                          onChange={() => setSelectedSubmissionId(sub.id)}
                          className="h-4 w-4 text-primary"
                        />
                        <div>
                          <p className="font-semibold text-sm">{sub.vendorName}</p>
                          <p className="text-xs text-muted-foreground">
                            Tender: {t?.title || sub.tenderId} • Submitted:{" "}
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                          {sub.files.length} PDF file(s)
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="m-vendor">Vendor Legal / Company Name</Label>
                <Input
                  id="m-vendor"
                  placeholder="e.g. Apex Industrial Solutions Pvt. Ltd."
                  value={manualVendorName}
                  onChange={(e) => setManualVendorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Vendor Supporting Documents (PDFs)</Label>
                <FileDropzone files={vendorFiles} onChange={setVendorFiles} multiple={true} withCategory={true} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(4)}>
              Review &amp; Run Analysis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Run Analysis */}
      {currentStep === 4 && (
        <div className="surface p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="font-display text-lg font-semibold">Step 4 — Review &amp; Run Compliance Analysis</h2>
            <p className="text-xs text-muted-foreground">
              Confirm selected parameters before executing the AI-assisted requirement matching engine.
            </p>
          </div>

          {/* Configuration Summary Card */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <span className="font-mono text-xs uppercase text-secondary font-semibold">
                Tender Scope
              </span>
              <p className="font-semibold text-base">{tenderInfo.title}</p>
              <p className="text-xs text-muted-foreground">Ref: {tenderInfo.reference}</p>
              <p className="text-xs text-muted-foreground">Department: {tenderInfo.department}</p>
              <p className="text-xs text-muted-foreground">
                Tender PDF: {tenderFiles[0]?.file.name || "Default tender template"}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-2">
              <span className="font-mono text-xs uppercase text-secondary font-semibold">
                Vendor Under Review
              </span>
              <p className="font-semibold text-base">
                {vendorMode === "select_submission"
                  ? existingSubmissions.find((s) => s.id === selectedSubmissionId)?.vendorName || "Selected Vendor"
                  : manualVendorName || "Uploaded Vendor Bundle"}
              </p>
              <p className="text-xs text-muted-foreground">
                Documents:{" "}
                {vendorMode === "select_submission"
                  ? `${existingSubmissions.find((s) => s.id === selectedSubmissionId)?.files.length || 0} files attached`
                  : `${vendorFiles.length} uploaded files`}
              </p>
              <p className="text-xs text-muted-foreground">
                Requirements to match: {tenderInfo.requiredDocs.length} clauses
              </p>
            </div>
          </div>

          <Notice tone="info">
            <b>Assistance Disclaimer:</b> TenderLens will parse submitted documents and highlight evidence passages.
            Final compliance determinations must be validated by an authorized procurement official.
          </Notice>

          {/* Stepped Honest Loading Indicator */}
          {analyzing ? (
            <div className="rounded-2xl border border-secondary/30 bg-primary-soft p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground animate-spin">
                <Loader2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-primary">Running Compliance Analysis</p>
                <p className="text-sm font-medium text-foreground mt-1">{analysisStepText}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Step {analysisStepIdx} of 5 • Cross-referencing PDF text against requirements
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back to Documents
              </Button>
              <Button size="lg" onClick={handleRunAnalysis} className="px-8">
                <Play className="mr-2 h-4 w-4" /> Run Compliance Analysis
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
