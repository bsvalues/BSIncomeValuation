/**
 * MCP and Agent Army Configuration
 * 
 * This file contains the configuration settings for the Master Control Program (MCP)
 * and Agent Army. It defines parameters for messaging, replay buffer, training,
 * and default agent settings.
 */

import { AgentConfig, MCPConfig } from '../agents/MasterControlProgram';

/**
 * Default agent configuration
 */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  enabled: true,
  performanceThreshold: 0.7, // Minimum acceptable performance (0-1)
  maxRetries: 3,             // Max retries for failed operations
  timeoutMs: 30000           // Timeout for operations (30 seconds)
};

/**
 * Master Control Program configuration
 */
export const MCP_CONFIG: MCPConfig = {
  replayBuffer: {
    type: 'memory',           // Use in-memory replay buffer for development
    maxSize: 1000,            // Store up to 1000 experiences
    priorityThreshold: 0.7    // Threshold for high-priority experiences
  },
  training: {
    triggerThreshold: 100,    // Start training after 100 experiences
    sampleSize: 50,           // Use 50 experiences for each training session
    minPriority: 0.3          // Minimum priority for training samples
  },
  defaultAgentConfig: DEFAULT_AGENT_CONFIG
};

/**
 * Configuration for the ValuationAgent
 */
export const VALUATION_AGENT_CONFIG = {
  ...DEFAULT_AGENT_CONFIG,
  confidenceThreshold: 0.7,   // Minimum confidence for valuation results
  learningRate: 0.1,          // Learning rate for parameter adjustments
  multiplierRange: {
    min: 2.5,                 // Minimum income multiplier
    max: 5.0                  // Maximum income multiplier
  },
  // Benton County-specific settings
  bentonCountyFactors: {
    residentialBaseMultiplier: 4.2,
    commercialBaseMultiplier: 3.8,
    agriculturalBaseMultiplier: 3.5
  }
};

/**
 * Configuration for the DataCleanerAgent
 */
export const DATA_CLEANER_AGENT_CONFIG = {
  ...DEFAULT_AGENT_CONFIG,
  duplicateDetectionThreshold: 0.85,  // Similarity threshold for duplicates
  validationRules: {
    allowNegativeIncome: false,       // Whether to allow negative income values
    requireDescriptions: true,        // Whether descriptions are required
    allowedFrequencies: [             // Valid frequency values
      'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
    ]
  }
};

/**
 * Configuration for the ReportingAgent
 */
export const REPORTING_AGENT_CONFIG = {
  ...DEFAULT_AGENT_CONFIG,
  reportingPeriods: ['monthly', 'quarterly', 'yearly'],
  defaultPeriod: 'monthly',
  insightGenerationThreshold: 5,      // Minimum number of data points for insights
  chartGenerationEnabled: true        // Whether to generate chart data
};

/**
 * Configuration for the ComplianceAgent
 */
export const COMPLIANCE_AGENT_CONFIG = {
  ...DEFAULT_AGENT_CONFIG,
  complianceRules: {
    requireAuditTrail: true,          // Whether all operations need audit records
    enforceDataRetention: true,       // Whether to enforce data retention policies
    bentonCountyRegulations: {
      requiredFields: [               // Fields required for compliance
        'propertyId', 'valuationDate', 'assessorId'
      ]
    }
  },
  auditLogEnabled: true               // Whether to generate audit logs
};

/**
 * Get environment-specific configuration
 * This allows for different settings in development vs. production
 */
export function getEnvironmentConfig(): MCPConfig {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production') {
    return {
      ...MCP_CONFIG,
      replayBuffer: {
        type: 'postgres',             // Use PostgreSQL in production
        connectionString: process.env.DATABASE_URL,
        maxSize: 10000,               // Store more experiences in production
        priorityThreshold: 0.7
      },
      training: {
        triggerThreshold: 500,        // More experiences before training in production
        sampleSize: 200,              // Larger training samples in production
        minPriority: 0.3
      }
    };
  }
  
  return MCP_CONFIG;
}