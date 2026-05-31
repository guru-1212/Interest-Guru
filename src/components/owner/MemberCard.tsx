"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/calculations";
import { computeLoanBalance } from "@/lib/loan-balance";
import { useInterestClock } from "@/hooks/useInterestClock";
import { usePayments } from "@/hooks/usePayments";
import { MarkWrongEntryModal } from "./MarkWrongEntryModal";
import { differenceInDays } from "date-fns";
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

  const isTaken = loan?.direction === "taken";
  const daysElapsed = loan ? differenceInDays(calculationDate, loan.startDate) : 0;

  return (
    <Link href={`/owner/members/${member.id}`}>
      <article
        className={`group relative overflow-hidden rounded-3xl border ${
          isTaken ? "border-amber-100 bg-amber-50/10" : "border-slate-100 bg-white"
        } p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border ${isTaken ? "border-amber-100 bg-amber-50" : "border-slate-100 bg-slate-50"}`}>
            {member.profilePhotoUrl ? (
              <img
                src={member.profilePhotoUrl}
                alt={member.fullName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center ${isTaken ? "text-amber-600" : "text-emerald-600"}`}>
                <span className="text-lg font-bold">
                  {member.fullName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
              isTaken 
                ? "bg-amber-100 text-amber-700 border-amber-200" 
                : "bg-emerald-100 text-emerald-700 border-emerald-200"
            }`}>
              {loan?.direction ?? "GIVEN"}
            </span>
            
            {loan?.status === "active" ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                <span className={`h-1 w-1 rounded-full ${isTaken ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
                Active
              </span>
            ) : loan?.status === "settled" && (
              <span className="text-[9px] font-bold text-slate-400 uppercase">Settled</span>
            )}
          </div>

          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-400">
               <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">Date: {loan?.startDate.toLocaleDateString('en-IN')}</span>
               <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">
                 {balance?.breakdown ? (
                   <>
                     {balance.breakdown.years > 0 && `${balance.breakdown.years}y `}
                     {balance.breakdown.months > 0 && `${balance.breakdown.months}m `}
                     {balance.breakdown.days}d
                   </>
                 ) : (
                   `Day: ${daysElapsed}`
                 )}
               </span>
               {loan?.givenBy && <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 font-semibold border border-slate-100">👤 {loan.givenBy}</span>}
            </div>
          </div>

          {loan ? (
            <div className="pt-2">
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                <span>Principal</span>
                <span>{isTaken ? "I Owe Total" : "Live balance"}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-600">
                  {formatCurrency(loan.principal)}
                </span>
                <span className={`text-lg font-extrabold ${isTaken ? "text-amber-600" : "text-emerald-600"}`}>
                  {effectiveLoading ? (
                    <span className="text-sm font-medium text-slate-400">Loading…</span>
                  ) : balance ? (
                    loan.status === "settled" ? formatCurrency(balance.accruedInterest) : formatCurrency(balance.grandTotal)
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              
              {!effectiveLoading && balance && balance.breakdown.totalInterest > 0 && (
                <p className={`mt-1 text-right text-[10px] font-bold ${isTaken ? "text-orange-500" : "text-emerald-600"}`}>
                  + Interest: {formatCurrency(balance.breakdown.totalInterest)}
                </p>
              )}
              
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
