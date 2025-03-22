import { Income, Valuation } from '../shared/schema';
import { IncomeAnalysis, AnomalyDetection } from '../client/src/types/agent-types';

/**
 * ValuationAgent - AI-powered agent for analyzing income data and generating valuation insights
 */
export class ValuationAgent {
  /**
   * Analyzes income data to provide valuation insights
   * @param incomeData Array of income records
   * @returns Analysis results and recommendations
   */
  async analyzeIncome(incomeData: Income[]): Promise<IncomeAnalysis> {
    // This is a placeholder for future AI implementation
    // In a real implementation, this would:
    // 1. Call an LLM API (OpenAI, Anthropic, etc.)
    // 2. Process the income data with specific prompts
    // 3. Return structured insights and recommendations

    const totalMonthlyIncome = incomeData.reduce((total, income) => {
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

    const incomeBySource = incomeData.reduce((acc, income) => {
      const source = income.source;
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(income);
      return acc;
    }, {} as Record<string, Income[]>);

    // Calculate income distribution by source
    const distribution = Object.entries(incomeBySource).map(([source, incomes]) => {
      const sourceTotal = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const totalIncome = incomeData.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const percentage = (sourceTotal / totalIncome) * 100;
      
      return {
        source,
        percentage: Math.round(percentage)
      };
    });

    return {
      analysis: {
        findings: [
          `Your total monthly income is $${totalMonthlyIncome.toFixed(2)}`,
          `You have ${incomeData.length} income sources across ${Object.keys(incomeBySource).length} categories`,
          `The most common income type is ${this.getMostCommonIncomeType(incomeBySource)}`
        ],
        distribution,
        recommendations: [
          'Consider diversifying income sources for stability',
          'Recurring income streams provide higher valuation multiples',
          'Investment income sources should be increased for long-term growth'
        ]
      }
    };
  }

  /**
   * Detects anomalies in valuation history
   * @param valuationHistory Array of valuation records
   * @returns Detected anomalies and insights
   */
  async detectAnomalies(valuationHistory: Valuation[]): Promise<AnomalyDetection> {
    // Placeholder for anomaly detection logic
    // Real implementation would use AI to identify patterns and outliers

    // Sort valuations by date
    const sortedValuations = [...valuationHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate percentage changes and detect anomalies
    interface ValuationChange {
      from: Date;
      to: Date;
      percentChange: number;
      isAnomaly: boolean;
    }
    
    const changes: ValuationChange[] = [];
    for (let i = 1; i < sortedValuations.length; i++) {
      const prevValue = parseFloat(sortedValuations[i - 1].valuationAmount);
      const currValue = parseFloat(sortedValuations[i].valuationAmount);
      const percentChange = ((currValue - prevValue) / prevValue) * 100;
      const isAnomaly = Math.abs(percentChange) > 20; // Consider >20% change an anomaly
      
      if (isAnomaly) {
        changes.push({
          from: new Date(sortedValuations[i - 1].createdAt),
          to: new Date(sortedValuations[i].createdAt),
          percentChange,
          isAnomaly
        });
      }
    }

    // Format anomalies according to the interface
    type Severity = 'high' | 'medium' | 'low';
    
    const formattedAnomalies = changes.map(change => {
      const dateFrom = change.from.toLocaleDateString();
      const dateTo = change.to.toLocaleDateString();
      const isIncrease = change.percentChange > 0;
      const absChange = Math.abs(change.percentChange).toFixed(1);
      
      let severity: Severity;
      if (Math.abs(change.percentChange) > 50) {
        severity = 'high';
      } else if (Math.abs(change.percentChange) > 30) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
      
      return {
        type: `Sudden ${isIncrease ? 'Increase' : 'Decrease'}`,
        severity,
        description: `${isIncrease ? 'Increase' : 'Decrease'} of ${absChange}% between ${dateFrom} and ${dateTo}`,
        recommendation: `Review changes in income sources during this period to understand the ${isIncrease ? 'growth' : 'decline'}`
      };
    });

    return {
      anomalies: formattedAnomalies,
      insights: formattedAnomalies.length > 0 
        ? [`Detected ${formattedAnomalies.length} significant changes in your valuation history`,
           `The largest change was ${Math.max(...changes.map(c => Math.abs(c.percentChange))).toFixed(1)}%`]
        : ['Your valuation history shows consistent growth']
    };
  }

  /**
   * Helper method to find the most common income type
   * @param incomeBySource Record mapping income sources to arrays of income records
   * @returns The most common income source type
   */
  private getMostCommonIncomeType(incomeBySource: Record<string, Income[]>): string {
    let maxCount = 0;
    let mostCommonType = '';
    
    for (const [source, incomes] of Object.entries(incomeBySource)) {
      if (incomes.length > maxCount) {
        maxCount = incomes.length;
        mostCommonType = source;
      }
    }
    
    return mostCommonType;
  }
}