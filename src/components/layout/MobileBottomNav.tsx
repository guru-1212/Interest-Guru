"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Shield, Wallet, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  let links: { href: string; label: string; icon: typeof LayoutDashboard }[] =
    [];

  if (user.role === "owner") {
    links = user.isApproved
      ? [{ href: "/owner", label: "Dashboard", icon: LayoutDashboard }]
      : [{ href: "/waiting", label: "Waiting", icon: Clock }];
  } else if (user.role === "member") {
    links = [{ href: "/member", label: "Balance", icon: Wallet }];
  } else if (user.role === "admin") {
    links = [{ href: "/admin", label: "Owners", icon: Shield }];
  }

  if (links.length === 0) return null;

  return (
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around rounded-[2rem] border border-white/20 bg-slate-900/90 px-4 shadow-2xl backdrop-blur-xl">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link 
              key={href} 
              href={href} 
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                active ? "text-emerald-400 scale-110" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ${
                active ? "bg-emerald-500/10" : ""
              }`}>
                <Icon className="h-6 w-6" aria-hidden />
                {active && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
