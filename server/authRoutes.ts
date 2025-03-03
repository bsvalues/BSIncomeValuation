import { Router, Request, Response } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { loginSchema, registerSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  hashPassword,
  comparePassword,
  generateTokens,
  storeRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  getUserByUsername,
  getUserByEmail,
  updateLastLogin,
  authenticateJWT,
} from "./auth";

// Create auth router
export const authRouter = Router();

// Register route
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request data
    const userData = registerSchema.parse(req.body);

    // Check if username or email already exists
    const existingUsername = await getUserByUsername(userData.username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const existingEmail = await getUserByEmail(userData.email);
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Create new user
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
    });

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Return user data and tokens
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    } else {
      res.status(500).json({ error: "Failed to register user" });
    }
  }
});

// Login route
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request data
    const loginData = loginSchema.parse(req.body);

    // Find user by username
    const user = await getUserByUsername(loginData.username);
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      loginData.password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
    });

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Return user data and tokens
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    } else {
      res.status(500).json({ error: "Failed to login" });
    }
  }
});

// Token refresh route
authRouter.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Generate new tokens
    const newTokens = generateTokens({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    });

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Store new refresh token
    await storeRefreshToken(payload.userId, newTokens.refreshToken);

    // Return new tokens
    res.json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

// Logout route
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Revoke refresh token
    await revokeRefreshToken(refreshToken);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// Get current user route (protected)
authRouter.get(
  "/me",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      // User is available from the middleware
      const { userId } = req.user;

      // Fetch user from database to get latest data
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

// Missing import error fix
import { eq } from "drizzle-orm";