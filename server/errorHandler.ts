import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Custom error classes for specific error types
export class ValidationError extends Error {
  status: number;
  errors: any;
  
  constructor(message: string, errors?: any) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.errors = errors;
  }
}

export class NotFoundError extends Error {
  status: number;
  
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export class AuthorizationError extends Error {
  status: number;
  
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'AuthorizationError';
    this.status = 401;
  }
}

export class ForbiddenError extends Error {
  status: number;
  
  constructor(message = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

// Handler for Zod validation errors
export function handleZodError(error: z.ZodError) {
  const formattedErrors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
  
  return new ValidationError('Validation failed', formattedErrors);
}

// Async handler to catch async errors in route handlers
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Get status code
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  // Determine error type
  const errorType = err.name || 'Error';
  
  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    const zodError = handleZodError(err);
    
    res.status(zodError.status).json({
      success: false,
      error: {
        type: zodError.name,
        message: zodError.message,
        status: zodError.status,
        validationErrors: zodError.errors
      }
    });
    return;
  }
  
  // Handle Drizzle/Database errors
  if (err.code && (err.code.startsWith('23') || err.code.startsWith('42'))) {
    console.error(`Database Error (${err.code}): ${err.message}`);
    return res.status(400).json({
      success: false,
      error: {
        type: 'DatabaseError',
        message: 'Database operation failed',
        status: 400,
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
      }
    });
  }
  
  // Additional details for development environment
  const details = process.env.NODE_ENV !== 'production' 
    ? {
        stack: err.stack,
        code: err.code,
        ...(err.errors && { validationErrors: err.errors })
      } 
    : undefined;
  
  // Log the error (with different levels based on severity)
  if (status >= 500) {
    console.error(`Error (${status}): ${message}`, err);
  } else if (status >= 400) {
    console.warn(`Warning (${status}): ${message}`);
  } else {
    console.log(`Info (${status}): ${message}`);
  }
  
  // Send standardized response
  res.status(status).json({
    success: false,
    error: {
      type: errorType,
      message,
      status,
      ...(details && { details })
    }
  });
};