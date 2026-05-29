"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { computeLoanBalance } from "@/lib/loan-balance";
import { useInterestClock } from "@/hooks/useInterestClock";
import type { Member, Loan, Payment } from "@/types";

interface MemberCardProps {
  member: Member;
  loan?: Loan;
  payments?: Payment[];
  compact?: boolean;
}

export function MemberCard({
  member,
  loan,
  payments = [],
  compact = false,
}: MemberCardProps) {
  const asOf = useInterestClock();

  const balance =
    loan && loan.status === "active"
      ? computeLoanBalance(
          loan.principal,
          loan.shekdaRate,
          loan.startDate,
          payments,
          asOf
        )
      : null;

  return (
    <Link href={`/owner/members/${member.id}`}>
      <article
        className={`group rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md ${
          compact ? "p-3" : "p-5"
        }`}
      >
        <div className={`flex items-start gap-3 ${compact ? "" : "gap-4"}`}>
          <div
            className={`relative shrink-0 overflow-hidden rounded-full bg-slate-100 ${
              compact ? "h-10 w-10" : "h-14 w-14"
            }`}
          >
            {member.profilePhotoUrl ? (
              <Image
                src={member.profilePhotoUrl}
                alt={member.fullName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User
                  className={`text-slate-400 ${compact ? "h-5 w-5" : "h-7 w-7"}`}
                />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={`truncate font-semibold text-slate-800 group-hover:text-emerald-700 ${
                compact ? "text-sm" : ""
              }`}
            >
              {member.fullName}
            </h3>
            {loan && (
              <>
                <p
                  className={`text-slate-500 ${compact ? "mt-0.5 text-[11px]" : "mt-1 text-xs"}`}
                >
                  Principal {formatCurrency(loan.principal)} · Shekda{" "}
                  {loan.shekdaRate}%
                </p>
                <p
                  className={`font-bold text-emerald-600 ${
                    compact ? "mt-1 text-base" : "mt-2 text-lg"
                  }`}
                >
                  {loan.status === "settled" ? (
                    <span
                      className={`font-medium text-slate-500 ${compact ? "text-xs" : "text-sm"}`}
                    >
                      Settled
                    </span>
                  ) : balance ? (
                    <>Live: {formatCurrency(balance.grandTotal)}</>
                  ) : (
                    "—"
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
