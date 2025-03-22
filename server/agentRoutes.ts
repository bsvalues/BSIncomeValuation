import { Request, Response, Router } from 'express';
import { ValuationAgent, DataCleanerAgent, ReportingAgent } from '../agents';
import { storage } from './storage';
import { authenticateJWT } from './auth';
import { asyncHandler, AuthorizationError, NotFoundError } from './errorHandler';

// Define interface for authenticated request with user payload
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    email: string;
    role: string;
  };
}

// Define interface for report generation options
interface ReportOptions {
  period: 'monthly' | 'quarterly' | 'yearly';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
}

export const agentRouter = Router();

// Initialize agents
const valuationAgent = new ValuationAgent();
const dataCleanerAgent = new DataCleanerAgent();
const reportingAgent = new ReportingAgent();

// Valuation analysis endpoint
agentRouter.get(
  '/analyze-income',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  asyncHandler(async (req: AuthenticatedRequest & { body: ReportOptions }, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    
    // Validate report options with defaults
    const period = req.body.period || 'monthly';
    if (!['monthly', 'quarterly', 'yearly'].includes(period)) {
      throw new Error(`Invalid period: ${period}. Must be one of 'monthly', 'quarterly', or 'yearly'`);
    }
    
    // Convert to boolean to ensure proper types
    const includeCharts = req.body.includeCharts !== undefined ? Boolean(req.body.includeCharts) : true;
    const includeInsights = req.body.includeInsights !== undefined ? Boolean(req.body.includeInsights) : true;
    const includeRecommendations = req.body.includeRecommendations !== undefined ? Boolean(req.body.includeRecommendations) : true;
    
    const incomes = await storage.getIncomesByUserId(userId);
    const valuations = await storage.getValuationsByUserId(userId);

    if (valuations.length === 0) {
      throw new NotFoundError('No valuation data found. Create your first valuation to generate a report.');
    }

    const reportOptions: ReportOptions = {
      period,
      includeCharts,
      includeInsights,
      includeRecommendations
    };

    const report = await reportingAgent.generateReport(incomes, valuations, reportOptions);
    
    return res.json(report);
  })
);