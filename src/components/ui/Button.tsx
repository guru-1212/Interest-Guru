"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
};

export function Button({
  variant = "primary",
  loading,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {children}
    </button>
  );
}
