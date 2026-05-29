import { describe, it, expect } from "vitest";
import { computeLoanBalance } from "./loan-balance";
import type { Payment } from "@/types";

describe("computeLoanBalance", () => {
  const start = new Date(2024, 0, 1);
  const asOf = new Date(2024, 1, 1);

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
    const result = computeLoanBalance(100_000, 2, start, payments, asOf);
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
    const result = computeLoanBalance(100_000, 2, start, payments, asOf);
    expect(result.interestPaid).toBe(1000);
    expect(result.outstandingInterest).toBeLessThan(result.accruedInterest);
  });
});
