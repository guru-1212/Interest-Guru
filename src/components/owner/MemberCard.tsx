"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/calculations";
import { computeLoanBalance } from "@/lib/loan-balance";
import { useInterestClock } from "@/hooks/useInterestClock";
import { usePayments } from "@/hooks/usePayments";
import { MarkWrongEntryModal } from "./MarkWrongEntryModal";
import type { Member, Loan, Payment } from "@/types";

interface MemberCardProps {
  member: Member;
  loan?: Loan;
  payments?: Payment[];
  paymentsLoaded?: boolean;
}

export function MemberCard({
  member,
  loan,
  payments = [],
  paymentsLoaded = true,
}: MemberCardProps) {
  const asOf = useInterestClock();
  const { payments: loanPayments, loading: loanPaymentsLoading } = usePayments(
    loan?.id
  );
  const effectiveLoading = loanPaymentsLoading && !paymentsLoaded;

  const effectivePayments =
    loanPayments && loanPayments.length > 0 ? loanPayments : payments;
  const calculationDate = loan?.status === "settled" && loan.settledAt ? loan.settledAt : asOf;
  const balance =
    loan
      ? computeLoanBalance(
          loan,
          effectivePayments,
          calculationDate
        )
      : null;

  return (
    <Link href={`/owner/members/${member.id}`}>
      <article
        className={`group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
            {member.profilePhotoUrl ? (
              <img
                src={member.profilePhotoUrl}
                alt={member.fullName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-600">
                <span className="text-lg font-bold">
                  {member.fullName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {loan?.status === "active" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          ) : loan?.status === "settled" && (
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Settled
            </span>
          )}
          <div className="ml-auto">
            <MarkWrongEntryModal 
              memberId={member.id} 
              memberName={member.fullName} 
              variant="icon" 
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              {member.fullName}
            </h3>
            <p className="text-xs font-medium text-slate-400">
              {loan?.interestMethod?.startsWith("fd") 
                ? `Bank FD @ ${loan.annualRate}% / year`
                : `${loan?.interestMethod === "shekda_compound" ? "Compound " : ""}Shekda @ ${loan?.shekdaRate}% / month`}
            </p>
          </div>

          {loan ? (
            <div className="pt-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                <span>Principal</span>
                <span>{loan.status === "settled" ? "Total Interest Earned" : "Live balance (Grand Total)"}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-600">
                  {formatCurrency(loan.principal)}
                </span>
                <span className={`text-lg font-extrabold ${loan.status === "settled" ? "text-slate-600" : "text-emerald-600"}`}>
                  {effectiveLoading ? (
                    <span className="text-sm font-medium text-slate-400">Loading…</span>
                  ) : balance ? (
                    loan.status === "settled" ? formatCurrency(balance.accruedInterest) : formatCurrency(balance.grandTotal)
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              
              {loan.status === "settled" && balance && (
                <div className="mt-3 border-t border-slate-50 pt-2 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Settlement</span>
                   <span className="text-sm font-bold text-slate-900">{formatCurrency(loan.settlementAmount ?? balance.grandTotal)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="py-2 text-xs font-medium text-slate-400 italic">
              No active loan recorded
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
