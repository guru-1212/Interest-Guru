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
    
    let totalGivenPrincipal = 0;
    let totalGivenInterest = 0;
    
    let totalTakenPrincipal = 0;
    let totalTakenInterest = 0;
    
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
      const isTaken = loan.direction === "taken";
      
      if (isFD) {
        totalFDPrincipal += balance.effectivePrincipal;
        totalFDInterest += balance.outstandingInterest;
      } else if (isTaken) {
        totalTakenPrincipal += balance.effectivePrincipal;
        totalTakenInterest += balance.outstandingInterest;
      } else {
        totalGivenPrincipal += balance.effectivePrincipal;
        totalGivenInterest += balance.outstandingInterest;
      }
    }

    const netWorth = (totalGivenPrincipal + totalGivenInterest + totalFDPrincipal + totalFDInterest) - (totalTakenPrincipal + totalTakenInterest);

    return {
      memberCount: members.length,
      activeLoanCount: activeLoans.length,
      totalGivenPrincipal,
      totalGivenInterest,
      totalFDPrincipal,
      totalFDInterest,
      totalTakenPrincipal,
      totalTakenInterest,
      netWorth,
    };
  }, [loans, members.length, paymentsByLoan, asOf]);

  if (membersLoading || loansLoading) {
    return (
      <div className="mb-8 grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Given Principal",
      value: formatCurrency(stats.totalGivenPrincipal),
      icon: Wallet,
      color: "emerald"
    },
    {
      label: "FD Principal",
      value: formatCurrency(stats.totalFDPrincipal),
      icon: PiggyBank,
      color: "blue"
    },
    {
      label: "FD Interest",
      value: formatCurrency(stats.totalFDInterest),
      icon: Coins,
      color: "sky"
    },
    {
      label: "Total Assets",
      value: formatCurrency(stats.totalGivenPrincipal + stats.totalGivenInterest + stats.totalFDPrincipal + stats.totalFDInterest),
      icon: TrendingUp,
      color: "emerald"
    },
    {
      label: "Taken (Borrowed)",
      value: formatCurrency(stats.totalTakenPrincipal),
      icon: Landmark,
      color: "amber"
    },
    {
      label: "Interest I Owe",
      value: formatCurrency(stats.totalTakenInterest),
      icon: Coins,
      color: "orange"
    },
    {
      label: "Total Liability",
      value: formatCurrency(stats.totalTakenPrincipal + stats.totalTakenInterest),
      icon: Landmark,
      color: "red"
    },
    {
      label: "Net Balance",
      value: formatCurrency(stats.netWorth),
      highlight: true,
      icon: Wallet,
      color: "emerald"
    },
  ];

  return (
    <div className="mb-8 grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`relative overflow-hidden rounded-2xl border p-3 transition-all duration-300 ${
            item.highlight
              ? "border-emerald-100 bg-emerald-600 text-white shadow-lg shadow-emerald-200"
              : "border-slate-100 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md"
          }`}
        >
          <div className="flex flex-col h-full justify-between">
            <div className={`p-1.5 rounded-xl w-fit mb-2 ${
              item.highlight ? "bg-white/20" : `bg-${item.color}-50`
            }`}>
              <item.icon className={`h-3.5 w-3.5 ${
                item.highlight ? "text-white" : `text-${item.color}-600`
              }`} />
            </div>
            <div>
              <p className={`text-[9px] font-bold uppercase tracking-tight mb-0.5 ${
                item.highlight ? "text-emerald-100" : "text-slate-400"
              }`}>
                {item.label}
              </p>
              <p className={`text-xs sm:text-sm font-bold truncate ${
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
