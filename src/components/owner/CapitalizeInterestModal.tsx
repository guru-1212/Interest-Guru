"use client";

import { useState } from "react";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { RefreshCcw, TrendingUp } from "lucide-react";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/calculations";
import type { Loan, LoanBalance } from "@/types";

interface CapitalizeInterestModalProps {
  loan: Loan;
  balance: LoanBalance;
  open: boolean;
  onClose: () => void;
}

export function CapitalizeInterestModal({
  loan,
  balance,
  open,
  onClose,
}: CapitalizeInterestModalProps) {
  const [loading, setLoading] = useState(false);

  const handleCapitalize = async () => {
    if (!balance.outstandingInterest || balance.outstandingInterest <= 0) {
      alert("No outstanding interest to capitalize.");
      return;
    }

    setLoading(true);
    try {
      const newPrincipal = balance.grandTotal;
      const interestAdded = balance.outstandingInterest;
      
      const event = {
        id: crypto.randomUUID(),
        previousPrincipal: loan.principal,
        interestAdded: interestAdded,
        newPrincipal: newPrincipal,
        date: new Date(),
        note: "Auto-capitalized (Chakravaadh rollover)",
      };

      await updateDoc(doc(db, "loans", loan.id), {
        principal: newPrincipal,
        startDate: new Date(),
        capitalizationHistory: arrayUnion(event),
      });

      onClose();
    } catch (err) {
      console.error("Capitalization failed:", err);
      alert("Failed to capitalize interest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Capitalize Interest (Rollover)"
    >
      <div className="space-y-6 py-2">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex gap-3">
            <TrendingUp className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                What is Capitalization?
              </p>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                This will add all current outstanding interest to the principal amount. 
                The loan&apos;s start date will reset to today, and future interest will be 
                calculated on the new, higher principal (Chakravaadh Vyaaj).
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-600">Current Principal</span>
            <span className="text-sm font-medium text-slate-900">
              {formatCurrency(loan.principal)}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-600">Accrued Interest (to add)</span>
            <span className="text-sm font-semibold text-emerald-600">
              + {formatCurrency(balance.outstandingInterest)}
            </span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-base font-bold text-slate-900">New Principal</span>
            <span className="text-xl font-bold text-emerald-600">
              {formatCurrency(balance.grandTotal)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={handleCapitalize} 
            loading={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Capitalize & Reset Clock
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={loading}
            className="w-full text-slate-500"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
