"use client";

import { useState } from "react";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/calculations";

interface SettleLoanModalProps {
  loanId: string;
  suggestedAmount: number;
  open: boolean;
  onClose: () => void;
}

export function SettleLoanModal({
  loanId,
  suggestedAmount,
  open,
  onClose,
}: SettleLoanModalProps) {
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSettle = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter the final settlement amount");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await updateDoc(doc(db, "loans", loanId), {
        status: "settled",
        settledAt: serverTimestamp(),
        settlementAmount: parsed,
        settlementNote: note.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settle loan">
      <p className="mb-4 text-sm text-slate-600">
        Suggested live balance: {formatCurrency(suggestedAmount)}
      </p>
      <div className="space-y-4">
        <Input
          label="Final amount received (₹)"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          label="Settlement note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSettle} loading={loading}>
            Confirm settlement
          </Button>
        </div>
      </div>
    </Modal>
  );
}
