"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useOwnerLoans } from "@/hooks/useLoans";
import { MemberCard } from "./MemberCard";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Payment } from "@/types";

interface MemberListProps {
  paymentsByLoan?: Record<string, Payment[]>;
  paymentsLoading?: boolean;
}

export function MemberList({ paymentsByLoan = {}, paymentsLoading = false }: MemberListProps) {
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers(user?.id);
  const { loans, loading: loansLoading } = useOwnerLoans(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [pullStart, setPullStart] = useState<number | null>(null);

  const loading = membersLoading || loansLoading;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 600);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) setPullStart(e.touches[0].clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (pullStart == null) return;
    const delta = e.changedTouches[0].clientY - pullStart;
    if (delta > 80) handleRefresh();
    setPullStart(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-500">
        No members yet. Add your first member above.
      </p>
    );
  }

  const loanByMember = new Map(loans.map((l) => [l.memberId, l]));

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="mb-3 flex items-center justify-between md:hidden">
        <p className="text-xs text-slate-500">Pull down to refresh · live data</p>
        <Button
          variant="ghost"
          className="min-h-[44px] min-w-[44px] px-2"
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <RefreshCw
            className={`h-5 w-5 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
          />
        </Button>
      </div>
      <div
        className={`grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 ${
          refreshing ? "opacity-60" : ""
        }`}
      >
        {members.map((member) => {
          const loan = loanByMember.get(member.id);
          return (
            <MemberCard
              key={member.id}
              member={member}
              loan={loan}
              payments={loan ? (paymentsByLoan[loan.id] || []) : []}
              paymentsLoaded={!paymentsLoading}
            />
          );
        })}
      </div>
    </div>
  );
}
