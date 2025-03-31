import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, authTokens } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// JWT Secret configuration
// Generate a random secret for development if JWT_SECRET is not set
import crypto from 'crypto';

// Create a secure JWT_SECRET from environment or generate it for development
const JWT_SECRET: string = (() => {
  const envSecret = process.env.JWT_SECRET;
  if (envSecret) return envSecret;
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production mode');
  }
  
  // For development, generate a random secret that persists for the session
  // This is more secure than a hardcoded value, but still not suitable for production
  const generatedSecret = crypto.randomBytes(64).toString('hex');
  console.log('Generated random JWT_SECRET for development. This will change on server restart.');
  return generatedSecret;
})();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h"; // Access token expiry 
const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Interface for JWT payload - exported for testing
export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
}

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password with hash
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT tokens
export const generateTokens = (payload: JwtPayload) => {
  // Make sure JWT_SECRET is a string
  if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
    throw new Error('JWT_SECRET must be provided as a string');
  }
  
  // Access token
  const accessToken = jwt.sign(
    payload, 
    JWT_SECRET as jwt.Secret, 
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Refresh token (longer lived)
  const refreshToken = jwt.sign(
    payload, 
    JWT_SECRET as jwt.Secret, 
    { expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
};

// Store refresh token in the database
export const storeRefreshToken = async (userId: number, token: string) => {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);

  // Insert new token
  await db.insert(authTokens).values({
    userId,
    token,
    expiresAt,
  });
};

// Verify refresh token from database
export const verifyRefreshToken = async (token: string) => {
  try {
    // Make sure JWT_SECRET is available
    if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
      console.error('JWT_SECRET must be provided as a string');
      return null;
    }
    
    // For TypeScript to recognize the secret properly
    const secretKey = JWT_SECRET as jwt.Secret;
    
    // Verify token signature using synchronous version for proper typing
    let decoded: JwtPayload;
    
    try {
      decoded = jwt.verify(token, secretKey) as JwtPayload;
    } catch (jwtError) {
      console.warn('JWT verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown error');
      // Track JWT verification failures (potential security issue)
      if (jwtError instanceof jwt.JsonWebTokenError) {
        console.warn('Invalid JWT token structure or signature');
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        console.warn('JWT token expired');
      } else if (jwtError instanceof jwt.NotBeforeError) {
        console.warn('JWT token not active yet');
      }
      return null;
    }

    // Check if token exists and is not revoked
    const [storedToken] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, token),
          eq(authTokens.revoked, false),
          gt(authTokens.expiresAt, new Date())
        )
      );

    if (!storedToken) {
      console.warn('Token not found in database or revoked or expired');
      return null;
    }

    return decoded;
  } catch (error) {
    console.warn('Error verifying refresh token:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

// Revoke refresh token (on logout)
export const revokeRefreshToken = async (token: string) => {
  await db
    .update(authTokens)
    .set({ revoked: true })
    .where(eq(authTokens.token, token));
};

// Middleware to authenticate JWT
export const authenticateJWT = (
  req: Request & { user?: JwtPayload },
  res: Response,
  next: NextFunction
) => {
  // In development mode, bypass authentication and set a mock user
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ DEVELOPMENT MODE: Authentication bypassed. Request authenticated with mock user.');
    // Set mock user for development
    req.user = {
      userId: 1,
      username: 'devuser',
      email: 'dev@example.com',
      role: 'user'
    };
    return next();
  }
  
  // Production authentication logic below
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthorizationError',
        message: "Authorization token required",
        status: 401,
        code: 'MISSING_TOKEN'
      }
    });
  }

  const parts = authHeader.split(" ");
  
  // Check if the Authorization header has the correct format (Bearer TOKEN)
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthorizationError',
        message: "Authorization header format must be 'Bearer {token}'",
        status: 401,
        code: 'INVALID_AUTH_FORMAT'
      }
    });
  }

  const token = parts[1];

  try {
    // Make sure JWT_SECRET is available
    if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
      console.error('JWT_SECRET must be provided as a string');
      return res.status(500).json({
        success: false,
        error: {
          type: 'ServerError',
          message: "Server configuration error",
          status: 500,
          code: 'SERVER_CONFIGURATION_ERROR'
        }
      });
    }
    
    // For TypeScript to recognize the secret properly
    const secretKey = JWT_SECRET as jwt.Secret;
    
    try {
      // Use the synchronous version to avoid TypeScript errors with callbacks
      const decoded = jwt.verify(token, secretKey) as JwtPayload;
      req.user = decoded;
      next();
    } catch (jwtError) {
      // Provide more specific error messages based on the JWT error type
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: "Access token has expired",
            status: 401,
            code: 'TOKEN_EXPIRED'
          }
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(403).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: "Invalid token",
            status: 403,
            code: 'INVALID_TOKEN'
          }
        });
      } else {
        return res.status(403).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: "Token validation failed",
            status: 403,
            code: 'TOKEN_VALIDATION_FAILED'
          }
        });
      }
    }
  } catch (err) {
    console.error('Error in authentication middleware:', err);
    return res.status(500).json({
      success: false,
      error: {
        type: 'ServerError',
        message: "Authentication error",
        status: 500,
        code: 'AUTH_ERROR'
      }
    });
  }
};

// Get user by ID
export const getUserById = async (id: number) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

// Get user by email
export const getUserByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
};

// Get user by username
export const getUserByUsername = async (username: string) => {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
};

// Update last login timestamp
export const updateLastLogin = async (userId: number) => {
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, userId));
};