"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { uploadProofDocuments } from "@/lib/proof-documents";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserPlus, Upload, Calculator } from "lucide-react";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import type { InterestMethod, CompoundFrequency, LoanDirection } from "@/types";

interface AddMemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddMemberForm({ onSuccess, onCancel }: AddMemberFormProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [principal, setPrincipal] = useState("");
  const [shekdaRate, setShekdaRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState<"active" | "settled">("active");
  const [direction, setDirection] = useState<LoanDirection>("given");
  const [givenBy, setGivenBy] = useState("");
  const [takenBy, setTakenBy] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interestMethod, setInterestMethod] = useState<InterestMethod>("shekda_simple");
  const [annualRate, setAnnualRate] = useState("");
  const [compoundFrequency, setCompoundFrequency] = useState<CompoundFrequency>("quarterly");
  const [maturityDate, setMaturityDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerId = auth.currentUser?.uid ?? user?.id;
    if (!ownerId) return;
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const memberRef = await addDoc(collection(db, "members"), {
        ownerId,
        fullName,
        email: email || null,
        phone: phone || null,
        createdAt: serverTimestamp(),
      });

      const loanData: any = {
        memberId: memberRef.id,
        ownerId,
        principal: parseFloat(principal),
        shekdaRate: (interestMethod === "no_interest" || !shekdaRate) ? 0 : parseFloat(shekdaRate),
        startDate: Timestamp.fromDate(new Date(startDate)),
        interestMethod,
        direction,
        givenBy: givenBy || null,
        takenBy: takenBy || null,
        proofDocuments: [],
        status,
        createdAt: serverTimestamp(),
      };

      if (status === "settled" && endDate) {
        loanData.settledAt = Timestamp.fromDate(new Date(endDate));
        loanData.settlementAmount = parseFloat(principal); 
        loanData.settlementNote = "Historical data entry";
      }

      if (interestMethod === "fd_compound" || interestMethod === "fd_payout") {
        loanData.annualRate = parseFloat(annualRate);
        loanData.compoundFrequency = compoundFrequency;
        if (maturityDate) {
          loanData.maturityDate = Timestamp.fromDate(new Date(maturityDate));
        }
      }

      await addDoc(collection(db, "loans"), {
        ...loanData
      });

      setFullName("");
      setEmail("");
      setPhone("");
      setPrincipal("");
      setShekdaRate("");
      setStartDate("");
      setEndDate("");
      setStatus("active");
      setDirection("given");
      setGivenBy("");
      setTakenBy("");
      setInterestMethod("shekda_simple");
      setAnnualRate("");
      setMaturityDate("");
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Member / Entity Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ramesh or HDFC Bank"
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
        </div>

        {/* Loan Direction Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Entry Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection("given")}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase transition-all ${
                direction === "given"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              Money Given (I lent)
            </button>
            <button
              type="button"
              onClick={() => setDirection("taken")}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase transition-all ${
                direction === "taken"
                  ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              Money Taken (I borrowed)
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Given By"
            value={givenBy}
            onChange={(e) => setGivenBy(e.target.value)}
            placeholder="Who paid the money?"
          />
          <Input
            label="Taken By"
            value={takenBy}
            onChange={(e) => setTakenBy(e.target.value)}
            placeholder="Who received the money?"
          />
        </div>

        {/* Loan Status Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Loan Status
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus("active")}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase transition-all ${
                status === "active"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              Current Active
            </button>
            <button
              type="button"
              onClick={() => setStatus("settled")}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase transition-all ${
                status === "settled"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              Old Completed
            </button>
          </div>
        </div>

        {/* Calculation Method Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Interest Method
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { id: "shekda_simple", label: "Shekda Simple" },
              { id: "shekda_compound", label: "Shekda Compound" },
              { id: "fd_compound", label: "Bank FD" },
              { id: "no_interest", label: "No Interest" },
              { id: "fd_payout", label: "Payout FD" },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setInterestMethod(method.id as InterestMethod)}
                className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                  interestMethod === method.id
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Calculator className={`h-4 w-4 mb-1 ${interestMethod === method.id ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="text-[9px] font-bold uppercase leading-tight">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Principal Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            required
          />
          
          {interestMethod === "no_interest" ? (
             <div className="space-y-1">
               <label className="block text-sm font-medium text-slate-400">Rate (%)</label>
               <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                 Interest Free
               </div>
             </div>
          ) : interestMethod.startsWith("shekda") ? (
            <Input
              label="Shekda Rate (%)"
              type="number"
              min="0"
              step="0.01"
              value={shekdaRate}
              onChange={(e) => setShekdaRate(e.target.value)}
              required
            />
          ) : (
            <Input
              label="Annual Rate (%)"
              type="number"
              min="0"
              step="0.01"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              required
            />
          )}
        </div>

        {interestMethod.startsWith("fd") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Compounding Frequency
              </label>
              <select
                value={compoundFrequency}
                onChange={(e) => setCompoundFrequency(e.target.value as CompoundFrequency)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
                <option value="at_maturity">At Maturity</option>
              </select>
            </div>
            <Input
              label="Maturity Date (Optional)"
              type="date"
              value={maturityDate}
              onChange={(e) => setMaturityDate(e.target.value)}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          {status === "settled" && (
            <Input
              label="End Date (Settled On)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-600">Member added successfully.</p>
        )}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={loading} className="flex-1">
            <UserPlus className="h-4 w-4" />
            Save Member
          </Button>
        </div>
      </form>
  );
}
