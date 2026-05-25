"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { memberFromDoc } from "@/lib/firestore-helpers";
import type { Member } from "@/types";

export function useMembers(ownerId: string | undefined) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "members"),
      where("ownerId", "==", ownerId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => memberFromDoc(d.id, d.data()));
      list.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      setMembers(list);
      setLoading(false);
    });

    return () => unsub();
  }, [ownerId]);

  return { members, loading };
}
