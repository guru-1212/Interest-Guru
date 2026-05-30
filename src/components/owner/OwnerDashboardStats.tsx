"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useOwnerLoans } from "@/hooks/useLoans";
import { useInterestClock } from "@/hooks/useInterestClock";
import { computeLoanBalance } from "@/lib/loan-balance";
import { formatCurrency } from "@/lib/calculations";
import { Users, Landmark, Wallet, TrendingUp, PiggyBank, Coins } from "lucide-react";
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
    // Explicitly exclude settled and wrong entries from the main live totals
    let totalPrincipal = 0;
    let totalOutstanding = 0;
    let totalInterest = 0;
    
    let totalFDPrincipal = 0;
    let totalFDInterest = 0;

    for (const loan of activeLoans) {
      const payments = paymentsByLoan[loan.id] ?? [];
      const balance = computeLoanBalance(
        loan,
        payments,
        asOf
      );
      
      const isFD = loan.interestMethod?.startsWith("fd");
      
      if (isFD) {
        totalFDPrincipal += balance.effectivePrincipal;
        totalFDInterest += balance.outstandingInterest;
      } else {
        totalPrincipal += balance.effectivePrincipal;
        totalInterest += balance.outstandingInterest;
      }
      
      totalOutstanding += balance.grandTotal;
    }

    const validMembersCount = members.filter(m => {
      const loan = loans.find(l => l.memberId === m.id);
      return !loan || loan.status !== "wrong_entry";
    }).length;

    return {
      memberCount: validMembersCount,
      activeLoanCount: activeLoans.length,
      settledCount: loans.filter((l) => l.status === "settled").length,
      totalPrincipal,
      totalInterest,
      totalFDPrincipal,
      totalFDInterest,
      totalOutstanding,
    };
  }, [loans, members, paymentsByLoan, asOf]);

  if (membersLoading || loansLoading) {
    return (
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-3xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  const items = [
    { 
      label: "Total Members", 
      value: String(stats.memberCount),
      icon: Users,
      color: "blue"
    },
    {
      label: "Shekda Principal",
      value: formatCurrency(stats.totalPrincipal),
      icon: Wallet,
      color: "violet"
    },
    {
      label: "FD Principal",
      value: formatCurrency(stats.totalFDPrincipal),
      icon: PiggyBank,
      color: "amber"
    },
    {
      label: "FD Interest",
      value: formatCurrency(stats.totalFDInterest),
      icon: Coins,
      color: "orange"
    },
    {
      label: "Active Loans", 
      value: String(stats.activeLoanCount),
      icon: Landmark,
      color: "emerald"
    },
    {
      label: "Live Grand Total",
      value: formatCurrency(stats.totalOutstanding),
      highlight: true,
      icon: TrendingUp,
      color: "emerald"
    },
  ];

  return (
    <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 sm:gap-6">
      {items.map((item) => (
        <div
          key={item.label}
          className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 transition-all duration-300 ${
            item.highlight
              ? "border-emerald-100 bg-emerald-600 text-white shadow-lg shadow-emerald-200"
              : "border-slate-100 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md"
          }`}
        >
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-2xl ${
                item.highlight ? "bg-white/20" : `bg-${item.color}-50`
              }`}>
                <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  item.highlight ? "text-white" : `text-${item.color}-600`
                }`} />
              </div>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                item.highlight ? "text-emerald-100" : "text-slate-500"
              }`}>
                {item.label}
              </p>
              <p className={`text-sm sm:text-lg font-bold truncate ${
                item.highlight ? "text-white" : "text-slate-900"
              }`}>
                {item.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

