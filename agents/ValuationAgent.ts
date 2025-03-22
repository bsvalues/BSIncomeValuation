import { Income, Valuation } from '../shared/schema';

/**
 * ValuationAgent - AI-powered agent for analyzing income data and generating valuation insights
 */
export class ValuationAgent {
  /**
   * Analyzes income data to provide valuation insights
   * @param incomeData Array of income records
   * @returns Analysis results and recommendations
   */
  async analyzeIncome(incomeData: Income[]) {
    // This is a placeholder for future AI implementation
    // In a real implementation, this would:
    // 1. Call an LLM API (OpenAI, Anthropic, etc.)
    // 2. Process the income data with specific prompts
    // 3. Return structured insights and recommendations

    const totalMonthlyIncome = incomeData.reduce((total, income) => {
      // Convert all income to monthly
      let monthlyAmount = income.amount;
      if (income.frequency === 'yearly') {
        monthlyAmount = income.amount / 12;
      } else if (income.frequency === 'weekly') {
        monthlyAmount = income.amount * 4.33;
      } else if (income.frequency === 'daily') {
        monthlyAmount = income.amount * 30;
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

    return {
      totalMonthlyIncome,
      incomeBySource,
      insights: [
        `Your total monthly income is $${totalMonthlyIncome.toFixed(2)}`,
        `You have ${incomeData.length} income sources across ${Object.keys(incomeBySource).length} categories`,
        `The most common income type is ${this.getMostCommonIncomeType(incomeBySource)}`
      ],
      recommendations: [
        'Consider diversifying income sources for stability',
        'Recurring income streams provide higher valuation multiples',
        'Investment income sources should be increased for long-term growth'
      ]
    };
  }

  /**
   * Detects anomalies in valuation history
   * @param valuationHistory Array of valuation records
   * @returns Detected anomalies and insights
   */
  async detectAnomalies(valuationHistory: Valuation[]) {
    // Placeholder for anomaly detection logic
    // Real implementation would use AI to identify patterns and outliers

    // Sort valuations by date
    const sortedValuations = [...valuationHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate percentage changes
    const changes = [];
    for (let i = 1; i < sortedValuations.length; i++) {
      const prevValue = sortedValuations[i - 1].valuationAmount;
      const currValue = sortedValuations[i].valuationAmount;
      const percentChange = ((currValue - prevValue) / prevValue) * 100;
      changes.push({
        from: sortedValuations[i - 1].createdAt,
        to: sortedValuations[i].createdAt,
        percentChange,
        isAnomaly: Math.abs(percentChange) > 20 // Consider >20% change an anomaly
      });
    }

    const anomalies = changes.filter(change => change.isAnomaly);

    return {
      anomalies,
      insights: anomalies.length > 0 
        ? [`Detected ${anomalies.length} significant changes in your valuation history`]
        : ['Your valuation history shows consistent growth']
    };
  }

  /**
   * Helper method to find the most common income type
   */
  private getMostCommonIncomeType(incomeBySource: Record<string, Income[]>) {
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