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

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface VendorProfile {
  companyName: string;
  legalName: string;
  cin: string;
  gstin: string;
  pan: string;
  udyam: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website?: string;
  turnoverLast3Years?: string;
}

export interface VendorDocument {
  id: string;
  name: string;
  category: string;
  size: number;
  uploadedAt: string;
  validUntil?: string;
  status: "Active" | "Pending Review" | "Expired";
}

export interface ReportItem {
  id: string;
  analysisId: string;
  tenderId: string;
  tenderTitle: string;
  tenderReference: string;
  department: string;
  vendorName: string;
  createdAt: string;
  status: SubmissionStatus;
  matchedCount: number;
  missingCount: number;
  reviewCount: number;
  totalRequirements: number;
}

