"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useOwnerLoans } from "@/hooks/useLoans";
import { useInterestClock } from "@/hooks/useInterestClock";
import { computeLoanBalance } from "@/lib/loan-balance";
import { formatCurrency } from "@/lib/calculations";
import type { Payment } from "@/types";

interface OwnerDashboardStatsProps {
  paymentsByLoan?: Record<string, Payment[]>;
}

export function OwnerDashboardStats({
  paymentsByLoan = {},
}: OwnerDashboardStatsProps) {
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers(user?.id);
  const { loans, loading: loansLoading } = useOwnerLoans(user?.id);
  const asOf = useInterestClock();

  const stats = useMemo(() => {
    const activeLoans = loans.filter((l) => l.status === "active");
    let totalPrincipal = 0;
    let totalOutstanding = 0;
    let totalInterest = 0;

    for (const loan of activeLoans) {
      const payments = paymentsByLoan[loan.id] ?? [];
      const balance = computeLoanBalance(
        loan.principal,
        loan.shekdaRate,
        loan.startDate,
        payments,
        asOf
      );
      totalPrincipal += balance.effectivePrincipal;
      totalOutstanding += balance.grandTotal;
      totalInterest += balance.outstandingInterest;
    }

    return {
      memberCount: members.length,
      activeLoanCount: activeLoans.length,
      settledCount: loans.filter((l) => l.status === "settled").length,
      totalPrincipal,
      totalInterest,
      totalOutstanding,
    };
  }, [loans, members.length, paymentsByLoan, asOf]);

  if (membersLoading || loansLoading) {
    return (
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  const items = [
    { label: "Members", value: String(stats.memberCount) },
    { label: "Active loans", value: String(stats.activeLoanCount) },
    {
      label: "Outstanding principal",
      value: formatCurrency(stats.totalPrincipal),
    },
    {
      label: "Live total owed",
      value: formatCurrency(stats.totalOutstanding),
      highlight: true,
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border p-4 ${
            item.highlight
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </p>
          <p
            className={`mt-1 text-xl font-bold ${
              item.highlight ? "text-emerald-700" : "text-slate-800"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
