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

// Interface for JWT payload
interface JwtPayload {
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
  // Access token
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  // Refresh token (longer lived)
  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "30d",
  });

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
    // Verify token signature
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

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
      return null;
    }

    return decoded;
  } catch (error) {
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
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      req.user = user as JwtPayload;
      next();
    });
  } else {
    res.status(401).json({ error: "Authorization token required" });
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