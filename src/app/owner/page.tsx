"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AddMemberModal } from "@/components/owner/AddMemberModal";
import { MemberList } from "@/components/owner/MemberList";
import { OwnerDashboardStats } from "@/components/owner/OwnerDashboardStats";
import { ExportDataPanel } from "@/components/owner/ExportDataPanel";

export default function OwnerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Owner Dashboard
            </h1>
            <p className="mt-1 text-slate-600">
              Manage members, shekda rates, payments, and proof documents.
            </p>
          </div>
          <AddMemberModal />
        </div>

        <OwnerDashboardStats />
        <ExportDataPanel />

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Members</h2>
          <MemberList />
        </div>
      </div>
    </ProtectedRoute>
  );
}
