"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  requireApproval?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireApproval = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "owner") router.replace("/owner");
      else router.replace("/member");
      return;
    }

    if (
      requireApproval &&
      user.role === "owner" &&
      !user.isApproved
    ) {
      router.replace("/waiting");
    }
  }, [user, loading, allowedRoles, requireApproval, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) return null;

  if (requireApproval && user.role === "owner" && !user.isApproved) {
    return null;
  }

  return <>{children}</>;
}
