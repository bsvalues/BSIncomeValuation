import { ReportingAgent } from '../../agents/ReportingAgent';
import { Income, Valuation } from '../../shared/schema';
import { TestIncome, TestValuation } from '../../shared/testTypes';

describe('ReportingAgent', () => {
  let reportingAgent: ReportingAgent;
  
  // Mock data for testing
  const mockIncomeData: TestIncome[] = [
    {
      id: 1,
      userId: 1,
      source: 'rental',
      amount: '2500',
      frequency: 'monthly',
      description: 'Main property rental income in Benton County',
      createdAt: new Date('2023-01-15')
    },
    {
      id: 2,
      userId: 1,
      source: 'other', // Using 'other' instead of 'parking' to match enum
      amount: '200',
      frequency: 'monthly',
      description: 'Parking space rentals',
      createdAt: new Date('2023-01-22')
    },
    {
      id: 3,
      userId: 1,
      source: 'business',
      amount: '1200',
      frequency: 'monthly',
      description: 'Business rental in Benton County commercial center',
      createdAt: new Date('2023-02-05')
    }
  ];

  const mockValuationHistory: TestValuation[] = [
    {
      id: 1,
      name: 'Initial Valuation',
      userId: 1,
      totalAnnualIncome: '54000',
      multiplier: '4.0',
      valuationAmount: '216000',
      incomeBreakdown: JSON.stringify({
        rental: 51600,
        parking: 2400
      }),
      notes: 'Initial valuation based on first year income projections',
      createdAt: new Date('2023-01-30'),
      updatedAt: new Date('2023-01-30'),
      isActive: true
    },
    {
      id: 2,
      name: '6-Month Update',
      userId: 1,
      totalAnnualIncome: '56400',
      multiplier: '4.2',
      valuationAmount: '236880',
      incomeBreakdown: JSON.stringify({
        rental: 54000,
        parking: 2400
      }),
      notes: 'Updated after rental increase for main unit',
      createdAt: new Date('2023-07-30'),
      updatedAt: new Date('2023-07-30'),
      isActive: true
    },
    {
      id: 3,
      name: 'Annual Review',
      userId: 1,
      totalAnnualIncome: '61200',
      multiplier: '4.3',
      valuationAmount: '263160',
      incomeBreakdown: JSON.stringify({
        rental: 58800,
        parking: 2400
      }),
      notes: 'Annual review with rental increases on both units',
      createdAt: new Date('2024-01-30'),
      updatedAt: new Date('2024-01-30'),
      isActive: true
    }
  ];

  beforeEach(() => {
    reportingAgent = new ReportingAgent();
  });

  describe('generateReport', () => {
    test('should throw error when no data is provided', async () => {
      await expect(reportingAgent.generateReport(null as any, null as any)).rejects.toThrow('Cannot generate report: Missing income or valuation data');
    });

    test('should generate a report with default options', async () => {
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory);
      
      // Check basic report structure
      expect(report).toBeDefined();
      expect(report.dateGenerated).toBeInstanceOf(Date);
      expect(report.periodCovered).toHaveProperty('start');
      expect(report.periodCovered).toHaveProperty('end');
      expect(report.metrics).toBeDefined();
      expect(report.summary).toBeDefined();
      
      // Should include charts by default
      expect(report.charts).toBeDefined();
    });

    test('should generate a report without charts when specified', async () => {
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        includeCharts: false
      });
      
      // Should not include charts
      expect(report.charts).toBeUndefined();
    });

    test('should generate a report with different period granularity', async () => {
      const yearlyReport = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        period: 'yearly'
      });
      
      const monthlyReport = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        period: 'monthly'
      });
      
      // Different period should result in different period coverage
      expect(yearlyReport.periodCovered.start.getTime()).toBeLessThan(monthlyReport.periodCovered.start.getTime());
    });

    test('should include insights when requested', async () => {
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        includeInsights: true
      });
      
      expect(report.insights).toBeDefined();
      expect(report.insights.length).toBeGreaterThan(0);
    });

    test('should include recommendations when requested', async () => {
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        includeRecommendations: true
      });
      
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateValuationSummary', () => {
    test('should handle empty valuation history', async () => {
      const summary = await reportingAgent.generateValuationSummary(mockIncomeData, []);
      
      expect(summary.text).toContain('No valuation data available');
      expect(summary.highlights).toHaveLength(1);
      expect(summary.trends).toHaveLength(1);
    });

    test('should generate summary with trends and highlights', async () => {
      const summary = await reportingAgent.generateValuationSummary(mockIncomeData, mockValuationHistory);
      
      expect(summary.text).toBeDefined();
      expect(summary.text.length).toBeGreaterThan(0);
      expect(summary.highlights.length).toBeGreaterThan(0);
      expect(summary.trends.length).toBeGreaterThan(0);
    });

    test('should include Benton County specific information', async () => {
      const summary = await reportingAgent.generateValuationSummary(mockIncomeData, mockValuationHistory);
      
      // Should mention Benton County in the summary
      expect(summary.text).toContain('Benton County');
    });

    test('should identify correct growth percentage', async () => {
      const summary = await reportingAgent.generateValuationSummary(mockIncomeData, mockValuationHistory);
      
      // Calculate expected growth percentage
      const firstAmount = parseFloat(mockValuationHistory[0].valuationAmount);
      const lastAmount = parseFloat(mockValuationHistory[2].valuationAmount);
      const expectedPercentChange = ((lastAmount - firstAmount) / firstAmount) * 100;
      
      // Summary should include the growth percentage
      expect(summary.text).toContain(Math.abs(expectedPercentChange).toFixed(2));
    });
  });
});