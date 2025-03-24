import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertIncomeSchema, insertValuationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { authRouter } from "./authRoutes";
import { dashboardRouter } from "./dashboardRoutes";
import { valuationRouter } from "./valuationRoutes";
import { agentRouter } from "./agentRoutes";
import { devAuthRouter } from "./devAuthRoutes";
import { asyncHandler, NotFoundError, ValidationError } from "./errorHandler";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Health check route
  router.get("/health", (req: Request, res: Response) => {
    res.json({ message: "Income Valuation SaaS API is running!" });
  });
  
  // Register auth routes
  router.use("/auth", authRouter);
  
  // Register dashboard routes
  router.use("/dashboard", dashboardRouter);
  
  // Register valuation routes
  router.use("/valuation", valuationRouter);
  
  // Register AI agent routes
  router.use("/agents", agentRouter);
  
  // Register dev auth routes (only available in development)
  router.use("/dev-auth", devAuthRouter);
  
  // Income multipliers route
  router.get("/multipliers", asyncHandler(async (req: Request, res: Response) => {
    const multipliers = await storage.getAllIncomeMultipliers();
    res.json(multipliers);
  }));

  // User routes
  router.post("/users", asyncHandler(async (req: Request, res: Response) => {
    console.log("Request body:", req.body);
    try {
      const userData = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", userData);
      const user = await storage.createUser(userData);
      console.log("Created user:", user);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new ValidationError(validationError.message);
      }
      throw error;
    }
  }));

  router.get("/users/:id", asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new NotFoundError("User not found");
    }
    
    res.json(user);
  }));

  // Income routes
  router.get("/users/:userId/incomes", asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const incomes = await storage.getIncomesByUserId(userId);
    res.json(incomes);
  }));

  router.get("/incomes/:id", asyncHandler(async (req: Request, res: Response) => {
    const incomeId = parseInt(req.params.id);
    const income = await storage.getIncomeById(incomeId);
    
    if (!income) {
      throw new NotFoundError("Income not found");
    }
    
    res.json(income);
  }));

  router.post("/incomes", asyncHandler(async (req: Request, res: Response) => {
    try {
      const incomeData = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(incomeData);
      res.status(201).json(income);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new ValidationError(validationError.message);
      }
      throw error;
    }
  }));

  router.put("/incomes/:id", async (req: Request, res: Response) => {
    try {
      const incomeId = parseInt(req.params.id);
      const incomeData = req.body;
      const income = await storage.updateIncome(incomeId, incomeData);
      if (!income) {
        return res.status(404).json({ error: "Income not found" });
      }
      res.json(income);
    } catch (error) {
      res.status(500).json({ error: "Failed to update income" });
    }
  });

  router.delete("/incomes/:id", async (req: Request, res: Response) => {
    try {
      const incomeId = parseInt(req.params.id);
      const success = await storage.deleteIncome(incomeId);
      if (!success) {
        return res.status(404).json({ error: "Income not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete income" });
    }
  });

  // Valuation routes
  router.get("/users/:userId/valuations", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const valuations = await storage.getValuationsByUserId(userId);
      res.json(valuations);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve valuations" });
    }
  });

  router.get("/valuations/:id", async (req: Request, res: Response) => {
    try {
      const valuationId = parseInt(req.params.id);
      const valuation = await storage.getValuationById(valuationId);
      if (!valuation) {
        return res.status(404).json({ error: "Valuation not found" });
      }
      res.json(valuation);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve valuation" });
    }
  });

  router.post("/valuations", asyncHandler(async (req: Request, res: Response) => {
    try {
      const valuationData = insertValuationSchema.parse(req.body);
      const valuation = await storage.createValuation(valuationData);
      res.status(201).json(valuation);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new ValidationError(validationError.message);
      }
      throw error;
    }
  }));

  router.put("/valuations/:id", asyncHandler(async (req: Request, res: Response) => {
    const valuationId = parseInt(req.params.id);
    const valuationData = req.body;
    const valuation = await storage.updateValuation(valuationId, valuationData);
    
    if (!valuation) {
      throw new NotFoundError("Valuation not found");
    }
    
    res.json(valuation);
  }));

  router.delete("/valuations/:id", asyncHandler(async (req: Request, res: Response) => {
    const valuationId = parseInt(req.params.id);
    const success = await storage.deleteValuation(valuationId);
    
    if (!success) {
      throw new NotFoundError("Valuation not found");
    }
    
    res.json({ success: true });
  }));

  // Register API routes with /api prefix
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
