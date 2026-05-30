import { calculateInterest } from "@/lib/calculations";
import type { LoanBalance, Payment } from "@/types";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Apply recorded payments: principal reduces base; interest reduces accrued portion. */
export function computeLoanBalance(
  principal: number,
  shekdaRate: number,
  startDate: Date,
  payments: Payment[],
  asOf: Date = new Date()
): LoanBalance {
  let principalPaid = 0;
  let interestPaid = 0;

  for (const p of payments) {
    if (p.type === "principal") {
      principalPaid += p.amount;
    } else if (p.type === "interest") {
      interestPaid += p.amount;
    } else {
      principalPaid += p.amount / 2;
      interestPaid += p.amount / 2;
    }
  }

  const effectivePrincipal = Math.max(0, round2(principal - principalPaid));
  const breakdown = calculateInterest(
    effectivePrincipal,
    shekdaRate,
    startDate,
    asOf
  );
  const outstandingInterest = Math.max(
    0,
    round2(breakdown.totalInterest - interestPaid)
  );
  const grandTotal = round2(effectivePrincipal + outstandingInterest);

  return {
    effectivePrincipal,
    principalPaid: round2(principalPaid),
    interestPaid: round2(interestPaid),
    accruedInterest: breakdown.totalInterest,
    outstandingInterest,
    grandTotal,
    breakdown,
  };
}
