import type { FindingStatus, SubmissionStatus } from "./types";

export const STATUS_LABEL: Record<FindingStatus, string> = {
  MATCHED: "MATCHED",
  MISSING_EVIDENCE: "MISSING EVIDENCE",
  REVIEW_REQUIRED: "REVIEW REQUIRED",
  NOT_ASSESSED: "NOT ASSESSED",
};

export type Tone = "success" | "danger" | "warning" | "neutral" | "info";

export const FINDING_TONE: Record<FindingStatus, Tone> = {
  MATCHED: "success",
  MISSING_EVIDENCE: "danger",
  REVIEW_REQUIRED: "warning",
  NOT_ASSESSED: "neutral",
};

export const SUBMISSION_TONE: Record<SubmissionStatus, Tone> = {
  Draft: "neutral",
  Submitted: "info",
  "Analysis in Progress": "info",
  "Review Required": "warning",
  "Analysis Completed": "success",
};

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtSize = (b: number) =>
  b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`;
