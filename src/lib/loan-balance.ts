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
  // Only consider payments that occurred on or after the current loan.startDate.
  // Payments before this date were already factored into the principal during previous capitalizations.
  const validPayments = payments
    .filter((p) => p.paidAt.getTime() >= loan.startDate.getTime())
    .sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime());

  let currentPrincipal = loan.principal;
  let currentDate = loan.startDate;
  let segmentAccruedInterest = 0;
  let principalPaid = 0;
  let interestPaid = 0;

  // Chronological segmented calculation: 
  // Calculate interest up to each payment date, adjust principal, and continue.
  for (const p of validPayments) {
    const evDate = p.paidAt > asOf ? asOf : p.paidAt;

    if (evDate > currentDate) {
      const segment = calculateInterest(
        {
          principal: currentPrincipal,
          startDate: currentDate,
          method: loan.interestMethod,
          shekdaRate: loan.shekdaRate,
          annualRate: loan.annualRate,
          frequency: loan.compoundFrequency,
        },
        evDate
      );
      segmentAccruedInterest += segment.totalInterest;
      currentDate = evDate;
    }

    if (p.paidAt > asOf) break; // Stop processing payments in the future

    if (p.type === "principal") {
      principalPaid += p.amount;
      currentPrincipal = Math.max(0, currentPrincipal - p.amount);
    } else if (p.type === "interest") {
      interestPaid += p.amount;
    } else {
      principalPaid += p.amount / 2;
      interestPaid += p.amount / 2;
      currentPrincipal = Math.max(0, currentPrincipal - p.amount / 2);
    }
  }

  // Calculate final segment from last payment to 'asOf'
  if (asOf > currentDate) {
    const segment = calculateInterest(
      {
        principal: currentPrincipal,
        startDate: currentDate,
        method: loan.interestMethod,
        shekdaRate: loan.shekdaRate,
        annualRate: loan.annualRate,
        frequency: loan.compoundFrequency,
      },
      asOf
    );
    segmentAccruedInterest += segment.totalInterest;
  }

  // Sum up previously capitalized interest for historical tracking
  const capitalizedInterest = (loan.capitalizationHistory || []).reduce(
    (sum, event) => sum + event.interestAdded,
    0
  );

  const totalAccruedInterest = segmentAccruedInterest + capitalizedInterest;
  const outstandingInterest = Math.max(0, round2(segmentAccruedInterest - interestPaid));
  const grandTotal = round2(currentPrincipal + outstandingInterest);

  // Calculate overall duration for display purposes
  const durationInfo = calculateInterest({ principal: 0, startDate: loan.startDate }, asOf);
  const totalMonthsElapsed = durationInfo.years * 12 + durationInfo.months + (durationInfo.days / 30);
  const avgMonthly = totalMonthsElapsed > 0 ? segmentAccruedInterest / totalMonthsElapsed : 0;

  return {
    effectivePrincipal: round2(currentPrincipal),
    principalPaid: round2(principalPaid),
    interestPaid: round2(interestPaid),
    accruedInterest: round2(totalAccruedInterest),
    capitalizedInterest: round2(capitalizedInterest),
    outstandingInterest,
    grandTotal,
    breakdown: {
      years: durationInfo.years,
      months: durationInfo.months,
      days: durationInfo.days,
      totalInterest: round2(segmentAccruedInterest),
      grandTotal: grandTotal,
      monthlyInterest: round2(avgMonthly),
    },
  };
}
