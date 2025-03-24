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
  router.get("/multipliers", async (req: Request, res: Response) => {
    try {
      const multipliers = await storage.getAllIncomeMultipliers();
      res.json(multipliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve income multipliers" });
    }
  });

  // User routes
  router.post("/users", async (req: Request, res: Response) => {
    try {
      console.log("Request body:", req.body);
      const userData = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", userData);
      const user = await storage.createUser(userData);
      console.log("Created user:", user);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  router.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve user" });
    }
  });

  // Income routes
  router.get("/users/:userId/incomes", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const incomes = await storage.getIncomesByUserId(userId);
      res.json(incomes);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve incomes" });
    }
  });

  router.get("/incomes/:id", async (req: Request, res: Response) => {
    try {
      const incomeId = parseInt(req.params.id);
      const income = await storage.getIncomeById(incomeId);
      if (!income) {
        return res.status(404).json({ error: "Income not found" });
      }
      res.json(income);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve income" });
    }
  });

  router.post("/incomes", async (req: Request, res: Response) => {
    try {
      const incomeData = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(incomeData);
      res.status(201).json(income);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to create income" });
      }
    }
  });

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

  router.post("/valuations", async (req: Request, res: Response) => {
    try {
      const valuationData = insertValuationSchema.parse(req.body);
      const valuation = await storage.createValuation(valuationData);
      res.status(201).json(valuation);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to create valuation" });
      }
    }
  });

  router.put("/valuations/:id", async (req: Request, res: Response) => {
    try {
      const valuationId = parseInt(req.params.id);
      const valuationData = req.body;
      const valuation = await storage.updateValuation(valuationId, valuationData);
      if (!valuation) {
        return res.status(404).json({ error: "Valuation not found" });
      }
      res.json(valuation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update valuation" });
    }
  });

  router.delete("/valuations/:id", async (req: Request, res: Response) => {
    try {
      const valuationId = parseInt(req.params.id);
      const success = await storage.deleteValuation(valuationId);
      if (!success) {
        return res.status(404).json({ error: "Valuation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete valuation" });
    }
  });

  // Register API routes with /api prefix
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
