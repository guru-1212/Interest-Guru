import { describe, it, expect } from "vitest";
import { calculateInterest, formatCurrency } from "./calculations";

describe("calculateInterest", () => {
  it("computes zero interest on start date", () => {
    const start = new Date(2024, 0, 15);
    const result = calculateInterest({
      principal: 100_000,
      shekdaRate: 2,
      startDate: start,
      method: "shekda_simple"
    }, start);
    expect(result.totalInterest).toBe(0);
    expect(result.grandTotal).toBe(100_000);
    expect(result.monthlyInterest).toBe(2000);
  });

  it("computes one full month of interest", () => {
    const start = new Date(2024, 0, 1);
    const asOf = new Date(2024, 1, 1);
    const result = calculateInterest({
      principal: 100_000,
      shekdaRate: 2,
      startDate: start,
      method: "shekda_simple"
    }, asOf);
    expect(result.months).toBe(1);
    expect(result.totalInterest).toBe(2000);
    expect(result.grandTotal).toBe(102_000);
  });

  it("uses daily rate for partial month (monthly/30)", () => {
    const start = new Date(2024, 0, 1);
    const asOf = new Date(2024, 0, 16);
    const result = calculateInterest({
      principal: 100_000,
      shekdaRate: 2,
      startDate: start,
      method: "shekda_simple"
    }, asOf);
    const monthly = 2000;
    const daily = monthly / 30;
    expect(result.days).toBe(15);
    expect(result.totalInterest).toBe(Math.round(15 * daily * 100) / 100);
  });
});

describe("formatCurrency", () => {
  it("formats INR", () => {
    expect(formatCurrency(1000)).toContain("1");
  });
});
