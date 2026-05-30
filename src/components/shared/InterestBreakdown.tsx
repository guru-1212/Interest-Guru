import { formatCurrency, formatDuration } from "@/lib/calculations";
import type { InterestBreakdown as Breakdown } from "@/types";

interface InterestBreakdownProps {
  breakdown: Breakdown;
  principal: number;
  shekdaRate: number;
  capitalizedInterest?: number;
  compact?: boolean;
}

export function InterestBreakdownDisplay({
  breakdown,
  principal,
  shekdaRate,
  capitalizedInterest = 0,
  compact = false,
}: InterestBreakdownProps) {
  const duration = formatDuration(
    breakdown.years,
    breakdown.months,
    breakdown.days
  );

  if (compact) {
    return (
      <p className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">{duration}</span>
        {" · "}
        Interest {formatCurrency(breakdown.totalInterest)}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Time elapsed
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-800">{duration}</p>
        <p className="mt-1 text-sm text-slate-500">
          {breakdown.years}y · {breakdown.months}m · {breakdown.days}d
        </p>
      </div>
      <div className="rounded-lg bg-emerald-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
          Shekda @ {shekdaRate}% / month
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          Monthly interest: {formatCurrency(breakdown.monthlyInterest)}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-xs text-slate-500">Principal</p>
        <p className="text-lg font-semibold">{formatCurrency(principal)}</p>
      </div>
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-xs text-slate-500">Total interest</p>
        <p className="text-lg font-semibold text-amber-700">
          {formatCurrency(breakdown.totalInterest)}
        </p>
        {capitalizedInterest > 0 && (
           <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
             <div className="flex justify-between">
               <span>Current:</span>
               <span>{formatCurrency(breakdown.totalInterest - capitalizedInterest)}</span>
             </div>
             <div className="flex justify-between border-t border-slate-100 pt-0.5">
               <span>Capitalized:</span>
               <span>{formatCurrency(capitalizedInterest)}</span>
             </div>
           </div>
        )}
      </div>
      <div className="col-span-full rounded-lg bg-slate-800 p-4 text-white sm:col-span-2">
        <p className="text-xs text-slate-300">Live balance (Grand Total)</p>
        <p className="text-2xl font-bold text-emerald-400">
          {formatCurrency(breakdown.grandTotal)}
        </p>
      </div>
    </div>
  );
}
