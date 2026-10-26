export type Role = "vendor" | "official";

export type FindingStatus = "MATCHED" | "MISSING_EVIDENCE" | "REVIEW_REQUIRED" | "NOT_ASSESSED";

export type SubmissionStatus =
  | "Draft"
  | "Submitted"
  | "Analysis in Progress"
  | "Review Required"
  | "Analysis Completed";

export interface Tender {
  id: string;
  title: string;
  reference: string;
  department: string;
  deadline: string; // ISO
  description: string;
  eligibility: string[];
  requiredDocuments: string[];
  technical: string[];
}

export interface SubmittedFile {
  name: string;
  size: number;
  category: string;
}

export interface Submission {
  id: string;
  tenderId: string;
  vendorId: string;
  vendorName: string;
  submittedAt: string;
  status: SubmissionStatus;
  lastAnalysisAt?: string;
  analysisId?: string;
  files: SubmittedFile[];
}

export interface Finding {
  requirement: string;
  original: string;
  status: FindingStatus;
  evidence: string;
  extracted?: string;
  sourceDocument?: string;
  page?: number;
  explanation: string;
  action: string;
}

export interface Analysis {
  id: string;
  tenderId: string;
  submissionId?: string;
  vendorName: string;
  createdAt: string;
  status: SubmissionStatus;
  findings: Finding[];
}

export const DOCUMENT_CATEGORIES = [
  "GST Certificate",
  "PAN Document",
  "Udyam Registration",
  "OEM Authorization",
  "Technical Specifications",
  "Experience Certificates",
  "Other Supporting Documents",
] as const;
