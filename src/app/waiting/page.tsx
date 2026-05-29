"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { userFromDoc } from "@/lib/firestore-helpers";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function WaitingContent() {
  const { firebaseUser, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      if (!snap.exists()) return;
      const profile = userFromDoc(snap.id, snap.data());
      if (profile.isApproved) {
        refreshUser();
        router.replace("/owner");
      }
    });
    return () => unsub();
  }, [firebaseUser, router, refreshUser]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10">
        <Clock className="mx-auto h-14 w-14 text-amber-600" />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Waiting for Admin Approval
        </h1>
        <p className="mt-4 text-slate-600">
          Your owner account has been registered. An administrator must approve
          your account before you can access the dashboard and manage members.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          You will be redirected automatically once approved.
        </p>
      </div>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <ProtectedRoute allowedRoles={["owner"]} requireApproval={false}>
      <WaitingContent />
    </ProtectedRoute>
  );
}
