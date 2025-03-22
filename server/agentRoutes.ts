import { Request, Response, Router } from 'express';
import { ValuationAgent, DataCleanerAgent, ReportingAgent } from '../agents';
import { storage } from './storage';
import { authenticateJWT } from './auth';

export const agentRouter = Router();

// Initialize agents
const valuationAgent = new ValuationAgent();
const dataCleanerAgent = new DataCleanerAgent();
const reportingAgent = new ReportingAgent();

// Valuation analysis endpoint
agentRouter.get(
  '/analyze-income',
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.user.userId;
      const incomes = await storage.getIncomesByUserId(userId);

      if (incomes.length === 0) {
        return res.status(404).json({ error: 'No income data found' });
      }

      const analysis = await valuationAgent.analyzeIncome(incomes);
      return res.json(analysis);
    } catch (error) {
      console.error('Error analyzing income:', error);
      return res.status(500).json({ error: 'Failed to analyze income data' });
    }
  }
);

// Anomaly detection endpoint
agentRouter.get(
  '/detect-anomalies',
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.user.userId;
      const valuations = await storage.getValuationsByUserId(userId);

      if (valuations.length < 2) {
        return res.status(404).json({ 
          error: 'Insufficient valuation history for anomaly detection',
          message: 'You need at least two valuations to detect anomalies'
        });
      }

      const results = await valuationAgent.detectAnomalies(valuations);
      return res.json(results);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return res.status(500).json({ error: 'Failed to detect anomalies' });
    }
  }
);

// Data quality analysis endpoint
agentRouter.get(
  '/analyze-data-quality',
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.user.userId;
      const incomes = await storage.getIncomesByUserId(userId);

      if (incomes.length === 0) {
        return res.status(404).json({ error: 'No income data found' });
      }

      const analysis = await dataCleanerAgent.analyzeIncomeData(incomes);
      return res.json(analysis);
    } catch (error) {
      console.error('Error analyzing data quality:', error);
      return res.status(500).json({ error: 'Failed to analyze data quality' });
    }
  }
);

// Generate valuation summary endpoint
agentRouter.get(
  '/valuation-summary',
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.user.userId;
      const incomes = await storage.getIncomesByUserId(userId);
      const valuations = await storage.getValuationsByUserId(userId);

      if (valuations.length === 0) {
        return res.status(404).json({ 
          error: 'No valuation data found',
          message: 'Create your first valuation to get a summary'
        });
      }

      const summary = await reportingAgent.generateValuationSummary(incomes, valuations);
      return res.json({ summary });
    } catch (error) {
      console.error('Error generating valuation summary:', error);
      return res.status(500).json({ error: 'Failed to generate valuation summary' });
    }
  }
);

// Generate detailed report endpoint
agentRouter.post(
  '/generate-report',
  authenticateJWT,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.user.userId;
      const { period, includeCharts, includeInsights, includeRecommendations } = req.body;
      
      const incomes = await storage.getIncomesByUserId(userId);
      const valuations = await storage.getValuationsByUserId(userId);

      if (valuations.length === 0) {
        return res.status(404).json({ 
          error: 'No valuation data found',
          message: 'Create your first valuation to generate a report'
        });
      }

      const report = await reportingAgent.generateReport(incomes, valuations, {
        period,
        includeCharts,
        includeInsights,
        includeRecommendations
      });
      
      return res.json(report);
    } catch (error) {
      console.error('Error generating report:', error);
      return res.status(500).json({ error: 'Failed to generate report' });
    }
  }
);