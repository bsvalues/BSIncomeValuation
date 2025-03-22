import { Income, Valuation } from '../shared/schema';
import { ValuationReport, ValuationSummary } from '../client/src/types/agent-types';

type ReportingPeriod = 'monthly' | 'quarterly' | 'yearly';

interface ReportOptions {
  period: ReportingPeriod;
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
}

interface ValuationInsight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  importance: 'high' | 'medium' | 'low';
}

interface ReportRecommendation {
  title: string;
  description: string;
  actionItems: string[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * ReportingAgent - AI-powered agent for generating insights and reports from valuations
 */
export class ReportingAgent {
  /**
   * Generates a comprehensive report based on income and valuation data
   * @param incomeData Array of income records
   * @param valuationHistory Array of valuation records
   * @param options Report configuration options
   * @returns Generated report with insights and recommendations
   */
  async generateReport(
    incomeData: Income[], 
    valuationHistory: Valuation[],
    options: Partial<ReportOptions> = {}
  ): Promise<ValuationReport> {
    // Apply default options
    const reportOptions: ReportOptions = {
      period: options.period || 'monthly',
      includeCharts: options.includeCharts !== undefined ? options.includeCharts : true,
      includeInsights: options.includeInsights !== undefined ? options.includeInsights : true,
      includeRecommendations: options.includeRecommendations !== undefined ? options.includeRecommendations : true
    };
    
    // Sort valuations by date
    const sortedValuations = [...valuationHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Generate time-based subsets of data
    const periodData = this.getDataByPeriod(sortedValuations, reportOptions.period);
    
    // Calculate key metrics
    const metrics = this.calculateMetrics(incomeData, sortedValuations);
    
    // Generate insights if requested
    const insights = reportOptions.includeInsights 
      ? this.generateInsights(incomeData, sortedValuations, metrics)
      : [];
      
    // Generate recommendations if requested
    const recommendations = reportOptions.includeRecommendations
      ? this.generateRecommendations(incomeData, sortedValuations, metrics)
      : [];
      
    // Prepare chart data if requested
    const chartData = reportOptions.includeCharts
      ? this.prepareChartData(incomeData, sortedValuations, reportOptions.period)
      : null;
      
    // Compile the report
    return {
      generatedAt: new Date().toISOString(),
      period: reportOptions.period,
      summary: this.generateSummary(metrics, insights),
      metrics,
      periodData,
      insights,
      recommendations,
      chartData
    };
  }
  
  /**
   * Generates a natural language summary of valuation performance
   * @param incomeData Array of income records
   * @param valuationHistory Array of valuation records
   * @returns Generated summary text
   */
  async generateValuationSummary(incomeData: Income[], valuationHistory: Valuation[]): Promise<ValuationSummary> {
    // This is a placeholder for future AI implementation
    // In a real implementation, this would:
    // 1. Call an LLM API with the income and valuation data
    // 2. Use specific prompts to generate natural language summary
    // 3. Return formatted text with key insights
    
    if (valuationHistory.length === 0) {
      return { summary: "No valuation data available yet. Create your first valuation to get started with insights." };
    }
    
    // Sort valuations by date
    const sortedValuations = [...valuationHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const latestValuation = sortedValuations[sortedValuations.length - 1];
    const metrics = this.calculateMetrics(incomeData, sortedValuations);
    
    // Generate a simple summary based on the calculated metrics
    const latestAmount = parseFloat(latestValuation.valuationAmount);
    let summary = `Your latest valuation is $${latestAmount.toLocaleString()}`;
    
    if (sortedValuations.length > 1) {
      const previousValuation = sortedValuations[sortedValuations.length - 2];
      const prevAmount = parseFloat(previousValuation.valuationAmount);
      const change = latestAmount - prevAmount;
      const percentChange = (change / prevAmount) * 100;
      
      summary += `, which is ${percentChange >= 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(1)}% from your previous valuation`;
    }
    
    summary += `. Your current weighted multiplier is ${metrics.weightedMultiplier.toFixed(2)}x.`;
    
    // Add income source insights
    if (incomeData.length > 0) {
      const incomeBySource = incomeData.reduce((acc, income) => {
        const source = income.source;
        if (!acc[source]) {
          acc[source] = [];
        }
        acc[source].push(income);
        return acc;
      }, {} as Record<string, Income[]>);
      
      const sourceCount = Object.keys(incomeBySource).length;
      summary += `\n\nYou have ${incomeData.length} income streams across ${sourceCount} source types.`;
      
      // Identify highest value source
      let highestSourceTotal = 0;
      let highestSourceName = '';
      
      for (const [source, incomes] of Object.entries(incomeBySource)) {
        const total = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
        if (total > highestSourceTotal) {
          highestSourceTotal = total;
          highestSourceName = source;
        }
      }
      
      summary += ` Your highest value income source is ${highestSourceName}.`;
    }
    
    return { summary };
  }
  
  /**
   * Private helper methods below
   */
  
  private getDataByPeriod(valuations: Valuation[], period: ReportingPeriod) {
    // Group valuations by the specified period
    const periodData: Record<string, Valuation[]> = {};
    
    valuations.forEach(valuation => {
      const date = new Date(valuation.createdAt);
      let key: string;
      
      switch (period) {
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          break;
      }
      
      if (!periodData[key]) {
        periodData[key] = [];
      }
      
      periodData[key].push(valuation);
    });
    
    return periodData;
  }
  
  private calculateMetrics(incomes: Income[], valuations: Valuation[]) {
    // Current values
    const latestValuation = valuations.length > 0 
      ? valuations[valuations.length - 1] 
      : null;
      
    // Income metrics
    const totalMonthlyIncome = incomes.reduce((total, income) => {
      // Convert all income to monthly
      let monthlyAmount = parseFloat(income.amount);
      if (income.frequency === 'yearly') {
        monthlyAmount = monthlyAmount / 12;
      } else if (income.frequency === 'weekly') {
        monthlyAmount = monthlyAmount * 4.33;
      } else if (income.frequency === 'daily') {
        monthlyAmount = monthlyAmount * 30;
      }
      return total + monthlyAmount;
    }, 0);
    
    const totalAnnualIncome = totalMonthlyIncome * 12;
    
    // Valuation metrics
    const weightedMultiplier = latestValuation ? parseFloat(latestValuation.valuationAmount) / totalAnnualIncome : 0;
    
    // Growth metrics
    let growthRate = 0;
    if (valuations.length >= 2) {
      const firstValuation = valuations[0];
      const lastValuation = valuations[valuations.length - 1];
      const firstAmount = parseFloat(firstValuation.valuationAmount);
      const lastAmount = parseFloat(lastValuation.valuationAmount);
      const timeDiff = new Date(lastValuation.createdAt).getTime() - new Date(firstValuation.createdAt).getTime();
      const yearsDiff = timeDiff / (1000 * 60 * 60 * 24 * 365);
      
      if (yearsDiff > 0 && firstAmount > 0) {
        // Compound Annual Growth Rate (CAGR)
        growthRate = Math.pow(lastAmount / firstAmount, 1 / yearsDiff) - 1;
      }
    }
    
    return {
      totalMonthlyIncome,
      totalAnnualIncome,
      weightedMultiplier,
      latestValuationAmount: latestValuation ? parseFloat(latestValuation.valuationAmount) : 0,
      incomeSourceCount: new Set(incomes.map(i => i.source)).size,
      incomeStreamCount: incomes.length,
      annualGrowthRate: growthRate
    };
  }
  
  private generateInsights(
    incomes: Income[], 
    valuations: Valuation[], 
    metrics: any
  ): ValuationInsight[] {
    const insights: ValuationInsight[] = [];
    
    // Insight on valuation trend
    if (valuations.length >= 2) {
      const lastValuation = valuations[valuations.length - 1];
      const previousValuation = valuations[valuations.length - 2];
      const lastAmount = parseFloat(lastValuation.valuationAmount);
      const prevAmount = parseFloat(previousValuation.valuationAmount);
      const change = lastAmount - prevAmount;
      const percentChange = (change / prevAmount) * 100;
      
      insights.push({
        type: percentChange >= 0 ? 'positive' : 'negative',
        message: `Your valuation has ${percentChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(1)}% since your previous valuation.`,
        importance: Math.abs(percentChange) > 10 ? 'high' : 'medium'
      });
    }
    
    // Insight on income diversity
    if (metrics.incomeSourceCount < 3 && incomes.length > 0) {
      insights.push({
        type: 'negative',
        message: `Your income is concentrated in only ${metrics.incomeSourceCount} source types, which may increase risk.`,
        importance: 'medium'
      });
    } else if (metrics.incomeSourceCount >= 3) {
      insights.push({
        type: 'positive',
        message: `Your income is diversified across ${metrics.incomeSourceCount} different source types, which reduces risk.`,
        importance: 'medium'
      });
    }
    
    // Insight on valuation multiplier
    if (metrics.weightedMultiplier > 0) {
      const multiplierQuality = metrics.weightedMultiplier >= 5 ? 'high' : 
                               (metrics.weightedMultiplier >= 3 ? 'good' : 'low');
      
      insights.push({
        type: multiplierQuality === 'low' ? 'negative' : 'positive',
        message: `Your valuation multiplier of ${metrics.weightedMultiplier.toFixed(2)}x is ${multiplierQuality} compared to industry averages.`,
        importance: 'high'
      });
    }
    
    return insights;
  }
  
  private generateRecommendations(
    incomes: Income[], 
    valuations: Valuation[], 
    metrics: any
  ): ReportRecommendation[] {
    const recommendations: ReportRecommendation[] = [];
    
    // Recommendation on income diversification
    if (metrics.incomeSourceCount < 3 && incomes.length > 0) {
      recommendations.push({
        title: 'Diversify Income Sources',
        description: 'Adding more diverse income sources can increase your valuation and reduce risk.',
        actionItems: [
          'Consider adding passive income streams like investments or rental income',
          'Explore freelance opportunities in your area of expertise',
          'Look into creating digital products or content for recurring revenue'
        ],
        priority: 'high'
      });
    }
    
    // Recommendation on highest-multiple income sources
    const incomeBySource = incomes.reduce((acc, income) => {
      if (!acc[income.source]) {
        acc[income.source] = [];
      }
      acc[income.source].push(income);
      return acc;
    }, {} as Record<string, Income[]>);
    
    // Find sources with highest and lowest multiples
    let highestMultipleSource = '';
    let highestMultiple = 0;
    
    for (const source in incomeBySource) {
      // Simulating multiplier values for different sources
      let multiplier = 0;
      switch (source) {
        case 'rental':
          multiplier = 8;
          break;
        case 'investment':
          multiplier = 7;
          break;
        case 'business':
          multiplier = 5;
          break;
        case 'salary':
          multiplier = 3;
          break;
        case 'freelance':
          multiplier = 4;
          break;
        default:
          multiplier = 2;
      }
      
      if (multiplier > highestMultiple) {
        highestMultiple = multiplier;
        highestMultipleSource = source;
      }
    }
    
    if (highestMultipleSource) {
      recommendations.push({
        title: 'Focus on High-Multiple Income',
        description: `${highestMultipleSource} income has the highest valuation multiple at ${highestMultiple}x.`,
        actionItems: [
          `Increase your allocation to ${highestMultipleSource} income where possible`,
          'Consider converting lower-multiple income sources to this type',
          'Research ways to optimize this income stream further'
        ],
        priority: 'medium'
      });
    }
    
    // General recommendation on tracking
    recommendations.push({
      title: 'Regular Valuation Updates',
      description: 'Keeping your valuations current provides better insights and trends.',
      actionItems: [
        'Schedule monthly or quarterly valuation updates',
        'Track changes in your income composition over time',
        'Document factors that influence valuation changes'
      ],
      priority: 'low'
    });
    
    return recommendations;
  }
  
  private prepareChartData(
    incomes: Income[], 
    valuations: Valuation[], 
    period: ReportingPeriod
  ) {
    // Prepare data for charts based on the period
    
    // Valuation over time chart
    const valuationHistory = valuations.map(v => ({
      date: v.createdAt,
      amount: v.valuationAmount
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Income by source breakdown
    const incomeBySource = incomes.reduce((acc, income) => {
      // Normalize to annual amounts
      let annualAmount = parseFloat(income.amount);
      if (income.frequency === 'monthly') {
        annualAmount *= 12;
      } else if (income.frequency === 'weekly') {
        annualAmount *= 52;
      } else if (income.frequency === 'daily') {
        annualAmount *= 365;
      }
      
      if (!acc[income.source]) {
        acc[income.source] = 0;
      }
      acc[income.source] += annualAmount;
      return acc;
    }, {} as Record<string, number>);
    
    const incomeBreakdown = Object.entries(incomeBySource).map(([source, amount]) => ({
      source,
      amount
    }));
    
    return {
      valuationHistory,
      incomeBreakdown
    };
  }
  
  private generateSummary(metrics: any, insights: ValuationInsight[]) {
    // Generate a concise summary from metrics and key insights
    let summary = `Current valuation: $${metrics.latestValuationAmount.toLocaleString()}`;
    
    if (metrics.annualGrowthRate !== 0) {
      summary += ` with ${metrics.annualGrowthRate >= 0 ? 'growth' : 'decline'} rate of ${Math.abs(metrics.annualGrowthRate * 100).toFixed(1)}% annually.`;
    }
    
    // Add high importance insights
    const highImportanceInsights = insights.filter(i => i.importance === 'high');
    if (highImportanceInsights.length > 0) {
      summary += ` Key insight: ${highImportanceInsights[0].message}`;
    }
    
    return summary;
  }
}