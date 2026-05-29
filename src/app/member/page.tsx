"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InterestBreakdownDisplay } from "@/components/shared/InterestBreakdown";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useMemberDashboard } from "@/hooks/useMemberDashboard";
import { usePayments } from "@/hooks/usePayments";
import { useInterestClock } from "@/hooks/useInterestClock";
import { computeLoanBalance } from "@/lib/loan-balance";
import { formatCurrency } from "@/lib/calculations";
import { PaymentsList } from "@/components/owner/PaymentsList";
import { Loader2 } from "lucide-react";

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const { member, loan, loading } = useMemberDashboard(user);
  const { payments, loading: paymentsLoading } = usePayments(loan?.id);
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
    <ProtectedRoute allowedRoles={["member"]}>
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Balance</h1>
        <p className="mt-1 text-slate-600">
          Live outstanding summary — updates automatically.
        </p>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        )}

        {!loading && !loan && (
          <Card className="mt-8">
            <p className="text-slate-600">
              No loan linked to your account. Ask your lender to register your
              email or phone on your member profile.
            </p>
          </Card>
        )}

        {loan && balance && loan.status === "active" && (
          <>
            <Card title={member?.fullName ?? "Your Loan"} className="mt-8">
              <InterestBreakdownDisplay
                breakdown={balance.breakdown}
                principal={balance.effectivePrincipal}
                shekdaRate={loan.shekdaRate}
              />
              {(balance.principalPaid > 0 || balance.interestPaid > 0) && (
                <p className="mt-4 text-sm text-slate-600">
                  Payments applied: principal{" "}
                  {formatCurrency(balance.principalPaid)}, interest{" "}
                  {formatCurrency(balance.interestPaid)}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Live as of {asOf.toLocaleTimeString()}
              </p>
            </Card>
            <Card title="Payment history" className="mt-6">
              <PaymentsList payments={payments} loading={paymentsLoading} />
            </Card>
          </>
        )}

        {loan?.status === "settled" && (
          <Card className="mt-8">
            <p className="font-medium text-emerald-700">
              Your loan has been settled. Thank you.
            </p>
            {loan.settlementAmount != null && (
              <p className="mt-2 text-sm text-slate-600">
                Final amount: {formatCurrency(loan.settlementAmount)}
                {loan.settledAt &&
                  ` · ${loan.settledAt.toLocaleDateString()}`}
              </p>
            )}
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
