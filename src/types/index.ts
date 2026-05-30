export type UserRole = "admin" | "owner" | "member";

export interface User {
  id: string;
  email: string;
  phone?: string;
  displayName: string;
  role: UserRole;
  isApproved: boolean;
  ownerId?: string;
  memberId?: string;
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

export type LoanStatus = "active" | "settled" | "wrong_entry";

export type InterestMethod = 
  | "shekda_simple" 
  | "shekda_compound" 
  | "fd_compound" 
  | "fd_payout"
  | "custom";

export type CompoundFrequency = 
  | "monthly" 
  | "quarterly" 
  | "half-yearly" 
  | "yearly"
  | "at_maturity";

export type ProofDocumentType = "aadhar" | "pan" | "bond" | "other";

export interface ProofDocument {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  type: ProofDocumentType;
  uploadedAt: Date;
}
export interface CapitalizationEvent {
  id: string;
  previousPrincipal: number;
  interestAdded: number;
  newPrincipal: number;
  date: Date;
  note?: string;
}

export interface WithdrawalEvent {
  id: string;
  withdrawnAt: Date;
  amount: number;
  note?: string;
}

export interface Loan {
  id:string;
  memberId: string;
  ownerId: string;
  principal: number;
  originalPrincipal?: number;
  shekdaRate: number;
  startDate: Date;
  proofDocuments: ProofDocument[];
  status: LoanStatus;
  settledAt?: Date;
  settlementAmount?: number;
  settlementNote?: string;
  capitalizationHistory?: CapitalizationEvent[];
  withdrawalHistory?: WithdrawalEvent[];

  // New FD/Compound fields
  interestMethod?: InterestMethod;
  annualRate?: number;
  compoundFrequency?: CompoundFrequency;
  maturityDate?: Date;
  autoGenerateEntries?: boolean;
}

export type PaymentType = "principal" | "interest" | "both";

export interface Payment {
  id: string;
  loanId: string;
  ownerId: string;
  amount: number;
  paidAt: Date;
  type: PaymentType;
  note?: string;
  createdBy: string;
  createdAt: Date;
}

export interface LoanBalance {
  effectivePrincipal: number;
  principalPaid: number;
  interestPaid: number;
  accruedInterest: number;
  capitalizedInterest: number;
  outstandingInterest: number;
  grandTotal: number;
  breakdown: InterestBreakdown;
}

export interface InterestBreakdown {
  years: number;
  months: number;
  days: number;
  totalInterest: number;
  grandTotal: number;
  monthlyInterest: number;
}
