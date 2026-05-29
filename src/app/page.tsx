"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { BookOpen, TrendingUp, Shield } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "admin") router.replace("/admin");
    else if (user.role === "owner") {
      router.replace(user.isApproved ? "/owner" : "/waiting");
    } else router.replace("/member");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <BookOpen className="mx-auto h-16 w-16 text-emerald-600" />
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
          VyaajBook
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Professional Fintech Ledger — Shekda interest tracking for lenders
          and borrowers.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Register as Owner</Button>
          </Link>
          <Link href="/register/member">
            <Button variant="ghost">Register as Member</Button>
          </Link>
        </div>
      </div>
      <div className="mt-20 grid gap-8 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="mt-3 font-semibold">Admin</h3>
          <p className="mt-2 text-sm text-slate-600">
            Approve owners and monitor the platform.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="mt-3 font-semibold">Owner</h3>
          <p className="mt-2 text-sm text-slate-600">
            Manage members, shekda rates, and document vaults.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="mt-3 font-semibold">Member</h3>
          <p className="mt-2 text-sm text-slate-600">
            View your outstanding balance in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
