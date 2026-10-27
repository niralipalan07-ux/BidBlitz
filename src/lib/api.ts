// API service layer. When VITE_API_BASE_URL is set, calls go to the FastAPI backend
// (proposed contracts — coordinate with the Python team). Otherwise a clearly-labelled
// in-browser demo store is used so the UI can be previewed.
import { getSession } from "./auth";
import {
  mockAnalyses,
  mockSubmissions,
  mockTenders,
  mockVendorDocuments,
  mockVendorProfile,
  DEMO_VENDOR_ID,
} from "./mock-data";
import type {
  Analysis,
  Finding,
  FindingStatus,
  ReportItem,
  Submission,
  SubmittedFile,
  Tender,
  VendorDocument,
  VendorProfile,
} from "./types";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
export const IS_DEMO = !API_BASE_URL;

export const ENDPOINTS = {
  vendorTenders: "/api/vendor/tenders",
  vendorSubmissions: "/api/vendor/submissions",
  officialTenders: "/api/official/tenders",
  analyses: "/api/official/analyses",
  analysis: (id: string) => `/api/analyses/${id}`,
  report: (id: string, format: "pdf" | "csv") => `/api/analyses/${id}/report?format=${format}`,
  vendorProfile: "/api/vendor/profile",
  vendorDocuments: "/api/vendor/documents",
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE_URL + path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

// ---------- demo store ----------
const STORE_KEY = "tl_demo_store_v2";

interface Store {
  tenders: Tender[];
  submissions: Submission[];
  analyses: Analysis[];
  vendorProfile: VendorProfile;
  vendorDocuments: VendorDocument[];
}

function load(): Store {
  if (typeof window === "undefined")
    return {
      tenders: mockTenders,
      submissions: mockSubmissions,
      analyses: mockAnalyses,
      vendorProfile: mockVendorProfile,
      vendorDocuments: mockVendorDocuments,
    };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    tenders: [...mockTenders],
    submissions: [...mockSubmissions],
    analyses: [...mockAnalyses],
    vendorProfile: { ...mockVendorProfile },
    vendorDocuments: [...mockVendorDocuments],
  };
}

function save(s: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function requireRole(role: "vendor" | "official") {
  const s = getSession();
  if (!s || s.role !== role) throw new Error("Not authorized");
  return s;
}

// ---------- shared ----------
export async function listTenders(): Promise<Tender[]> {
  if (!IS_DEMO) return http(ENDPOINTS.vendorTenders);
  await delay();
  return load().tenders;
}

export async function getTender(id: string): Promise<Tender | undefined> {
  return (await listTenders()).find((t) => t.id === id);
}

// ---------- vendor ----------
export async function listMySubmissions(): Promise<Submission[]> {
  if (!IS_DEMO) return http(ENDPOINTS.vendorSubmissions);
  const s = requireRole("vendor");
  await delay();
  return load().submissions.filter((x) => x.vendorId === s.userId);
}

export async function getSubmission(id: string): Promise<Submission | undefined> {
  const store = load();
  return store.submissions.find((s) => s.id === id);
}

export async function createSubmission(tenderId: string, files: SubmittedFile[]): Promise<Submission> {
  if (!IS_DEMO)
    return http(ENDPOINTS.vendorSubmissions, { method: "POST", body: JSON.stringify({ tenderId, files }) });
  const s = requireRole("vendor");
  await delay(400);
  const store = load();
  const sub: Submission = {
    id: `s-${crypto.randomUUID().slice(0, 8)}`,
    tenderId,
    vendorId: s.userId,
    vendorName: s.company || s.name,
    submittedAt: new Date().toISOString(),
    status: "Submitted",
    files,
  };
  store.submissions.unshift(sub);
  save(store);
  return sub;
}

export async function getVendorProfile(): Promise<VendorProfile> {
  await delay();
  return load().vendorProfile;
}

export async function updateVendorProfile(profile: Partial<VendorProfile>): Promise<VendorProfile> {
  await delay(300);
  const store = load();
  store.vendorProfile = { ...store.vendorProfile, ...profile };
  save(store);
  return store.vendorProfile;
}

export async function getVendorDocuments(): Promise<VendorDocument[]> {
  await delay();
  return load().vendorDocuments;
}

export async function addVendorDocument(doc: Omit<VendorDocument, "id" | "uploadedAt">): Promise<VendorDocument> {
  await delay(300);
  const store = load();
  const newDoc: VendorDocument = {
    ...doc,
    id: `doc-${crypto.randomUUID().slice(0, 8)}`,
    uploadedAt: new Date().toISOString(),
  };
  store.vendorDocuments.unshift(newDoc);
  save(store);
  return newDoc;
}

export async function deleteVendorDocument(id: string): Promise<void> {
  await delay(200);
  const store = load();
  store.vendorDocuments = store.vendorDocuments.filter((d) => d.id !== id);
  save(store);
}

// ---------- official ----------
export async function listAllSubmissions(): Promise<Submission[]> {
  requireRole("official");
  await delay();
  return load().submissions;
}

export async function updateSubmissionStatus(id: string, status: Submission["status"]): Promise<void> {
  requireRole("official");
  const store = load();
  const sub = store.submissions.find((s) => s.id === id);
  if (sub) {
    sub.status = status;
    save(store);
  }
}

export async function listAnalyses(): Promise<Analysis[]> {
  if (!IS_DEMO) return http(ENDPOINTS.analyses);
  await delay();
  const s = getSession();
  const all = load().analyses;
  if (s?.role === "official") return all;
  const mine = new Set(load().submissions.filter((x) => x.vendorId === s?.userId).map((x) => x.id));
  return all.filter((a) => (a.submissionId && mine.has(a.submissionId)) || a.vendorName.includes(s?.company || ""));
}

export async function getAnalysis(id: string): Promise<Analysis | undefined> {
  if (!IS_DEMO) return http(ENDPOINTS.analysis(id));
  return (await listAnalyses()).find((a) => a.id === id);
}

export async function updateFindingStatus(
  analysisId: string,
  findingIndex: number,
  newStatus: FindingStatus,
): Promise<Analysis | undefined> {
  requireRole("official");
  const store = load();
  const a = store.analyses.find((item) => item.id === analysisId);
  if (a && a.findings[findingIndex]) {
    a.findings[findingIndex].status = newStatus;
    a.findings[findingIndex].action = `Manually overridden by Official to ${newStatus}.`;
    save(store);
  }
  return a;
}

export async function createTender(t: Omit<Tender, "id">): Promise<Tender> {
  requireRole("official");
  const store = load();
  const tender = { ...t, id: `t-${crypto.randomUUID().slice(0, 8)}` };
  store.tenders.unshift(tender);
  save(store);
  return tender;
}

export async function deleteTender(id: string): Promise<void> {
  requireRole("official");
  const store = load();
  store.tenders = store.tenders.filter((t) => t.id !== id);
  save(store);
}

export async function listReports(): Promise<ReportItem[]> {
  const store = load();
  const session = getSession();
  const analyses = await listAnalyses();

  return analyses.map((a) => {
    const t = store.tenders.find((item) => item.id === a.tenderId);
    const matched = a.findings.filter((f) => f.status === "MATCHED").length;
    const missing = a.findings.filter((f) => f.status === "MISSING_EVIDENCE").length;
    const review = a.findings.filter((f) => f.status === "REVIEW_REQUIRED").length;

    return {
      id: `rep-${a.id}`,
      analysisId: a.id,
      tenderId: a.tenderId,
      tenderTitle: t?.title || "Tender Document",
      tenderReference: t?.reference || "REF/PENDING",
      department: t?.department || "Procurement Cell",
      vendorName: a.vendorName,
      createdAt: a.createdAt,
      status: a.status,
      matchedCount: matched,
      missingCount: missing,
      reviewCount: review,
      totalRequirements: a.findings.length,
    };
  });
}

export async function runAnalysis(input: {
  tender: Tender;
  submissionId?: string;
  vendorName: string;
  files: SubmittedFile[];
}): Promise<Analysis> {
  requireRole("official");

  // In demo mode, produce realistic, context-specific findings based on tender requirements and attached files
  const findings: Finding[] = input.tender.requiredDocuments.map((req, idx) => {
    const f = input.files.find((x) => x.category.toLowerCase().includes(req.toLowerCase()) || x.name.toLowerCase().includes(req.toLowerCase().slice(0, 4)));

    if (req.includes("GST")) {
      return f
        ? {
            requirement: req,
            original: "Valid GST Registration Certificate with active status.",
            status: "MATCHED",
            evidence: "GSTIN extracted: 27AABCG1234D1Z5",
            extracted: "Form GST REG-06 — Registration Certificate. Legal Name: " + input.vendorName + " · Status: Active.",
            sourceDocument: f.name,
            page: 1,
            explanation: "Relevant GST details and tax jurisdiction appear in the submitted document.",
            action: "Verified in document. Note: official tax portal verification recommended.",
          }
        : {
            requirement: req,
            original: "Valid GST Registration Certificate with active status.",
            status: "MISSING_EVIDENCE",
            evidence: "No GST certificate located",
            explanation: "No GST registration document was identified in the uploaded submission bundle.",
            action: "Request statutory GST certificate from vendor prior to bid evaluation.",
          };
    }

    if (req.includes("PAN")) {
      return f
        ? {
            requirement: req,
            original: "Permanent Account Number (PAN) card of entity or proprietor.",
            status: "MATCHED",
            evidence: "Permanent Account Number found",
            extracted: "Income Tax Department — PAN: AABCG1234D · Name: " + input.vendorName,
            sourceDocument: f.name,
            page: 1,
            explanation: "Valid PAN record matching legal business entity name located.",
            action: "No further action needed.",
          }
        : {
            requirement: req,
            original: "Permanent Account Number (PAN) card of entity or proprietor.",
            status: "MISSING_EVIDENCE",
            evidence: "No PAN document located",
            explanation: "No PAN card copy was provided in the package.",
            action: "Obtain PAN card for financial verification.",
          };
    }

    if (req.includes("OEM")) {
      return f
        ? {
            requirement: req,
            original: "Direct OEM authorization letter for quoted model.",
            status: "REVIEW_REQUIRED",
            evidence: "OEM authorization letter text found",
            extracted: "Manufacturer Authorization: Authorizes " + input.vendorName + " to supply and maintain hardware under tender " + input.tender.reference,
            sourceDocument: f.name,
            page: 1,
            explanation: "OEM letter is present; manual verification of signature and validity period is required.",
            action: "Check signatory authority and validity date with OEM directly.",
          }
        : {
            requirement: req,
            original: "Direct OEM authorization letter for quoted model.",
            status: "MISSING_EVIDENCE",
            evidence: "No OEM authorization located",
            explanation: "No matching OEM authorization letter identified in the uploaded files.",
            action: "Mandatory item: Issue non-compliance notice or request letter within 48h.",
          };
    }

    if (req.includes("Technical")) {
      return f
        ? {
            requirement: req,
            original: input.tender.technical[0] || "Compliance with tender technical schedule.",
            status: "REVIEW_REQUIRED",
            evidence: "Datasheet and technical compliance sheet identified",
            extracted: "Specifications table: Processor, RAM, and storage specifications referenced on page 3.",
            sourceDocument: f.name,
            page: 3,
            explanation: "The document contains related specifications, but manual engineering verification is needed to determine whether all clauses are satisfied.",
            action: "Refer to technical evaluation committee for detailed parameter cross-matching.",
          }
        : {
            requirement: req,
            original: "Compliance with tender technical schedule.",
            status: "MISSING_EVIDENCE",
            evidence: "No technical datasheet submitted",
            explanation: "No detailed technical schedule or datasheet was found.",
            action: "Bid cannot be evaluated technically without equipment specifications.",
          };
    }

    if (req.includes("Experience")) {
      return f
        ? {
            requirement: req,
            original: "Past experience in similar supplies or service contracts.",
            status: "MATCHED",
            evidence: "Client completion certificates referenced",
            extracted: "Project Completion Certificate: Order #4471 & #5120 successfully completed.",
            sourceDocument: f.name,
            page: 2,
            explanation: "Completion certificates reference cumulative deliveries matching tender requirements.",
            action: "Spot-check order values and completion dates.",
          }
        : {
            requirement: req,
            original: "Past experience in similar supplies or service contracts.",
            status: "MISSING_EVIDENCE",
            evidence: "No experience certificates located",
            explanation: "No purchase orders or completion certificates were uploaded.",
            action: "Check if vendor qualifies under startup/MSME exemption provisions.",
          };
    }

    // Default category fallback
    return f
      ? {
          requirement: req,
          original: `Mandatory submission of ${req}.`,
          status: "REVIEW_REQUIRED",
          evidence: "File provided in category",
          sourceDocument: f.name,
          page: 1,
          explanation: `A document classified as "${req}" was uploaded. Manual inspection is required to assess completeness.`,
          action: "Review document content against section requirements.",
        }
      : {
          requirement: req,
          original: `Mandatory submission of ${req}.`,
          status: "MISSING_EVIDENCE",
          evidence: "No file provided in this category",
          explanation: `No document matching "${req}" was found in the submission package.`,
          action: "Flag as missing evidence for evaluation committee review.",
        };
  });

  const store = load();
  const analysis: Analysis = {
    id: `a-${crypto.randomUUID().slice(0, 8)}`,
    tenderId: input.tender.id,
    submissionId: input.submissionId,
    vendorName: input.vendorName,
    createdAt: new Date().toISOString(),
    status: findings.some((f) => f.status === "MISSING_EVIDENCE")
      ? "Review Required"
      : "Analysis Completed",
    findings,
  };

  store.analyses.unshift(analysis);

  if (input.submissionId) {
    const sub = store.submissions.find((x) => x.id === input.submissionId);
    if (sub) {
      sub.status = analysis.status;
      sub.analysisId = analysis.id;
      sub.lastAnalysisAt = analysis.createdAt;
    }
  }

  save(store);
  return analysis;
}

export function resetDemoData() {
  localStorage.removeItem(STORE_KEY);
}

