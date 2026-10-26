// API service layer. When VITE_API_BASE_URL is set, calls go to the FastAPI backend
// (proposed contracts — coordinate with the Python team). Otherwise a clearly-labelled
// in-browser demo store is used so the UI can be previewed.
import { getSession } from "./auth";
import { mockAnalyses, mockSubmissions, mockTenders } from "./mock-data";
import type { Analysis, Finding, Submission, SubmittedFile, Tender } from "./types";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
export const IS_DEMO = !API_BASE_URL;

export const ENDPOINTS = {
  vendorTenders: "/api/vendor/tenders",
  vendorSubmissions: "/api/vendor/submissions",
  officialTenders: "/api/official/tenders",
  analyses: "/api/official/analyses",
  analysis: (id: string) => `/api/analyses/${id}`,
  report: (id: string, format: "pdf" | "csv") => `/api/analyses/${id}/report?format=${format}`,
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
const STORE_KEY = "tl_demo_store_v1";
interface Store {
  tenders: Tender[];
  submissions: Submission[];
  analyses: Analysis[];
}
function load(): Store {
  if (typeof window === "undefined")
    return { tenders: mockTenders, submissions: mockSubmissions, analyses: mockAnalyses };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { tenders: [...mockTenders], submissions: [...mockSubmissions], analyses: [...mockAnalyses] };
}
function save(s: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
}
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

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

export async function createSubmission(tenderId: string, files: SubmittedFile[]): Promise<Submission> {
  if (!IS_DEMO)
    return http(ENDPOINTS.vendorSubmissions, { method: "POST", body: JSON.stringify({ tenderId, files }) });
  const s = requireRole("vendor");
  await delay(500);
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

// ---------- official ----------
export async function listAllSubmissions(): Promise<Submission[]> {
  requireRole("official");
  await delay();
  return load().submissions;
}

export async function listAnalyses(): Promise<Analysis[]> {
  if (!IS_DEMO) return http(ENDPOINTS.analyses);
  await delay();
  const s = getSession();
  const all = load().analyses;
  if (s?.role === "official") return all;
  const mine = new Set(load().submissions.filter((x) => x.vendorId === s?.userId).map((x) => x.id));
  return all.filter((a) => a.submissionId && mine.has(a.submissionId));
}

export async function getAnalysis(id: string): Promise<Analysis | undefined> {
  if (!IS_DEMO) return http(ENDPOINTS.analysis(id));
  return (await listAnalyses()).find((a) => a.id === id);
}

export async function createTender(t: Omit<Tender, "id">): Promise<Tender> {
  requireRole("official");
  const store = load();
  const tender = { ...t, id: `t-${crypto.randomUUID().slice(0, 8)}` };
  store.tenders.unshift(tender);
  save(store);
  return tender;
}

export async function runAnalysis(input: {
  tender: Tender;
  submissionId?: string;
  vendorName: string;
  files: SubmittedFile[];
}): Promise<Analysis> {
  requireRole("official");
  // DEMO: no real document processing happens here. Findings only reflect whether a
  // file of the required category was supplied — every match is marked for review.
  const findings: Finding[] = input.tender.requiredDocuments.map((req) => {
    const f = input.files.find((x) => x.category === req);
    return f
      ? {
          requirement: req,
          original: `Submit ${req}.`,
          status: "REVIEW_REQUIRED",
          evidence: "File provided (content not analysed in demo)",
          sourceDocument: f.name,
          explanation: "A file in this category was supplied. Demo mode does not read document text.",
          action: "Connect the Python compliance engine for evidence extraction.",
        }
      : {
          requirement: req,
          original: `Submit ${req}.`,
          status: "MISSING_EVIDENCE",
          evidence: "No file in this category",
          explanation: "No uploaded file was categorised under this requirement.",
          action: "Request the document from the vendor or confirm it was submitted elsewhere.",
        };
  });
  const store = load();
  const analysis: Analysis = {
    id: `a-${crypto.randomUUID().slice(0, 8)}`,
    tenderId: input.tender.id,
    submissionId: input.submissionId,
    vendorName: input.vendorName,
    createdAt: new Date().toISOString(),
    status: "Review Required",
    findings,
  };
  store.analyses.unshift(analysis);
  if (input.submissionId) {
    const sub = store.submissions.find((x) => x.id === input.submissionId);
    if (sub) {
      sub.status = "Review Required";
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
