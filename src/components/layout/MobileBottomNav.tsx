"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Shield, Wallet, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const linkClass = (active: boolean) =>
  `flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition ${
    active ? "text-emerald-600" : "text-slate-500 hover:text-slate-800"
  }`;

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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={linkClass(active)}>
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
