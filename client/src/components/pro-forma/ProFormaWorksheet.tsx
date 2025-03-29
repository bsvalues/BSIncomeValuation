import React, { forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Printer, Download, FileDown } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { usePDF } from 'react-to-pdf';

// Export type for ref
export interface ProFormaWorksheetRef {
  downloadPDF: () => void;
}

interface ProFormaData {
  propertyInfo: {
    propertyType: string;
    propertyAddress: string;
    squareFootage: number;
    yearBuilt: number;
    currentAssessment: number;
    location: string;
  };
  incomeProjections: {
    rentalIncome: number;
    rentalUnit: string;
    vacancyRate: number;
    otherIncome: number;
    otherIncomeSource?: string;
  };
  expenseProjections: {
    propertyTaxes: number;
    insurance: number;
    utilities: number;
    maintenance: number;
    managementFees: number;
    replacementReserves: number;
    otherExpenses: number;
  };
  financing: {
    purchasePrice: number;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    monthlyPayment: number;
  };
}

interface CalculatedMetrics {
  effectiveGrossIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  annualDebtService: number;
  cashFlow: number;
  capRate: number;
  cashOnCash: number;
  roi: number;
  vacancyLoss: number;
  operatingExpenseRatio: number;
  dscr: number;
  totalReturnFiveYears: number;
  totalReturnTenYears: number;
}

interface ProFormaWorksheetProps {
  formData: ProFormaData;
  calculatedMetrics: CalculatedMetrics;
  appreciationRate?: number;
  rentGrowthRate?: number;
}

const ProFormaWorksheet = forwardRef<ProFormaWorksheetRef, ProFormaWorksheetProps>(
  ({ formData, calculatedMetrics, appreciationRate = 3, rentGrowthRate = 2.5 }, ref) => {
  const { toPDF, targetRef } = usePDF({
    filename: `ProForma_${formData.propertyInfo.location.replace(/\s+/g, '_')}.pdf`
  });
  
  // Expose the downloadPDF method via ref
  useImperativeHandle(ref, () => ({
    downloadPDF: () => toPDF()
  }));

  // Generate 10-year projection data
  const generateProjection = () => {
    const { 
      effectiveGrossIncome,
      operatingExpenses,
      netOperatingIncome,
      annualDebtService,
      cashFlow
    } = calculatedMetrics;
    
    const { purchasePrice, downPayment, loanAmount } = formData.financing;
    const years = 10;
    const projectionData = [];
    
    for (let i = 0; i <= years; i++) {
      const year = i;
      
      // Initial year (purchase)
      if (i === 0) {
        projectionData.push({
          year: 'Purchase',
          income: 0,
          operatingExpenses: 0,
          netOperatingIncome: 0,
          debtService: 0,
          cashFlow: 0,
          propertyValue: purchasePrice,
          equity: downPayment,
          loanBalance: loanAmount,
          roi: 0
        });
        continue;
      }
      
      // Year i calculations with compounding growth
      const incomeGrowthFactor = Math.pow(1 + rentGrowthRate / 100, i);
      const expenseGrowthFactor = Math.pow(1 + 2.5 / 100, i); // Expenses grow at inflation rate (assumed 2.5%)
      const valueGrowthFactor = Math.pow(1 + appreciationRate / 100, i);
      
      // Calculate values with growth
      const projectedIncome = effectiveGrossIncome * incomeGrowthFactor;
      const projectedExpenses = operatingExpenses * expenseGrowthFactor;
      const projectedNOI = projectedIncome - projectedExpenses;
      
      // Debt service remains constant for fixed-rate loans
      const projectedDebtService = annualDebtService;
      
      // Cash flow grows with income
      const projectedCashFlow = projectedNOI - projectedDebtService;
      
      // Property value appreciation
      const projectedValue = purchasePrice * valueGrowthFactor;
      
      // Loan amortization (simplified)
      const remainingLoanFactor = 1 - (i / formData.financing.loanTerm) * 0.3; // Simple approximation
      const projectedLoanBalance = Math.max(loanAmount * remainingLoanFactor, 0);
      
      // Equity position
      const projectedEquity = projectedValue - projectedLoanBalance;
      
      // ROI calculation - total return divided by initial investment
      const totalCashFlow = i * projectedCashFlow; // Simplified
      const equityGain = projectedEquity - downPayment;
      const totalReturn = totalCashFlow + equityGain;
      const initialInvestment = downPayment + (purchasePrice * 0.03); // Down payment plus closing costs
      const projectedROI = (totalReturn / initialInvestment) * 100;
      
      projectionData.push({
        year: `Year ${i}`,
        income: projectedIncome,
        operatingExpenses: projectedExpenses,
        netOperatingIncome: projectedNOI,
        debtService: projectedDebtService,
        cashFlow: projectedCashFlow,
        propertyValue: projectedValue,
        equity: projectedEquity,
        loanBalance: projectedLoanBalance,
        roi: projectedROI
      });
    }
    
    return projectionData;
  };

  // Calculate total expenses
  const getTotalExpenses = () => {
    const { expenseProjections } = formData;
    return Object.values(expenseProjections).reduce((sum, val) => sum + val, 0);
  };

  // Generate PDF
  const handleDownloadPDF = () => {
    toPDF();
  };

  // Property type lookup
  const getPropertyTypeName = () => {
    const types = {
      residential: "Single-Family Residential",
      "multi-family": "Multi-Family",
      commercial: "Commercial", 
      industrial: "Industrial",
      land: "Vacant Land"
    };
    
    return types[formData.propertyInfo.propertyType as keyof typeof types] || formData.propertyInfo.propertyType;
  };

  return (
    <div>
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Pro Forma Worksheet</CardTitle>
            <CardDescription>Detailed financial analysis for your property</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div ref={targetRef} className="p-4 pdf-content">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary-700">Pro Forma Analysis Worksheet</h2>
              <p className="text-slate-600">
                {formData.propertyInfo.propertyAddress || `Property in ${formData.propertyInfo.location}, Benton County`}
              </p>
              <p className="text-sm text-slate-500">
                Analysis Date: {new Date().toLocaleDateString()}
              </p>
            </div>
            
            {/* Property Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-primary-700 border-b border-slate-200 pb-2 mb-3">
                Property Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Property Type</p>
                  <p className="font-medium">{getPropertyTypeName()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Location</p>
                  <p className="font-medium">{formData.propertyInfo.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Square Footage</p>
                  <p className="font-medium">{formData.propertyInfo.squareFootage.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Year Built</p>
                  <p className="font-medium">{formData.propertyInfo.yearBuilt}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Purchase Price</p>
                  <p className="font-medium">{formatCurrency(formData.financing.purchasePrice)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Down Payment</p>
                  <p className="font-medium">{formatCurrency(formData.financing.downPayment)} ({Math.round(formData.financing.downPayment / formData.financing.purchasePrice * 100)}%)</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Loan Amount</p>
                  <p className="font-medium">{formatCurrency(formData.financing.loanAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Interest Rate</p>
                  <p className="font-medium">{formData.financing.interestRate}%</p>
                </div>
              </div>
            </div>
            
            {/* Annual Income and Expenses */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-primary-700 border-b border-slate-200 pb-2 mb-3">
                Annual Income & Expenses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Income Section */}
                <div>
                  <h4 className="text-md font-medium mb-2">Income</h4>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Rental Income</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            formData.incomeProjections.rentalUnit === 'monthly'
                              ? formData.incomeProjections.rentalIncome * 12
                              : formData.incomeProjections.rentalIncome
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-rose-600">Vacancy Loss ({formData.incomeProjections.vacancyRate}%)</TableCell>
                        <TableCell className="text-right text-rose-600">
                          ({formatCurrency(calculatedMetrics.vacancyLoss)})
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Other Income</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(formData.incomeProjections.otherIncome)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-slate-50">
                        <TableCell className="font-semibold">Effective Gross Income</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(calculatedMetrics.effectiveGrossIncome)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                {/* Expenses Section */}
                <div>
                  <h4 className="text-md font-medium mb-2">Operating Expenses</h4>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Property Taxes</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(formData.expenseProjections.propertyTaxes)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Insurance</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(formData.expenseProjections.insurance)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Utilities</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(formData.expenseProjections.utilities)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Maintenance</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(formData.expenseProjections.maintenance)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Management</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(formData.expenseProjections.managementFees)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Replacement Reserves</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(formData.expenseProjections.replacementReserves)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Other Expenses</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(formData.expenseProjections.otherExpenses)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-slate-50">
                        <TableCell className="font-semibold">Total Operating Expenses</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(getTotalExpenses())}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            
            {/* Financial Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-primary-700 border-b border-slate-200 pb-2 mb-3">
                Financial Summary
              </h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Effective Gross Income</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(calculatedMetrics.effectiveGrossIncome)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-rose-600">Operating Expenses</TableCell>
                    <TableCell className="text-right text-rose-600">
                      ({formatCurrency(calculatedMetrics.operatingExpenses)})
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-semibold">Net Operating Income (NOI)</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(calculatedMetrics.netOperatingIncome)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-rose-600">Annual Debt Service</TableCell>
                    <TableCell className="text-right text-rose-600">
                      ({formatCurrency(calculatedMetrics.annualDebtService)})
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-semibold">Annual Cash Flow</TableCell>
                    <TableCell className={`text-right font-semibold ${calculatedMetrics.cashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(calculatedMetrics.cashFlow)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* Key Performance Metrics */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-primary-700 border-b border-slate-200 pb-2 mb-3">
                Key Performance Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-500">Capitalization Rate</p>
                  <p className="text-xl font-bold text-primary-700">{calculatedMetrics.capRate.toFixed(2)}%</p>
                  <p className="text-xs text-slate-500 mt-1">NOI / Property Value</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-500">Cash-on-Cash Return</p>
                  <p className="text-xl font-bold text-primary-700">{calculatedMetrics.cashOnCash.toFixed(2)}%</p>
                  <p className="text-xs text-slate-500 mt-1">Annual Cash Flow / Initial Investment</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-500">Debt Service Coverage</p>
                  <p className="text-xl font-bold text-primary-700">{calculatedMetrics.dscr.toFixed(2)}x</p>
                  <p className="text-xs text-slate-500 mt-1">NOI / Annual Debt Service</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-500">Operating Expense Ratio</p>
                  <p className="text-xl font-bold text-primary-700">{(calculatedMetrics.operatingExpenseRatio * 100).toFixed(1)}%</p>
                  <p className="text-xs text-slate-500 mt-1">Operating Expenses / Effective Gross Income</p>
                </div>
              </div>
            </div>
            
            {/* 10-Year Projection */}
            <div>
              <h3 className="text-lg font-semibold text-primary-700 border-b border-slate-200 pb-2 mb-3">
                10-Year Projection (with {appreciationRate}% Appreciation, {rentGrowthRate}% Rent Growth)
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="font-semibold">Period</TableHead>
                      <TableHead className="text-right font-semibold">NOI</TableHead>
                      <TableHead className="text-right font-semibold">Cash Flow</TableHead>
                      <TableHead className="text-right font-semibold">Property Value</TableHead>
                      <TableHead className="text-right font-semibold">Equity</TableHead>
                      <TableHead className="text-right font-semibold">Total ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generateProjection().map((row, index) => (
                      <TableRow key={index} className={index === 0 ? 'bg-slate-50' : ''}>
                        <TableCell className="font-medium">{row.year}</TableCell>
                        <TableCell className="text-right">
                          {index === 0 ? '-' : formatCurrency(row.netOperatingIncome)}
                        </TableCell>
                        <TableCell className={`text-right ${row.cashFlow < 0 ? 'text-rose-600' : ''}`}>
                          {index === 0 ? '-' : formatCurrency(row.cashFlow)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.propertyValue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.equity)}</TableCell>
                        <TableCell className="text-right">
                          {index === 0 ? '-' : `${row.roi.toFixed(1)}%`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold mb-2">Benton County Market Notes</h4>
                <p className="text-sm text-slate-600">
                  This analysis uses Benton County historical averages for appreciation ({appreciationRate}%) and rent growth ({rentGrowthRate}%). 
                  The {formData.propertyInfo.location} area has shown {
                    formData.propertyInfo.location.includes('Richland') ? 'strong' : 
                    formData.propertyInfo.location.includes('Kennewick') ? 'stable' : 
                    'moderate'
                  } performance compared to other areas in the county.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-sm text-slate-500">
              <p>Generated by Income Valuation Pro Forma Tool</p>
              <p>Benton County Real Estate Analysis | {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default ProFormaWorksheet;