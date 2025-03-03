import { Router, Request, Response } from 'express';
import { authenticateJWT } from './auth';
import { storage } from './storage';

export const dashboardRouter = Router();

interface IncomeSummary {
  source: string;
  total: number;
  count: number;
  averageAmount: number;
}

interface DashboardResponse {
  recentValuations: any[];
  incomeSummaryByType: IncomeSummary[];
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  valuationCount: number;
  incomeCount: number;
  latestValuation: any | null;
}

// Dashboard endpoint for authenticated users
dashboardRouter.get('/', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.userId;
    
    // Get recent valuations (last 5)
    const allValuations = await storage.getValuationsByUserId(userId);
    const recentValuations = allValuations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    // Get all incomes for the user
    const incomes = await storage.getIncomesByUserId(userId);
    
    // Calculate income summary by type
    const incomeByType: Record<string, IncomeSummary> = {};
    let totalMonthlyIncome = 0;
    let totalAnnualIncome = 0;
    
    incomes.forEach(income => {
      // Initialize the income type if not exists
      if (!incomeByType[income.source]) {
        incomeByType[income.source] = {
          source: income.source,
          total: 0,
          count: 0,
          averageAmount: 0
        };
      }
      
      // Calculate annual amount for this income
      let annualAmount = 0;
      let monthlyAmount = 0;
      
      switch (income.frequency) {
        case 'monthly':
          monthlyAmount = Number(income.amount);
          annualAmount = monthlyAmount * 12;
          break;
        case 'yearly':
          annualAmount = Number(income.amount);
          monthlyAmount = annualAmount / 12;
          break;
        case 'weekly':
          monthlyAmount = Number(income.amount) * 4.33; // average weeks in a month
          annualAmount = monthlyAmount * 12;
          break;
        case 'daily':
          monthlyAmount = Number(income.amount) * 30.42; // average days in a month
          annualAmount = monthlyAmount * 12;
          break;
        default:
          annualAmount = Number(income.amount);
          monthlyAmount = annualAmount / 12;
      }
      
      // Update summary
      incomeByType[income.source].total += annualAmount;
      incomeByType[income.source].count += 1;
      totalAnnualIncome += annualAmount;
      totalMonthlyIncome += monthlyAmount;
    });
    
    // Calculate averages
    Object.values(incomeByType).forEach(summary => {
      summary.averageAmount = summary.total / summary.count;
    });
    
    // Get latest valuation
    const latestValuation = recentValuations.length > 0 ? recentValuations[0] : null;
    
    const dashboardData: DashboardResponse = {
      recentValuations,
      incomeSummaryByType: Object.values(incomeByType),
      totalMonthlyIncome,
      totalAnnualIncome,
      valuationCount: allValuations.length,
      incomeCount: incomes.length,
      latestValuation
    };
    
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get detailed dashboard data including trends
dashboardRouter.get('/detailed', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.userId;
    
    // Get all valuations
    const valuations = await storage.getValuationsByUserId(userId);
    
    // Get all incomes
    const incomes = await storage.getIncomesByUserId(userId);
    
    // Calculate income and valuation trends over time
    const valuationsByMonth: Record<string, { totalIncome: number; totalValuation: number }> = {};
    
    // Process valuations and group by month
    valuations.forEach(valuation => {
      const date = new Date(valuation.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!valuationsByMonth[monthKey]) {
        valuationsByMonth[monthKey] = {
          totalIncome: 0,
          totalValuation: 0
        };
      }
      
      valuationsByMonth[monthKey].totalIncome = Number(valuation.totalAnnualIncome);
      valuationsByMonth[monthKey].totalValuation = Number(valuation.valuationAmount);
    });
    
    // Convert to array and sort by date
    const valuationTrends = Object.entries(valuationsByMonth).map(([month, data]) => ({
      month,
      totalIncome: data.totalIncome,
      totalValuation: data.totalValuation,
      multiplier: data.totalIncome > 0 ? data.totalValuation / data.totalIncome : 0
    })).sort((a, b) => a.month.localeCompare(b.month));
    
    return res.status(200).json({
      valuationTrends,
      incomesBySource: incomes.reduce((acc: Record<string, number>, income) => {
        const source = income.source;
        if (!acc[source]) acc[source] = 0;
        acc[source] += Number(income.amount);
        return acc;
      }, {}),
      incomesByFrequency: incomes.reduce((acc: Record<string, number>, income) => {
        const frequency = income.frequency;
        if (!acc[frequency]) acc[frequency] = 0;
        acc[frequency] += Number(income.amount);
        return acc;
      }, {}),
      valuationCount: valuations.length,
      incomeCount: incomes.length
    });
  } catch (error) {
    console.error('Detailed dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch detailed dashboard data' });
  }
});

// Export the summary data for a specific valuation
dashboardRouter.get('/valuation/:id/summary', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.userId;
    const valuationId = parseInt(req.params.id);
    
    // Get the valuation
    const valuation = await storage.getValuationById(valuationId);
    
    if (!valuation) {
      return res.status(404).json({ error: 'Valuation not found' });
    }
    
    // Check if the valuation belongs to the user
    if (valuation.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to valuation' });
    }
    
    // Get incomes associated with this valuation
    // In a real app, you might store this association directly
    // For now, we'll just get all user incomes
    const incomes = await storage.getIncomesByUserId(userId);
    
    // Calculate income breakdown
    const incomeBreakdown = incomes.reduce((acc: Record<string, number>, income) => {
      const source = income.source;
      if (!acc[source]) acc[source] = 0;
      
      // Convert to annual amount
      let annualAmount = 0;
      switch (income.frequency) {
        case 'monthly':
          annualAmount = Number(income.amount) * 12;
          break;
        case 'yearly':
          annualAmount = Number(income.amount);
          break;
        case 'weekly':
          annualAmount = Number(income.amount) * 52;
          break;
        case 'daily':
          annualAmount = Number(income.amount) * 365;
          break;
        default:
          annualAmount = Number(income.amount);
      }
      
      acc[source] += annualAmount;
      return acc;
    }, {});
    
    return res.status(200).json({
      valuation,
      incomeBreakdown,
      totalIncome: Object.values(incomeBreakdown).reduce((sum, amount) => sum + amount, 0),
      incomeCount: incomes.length
    });
  } catch (error) {
    console.error('Valuation summary error:', error);
    return res.status(500).json({ error: 'Failed to fetch valuation summary' });
  }
});