import { Income } from '../shared/schema';

/**
 * DataCleanerAgent - AI-powered agent for detecting and fixing anomalies in income data
 */
export class DataCleanerAgent {
  /**
   * Analyzes income data to detect potential issues or anomalies
   * @param incomeData Array of income records
   * @returns Object containing analysis results, issues found, and suggested fixes
   */
  async analyzeIncomeData(incomeData: Income[]) {
    // This is a placeholder for future AI implementation
    // In a real implementation, this would:
    // 1. Call an LLM API with the income data
    // 2. Use specific prompts to identify data quality issues
    // 3. Return structured results with suggestions

    const issues = [];
    const suggestedFixes = [];
    
    // Check for missing descriptions
    const missingDescriptions = incomeData.filter(income => !income.description || income.description.trim() === '');
    if (missingDescriptions.length > 0) {
      issues.push({
        type: 'missing_data',
        message: `${missingDescriptions.length} income entries are missing descriptions`,
        affectedIds: missingDescriptions.map(i => i.id)
      });
      
      suggestedFixes.push({
        type: 'add_descriptions',
        message: 'Add detailed descriptions to income sources for better categorization'
      });
    }
    
    // Check for unusual amounts (outliers)
    const amounts = incomeData.map(i => parseFloat(i.amount));
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length
    );
    
    const outliers = incomeData.filter(income => 
      Math.abs(parseFloat(income.amount) - avgAmount) > stdDev * 2 // More than 2 standard deviations
    );
    
    if (outliers.length > 0) {
      issues.push({
        type: 'outlier_amounts',
        message: `${outliers.length} income entries have unusually high or low amounts`,
        affectedIds: outliers.map(i => i.id)
      });
      
      suggestedFixes.push({
        type: 'verify_outliers',
        message: 'Verify the outlier amounts are correct and update if needed'
      });
    }
    
    // Check for duplicate entries
    const potentialDuplicates = this.findPotentialDuplicates(incomeData);
    if (potentialDuplicates.length > 0) {
      issues.push({
        type: 'potential_duplicates',
        message: `Found ${potentialDuplicates.length} potential duplicate income entries`,
        affectedGroups: potentialDuplicates
      });
      
      suggestedFixes.push({
        type: 'remove_duplicates',
        message: 'Review and remove duplicate entries to avoid double-counting'
      });
    }
    
    return {
      totalIncomeEntries: incomeData.length,
      issues,
      suggestedFixes,
      dataQualityScore: this.calculateDataQualityScore(issues, incomeData.length)
    };
  }
  
  /**
   * Finds potential duplicate income entries based on similar attributes
   * @param incomeData Array of income records
   * @returns Array of groups of potential duplicates
   */
  private findPotentialDuplicates(incomeData: Income[]): Income[][] {
    const duplicateGroups: Income[][] = [];
    const checked = new Set<number>();
    
    for (let i = 0; i < incomeData.length; i++) {
      if (checked.has(incomeData[i].id)) continue;
      
      const current = incomeData[i];
      const similars = [current];
      
      for (let j = i + 1; j < incomeData.length; j++) {
        const other = incomeData[j];
        
        const currentAmount = parseFloat(current.amount);
        const otherAmount = parseFloat(other.amount);
        
        // Consider entries similar if they have the same source and similar amounts
        if (
          current.source === other.source &&
          current.frequency === other.frequency &&
          Math.abs(currentAmount - otherAmount) < (currentAmount * 0.05) // Within 5%
        ) {
          similars.push(other);
          checked.add(other.id);
        }
      }
      
      if (similars.length > 1) {
        duplicateGroups.push(similars);
      }
      
      checked.add(current.id);
    }
    
    return duplicateGroups;
  }
  
  /**
   * Calculates a data quality score based on issues found
   * @param issues Array of issues found
   * @param totalRecords Total number of records analyzed
   * @returns Quality score from 0-100
   */
  private calculateDataQualityScore(issues: any[], totalRecords: number): number {
    if (totalRecords === 0) return 100;
    
    // Calculate how many records have issues
    const affectedRecords = new Set<number>();
    
    issues.forEach(issue => {
      if (issue.affectedIds) {
        issue.affectedIds.forEach((id: number) => affectedRecords.add(id));
      } else if (issue.affectedGroups) {
        issue.affectedGroups.forEach((group: Income[]) => {
          group.forEach(income => affectedRecords.add(income.id));
        });
      }
    });
    
    // Score is the percentage of records without issues
    const score = 100 - (affectedRecords.size / totalRecords * 100);
    return Math.round(score);
  }
}