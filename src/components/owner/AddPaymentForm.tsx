"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { PaymentType } from "@/types";

interface AddPaymentFormProps {
  loanId: string;
  ownerId: string;
}

export function AddPaymentForm({ loanId, ownerId }: AddPaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [type, setType] = useState<PaymentType>("both");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await addDoc(collection(db, "loans", loanId, "payments"), {
        loanId,
        ownerId,
        amount: parsed,
        paidAt: Timestamp.fromDate(new Date(paidAt)),
        type,
        note: note.trim() || null,
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Amount (₹)"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Input
          label="Payment date"
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Payment type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PaymentType)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="principal">Principal only</option>
          <option value="interest">Interest only</option>
          <option value="both">Both (split 50/50)</option>
        </select>
      </div>
      <Input
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={loading}>
        Record payment
      </Button>
    </form>
  );
}
