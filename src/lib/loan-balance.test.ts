import { describe, it, expect } from "vitest";
import { computeLoanBalance } from "./loan-balance";
import type { Loan, Payment } from "@/types";

describe("computeLoanBalance", () => {
  const start = new Date(2024, 0, 1);
  const asOf = new Date(2024, 1, 1);

  const mockLoan: Loan = {
    id: "l1",
    memberId: "m1",
    ownerId: "o1",
    principal: 100_000,
    shekdaRate: 2,
    startDate: start,
    proofDocuments: [],
    status: "active",
  };

  it("reduces principal when principal payment recorded", () => {
    const payments: Payment[] = [
      {
        id: "1",
        loanId: "l1",
        ownerId: "o1",
        amount: 10_000,
        paidAt: new Date(2024, 0, 15),
        type: "principal",
        createdBy: "o1",
        createdAt: new Date(2024, 0, 15),
      },
    ];
    const result = computeLoanBalance(mockLoan, payments, asOf);
    expect(result.effectivePrincipal).toBe(90_000);
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
    expect(result.outstandingInterest).toBeLessThan(result.accruedInterest);
  });

  it("includes capitalized interest in total accrued interest", () => {
    const capitalizedLoan: Loan = {
      ...mockLoan,
      capitalizationHistory: [
        {
          id: "c1",
          previousPrincipal: 90_000,
          interestAdded: 5000,
          newPrincipal: 95_000,
          date: new Date(2023, 11, 1),
        },
      ],
    };
    const result = computeLoanBalance(capitalizedLoan, [], asOf);
    expect(result.capitalizedInterest).toBe(5000);
    // 100k principal, 2% rate, 1 month = 2000 interest.
    // Total accrued should be 2000 + 5000 = 7000.
    expect(result.accruedInterest).toBe(7000);
  });
});
