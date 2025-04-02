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
  // Check for null or undefined
  if (error == null) {
    return defaultMessage;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  // Handle axios error responses or standard fetch responses
  if (typeof error === 'object') {
    const err = error as Record<string, any>;
    
    // Handle API error response formats
    if (err.error) {
      if (typeof err.error === 'string') {
        return err.error;
      }
      if (typeof err.error === 'object' && err.error.message) {
        return err.error.message;
      }
    }
    
    // Handle message in object
    if (err.message && typeof err.message === 'string') {
      return err.message;
    }

    // Handle standard API error format
    if (err.status && err.data) {
      if (typeof err.data === 'string') {
        return err.data;
      }
      if (typeof err.data === 'object' && err.data.message) {
        return err.data.message;
      }
    }
    
    // Try to extract nested error messages
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data === 'string') {
        return data;
      }
      if (typeof data === 'object') {
        if (data.message) {
          return data.message;
        }
        if (data.error) {
          return typeof data.error === 'string' 
            ? data.error 
            : (data.error.message || JSON.stringify(data.error));
        }
      }
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Return default message for unhandled error types
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
    variant: 'destructive',
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
  patterns: Record<string, string> = commonErrorPatterns,
  defaultMessage = 'An unexpected error occurred'
): string {
  const errorMsg = getErrorMessage(error, defaultMessage);
  
  // Check each pattern for a match
  for (const [pattern, message] of Object.entries(patterns)) {
    if (errorMsg.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }
  
  return errorMsg;
}

/**
 * Common error patterns and their user-friendly messages
 */
export const commonErrorPatterns: Record<string, string> = {
  'network error': 'Unable to connect to the server. Please check your internet connection.',
  'timeout': 'The server took too long to respond. Please try again later.',
  'unauthorized': 'You are not authorized to perform this action.',
  'forbidden': 'You do not have permission to access this resource.',
  'not found': 'The requested resource could not be found.',
  'internal server error': 'Something went wrong on our servers. We\'re working on fixing it.',
  'bad gateway': 'Our server is temporarily unavailable. Please try again later.',
  'gateway timeout': 'The server took too long to respond. Please try again later.',
  'service unavailable': 'This service is temporarily unavailable. Please try again later.',
  'duplicate key': 'This item already exists in our system.',
  'validation failed': 'Some of the information you provided is not valid.',
  'required field': 'Please fill in all required fields.',
  'invalid credentials': 'The username or password you entered is incorrect.',
  'database error': 'There was a problem with our database. Please try again later.',
  'rate limit': 'You\'ve made too many requests. Please wait a moment and try again.',
};

/**
 * Get a formatted API error object from various error types
 * 
 * @param error - The error to convert
 * @returns A standardized ApiError object
 */
export function formatApiError(error: unknown): ApiError {
  const apiError: ApiError = {
    message: getErrorMessage(error),
  };
  
  // Extract additional error details if available
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, any>;
    
    // Extract status code
    if (err.status) {
      apiError.status = err.status;
    } else if (err.response?.status) {
      apiError.status = err.response.status;
    }
    
    // Extract error code
    if (err.code) {
      apiError.code = err.code;
    } else if (err.error?.code) {
      apiError.code = err.error.code;
    } else if (err.response?.data?.code) {
      apiError.code = err.response.data.code;
    }
    
    // Extract error type
    if (err.type) {
      apiError.type = err.type;
    } else if (err.error?.type) {
      apiError.type = err.error.type;
    } else if (err.response?.data?.type) {
      apiError.type = err.response.data.type;
    }
    
    // Extract additional details
    if (err.details) {
      apiError.details = err.details;
    } else if (err.error?.details) {
      apiError.details = err.error.details;
    } else if (err.response?.data?.details) {
      apiError.details = err.response.data.details;
    }
  }
  
  return apiError;
}