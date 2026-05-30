"use client";

import { useState } from "react";
import { Trash2, AlertCircle, Lock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { markLoanAsWrongEntry } from "@/lib/member-actions";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface MarkWrongEntryModalProps {
  memberId: string;
  memberName: string;
  variant?: "button" | "icon";
}

export function MarkWrongEntryModal({
  memberId,
  memberName,
  variant = "button",
}: MarkWrongEntryModalProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  const CORRECT_PASSWORD = "7522935014Guru";

  const handleMarkAsWrong = async () => {
    if (!user?.id) {
      setError("Authentication error. Please sign in again.");
      return;
    }
    if (password !== CORRECT_PASSWORD) {
      setError("Incorrect management password.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await markLoanAsWrongEntry(memberId, user.id);
      setOpen(false);
      // If we are on the detail page, go back home
      if (window.location.pathname.includes(`/members/${memberId}`)) {
        router.push("/owner");
      }
    } catch (err) {
      console.error("Operation failed:", err);
      setError("Failed to update entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          variant="ghost"
          onClick={() => setOpen(true)}
          className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-bold"
        >
          <AlertCircle className="h-4 w-4" />
          Mark as Wrong Entry
        </Button>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 transition-all hover:bg-amber-50 hover:text-amber-600"
          title="Mark as wrong entry"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {open && (
        <Modal
          open
          onClose={() => {
            if (!loading) setOpen(false);
          }}
          title="Mark as Wrong Entry"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold uppercase tracking-tight">Archive incorrect record</p>
                <p className="mt-1 leading-relaxed">
                  This will move <strong>{memberName}</strong> to the &quot;Wrong Entry&quot; section. 
                  Their details will no longer be counted in your dashboard totals.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                Enter Management Password
              </label>
              <Input
                type="password"
                placeholder="Confirm with password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={loading}
              />
              {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-[2] bg-amber-600 hover:bg-amber-700 text-white border-none"
                onClick={handleMarkAsWrong}
                loading={loading}
              >
                <Trash2 className="h-4 w-4" />
                Move to Wrong Entry
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
