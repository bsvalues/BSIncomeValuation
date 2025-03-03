import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { insertValuationSchema } from "@shared/schema";
import { authenticateJWT } from "./auth";
import { z } from "zod";

export const valuationRouter = Router();

// Get available income multipliers
valuationRouter.get(
  "/multipliers",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const multipliers = await storage.getAllIncomeMultipliers();
      res.json(multipliers);
    } catch (error) {
      console.error("Error fetching multipliers:", error);
      res.status(500).json({ error: "Failed to fetch income multipliers" });
    }
  }
);

// Calculate valuation based on user's income sources
valuationRouter.post(
  "/calculate",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.userId;
      
      // Calculate valuation
      const valuation = await storage.calculateValuation(userId);
      
      res.json(valuation);
    } catch (error) {
      console.error("Error calculating valuation:", error);
      res.status(500).json({ error: "Failed to calculate valuation" });
    }
  }
);

// Save calculated valuation
valuationRouter.post(
  "/save",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.userId;
      
      // Validate request body
      const valuationData = req.body;
      const validationSchema = z.object({
        totalAnnualIncome: z.number().or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)),
        multiplier: z.number().or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)),
        notes: z.string().optional(),
      });
      
      const validatedData = validationSchema.parse(valuationData);
      
      // Calculate valuation amount
      const totalAnnualIncome = parseFloat(validatedData.totalAnnualIncome.toString());
      const multiplier = parseFloat(validatedData.multiplier.toString());
      const valuationAmount = totalAnnualIncome * multiplier;
      
      // Create valuation in database
      const newValuation = await storage.createValuation({
        userId,
        totalAnnualIncome: totalAnnualIncome.toString(),
        multiplier: multiplier.toString(),
        valuationAmount: valuationAmount.toString(),
        notes: validatedData.notes,
      });
      
      res.status(201).json(newValuation);
    } catch (error) {
      console.error("Error saving valuation:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid valuation data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to save valuation" });
      }
    }
  }
);

// Admin endpoint to manage income multipliers
valuationRouter.post(
  "/multipliers",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
      }
      
      const multiplierData = req.body;
      const validationSchema = z.object({
        source: z.string().min(1),
        multiplier: z.number().or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      
      const validatedData = validationSchema.parse(multiplierData);
      
      // Create multiplier in database
      const newMultiplier = await storage.createIncomeMultiplier({
        source: validatedData.source,
        multiplier: validatedData.multiplier.toString(),
        description: validatedData.description,
        isActive: validatedData.isActive,
      });
      
      res.status(201).json(newMultiplier);
    } catch (error) {
      console.error("Error creating multiplier:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid multiplier data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create multiplier" });
      }
    }
  }
);

// Update an income multiplier
valuationRouter.put(
  "/multipliers/:id",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid multiplier ID" });
      }
      
      const multiplierData = req.body;
      const validationSchema = z.object({
        source: z.string().min(1).optional(),
        multiplier: z.number().or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      
      const validatedData = validationSchema.parse(multiplierData);
      
      // Update multiplier in database
      const updatedMultiplier = await storage.updateIncomeMultiplier(id, {
        source: validatedData.source,
        multiplier: validatedData.multiplier?.toString(),
        description: validatedData.description,
        isActive: validatedData.isActive,
      });
      
      if (!updatedMultiplier) {
        return res.status(404).json({ error: "Multiplier not found" });
      }
      
      res.json(updatedMultiplier);
    } catch (error) {
      console.error("Error updating multiplier:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid multiplier data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update multiplier" });
      }
    }
  }
);

// Delete an income multiplier
valuationRouter.delete(
  "/multipliers/:id",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid multiplier ID" });
      }
      
      const success = await storage.deleteIncomeMultiplier(id);
      
      if (!success) {
        return res.status(404).json({ error: "Multiplier not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting multiplier:", error);
      res.status(500).json({ error: "Failed to delete multiplier" });
    }
  }
);