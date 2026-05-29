"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OwnersTable } from "@/components/admin/OwnersTable";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-slate-600">
            Approve owners and monitor platform access.
          </p>
        </div>
        <OwnersTable />
      </div>
    </ProtectedRoute>
  );
}
