"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { memberFromDoc, loanFromDoc } from "@/lib/firestore-helpers";
import type { Loan, Member, User } from "@/types";

export function useMemberDashboard(user: User | null) {
  const [member, setMember] = useState<Member | null>(null);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMember(null);
      setLoan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let memberUnsub: (() => void) | undefined;
    let loanUnsub: (() => void) | undefined;

    const attachLoanListener = (memberId: string) => {
      loanUnsub?.();
      const loanQ = query(
        collection(db, "loans"),
        where("memberId", "==", memberId),
        limit(1)
      );
      loanUnsub = onSnapshot(loanQ, (loanSnap) => {
        if (loanSnap.empty) {
          setLoan(null);
        } else {
          const d = loanSnap.docs[0];
          setLoan(loanFromDoc(d.id, d.data()));
        }
        setLoading(false);
      });
    };

    if (user.memberId) {
      memberUnsub = onSnapshot(doc(db, "members", user.memberId), (snap) => {
        if (snap.exists()) {
          const m = memberFromDoc(snap.id, snap.data());
          setMember(m);
          attachLoanListener(m.id);
        } else {
          setMember(null);
          setLoan(null);
          setLoading(false);
        }
      });
      return () => {
        memberUnsub?.();
        loanUnsub?.();
      };
    }

    const queries = [];
    if (user.email) {
      queries.push(
        query(
          collection(db, "members"),
          where("email", "==", user.email),
          limit(1)
        )
      );
    }
    if (user.phone) {
      queries.push(
        query(
          collection(db, "members"),
          where("phone", "==", user.phone),
          limit(1)
        )
      );
    }

    if (queries.length === 0) {
      setLoading(false);
      return;
    }

    let found = false;
    let pending = queries.length;

    const unsubs = queries.map((q) =>
      onSnapshot(q, (snap) => {
        pending -= 1;
        if (!found && !snap.empty) {
          found = true;
          const d = snap.docs[0];
          const m = memberFromDoc(d.id, d.data());
          setMember(m);
          attachLoanListener(m.id);
        }
        if (pending === 0 && !found) {
          setMember(null);
          setLoan(null);
          setLoading(false);
        }
      })
    );

    return () => {
      unsubs.forEach((u) => u());
      loanUnsub?.();
    };
  }, [user?.id, user?.email, user?.phone, user?.memberId]);

  return { member, loan, loading };
}
