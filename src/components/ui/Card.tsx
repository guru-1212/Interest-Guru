import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = "", title }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-slate-800">{title}</h3>
      )}
      {children}
    </div>
  );
}
