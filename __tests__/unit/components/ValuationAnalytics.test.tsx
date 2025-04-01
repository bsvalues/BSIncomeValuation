import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValuationAnalytics } from '@/components/ValuationAnalytics';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import userEvent from '@testing-library/user-event';

// Mock the api request function
vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual('@/lib/queryClient');
  return {
    ...actual,
    apiRequest: vi.fn(() => Promise.resolve({ success: true })),
  };
});

// Mock recharts to avoid canvas rendering issues in tests
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  
  // Create simplified versions of chart components
  const MockLineChart = vi.fn().mockImplementation(({ children }) => <div data-testid="line-chart">{children}</div>);
  const MockAreaChart = vi.fn().mockImplementation(({ children }) => <div data-testid="area-chart">{children}</div>);
  const MockBarChart = vi.fn().mockImplementation(({ children }) => <div data-testid="bar-chart">{children}</div>);
  const MockPieChart = vi.fn().mockImplementation(({ children }) => <div data-testid="pie-chart">{children}</div>);
  
  return {
    ...actual,
    LineChart: MockLineChart,
    AreaChart: MockAreaChart,
    BarChart: MockBarChart,
    PieChart: MockPieChart,
    Line: vi.fn().mockImplementation(() => <div data-testid="line" />),
    Area: vi.fn().mockImplementation(() => <div data-testid="area" />),
    Bar: vi.fn().mockImplementation(() => <div data-testid="bar" />),
    Pie: vi.fn().mockImplementation(() => <div data-testid="pie" />),
    XAxis: vi.fn().mockImplementation(() => <div data-testid="x-axis" />),
    YAxis: vi.fn().mockImplementation(() => <div data-testid="y-axis" />),
    CartesianGrid: vi.fn().mockImplementation(() => <div data-testid="cartesian-grid" />),
    Tooltip: vi.fn().mockImplementation(() => <div data-testid="tooltip" />),
    Legend: vi.fn().mockImplementation(() => <div data-testid="legend" />),
    ResponsiveContainer: vi.fn().mockImplementation(({ children }) => <div data-testid="responsive-container">{children}</div>),
  };
});

describe('ValuationAnalytics Component', () => {
  const mockValuationHistory = [
    {
      id: 1,
      userId: 1,
      name: 'January Valuation',
      totalAnnualIncome: '60000.00',
      multiplier: '2.5',
      valuationAmount: '150000.00',
      incomeBreakdown: JSON.stringify({
        salary: 54000,
        investment: 6000
      }),
      notes: 'Initial valuation',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
      isActive: true
    },
    {
      id: 2,
      userId: 1,
      name: 'February Valuation',
      totalAnnualIncome: '63000.00',
      multiplier: '2.6',
      valuationAmount: '163800.00',
      incomeBreakdown: JSON.stringify({
        salary: 57000,
        investment: 6000
      }),
      notes: 'After salary increase',
      createdAt: new Date('2025-02-15'),
      updatedAt: new Date('2025-02-15'),
      isActive: true
    },
    {
      id: 3,
      userId: 1,
      name: 'March Valuation',
      totalAnnualIncome: '69000.00',
      multiplier: '2.8',
      valuationAmount: '193200.00',
      incomeBreakdown: JSON.stringify({
        salary: 57000,
        investment: 12000
      }),
      notes: 'After investment increase',
      createdAt: new Date('2025-03-15'),
      updatedAt: new Date('2025-03-15'),
      isActive: true
    }
  ];

  const mockTrendAnalysis = {
    valuationTrend: {
      growthRate: '28.80',
      annualizedGrowthRate: '172.80',
      volatility: 'medium',
      direction: 'upward'
    },
    incomeTrend: {
      growthRate: '15.00',
      annualizedGrowthRate: '90.00',
      volatility: 'low',
      direction: 'upward'
    },
    multiplierTrend: {
      growthRate: '12.00',
      annualizedGrowthRate: '72.00',
      volatility: 'low',
      direction: 'upward'
    },
    projections: {
      oneMonth: '199000.00',
      threeMonths: '211000.00',
      sixMonths: '232000.00',
      oneYear: '270000.00'
    }
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the trend analysis API request
    const apiRequestMock = vi.fn().mockResolvedValue({
      success: true,
      data: mockTrendAnalysis
    });
    
    vi.mocked(queryClient.apiRequest).mockImplementation(apiRequestMock);
  });
  
  it('renders valuation history charts', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationAnalytics valuationHistory={mockValuationHistory} />
      </QueryClientProvider>
    );
    
    // Check if valuation history chart is rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Check for chart titles
    expect(screen.getByText(/valuation history/i)).toBeInTheDocument();
    expect(screen.getByText(/income trends/i)).toBeInTheDocument();
    expect(screen.getByText(/multiplier trends/i)).toBeInTheDocument();
  });
  
  it('shows message when no valuation history is available', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationAnalytics valuationHistory={[]} />
      </QueryClientProvider>
    );
    
    // Check if no-data message is displayed
    expect(screen.getByText(/no valuation history available/i)).toBeInTheDocument();
    expect(screen.getByText(/create at least 2 valuations to see analytics/i)).toBeInTheDocument();
  });
  
  it('displays trend analysis data correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationAnalytics valuationHistory={mockValuationHistory} />
      </QueryClientProvider>
    );
    
    // Check if trend analysis data is displayed
    await waitFor(() => {
      expect(screen.getByText(/growth rate/i)).toBeInTheDocument();
      expect(screen.getByText(/28\.80%/i)).toBeInTheDocument();
      
      expect(screen.getByText(/annualized growth rate/i)).toBeInTheDocument();
      expect(screen.getByText(/172\.80%/i)).toBeInTheDocument();
      
      expect(screen.getByText(/volatility/i)).toBeInTheDocument();
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
    });
  });
  
  it('displays income source breakdown chart', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationAnalytics valuationHistory={mockValuationHistory} />
      </QueryClientProvider>
    );
    
    // Check if income breakdown chart is rendered
    expect(screen.getByText(/income source breakdown/i)).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
  
  it('shows projections in the forecast section', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationAnalytics valuationHistory={mockValuationHistory} />
      </QueryClientProvider>
    );
    
    // Check if projections are displayed
    await waitFor(() => {
      expect(screen.getByText(/valuation forecast/i)).toBeInTheDocument();
      expect(screen.getByText(/1 month/i)).toBeInTheDocument();
      expect(screen.getByText(/\$199,000/i)).toBeInTheDocument();
      
      expect(screen.getByText(/3 months/i)).toBeInTheDocument();
      expect(screen.getByText(/\$211,000/i)).toBeInTheDocument();
      
      expect(screen.getByText(/6 months/i)).toBeInTheDocument();
      expect(screen.getByText(/\$232,000/i)).toBeInTheDocument();
      
      expect(screen.getByText(/1 year/i)).toBeInTheDocument();
      expect(screen.getByText(/\$270,000/i)).toBeInTheDocument();
    });
  });
  
  it('handles what-if scenario simulations', async () => {
    const user = userEvent.setup();
    
    // Mock scenario API request
    const scenarioApiMock = vi.fn().mockResolvedValue({
      success: true,
      data: {
        originalValuation: '193200.00',
        adjustedValuation: '215000.00',
        percentageChange: '11.28',
        breakdown: {
          income: '75000.00',
          multiplier: '2.8'
        }
      }
    });
    
    vi.mocked(queryClient.apiRequest).mockImplementation(scenarioApiMock);
    
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationAnalytics valuationHistory={mockValuationHistory} />
      </QueryClientProvider>
    );
    
    // Open what-if scenario panel
    const scenarioButton = screen.getByRole('button', { name: /what-if scenario/i });
    await user.click(scenarioButton);
    
    // Adjust the income slider
    const incomeSlider = screen.getByLabelText(/adjust income/i);
    await user.click(incomeSlider); // Simulating slider interaction
    
    // Click the calculate scenario button
    const calculateButton = screen.getByRole('button', { name: /calculate scenario/i });
    await user.click(calculateButton);
    
    // Check scenario results
    await waitFor(() => {
      expect(screen.getByText(/scenario results/i)).toBeInTheDocument();
      expect(screen.getByText(/original valuation/i)).toBeInTheDocument();
      expect(screen.getByText(/\$193,200/i)).toBeInTheDocument();
      
      expect(screen.getByText(/adjusted valuation/i)).toBeInTheDocument();
      expect(screen.getByText(/\$215,000/i)).toBeInTheDocument();
      
      expect(screen.getByText(/percentage change/i)).toBeInTheDocument();
      expect(screen.getByText(/\+11\.28%/i)).toBeInTheDocument();
    });
  });
});