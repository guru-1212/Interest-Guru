"use client";

import { useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AddMemberModal } from "@/components/owner/AddMemberModal";
import { InterestCalculatorModal } from "@/components/owner/InterestCalculatorModal";
import { MemberList } from "@/components/owner/MemberList";
import { OwnerDashboardStats } from "@/components/owner/OwnerDashboardStats";
import { ExportDataPanel } from "@/components/owner/ExportDataPanel";
import { useAuth } from "@/hooks/useAuth";
import { useAllOwnerPayments } from "@/hooks/usePayments";
import type { Payment } from "@/types";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const { payments, loading: paymentsLoading } = useAllOwnerPayments(user?.id);

  const paymentsByLoan = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    for (const p of payments) {
      if (!map[p.loanId]) map[p.loanId] = [];
      map[p.loanId].push(p);
    }
    return map;
  }, [payments]);

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="mt-1 text-slate-500 font-medium">
              Welcome back! Here&apos;s your financial summary.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <InterestCalculatorModal />
            <AddMemberModal />
          </div>
        </header>

        <section className="mb-10">
          <OwnerDashboardStats paymentsByLoan={paymentsByLoan} />
        </section>
        
        <section className="mb-12">
          <ExportDataPanel />
        </section>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              All Members
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Live</span>
            </h2>
          </div>
          <MemberList paymentsByLoan={paymentsByLoan} paymentsLoading={paymentsLoading} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
