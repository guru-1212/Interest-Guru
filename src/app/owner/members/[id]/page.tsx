"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { memberFromDoc } from "@/lib/firestore-helpers";
import { useLoanByMember } from "@/hooks/useLoans";
import { usePayments } from "@/hooks/usePayments";
import { useInterestClock } from "@/hooks/useInterestClock";
import { computeLoanBalance } from "@/lib/loan-balance";
import { formatCurrency } from "@/lib/calculations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InterestBreakdownDisplay } from "@/components/shared/InterestBreakdown";
import { DocumentGallery } from "@/components/owner/DocumentGallery";
import { UploadDocumentsModal } from "@/components/owner/UploadDocumentsModal";
import { MemberProfileCard } from "@/components/owner/MemberProfileCard";
import { AddPaymentForm } from "@/components/owner/AddPaymentForm";
import { PaymentsList } from "@/components/owner/PaymentsList";
import { SettleLoanModal } from "@/components/owner/SettleLoanModal";
import { CapitalizeInterestModal } from "@/components/owner/CapitalizeInterestModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RefreshCcw, TrendingUp } from "lucide-react";
import type { Member } from "@/types";

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [member, setMember] = useState<Member | null>(null);
  const { loan, loading: loanLoading } = useLoanByMember(id);
  const { payments, loading: paymentsLoading } = usePayments(loan?.id);
  const asOf = useInterestClock();
  const [settleOpen, setSettleOpen] = useState(false);
  const [capitalizeOpen, setCapitalizeOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "members", id), (snap) => {
      if (snap.exists()) setMember(memberFromDoc(snap.id, snap.data()));
    });
    return () => unsub();
  }, [id]);

  const balance =
    loan && loan.status === "active"
      ? computeLoanBalance(
          loan,
          payments,
          asOf
        )
      : null;

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        <Link
          href="/owner"
          className="mb-6 inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {member && (
          <div className="mb-8">
            <MemberProfileCard member={member} loanStatus={loan?.status} />
          </div>
        )}

        {loanLoading && (
          <p className="text-slate-500">Loading loan details...</p>
        )}

        {loan && balance && loan.status === "active" && (
          <Card title="Interest Breakdown (Shekda)" className="mb-8">
            <InterestBreakdownDisplay
              breakdown={balance.breakdown}
              principal={balance.effectivePrincipal}
              shekdaRate={loan.shekdaRate}
              capitalizedInterest={balance.capitalizedInterest}
            />
            {(balance.principalPaid > 0 || balance.interestPaid > 0) && (
              <p className="mt-4 text-sm text-slate-600">
                After payments: principal paid{" "}
                {formatCurrency(balance.principalPaid)}, interest paid{" "}
                {formatCurrency(balance.interestPaid)}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Live balance {formatCurrency(balance.grandTotal)} · updated{" "}
              {asOf.toLocaleTimeString()}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => setSettleOpen(true)}>
                <CheckCircle className="h-4 w-4" />
                Settle Loan
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setCapitalizeOpen(true)}
                disabled={!balance.outstandingInterest || balance.outstandingInterest <= 0}
              >
                <RefreshCcw className="h-4 w-4" />
                Capitalize Interest
              </Button>
            </div>
          </Card>
        )}

        {loan?.capitalizationHistory && loan.capitalizationHistory.length > 0 && (
          <Card title="Capitalization History" className="mb-8">
            <div className="space-y-4">
              {loan.capitalizationHistory.map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                  <TrendingUp className="mt-1 h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between font-medium text-slate-900">
                      <span>Interest added to principal</span>
                      <span>{formatCurrency(event.interestAdded)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                      <span>{event.date.toLocaleDateString()} · New Principal: {formatCurrency(event.newPrincipal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {loan?.status === "active" && loan && (
          <>
            <Card title="Record payment" className="mb-8">
              <AddPaymentForm loanId={loan.id} ownerId={loan.ownerId} />
            </Card>
            <Card title="Payment history" className="mb-8">
              <PaymentsList payments={payments} loading={paymentsLoading} />
            </Card>
          </>
        )}

        {loan && (
          <SettleLoanModal
            loanId={loan.id}
            suggestedAmount={balance?.grandTotal ?? loan.principal}
            open={settleOpen}
            onClose={() => setSettleOpen(false)}
          />
        )}

        {loan && balance && member && (
          <CapitalizeInterestModal
            member={member}
            loan={loan}
            balance={balance}
            payments={payments}
            open={capitalizeOpen}
            onClose={() => setCapitalizeOpen(false)}
          />
        )}

        {loan?.status === "settled" && (
          <Card className="mb-8">
            <p className="font-medium text-emerald-700">
              This loan has been settled.
              {loan.settledAt &&
                ` on ${loan.settledAt.toLocaleDateString()}`}
            </p>
            {loan.settlementAmount != null && (
              <p className="mt-2 text-sm text-slate-600">
                Final amount received:{" "}
                {formatCurrency(loan.settlementAmount)}
                {loan.settlementNote ? ` · ${loan.settlementNote}` : ""}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-600">
              You can still update the member profile photo and upload proof
              documents below.
            </p>
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Payment history
              </h3>
              <PaymentsList payments={payments} loading={paymentsLoading} />
            </div>
          </Card>
        )}

        {loan && (
          <Card title="Document Vault">
            <div className="mb-6">
              <UploadDocumentsModal
                loanId={loan.id}
                settled={loan.status === "settled"}
              />
            </div>
            <DocumentGallery 
              loanId={loan.id} 
              documents={loan.proofDocuments} 
            />
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
