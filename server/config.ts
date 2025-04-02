/**
 * Application Configuration
 * 
 * Central location for all configuration settings
 */

// Development Mode Configuration
export const config = {
  // Authentication settings
  auth: {
    // Set to false to disable authentication requirements completely
    enabled: process.env.NODE_ENV === 'production',
    
    // JWT configuration
    jwt: {
      // In development, this will be generated
      secret: process.env.JWT_SECRET || '',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },
    
    // Dev authentication toggle
    devBypass: process.env.NODE_ENV !== 'production',
  },
  
  // Database settings
  database: {
    url: process.env.DATABASE_URL || '',
    logging: process.env.NODE_ENV !== 'production',
  },
  
  // Feature flags
  features: {
    // Advanced AI features
    ai: {
      enabled: true,
      predictiveAnalytics: true,
      anomalyDetection: true,
      dataQualityAnalysis: true,
      reportGeneration: true,
    },
    
    // Custom dashboards
    customDashboards: {
      enabled: true,
      maxWidgetsPerDashboard: 10,
    },
    
    // Data export
    export: {
      enabled: true,
      formats: ['csv', 'xlsx', 'pdf'],
    },
  },
  
  // API rate limiting
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
};