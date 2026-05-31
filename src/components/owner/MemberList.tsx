"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useOwnerLoans } from "@/hooks/useLoans";
import { MemberCard } from "./MemberCard";
import { Loader2, RefreshCw, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Payment } from "@/types";

interface MemberListProps {
  paymentsByLoan?: Record<string, Payment[]>;
  paymentsLoading?: boolean;
  statusFilter?: "active" | "settled" | "wrong_entry";
}

export function MemberList({ 
  paymentsByLoan = {}, 
  paymentsLoading = false,
  statusFilter
}: MemberListProps) {
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers(user?.id);
  const { loans, loading: loansLoading } = useOwnerLoans(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [pullStart, setPullStart] = useState<number | null>(null);
  const [viewFilter, setViewFilter] = useState<"all" | "given" | "taken">("all");
  const [interestFilter, setInterestFilter] = useState<"all" | "with_interest" | "interest_free">("all");

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

  const filteredMembers = members.filter((member) => {
    const loan = loanByMember.get(member.id);
    
    // 1. Status Filter (Active/Settled)
    if (statusFilter) {
      if (!loan && statusFilter !== "active") return false;
      if (loan && loan.status !== statusFilter) return false;
    }

    // 2. Direction Filter (Given/Taken)
    if (viewFilter !== "all") {
      const direction = loan?.direction || "given";
      if (direction !== viewFilter) return false;
    }

    // 3. Interest Type Filter (With Interest / Interest Free)
    if (interestFilter !== "all") {
      const isFree = loan?.interestMethod === "no_interest" || (loan && !loan.interestMethod && loan.shekdaRate === 0);
      if (interestFilter === "interest_free" && !isFree) return false;
      if (interestFilter === "with_interest" && isFree) return false;
    }

    return true;
  });

  const givenMembers = filteredMembers.filter(m => {
    const l = loanByMember.get(m.id);
    return !l || l.direction === "given" || !l.direction;
  });

  const takenMembers = filteredMembers.filter(m => {
    const l = loanByMember.get(m.id);
    return l && l.direction === "taken";
  });

  const renderSection = (title: string, icon: any, list: typeof filteredMembers, colorClass: string) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-4">
        <div className={`flex items-center gap-2 border-b border-slate-100 pb-2`}>
          <div className={`rounded-lg p-1.5 ${colorClass === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {icon}
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">{title}</h3>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {list.length}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((member) => {
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
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Direction Filter */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
            {[
              { id: "all", label: "All Records" },
              { id: "given", label: "Given (Assets)" },
              { id: "taken", label: "Taken (Debts)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewFilter(tab.id as any)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  viewFilter === tab.id
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <p className="hidden text-xs text-slate-500 md:block font-medium">Auto-calculated live data</p>
            <Button
              variant="ghost"
              className="min-h-[40px] min-w-[44px] px-2"
              onClick={handleRefresh}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Interest Type Filter */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rate Filter:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {[
              { id: "all", label: "All Rates" },
              { id: "with_interest", label: "With Interest" },
              { id: "interest_free", label: "Interest Free" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setInterestFilter(tab.id as any)}
                className={`rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-tighter transition-all ${
                  interestFilter === tab.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={refreshing ? "opacity-60" : ""}>
        {(viewFilter === "all" || viewFilter === "given") && renderSection("Money Given (Assets)", <ArrowUpCircle className="h-4 w-4" />, givenMembers, 'emerald')}
        
        {takenMembers.length > 0 && givenMembers.length > 0 && viewFilter === "all" && <div className="h-10" />}
        
        {(viewFilter === "all" || viewFilter === "taken") && renderSection("Money Taken (Liabilities)", <ArrowDownCircle className="h-4 w-4" />, takenMembers, 'amber')}
      </div>

      {filteredMembers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            No {viewFilter !== 'all' ? viewFilter : ''} {interestFilter !== 'all' ? interestFilter.replace('_', ' ') : ''} entries found
          </p>
          <p className="mt-1 text-xs text-slate-400">Try changing your filters or adding a new member.</p>
        </div>
      )}
    </div>
  );
}
