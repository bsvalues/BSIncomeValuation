import { Request, Response, Router } from 'express';
import { ValuationAgent, DataCleanerAgent, ReportingAgent } from '../agents';
import { storage } from './storage';
import { authenticateJWT } from './auth';
import { asyncHandler, AuthorizationError, NotFoundError } from './errorHandler';

export const agentRouter = Router();

// Initialize agents
const valuationAgent = new ValuationAgent();
const dataCleanerAgent = new DataCleanerAgent();
const reportingAgent = new ReportingAgent();

// Valuation analysis endpoint
agentRouter.get(
  '/analyze-income',
  authenticateJWT,
  asyncHandler(async (req: Request & { user?: any }, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const incomes = await storage.getIncomesByUserId(userId);

    if (incomes.length === 0) {
      throw new NotFoundError('No income data found');
    }

    const analysis = await valuationAgent.analyzeIncome(incomes);
    return res.json(analysis);
  })
);

// Anomaly detection endpoint
agentRouter.get(
  '/detect-anomalies',
  authenticateJWT,
  asyncHandler(async (req: Request & { user?: any }, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const valuations = await storage.getValuationsByUserId(userId);

    if (valuations.length < 2) {
      throw new NotFoundError('Insufficient valuation history for anomaly detection. You need at least two valuations to detect anomalies.');
    }

    const results = await valuationAgent.detectAnomalies(valuations);
    return res.json(results);
  })
);

// Data quality analysis endpoint
agentRouter.get(
  '/analyze-data-quality',
  authenticateJWT,
  asyncHandler(async (req: Request & { user?: any }, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const incomes = await storage.getIncomesByUserId(userId);

    if (incomes.length === 0) {
      throw new NotFoundError('No income data found');
    }

    const analysis = await dataCleanerAgent.analyzeIncomeData(incomes);
    return res.json(analysis);
  })
);

// Generate valuation summary endpoint
agentRouter.get(
  '/valuation-summary',
  authenticateJWT,
  asyncHandler(async (req: Request & { user?: any }, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const incomes = await storage.getIncomesByUserId(userId);
    const valuations = await storage.getValuationsByUserId(userId);

    if (valuations.length === 0) {
      throw new NotFoundError('No valuation data found. Create your first valuation to get a summary.');
    }

    const summary = await reportingAgent.generateValuationSummary(incomes, valuations);
    return res.json({ summary });
  })
);

// Generate detailed report endpoint
agentRouter.post(
  '/generate-report',
  authenticateJWT,
  asyncHandler(async (req: Request & { user?: any }, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const { period, includeCharts, includeInsights, includeRecommendations } = req.body;
    
    const incomes = await storage.getIncomesByUserId(userId);
    const valuations = await storage.getValuationsByUserId(userId);

    if (valuations.length === 0) {
      throw new NotFoundError('No valuation data found. Create your first valuation to generate a report.');
    }

    const report = await reportingAgent.generateReport(incomes, valuations, {
      period,
      includeCharts,
      includeInsights,
      includeRecommendations
    });
    
    return res.json(report);
  })
);