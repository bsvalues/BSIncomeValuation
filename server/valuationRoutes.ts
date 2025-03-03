import { Router, Request, Response } from "express";
import { authenticateJWT } from "./auth";
import { storage } from "./storage";
import { insertIncomeSchema, insertValuationSchema } from "@shared/schema";
import { ZodError } from "zod";

export const valuationRouter = Router();

// Get all valuations for the authenticated user
valuationRouter.get(
  "/",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.userId;
      const valuations = await storage.getValuationsByUserId(userId);
      
      res.json({
        success: true,
        data: valuations
      });
    } catch (error) {
      console.error("Error fetching valuations:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch valuations"
        }
      });
    }
  }
);

// Get a specific valuation by ID
valuationRouter.get(
  "/:id",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const valuationId = parseInt(req.params.id);
      const valuation = await storage.getValuationById(valuationId);
      
      if (!valuation) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Valuation not found"
          }
        });
      }
      
      // Check if the valuation belongs to the authenticated user
      if (valuation.userId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: "You don't have permission to access this valuation"
          }
        });
      }
      
      res.json({
        success: true,
        data: valuation
      });
    } catch (error) {
      console.error("Error fetching valuation:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch valuation"
        }
      });
    }
  }
);

// Calculate a new valuation
valuationRouter.post(
  "/calculate",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.userId;
      
      // Calculate valuation based on user's income sources
      const valuationResult = await storage.calculateValuation(userId);
      
      // Create a new valuation record
      const newValuation = await storage.createValuation({
        userId,
        name: req.body.name || `Valuation ${new Date().toLocaleDateString()}`,
        valuationAmount: valuationResult.totalValuation.toString(),
        incomeBreakdown: JSON.stringify(valuationResult.incomeBreakdown),
        multiplier: valuationResult.weightedMultiplier.toString(),
        totalAnnualIncome: valuationResult.totalAnnualIncome.toString(),
        notes: req.body.notes || "",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json({
        success: true,
        data: {
          valuation: newValuation,
          calculationDetails: valuationResult
        }
      });
    } catch (error) {
      console.error("Error calculating valuation:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to calculate valuation"
        }
      });
    }
  }
);

// Create a new income
valuationRouter.post(
  "/income",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.userId;
      
      // Validate the income data
      const incomeData = insertIncomeSchema.parse({
        ...req.body,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create the income
      const newIncome = await storage.createIncome(incomeData);
      
      res.status(201).json({
        success: true,
        data: newIncome
      });
    } catch (error) {
      console.error("Error creating income:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid income data",
            details: error.format()
          }
        });
      }
      
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to create income"
        }
      });
    }
  }
);

// Update a valuation
valuationRouter.put(
  "/:id",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const valuationId = parseInt(req.params.id);
      const userId = req.user.userId;
      
      // Check if the valuation exists and belongs to the user
      const existingValuation = await storage.getValuationById(valuationId);
      
      if (!existingValuation) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Valuation not found"
          }
        });
      }
      
      if (existingValuation.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: "You don't have permission to update this valuation"
          }
        });
      }
      
      // Update only the allowed fields
      const updatedValuation = await storage.updateValuation(valuationId, {
        notes: req.body.notes,
        updatedAt: new Date()
      });
      
      res.json({
        success: true,
        data: updatedValuation
      });
    } catch (error) {
      console.error("Error updating valuation:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to update valuation"
        }
      });
    }
  }
);

// Delete a valuation
valuationRouter.delete(
  "/:id",
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const valuationId = parseInt(req.params.id);
      const userId = req.user.userId;
      
      // Check if the valuation exists and belongs to the user
      const existingValuation = await storage.getValuationById(valuationId);
      
      if (!existingValuation) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Valuation not found"
          }
        });
      }
      
      if (existingValuation.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: "You don't have permission to delete this valuation"
          }
        });
      }
      
      // Delete the valuation
      const success = await storage.deleteValuation(valuationId);
      
      if (success) {
        res.json({
          success: true,
          message: "Valuation deleted successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: "Failed to delete valuation"
          }
        });
      }
    } catch (error) {
      console.error("Error deleting valuation:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to delete valuation"
        }
      });
    }
  }
);