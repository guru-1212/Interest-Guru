"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { loanFromDoc } from "@/lib/firestore-helpers";
import type { Loan } from "@/types";

export function useOwnerLoans(ownerId: string | undefined) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevOwnerId, setPrevOwnerId] = useState(ownerId);

  if (ownerId !== prevOwnerId) {
    setPrevOwnerId(ownerId);
    if (!ownerId) {
      setLoans([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ownerId) return;

    const q = query(
      collection(db, "loans"),
      where("ownerId", "==", ownerId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map((d) => loanFromDoc(d.id, d.data())));
      setLoading(false);
    });

    return () => unsub();
  }, [ownerId]);

  return { loans, loading };
}

export function useLoanByMember(memberId: string | undefined) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevMemberId, setPrevMemberId] = useState(memberId);

  // Adjust state during render when memberId changes
  if (memberId !== prevMemberId) {
    setPrevMemberId(memberId);
    setLoan(null);
    setLoading(!!memberId); // If no memberId, we aren't loading anything
  }

  useEffect(() => {
    if (!memberId) return;

    const q = query(
      collection(db, "loans"),
      where("memberId", "==", memberId)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setLoan(null);
      } else {
        const d = snap.docs[0];
        setLoan(loanFromDoc(d.id, d.data()));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error in useLoanByMember snapshot:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [memberId]);

  return { loan, loading };
}

export async function fetchLoanById(loanId: string): Promise<Loan | null> {
  const snap = await getDoc(doc(db, "loans", loanId));
  if (!snap.exists()) return null;
  return loanFromDoc(snap.id, snap.data());
}
