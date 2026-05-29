"use client";

import { formatCurrency } from "@/lib/calculations";
import type { Payment } from "@/types";

interface PaymentsListProps {
  payments: Payment[];
  loading?: boolean;
}

export function PaymentsList({ payments, loading }: PaymentsListProps) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading payments...</p>;
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-slate-500">No payments recorded yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {payments.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
        >
          <div>
            <p className="font-medium text-slate-800">
              {formatCurrency(p.amount)}
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal capitalize text-slate-600">
                {p.type}
              </span>
            </p>
            <p className="text-slate-500">
              {p.paidAt.toLocaleDateString()}
              {p.note ? ` · ${p.note}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
