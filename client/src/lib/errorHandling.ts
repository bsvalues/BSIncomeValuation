/**
 * Error Handling Utilities
 * 
 * This module provides consistent error handling utilities for use throughout the application.
 */

import { toast } from '@/hooks/use-toast';

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  type?: string;
  details?: Record<string, any>;
};

/**
 * Extract error message from various error types
 * This function handles different error formats and returns a user-friendly message
 * 
 * @param error - The error object to be processed
 * @param defaultMessage - A default message to use if no specific message can be extracted
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  // Handle null or undefined error
  if (error === null || error === undefined) {
    return defaultMessage;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  // Handle standard API error responses
  if (typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  
  // Handle error response objects that contain nested error information
  if (typeof error === 'object' && 'error' in error) {
    const errorObj = (error as any).error;
    
    if (typeof errorObj === 'string') {
      return errorObj;
    }
    
    if (typeof errorObj === 'object' && errorObj !== null) {
      if ('message' in errorObj && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
    }
  }
  
  // Handle case where the error is a string
  if (typeof error === 'string') {
    return error;
  }
  
  // Unable to extract a specific error message, use the default
  return defaultMessage;
}

/**
 * Display an error toast with consistent styling
 * 
 * @param title - The toast title
 * @param error - The error object or message
 * @param defaultMessage - Default message if error doesn't contain a message
 */
export function showErrorToast(title: string, error: unknown, defaultMessage = 'An unexpected error occurred'): void {
  toast({
    title,
    description: getErrorMessage(error, defaultMessage),
    variant: "destructive",
  });
}

/**
 * Map common error patterns to user-friendly messages
 * 
 * @param error - The error to map
 * @param patterns - Object mapping error patterns to friendly messages
 * @param defaultMessage - Default message if no pattern matches
 * @returns A user-friendly error message
 */
export function mapErrorToFriendlyMessage(
  error: unknown, 
  patterns: Record<string, string>,
  defaultMessage = 'An unexpected error occurred'
): string {
  const errorMessage = getErrorMessage(error, defaultMessage);
  
  for (const [pattern, message] of Object.entries(patterns)) {
    if (errorMessage.includes(pattern)) {
      return message;
    }
  }
  
  return errorMessage;
}

/**
 * Common error patterns and their user-friendly messages
 */
export const commonErrorPatterns: Record<string, string> = {
  'Network Error': 'Unable to connect to the server. Please check your internet connection.',
  'Failed to fetch': 'Server connection failed. Please try again later.',
  'Unauthorized': 'Your session has expired. Please log in again.',
  'Forbidden': 'You don\'t have permission to access this resource.',
  '404': 'The requested resource was not found.',
  '500': 'The server encountered an error. Our team has been notified.',
  'timeout': 'The request timed out. Please try again.',
  'CORS': 'Cross-origin request blocked. Please contact support.',
};

/**
 * Get a formatted API error object from various error types
 * 
 * @param error - The error to convert
 * @returns A standardized ApiError object
 */
export function formatApiError(error: unknown): ApiError {
  if (error === null || error === undefined) {
    return { message: 'Unknown error' };
  }
  
  if (error instanceof Error) {
    return { 
      message: error.message,
      type: error.name,
      details: { stack: error.stack }
    };
  }
  
  if (typeof error === 'object') {
    // Try to extract standard properties
    const errorObj = error as Record<string, any>;
    return {
      message: errorObj.message || 'API error occurred',
      status: errorObj.status || errorObj.statusCode,
      code: errorObj.code,
      type: errorObj.type || 'ApiError',
      details: errorObj
    };
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  return { message: 'Unexpected error format' };
}