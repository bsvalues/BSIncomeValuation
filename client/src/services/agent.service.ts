import { apiRequest } from '@/lib/queryClient';
import { 
  IncomeAnalysis, 
  AnomalyDetection, 
  DataQualityAnalysis, 
  ValuationSummary,
  ValuationReport
} from '@/types/agent-types';

// Base URL for agent endpoints
const AGENT_API_BASE = '/api/agents';

/**
 * Agent Service
 * Provides methods to interact with AI agent endpoints
 */
export const AgentService = {
  /**
   * Analyze income data to provide insights and recommendations
   * @param userId User ID to analyze income for
   * @returns Promise with income analysis results
   */
  analyzeIncome: async (userId: number): Promise<IncomeAnalysis> => {
    return apiRequest<IncomeAnalysis>(`${AGENT_API_BASE}/analyze-income/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Detect anomalies in valuation history
   * @param userId User ID to analyze valuations for
   * @returns Promise with anomaly detection results
   */
  detectAnomalies: async (userId: number): Promise<AnomalyDetection> => {
    return apiRequest<AnomalyDetection>(`${AGENT_API_BASE}/detect-anomalies/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Analyze data quality for a user's income sources
   * @param userId User ID to analyze data quality for
   * @returns Promise with data quality analysis
   */
  analyzeDataQuality: async (userId: number): Promise<DataQualityAnalysis> => {
    return apiRequest<DataQualityAnalysis>(`${AGENT_API_BASE}/data-quality/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Generate a summary of the valuation
   * @param valuationId ID of the valuation to summarize
   * @returns Promise with valuation summary
   */
  generateValuationSummary: async (valuationId: number): Promise<ValuationSummary> => {
    return apiRequest<ValuationSummary>(`${AGENT_API_BASE}/valuation-summary/${valuationId}`, {
      method: 'GET',
    });
  },

  /**
   * Generate a comprehensive valuation report
   * @param userId User ID to generate report for
   * @param options Report options (period, inclusions)
   * @returns Promise with generated report
   */
  generateReport: async (
    userId: number, 
    options: {
      period: 'monthly' | 'quarterly' | 'yearly';
      includeCharts: boolean;
      includeInsights: boolean;
      includeRecommendations: boolean;
    }
  ): Promise<ValuationReport> => {
    return apiRequest<ValuationReport>(`${AGENT_API_BASE}/report/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
  }
};