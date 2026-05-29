"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ServiceWorkerRegister />
      <Navbar />
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </AuthProvider>
  );
}
