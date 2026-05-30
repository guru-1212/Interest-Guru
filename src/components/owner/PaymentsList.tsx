"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/calculations";
import { Trash2, Loader2 } from "lucide-react";
import { deletePayment } from "@/hooks/usePayments";
import type { Payment } from "@/types";

interface PaymentsListProps {
  payments: Payment[];
  loading?: boolean;
}

export function PaymentsList({ payments, loading }: PaymentsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (loanId: string, paymentId: string) => {
    if (!window.confirm("Are you sure you want to mark this entry as wrong? It will be permanently deleted and the balance will be updated.")) {
      return;
    }

    setDeletingId(paymentId);
    try {
      await deletePayment(loanId, paymentId);
    } catch (error) {
      console.error("Failed to delete payment:", error);
      alert("Failed to delete payment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500 py-4">Loading payments...</p>;
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">No payments recorded yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {payments.map((p) => {
        const isDeleting = deletingId === p.id;
        return (
          <li
            key={p.id}
            className="group flex items-center justify-between gap-2 py-4 text-sm"
          >
            <div className="flex-1">
              <p className="font-bold text-slate-900">
                {formatCurrency(p.amount)}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  p.type === 'principal' ? 'bg-blue-50 text-blue-600' : 
                  p.type === 'interest' ? 'bg-violet-50 text-violet-600' : 
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {p.type}
                </span>
              </p>
              <p className="mt-0.5 font-medium text-slate-500">
                {p.paidAt.toLocaleDateString()}
                {p.note ? ` · ${p.note}` : ""}
              </p>
            </div>
            
            <button
              onClick={() => handleDelete(p.loanId, p.id)}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 md:opacity-0 disabled:opacity-100"
              title="Delete incorrect entry"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
