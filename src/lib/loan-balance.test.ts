import { describe, it, expect } from "vitest";
import { computeLoanBalance } from "./loan-balance";
import type { Loan, Payment } from "@/types";

describe("computeLoanBalance", () => {
  const start = new Date(2024, 0, 1); // Jan 1, 2024
  const asOf = new Date(2024, 1, 1);  // Feb 1, 2024

  const mockLoan: Loan = {
    id: "l1",
    memberId: "m1",
    ownerId: "o1",
    principal: 100_000,
    shekdaRate: 2,
    startDate: start,
    proofDocuments: [],
    status: "active",
    interestMethod: "shekda_simple",
  };

  it("reduces principal and calculates interest chronologically when principal payment recorded mid-month", () => {
    const payments: Payment[] = [
      {
        id: "1",
        loanId: "l1",
        ownerId: "o1",
        amount: 10_000,
        paidAt: new Date(2024, 0, 16), // Jan 16 (15 days elapsed)
        type: "principal",
        createdBy: "o1",
        createdAt: new Date(2024, 0, 16),
      },
    ];
    const result = computeLoanBalance(mockLoan, payments, asOf);
    
    expect(result.effectivePrincipal).toBe(90_000);
    // Interest segment 1: 15 days on 100k @ 2% = 1000
    // Interest segment 2: 16 days on 90k @ 2% = 960
    // Total approx 1960. (Exact depends on month boundaries in date-fns, but should be >1900 and <2000)
    expect(result.outstandingInterest).toBeGreaterThan(1900);
    expect(result.outstandingInterest).toBeLessThan(2000);
  });

  it("reduces outstanding interest when interest payment recorded", () => {
    const payments: Payment[] = [
      {
        id: "1",
        loanId: "l1",
        ownerId: "o1",
        amount: 1000,
        paidAt: new Date(2024, 0, 20),
        type: "interest",
        createdBy: "o1",
        createdAt: new Date(2024, 0, 20),
      },
    ];
    const result = computeLoanBalance(mockLoan, payments, asOf);
    expect(result.interestPaid).toBe(1000);
    expect(result.outstandingInterest).toBe(result.accruedInterest - 1000);
  });

  it("includes capitalized interest in historical tracking but not current outstanding", () => {
    const capitalizedLoan: Loan = {
      ...mockLoan,
      principal: 95_000, // Capitalization event would have updated the principal
      startDate: new Date(2024, 0, 1), // And reset the start date
      capitalizationHistory: [
        {
          id: "c1",
          previousPrincipal: 90_000,
          interestAdded: 5000,
          newPrincipal: 95_000,
          date: new Date(2024, 0, 1), // Event on the new start date
        },
      ],
    };
    const result = computeLoanBalance(capitalizedLoan, [], asOf);
    
    // Capitalized amount should be tracked
    expect(result.capitalizedInterest).toBe(5000);
    
    // Accrued interest over 1 month on 95k @ 2% = 1900
    // Total historical accrued = 1900 + 5000 = 6900
    expect(result.accruedInterest).toBe(6900);
    
    // Current outstanding should only be the new 1900
    expect(result.outstandingInterest).toBe(1900);
  });

  it("calculates FD quarterly compounding correctly with exact chronological matching", () => {
    const fdLoan: Loan = {
      ...mockLoan,
      interestMethod: "fd_compound",
      annualRate: 10,
      compoundFrequency: "quarterly",
      startDate: new Date(2023, 0, 1), // Jan 1, 2023
    };
    
    // 1 year later (Jan 1, 2024) without payments
    const asOf2024 = new Date(2024, 0, 1);
    
    const result = computeLoanBalance(fdLoan, [], asOf2024);
    // 100k @ 10% compounded quarterly for 1 year = ~110,381.29
    expect(result.grandTotal).toBeCloseTo(110381.29, 1);
  });
});
