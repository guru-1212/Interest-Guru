"use client";

import Link from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-emerald-600" />
          <span className="text-xl font-bold text-slate-800">VyaajBook</span>
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user.displayName}{" "}
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 capitalize">
                {user.role}
              </span>
            </span>
            <Button variant="ghost" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
