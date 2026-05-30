import { useState, useMemo } from "react";
import Image from "next/image";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { RefreshCcw, TrendingUp, Calendar, User as UserIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/calculations";
import { computeLoanBalance } from "@/lib/loan-balance";
import { startOfDay } from "date-fns";
import type { Loan, LoanBalance, Payment, Member } from "@/types";

interface CapitalizeInterestModalProps {
  member: Member;
  loan: Loan;
  balance: LoanBalance;
  payments: Payment[];
  open: boolean;
  onClose: () => void;
}

export function CapitalizeInterestModal({
  member,
  loan,
  balance: currentBalance,
  payments,
  open,
  onClose,
}: CapitalizeInterestModalProps) {
  const [loading, setLoading] = useState(false);
  const [capitalizeDate, setCapitalizeDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const balanceAtDate = useMemo(() => {
    const selectedDate = startOfDay(new Date(capitalizeDate));
    return computeLoanBalance(loan, payments, selectedDate);
  }, [loan, payments, capitalizeDate]);

  const handleCapitalize = async () => {
    if (!balanceAtDate.outstandingInterest || balanceAtDate.outstandingInterest <= 0) {
      alert("No outstanding interest to capitalize as of this date.");
      return;
    }

    const confirmMsg = `Are you sure you want to capitalize interest for ${member.fullName} as of ${capitalizeDate}? This will set the new principal to ${formatCurrency(balanceAtDate.grandTotal)} and reset the interest clock to this date.`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const newPrincipal = balanceAtDate.grandTotal;
      const interestAdded = balanceAtDate.outstandingInterest;
      const selectedDate = startOfDay(new Date(capitalizeDate));
      
      const event = {
        id: crypto.randomUUID(),
        previousPrincipal: loan.principal,
        interestAdded: interestAdded,
        newPrincipal: newPrincipal,
        date: selectedDate,
        note: `Capitalized on ${capitalizeDate} (Retroactive)`,
      };

      await updateDoc(doc(db, "loans", loan.id), {
        principal: newPrincipal,
        startDate: selectedDate,
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
        {/* Member Header */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white border border-slate-200">
            {member.profilePhotoUrl ? (
              <img
                src={member.profilePhotoUrl}
                alt={member.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserIcon className="h-8 w-8 text-slate-400" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{member.fullName}</h3>
            <p className="text-xs text-slate-500">
              Loan Principal: {formatCurrency(loan.principal)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex gap-3">
            <TrendingUp className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Retroactive Capitalization
              </p>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                Choose the date when the interest was added to the principal. 
                The system will calculate interest till that date, add it to principal, 
                and restart the clock from then.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Capitalization Date"
            type="date"
            value={capitalizeDate}
            onChange={(e) => setCapitalizeDate(e.target.value)}
            icon={<Calendar className="h-4 w-4 text-slate-400" />}
            max={new Date().toISOString().split("T")[0]}
          />

          <div className="mt-6 space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-600">Principal (as of date)</span>
              <span className="text-sm font-medium text-slate-900">
                {formatCurrency(loan.principal)}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-600">Interest to add</span>
              <span className="text-sm font-semibold text-emerald-600">
                + {formatCurrency(balanceAtDate.outstandingInterest)}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-sm font-bold text-slate-900">New Principal</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(balanceAtDate.grandTotal)}
              </span>
            </div>
          </div>
          
          <p className="text-center text-[10px] text-slate-400">
            Note: Current balance today is {formatCurrency(currentBalance.grandTotal)}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={handleCapitalize} 
            loading={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Capitalize & Update Principal
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
