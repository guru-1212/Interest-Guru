import { calculateInterest } from "@/lib/calculations";
import type { Loan, LoanBalance, Payment } from "@/types";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Apply recorded payments: principal reduces base; interest reduces accrued portion. */
export function computeLoanBalance(
  loan: Loan,
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

  // Sum up previously capitalized interest
  const capitalizedInterest = (loan.capitalizationHistory || []).reduce(
    (sum, event) => sum + event.interestAdded,
    0
  );

  const effectivePrincipal = Math.max(0, round2(loan.principal - principalPaid));
  const breakdown = calculateInterest(
    effectivePrincipal,
    loan.shekdaRate,
    loan.startDate,
    asOf
  );
  
  // Total accrued interest is what's accrued now + what was already capitalized
  const totalAccruedInterest = round2(breakdown.totalInterest + capitalizedInterest);
  
  const outstandingInterest = Math.max(
    0,
    round2(totalAccruedInterest - interestPaid)
  );
  
  const grandTotal = round2(effectivePrincipal + outstandingInterest);

  return {
    effectivePrincipal,
    principalPaid: round2(principalPaid),
    interestPaid: round2(interestPaid),
    accruedInterest: totalAccruedInterest,
    capitalizedInterest: round2(capitalizedInterest),
    outstandingInterest,
    grandTotal,
    breakdown,
  };
}
