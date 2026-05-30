import {
  addMonths,
  addYears,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  startOfDay,
} from "date-fns";
import type { InterestBreakdown, InterestMethod, CompoundFrequency } from "@/types";

/**
 * Shekda interest: monthly rate on principal; partial months use daily rate (monthly / 30).
 * This is the default Simple Interest method.
 */
export function calculateShekdaSimple(
  principal: number,
  shekdaRate: number,
  startDate: Date,
  asOf: Date = new Date()
): InterestBreakdown {
  const today = startOfDay(asOf);
  const start = startOfDay(startDate);

  const years = differenceInYears(today, start);
  const afterYears = addYears(start, years);
  const months = differenceInMonths(today, afterYears);
  const afterMonths = addMonths(afterYears, months);
  const days = differenceInDays(today, afterMonths);

  const monthlyInterest = (principal * shekdaRate) / 100;
  const dailyInterest = monthlyInterest / 30;

  const fullMonths = years * 12 + months;
  const totalInterest =
    fullMonths * monthlyInterest + days * dailyInterest;
  const grandTotal = principal + totalInterest;

  return {
    years,
    months,
    days,
    totalInterest: Math.round(totalInterest * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    monthlyInterest: Math.round(monthlyInterest * 100) / 100,
  };
}

/**
 * Monthly Compounding Shekda: Every month, the interest is added to the principal.
 */
export function calculateShekdaCompound(
  principal: number,
  shekdaRate: number,
  startDate: Date,
  asOf: Date = new Date()
): InterestBreakdown {
  const today = startOfDay(asOf);
  const start = startOfDay(startDate);

  const totalMonths = differenceInMonths(today, start);
  let currentPrincipal = principal;

  // Compound for each full month
  for (let i = 0; i < totalMonths; i++) {
    const monthInterest = (currentPrincipal * shekdaRate) / 100;
    currentPrincipal += monthInterest;
  }

  // Calculate days for the partial month
  const afterFullMonths = addMonths(start, totalMonths);
  const remainingDays = differenceInDays(today, afterFullMonths);
  
  const monthlyInterestOnFinalPrincipal = (currentPrincipal * shekdaRate) / 100;
  const dailyInterest = monthlyInterestOnFinalPrincipal / 30;
  const partialInterest = remainingDays * dailyInterest;

  const totalInterest = (currentPrincipal - principal) + partialInterest;
  const grandTotal = principal + totalInterest;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return {
    years,
    months,
    days: remainingDays,
    totalInterest: Math.round(totalInterest * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    monthlyInterest: Math.round(monthlyInterestOnFinalPrincipal * 100) / 100,
  };
}

/**
 * FD / Bank Deposit Compounding: Uses annual rate and specific compounding frequency.
 */
export function calculateFDCompound(
  principal: number,
  annualRate: number,
  frequency: CompoundFrequency,
  startDate: Date,
  asOf: Date = new Date()
): InterestBreakdown {
  const today = startOfDay(asOf);
  const start = startOfDay(startDate);

  let compoundsPerYear = 4; // default quarterly
  if (frequency === "monthly") compoundsPerYear = 12;
  if (frequency === "quarterly") compoundsPerYear = 4;
  if (frequency === "half-yearly") compoundsPerYear = 2;
  if (frequency === "yearly") compoundsPerYear = 1;
  if (frequency === "at_maturity") compoundsPerYear = 0; // Simple interest

  const totalDays = differenceInDays(today, start);
  const years = totalDays / 365;

  let grandTotal = principal;

  if (compoundsPerYear > 0) {
    // Standard Compound Interest Formula: A = P(1 + r/n)^(nt)
    grandTotal = principal * Math.pow(1 + (annualRate / 100) / compoundsPerYear, compoundsPerYear * years);
  } else {
    // Simple Interest (At Maturity)
    grandTotal = principal * (1 + (annualRate / 100) * years);
  }

  const totalInterest = grandTotal - principal;

  // For duration breakdown
  const diffYears = differenceInYears(today, start);
  const diffMonths = differenceInMonths(today, addYears(start, diffYears));
  const diffDays = differenceInDays(today, addMonths(addYears(start, diffYears), diffMonths));

  const totalMonthsElapsed = differenceInMonths(today, start) + (diffDays / 30);
  const monthlyAverage = totalMonthsElapsed > 0 ? totalInterest / totalMonthsElapsed : 0;

  return {
    years: diffYears,
    months: diffMonths,
    days: diffDays,
    totalInterest: Math.round(totalInterest * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    monthlyInterest: Math.round(monthlyAverage * 100) / 100,
  };
}

/**
 * Router for all interest methods
 */
export function calculateInterest(
  config: {
    principal: number;
    startDate: Date;
    method?: InterestMethod;
    shekdaRate?: number;
    annualRate?: number;
    frequency?: CompoundFrequency;
  },
  asOf: Date = new Date()
): InterestBreakdown {
  const { principal, startDate, method = "shekda_simple", shekdaRate = 0, annualRate = 0, frequency = "quarterly" } = config;

  switch (method) {
    case "shekda_compound":
      return calculateShekdaCompound(principal, shekdaRate, startDate, asOf);
    case "fd_compound":
      return calculateFDCompound(principal, annualRate, frequency, startDate, asOf);
    case "fd_payout":
      // FD Payout is actually just simple interest on the principal at annual rate
      return calculateFDCompound(principal, annualRate, "yearly", startDate, asOf); // Simplified: payout frequency doesn't change total accrued if it's not compounding
    case "shekda_simple":
    default:
      return calculateShekdaSimple(principal, shekdaRate, startDate, asOf);
  }
}

export function formatDuration(years: number, months: number, days: number): string {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Year${years !== 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} Month${months !== 1 ? "s" : ""}`);
  if (days > 0) parts.push(`${days} Day${days !== 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "0 Days";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}
