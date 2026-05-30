import {
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import type { Loan, Member, Payment, ProofDocument, User } from "@/types";

export function timestampToDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

export function userFromDoc(id: string, data: DocumentData): User {
  return {
    id,
    email: data.email ?? "",
    phone: data.phone,
    displayName: data.displayName ?? "",
    role: data.role,
    isApproved: data.isApproved ?? false,
    ownerId: data.ownerId,
    memberId: data.memberId,
    createdAt: timestampToDate(data.createdAt),
  };
}

export function memberFromDoc(id: string, data: DocumentData): Member {
  return {
    id,
    ownerId: data.ownerId,
    fullName: data.fullName ?? "",
    profilePhotoUrl: data.profilePhotoUrl,
    email: data.email,
    phone: data.phone,
    createdAt: timestampToDate(data.createdAt),
  };
}

export function loanFromDoc(id: string, data: DocumentData): Loan {
  const proofs = (data.proofDocuments ?? []) as ProofDocument[];
  return {
    id,
    memberId: data.memberId,
    ownerId: data.ownerId,
    principal: data.principal ?? 0,
    shekdaRate: data.shekdaRate ?? 0,
    startDate: timestampToDate(data.startDate),
    proofDocuments: proofs.map((p) => ({
      ...p,
      uploadedAt: timestampToDate(p.uploadedAt),
    })),
    status: data.status ?? "active",
    settledAt: data.settledAt ? timestampToDate(data.settledAt) : undefined,
    settlementAmount: data.settlementAmount,
    settlementNote: data.settlementNote,
    capitalizationHistory: (data.capitalizationHistory ?? []).map((c: { id: string; previousPrincipal: number; interestAdded: number; newPrincipal: number; date: unknown; note?: string }) => ({
      ...c,
      date: timestampToDate(c.date),
    })),
  };
}

export function paymentFromDoc(id: string, data: DocumentData): Payment {
  return {
    id,
    loanId: data.loanId,
    ownerId: data.ownerId,
    amount: data.amount ?? 0,
    paidAt: timestampToDate(data.paidAt),
    type: data.type ?? "both",
    note: data.note,
    createdBy: data.createdBy,
    createdAt: timestampToDate(data.createdAt),
  };
}
