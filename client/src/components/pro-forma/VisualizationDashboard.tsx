import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, 
  LineChart, Line, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { AlertCircle, ChartBar, DollarSign, TrendingUp } from 'lucide-react';

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

interface VisualizationDashboardProps {
  formData: ProFormaData;
  calculatedMetrics: CalculatedMetrics;
  applyAssumptions: (assumptions: any) => void;
}

export default function VisualizationDashboard({ 
  formData,
  calculatedMetrics,
  applyAssumptions
}: VisualizationDashboardProps) {
  const [currentTab, setCurrentTab] = useState('cash-flow');
  const [appreciationRate, setAppreciationRate] = useState(3.0);
  const [rentGrowthRate, setRentGrowthRate] = useState(2.5);
  const [expenseGrowthRate, setExpenseGrowthRate] = useState(2.0);
  const [projectionYears, setProjectionYears] = useState(10);
  
  // Generate projection data for charts
  const generateProjectionData = () => {
    const projectionData = [];
    const {
      effectiveGrossIncome,
      operatingExpenses,
      netOperatingIncome,
      annualDebtService,
      cashFlow
    } = calculatedMetrics;
    
    const { purchasePrice } = formData.financing;
    
    // Add data for each year
    for (let i = 1; i <= projectionYears; i++) {
      const incomeGrowthFactor = Math.pow(1 + rentGrowthRate / 100, i);
      const expenseGrowthFactor = Math.pow(1 + expenseGrowthRate / 100, i);
      const valueGrowthFactor = Math.pow(1 + appreciationRate / 100, i);
      
      const yearIncome = effectiveGrossIncome * incomeGrowthFactor;
      const yearExpenses = operatingExpenses * expenseGrowthFactor;
      const yearNOI = yearIncome - yearExpenses;
      // Annual debt service remains constant for fixed-rate loans
      const yearCashFlow = yearNOI - annualDebtService;
      const yearPropertyValue = purchasePrice * valueGrowthFactor;
      
      projectionData.push({
        year: i,
        yearLabel: `Year ${i}`,
        income: yearIncome,
        expenses: yearExpenses,
        noi: yearNOI,
        cashFlow: yearCashFlow,
        propertyValue: yearPropertyValue,
        capRate: (yearNOI / yearPropertyValue) * 100
      });
    }
    
    return projectionData;
  };
  
  // Calculate the cumulative data for total return
  const generateCumulativeData = () => {
    const projectionData = generateProjectionData();
    const cumulativeData: Array<{
      year: number;
      yearLabel: string;
      cashFlow: number;
      appreciation: number;
      totalReturn: number;
    }> = [];
    
    let cumulativeCashFlow: number = 0;
    let cumulativeApreciation: number = 0;
    
    projectionData.forEach((yearData, index) => {
      cumulativeCashFlow += yearData.cashFlow;
      
      // Calculate appreciation as difference from initial value
      const appreciation = yearData.propertyValue - formData.financing.purchasePrice;
      
      cumulativeData.push({
        year: yearData.year,
        yearLabel: yearData.yearLabel,
        cashFlow: cumulativeCashFlow,
        appreciation: appreciation,
        totalReturn: cumulativeCashFlow + appreciation
      });
    });
    
    return cumulativeData;
  };
  
  // Prepare expense breakdown data for pie chart
  const getExpenseBreakdownData = () => {
    const { expenseProjections } = formData;
    
    return [
      { name: 'Property Taxes', value: expenseProjections.propertyTaxes },
      { name: 'Insurance', value: expenseProjections.insurance },
      { name: 'Utilities', value: expenseProjections.utilities },
      { name: 'Maintenance', value: expenseProjections.maintenance },
      { name: 'Management', value: expenseProjections.managementFees },
      { name: 'Reserves', value: expenseProjections.replacementReserves },
      { name: 'Other', value: expenseProjections.otherExpenses }
    ].filter(item => item.value > 0);
  };
  
  // Apply new assumption values
  const handleApplyAssumptions = () => {
    applyAssumptions({
      appreciationRate,
      rentGrowthRate,
      expenseGrowthRate
    });
  };
  
  // Format tooltip data for financials
  const formatFinancialTooltip = (value: any, name: string) => {
    if (name === 'capRate') return `${Number(value).toFixed(2)}%`;
    return formatCurrency(Number(value));
  };
  
  // Generic formatter that ensures we have a number
  const formatTooltipValue = (value: any) => {
    return formatCurrency(Number(value));
  };
  
  // Colors for charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#4CAF50', '#F44336', '#9C27B0', '#673AB7'
  ];
  
  // Chart configuration
  const renderCashFlowChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={generateProjectionData()}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="yearLabel" />
        <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
        <Tooltip formatter={formatFinancialTooltip} />
        <Legend />
        <Bar name="Income" dataKey="income" fill="#4CAF50" />
        <Bar name="Expenses" dataKey="expenses" fill="#F44336" />
        <Bar name="Cash Flow" dataKey="cashFlow" fill="#2196F3" />
      </BarChart>
    </ResponsiveContainer>
  );
  
  const renderNOIChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={generateProjectionData()}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="yearLabel" />
        <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
        <Tooltip formatter={formatFinancialTooltip} />
        <Legend />
        <Line 
          type="monotone" 
          name="Net Operating Income" 
          dataKey="noi" 
          stroke="#4CAF50" 
          activeDot={{ r: 8 }} 
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          name="Cap Rate" 
          dataKey="capRate" 
          stroke="#FF9800" 
          activeDot={{ r: 8 }} 
          strokeWidth={2}
          yAxisId="right"
        />
      </LineChart>
    </ResponsiveContainer>
  );
  
  const renderPropertyValueChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={generateProjectionData()}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="yearLabel" />
        <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
        <Tooltip formatter={formatFinancialTooltip} />
        <Legend />
        <Area 
          type="monotone" 
          name="Property Value" 
          dataKey="propertyValue" 
          fill="#9C27B0" 
          stroke="#9C27B0" 
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
  
  const renderTotalReturnChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={generateCumulativeData()}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        stackOffset="expand"
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="yearLabel" />
        <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
        <Tooltip formatter={formatFinancialTooltip} />
        <Legend />
        <Area 
          type="monotone" 
          name="Cash Flow" 
          dataKey="cashFlow" 
          stackId="1"
          fill="#2196F3" 
          stroke="#2196F3" 
        />
        <Area 
          type="monotone" 
          name="Appreciation" 
          dataKey="appreciation" 
          stackId="1"
          fill="#FF9800" 
          stroke="#FF9800" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
  
  const renderExpenseBreakdownChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <Pie
          dataKey="value"
          data={getExpenseBreakdownData()}
          cx="50%"
          cy="50%"
          outerRadius={150}
          fill="#8884d8"
          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          {getExpenseBreakdownData().map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatTooltipValue} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
  
  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="h-5 w-5 text-primary-500" />
            Visualization Dashboard
          </CardTitle>
          <CardDescription>
            Interactive charts and projections for your property
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Chart Controls */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold mb-4">Projection Assumptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="appreciation-rate" className="mb-2 block">
                  Appreciation Rate: {appreciationRate}%
                </Label>
                <Slider
                  id="appreciation-rate"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[appreciationRate]}
                  onValueChange={(value) => setAppreciationRate(value[0])}
                  className="mb-4"
                />
              </div>
              <div>
                <Label htmlFor="rent-growth-rate" className="mb-2 block">
                  Rent Growth Rate: {rentGrowthRate}%
                </Label>
                <Slider
                  id="rent-growth-rate"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[rentGrowthRate]}
                  onValueChange={(value) => setRentGrowthRate(value[0])}
                  className="mb-4"
                />
              </div>
              <div>
                <Label htmlFor="expense-growth-rate" className="mb-2 block">
                  Expense Growth Rate: {expenseGrowthRate}%
                </Label>
                <Slider
                  id="expense-growth-rate"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[expenseGrowthRate]}
                  onValueChange={(value) => setExpenseGrowthRate(value[0])}
                  className="mb-4"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="projection-years" className="mb-2 block">
                  Projection Period: {projectionYears} years
                </Label>
                <Select 
                  value={projectionYears.toString()} 
                  onValueChange={(value) => setProjectionYears(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="15">15 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                    <SelectItem value="30">30 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleApplyAssumptions}>
                Apply to Analysis
              </Button>
            </div>
          </div>

          {/* Info Card */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-1">Benton County Market Insights</h4>
              <p className="text-sm text-blue-700">
                Historical data from Benton County shows that properties in the {formData.propertyInfo.location} area 
                have appreciated at an average of {
                  formData.propertyInfo.location.includes('Richland') ? '3.8' : 
                  formData.propertyInfo.location.includes('Kennewick') ? '3.2' : 
                  '2.9'
                }% annually over the past decade, with rental growth rates of {
                  formData.propertyInfo.location.includes('Richland') ? '3.2' : 
                  formData.propertyInfo.location.includes('Kennewick') ? '2.8' : 
                  '2.4'
                }%.
              </p>
            </div>
          </div>

          {/* Chart Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-6 grid grid-cols-5 w-full">
              <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
              <TabsTrigger value="noi">NOI & Cap Rate</TabsTrigger>
              <TabsTrigger value="property-value">Property Value</TabsTrigger>
              <TabsTrigger value="total-return">Total Return</TabsTrigger>
              <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cash-flow" className="border p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-4">Income, Expenses & Cash Flow Projection</h3>
              {renderCashFlowChart()}
            </TabsContent>
            
            <TabsContent value="noi" className="border p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-4">Net Operating Income & Cap Rate Over Time</h3>
              {renderNOIChart()}
            </TabsContent>
            
            <TabsContent value="property-value" className="border p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-4">Property Value Appreciation ({appreciationRate}% Annual)</h3>
              {renderPropertyValueChart()}
            </TabsContent>
            
            <TabsContent value="total-return" className="border p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-4">Cumulative Return: Cash Flow + Appreciation</h3>
              {renderTotalReturnChart()}
            </TabsContent>
            
            <TabsContent value="expenses" className="border p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-4">Operating Expense Breakdown</h3>
              {renderExpenseBreakdownChart()}
            </TabsContent>
          </Tabs>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-slate-500">Cash on Cash Return</h4>
                  <DollarSign className="h-4 w-4 text-primary-500" />
                </div>
                <p className="text-2xl font-bold text-primary-700">{calculatedMetrics.cashOnCash.toFixed(2)}%</p>
                <p className="text-xs text-slate-500 mt-1">First Year Return on Investment</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-slate-500">Cap Rate</h4>
                  <TrendingUp className="h-4 w-4 text-primary-500" />
                </div>
                <p className="text-2xl font-bold text-primary-700">{calculatedMetrics.capRate.toFixed(2)}%</p>
                <p className="text-xs text-slate-500 mt-1">Net Operating Income / Property Value</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-slate-500">5-Year ROI</h4>
                  <ChartBar className="h-4 w-4 text-primary-500" />
                </div>
                <p className="text-2xl font-bold text-primary-700">{calculatedMetrics.totalReturnFiveYears.toFixed(2)}%</p>
                <p className="text-xs text-slate-500 mt-1">Estimated 5-Year Total Return</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-slate-500">DSCR</h4>
                  <AlertCircle className="h-4 w-4 text-primary-500" />
                </div>
                <p className="text-2xl font-bold text-primary-700">{calculatedMetrics.dscr.toFixed(2)}x</p>
                <p className="text-xs text-slate-500 mt-1">Debt Service Coverage Ratio</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}