/**
 * Utility functions for formatting various data types
 */

/**
 * Format a number as currency
 * @param amount The number to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format a date in a human-readable format
 * @param date The date to format
 * @param format The format to use (defaults to US style)
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number): string => {
  // Convert to Date if not already
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Format a percentage
 * @param value The percentage value (0-1)
 * @param decimalPlaces The number of decimal places to include
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimalPlaces = 1): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
};

/**
 * Format a number with commas and decimal places
 * @param value The number to format
 * @param decimalPlaces The number of decimal places to include
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimalPlaces = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
};