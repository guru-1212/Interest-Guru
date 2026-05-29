"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userFromDoc } from "@/lib/firestore-helpers";
import type { User } from "@/types";
import { Card } from "@/components/ui/Card";
import { Loader2, ShieldCheck } from "lucide-react";

export function OwnersTable() {
  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "owner")
    );

    const unsub = onSnapshot(q, (snap) => {
      setOwners(
        snap.docs
          .map((d) => userFromDoc(d.id, d.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      );
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const toggleApproval = async (owner: User) => {
    setUpdating(owner.id);
    try {
      await updateDoc(doc(db, "users", owner.id), {
        isApproved: !owner.isApproved,
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <Card title="Registered Owners">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Email</th>
              <th className="pb-3 pr-4 font-medium">Registered</th>
              <th className="pb-3 font-medium">Approved</th>
            </tr>
          </thead>
          <tbody>
            {owners.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  No owners registered yet.
                </td>
              </tr>
            ) : (
              owners.map((owner) => (
                <tr
                  key={owner.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-4 pr-4 font-medium text-slate-800">
                    {owner.displayName}
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{owner.email}</td>
                  <td className="py-4 pr-4 text-slate-600">
                    {owner.createdAt.toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <button
                      type="button"
                      onClick={() => toggleApproval(owner)}
                      disabled={updating === owner.id}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        owner.isApproved
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {updating === owner.id
                        ? "..."
                        : owner.isApproved
                          ? "Approved"
                          : "Approve"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
