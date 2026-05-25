export type UserRole = "admin" | "owner" | "member";

export interface User {
  id: string;
  email: string;
  phone?: string;
  displayName: string;
  role: UserRole;
  isApproved: boolean;
  ownerId?: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  ownerId: string;
  fullName: string;
  profilePhotoUrl?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
}

export type LoanStatus = "active" | "settled";

export type ProofDocumentType = "aadhar" | "pan" | "bond" | "other";

export interface ProofDocument {
  id: string;
  name: string;
  url: string;
  type: ProofDocumentType;
  uploadedAt: Date;
}

export interface Loan {
  id: string;
  memberId: string;
  ownerId: string;
  principal: number;
  shekdaRate: number;
  startDate: Date;
  proofDocuments: ProofDocument[];
  status: LoanStatus;
  settledAt?: Date;
}

export interface InterestBreakdown {
  years: number;
  months: number;
  days: number;
  totalInterest: number;
  grandTotal: number;
  monthlyInterest: number;
}
