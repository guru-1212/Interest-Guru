"use client";

import Link from "next/link";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Vyaaj<span className="text-emerald-600">Book</span>
          </span>
        </Link>
        
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-bold text-slate-900">
                {user.displayName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {user.role} Account
              </span>
            </div>
            <div className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
               <UserIcon className="h-5 w-5" />
            </div>
            <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block" />
            <Button 
              variant="ghost" 
              onClick={() => signOut()}
              className="h-10 w-10 p-0 sm:w-auto sm:px-4 text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline ml-2 font-bold">Sign out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
