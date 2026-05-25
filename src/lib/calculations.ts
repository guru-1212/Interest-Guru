import {
  addMonths,
  addYears,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  startOfDay,
} from "date-fns";
import type { InterestBreakdown } from "@/types";

/**
 * Shekda interest: monthly rate on principal; partial months use daily rate (monthly / 30).
 */
export function calculateInterest(
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
