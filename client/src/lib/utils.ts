import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with tailwind-merge for efficient CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency (USD)
 * @param value The number to format
 * @param options Either number of decimal places (default: 0) or a boolean to use compact notation
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options: number | boolean = 0
): string {
  const minimumFractionDigits = typeof options === 'number' ? options : 0;
  const compact = typeof options === 'boolean' ? options : false;
  
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);
}

/**
 * Formats a number as a percentage
 * @param value The number to format (e.g., 0.125 for 12.5%)
 * @param minimumFractionDigits Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  minimumFractionDigits: number = 1
): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculates monthly mortgage payment
 * @param principal Loan principal amount
 * @param annualInterestRate Annual interest rate (as a percentage, e.g., 4.5 for 4.5%)
 * @param termInYears Loan term in years
 * @returns Monthly payment amount
 */
export function calculateMortgagePayment(
  principal: number,
  annualInterestRate: number,
  termInYears: number
): number {
  if (principal <= 0 || annualInterestRate <= 0 || termInYears <= 0) {
    return 0;
  }
  
  const monthlyRate = annualInterestRate / 100 / 12;
  const numPayments = termInYears * 12;
  
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numPayments);
  const denominator = Math.pow(1 + monthlyRate, numPayments) - 1;
  
  return principal * (numerator / denominator);
}

/**
 * Calculates capitalization rate
 * @param netOperatingIncome Annual net operating income
 * @param propertyValue Property value or purchase price
 * @returns Cap rate as a decimal (e.g., 0.065 for 6.5%)
 */
export function calculateCapRate(
  netOperatingIncome: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) {
    return 0;
  }
  
  return netOperatingIncome / propertyValue;
}

/**
 * Calculates cash-on-cash return
 * @param annualCashFlow Annual cash flow after all expenses and debt service
 * @param initialInvestment Initial cash investment (typically down payment + closing costs)
 * @returns Cash-on-cash return as a decimal (e.g., 0.085 for 8.5%)
 */
export function calculateCashOnCash(
  annualCashFlow: number,
  initialInvestment: number
): number {
  if (initialInvestment <= 0) {
    return 0;
  }
  
  return annualCashFlow / initialInvestment;
}

/**
 * Calculates net operating income
 * @param effectiveGrossIncome Annual effective gross income after vacancy
 * @param operatingExpenses Annual operating expenses
 * @returns Net operating income
 */
export function calculateNOI(
  effectiveGrossIncome: number,
  operatingExpenses: number
): number {
  return effectiveGrossIncome - operatingExpenses;
}

/**
 * Calculates effective gross income
 * @param potentialGrossIncome Annual potential gross income
 * @param vacancyRate Vacancy rate as a percentage (e.g., 5 for 5%)
 * @param otherIncome Other income
 * @returns Effective gross income
 */
export function calculateEffectiveGrossIncome(
  potentialGrossIncome: number,
  vacancyRate: number,
  otherIncome: number = 0
): number {
  return potentialGrossIncome * (1 - vacancyRate / 100) + otherIncome;
}

/**
 * Calculates annual cash flow
 * @param netOperatingIncome Annual net operating income
 * @param debtService Annual debt service (mortgage payments)
 * @returns Annual cash flow
 */
export function calculateCashFlow(
  netOperatingIncome: number,
  debtService: number
): number {
  return netOperatingIncome - debtService;
}