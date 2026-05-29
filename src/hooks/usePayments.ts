"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { paymentFromDoc } from "@/lib/firestore-helpers";
import type { Payment } from "@/types";

export function usePayments(loanId: string | undefined) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loanId) {
      setPayments([]);
      setLoading(false);
      return;
    }

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
      () => {
        setPayments([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [loanId]);

  return { payments, loading };
}
