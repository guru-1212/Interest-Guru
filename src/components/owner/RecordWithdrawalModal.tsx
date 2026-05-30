"use client";

import { useState } from "react";
import { doc, Timestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/calculations";
import type { Loan } from "@/types";

interface RecordWithdrawalModalProps {
  loan: Loan;
  open: boolean;
  onClose: () => void;
}

export function RecordWithdrawalModal({ loan, open, onClose }: RecordWithdrawalModalProps) {
  const [amount, setAmount] = useState("");
  const [withdrawnAt, setWithdrawnAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRecordWithdrawal = async () => {
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    const currentPrincipal = loan.principal;
    if (withdrawalAmount > currentPrincipal) {
      setError(`Withdrawal cannot exceed current principal of ${formatCurrency(currentPrincipal)}.`);
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const loanRef = doc(db, "loans", loan.id);
      const newPrincipal = currentPrincipal - withdrawalAmount;

      const withdrawalEvent = {
        id: `${loan.id}_${Date.now()}`,
        withdrawnAt: Timestamp.fromDate(new Date(withdrawnAt)),
        amount: withdrawalAmount,
        note: note || "Principal withdrawal",
        oldPrincipal: currentPrincipal,
        newPrincipal,
      };

      await updateDoc(loanRef, {
        principal: newPrincipal, // Update the current principal
        withdrawalHistory: arrayUnion(withdrawalEvent),
        // Ensure originalPrincipal is set if it's not already
        ...(loan.originalPrincipal == null && { originalPrincipal: currentPrincipal }),
      });
      
      onClose();
      setAmount("");
      setNote("");

    } catch (err) {
      console.error(err);
      setError("Failed to record withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Principal Withdrawal">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Record a partial withdrawal from the FD principal. The interest calculation will be adjusted automatically from the withdrawal date.
        </p>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">Current Principal</p>
            <p className="font-bold text-lg text-slate-800">{formatCurrency(loan.principal)}</p>
        </div>

        <Input
          label="Amount to Withdraw (₹)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Input
          label="Withdrawal Date"
          type="date"
          value={withdrawnAt}
          onChange={(e) => setWithdrawnAt(e.target.value)}
          required
        />
        <Input
          label="Note (Optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        
        {error && <p className="text-sm text-red-600">{error}</p>}
        
        {amount && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-emerald-600">New Remaining Principal</p>
                <p className="font-bold text-lg text-emerald-800">
                    {formatCurrency(loan.principal - (parseFloat(amount) || 0))}
                </p>
            </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRecordWithdrawal}
            loading={loading}
          >
            Confirm & Record Withdrawal
          </Button>
        </div>
      </div>
    </Modal>
  );
}
