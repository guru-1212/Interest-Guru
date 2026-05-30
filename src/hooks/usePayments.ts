import { useEffect, useState } from "react";
import { collection, collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { paymentFromDoc } from "@/lib/firestore-helpers";
import type { Payment } from "@/types";

export function usePayments(loanId: string | undefined) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevLoanId, setPrevLoanId] = useState(loanId);

  // Adjust state during render when loanId changes
  if (loanId !== prevLoanId) {
    setPrevLoanId(loanId);
    setPayments([]);
    setLoading(!!loanId);
  }

  useEffect(() => {
    if (!loanId) return;

    const unsub = onSnapshot(
      collection(db, "loans", loanId, "payments"),
      (snap) => {
        const list = snap.docs.map((d) =>
          paymentFromDoc(d.id, { ...d.data(), loanId })
        );
        list.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
        setPayments(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error in usePayments snapshot:", error);
        setPayments([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [loanId]);

  return { payments, loading };
}

export function useAllOwnerPayments(ownerId: string | undefined) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevOwnerId, setPrevOwnerId] = useState(ownerId);

  if (ownerId !== prevOwnerId) {
    setPrevOwnerId(ownerId);
    setPayments([]);
    setLoading(!!ownerId);
  }

  useEffect(() => {
    if (!ownerId) return;

    const q = query(
      collectionGroup(db, "payments"),
      where("ownerId", "==", ownerId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => paymentFromDoc(d.id, d.data()));
      list.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
      setPayments(list);
      setLoading(false);
    }, (error) => {
      console.error("Error in useAllOwnerPayments snapshot:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [ownerId]);

  return { payments, loading };
}
