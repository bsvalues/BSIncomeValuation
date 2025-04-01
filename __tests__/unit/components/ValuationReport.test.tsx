import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValuationReport } from '@/components/ValuationReport';
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

// Mock the react-to-pdf library
vi.mock('react-to-pdf', () => ({
  usePDF: vi.fn(() => [{}, { toPDF: vi.fn() }])
}));

// Mock recharts to avoid canvas rendering issues in tests
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  
  // Create simplified versions of chart components
  const MockLineChart = vi.fn().mockImplementation(({ children }) => <div data-testid="line-chart">{children}</div>);
  const MockPieChart = vi.fn().mockImplementation(({ children }) => <div data-testid="pie-chart">{children}</div>);
  
  return {
    ...actual,
    LineChart: MockLineChart,
    PieChart: MockPieChart,
    Line: vi.fn().mockImplementation(() => <div data-testid="line" />),
    Pie: vi.fn().mockImplementation(() => <div data-testid="pie" />),
    XAxis: vi.fn().mockImplementation(() => <div data-testid="x-axis" />),
    YAxis: vi.fn().mockImplementation(() => <div data-testid="y-axis" />),
    CartesianGrid: vi.fn().mockImplementation(() => <div data-testid="cartesian-grid" />),
    Tooltip: vi.fn().mockImplementation(() => <div data-testid="tooltip" />),
    Legend: vi.fn().mockImplementation(() => <div data-testid="legend" />),
    ResponsiveContainer: vi.fn().mockImplementation(({ children }) => <div data-testid="responsive-container">{children}</div>),
  };
});

describe('ValuationReport Component', () => {
  const mockValuation = {
    id: 1,
    userId: 1,
    name: 'Current Valuation',
    totalAnnualIncome: '84000.00',
    multiplier: '3.2',
    valuationAmount: '268800.00',
    incomeBreakdown: JSON.stringify({
      salary: 60000,
      investment: 12000,
      rental: 12000
    }),
    notes: 'Comprehensive valuation including all income sources',
    createdAt: new Date('2025-03-15'),
    updatedAt: new Date('2025-03-15'),
    isActive: true
  };

  const mockIncomeData = [
    { id: 1, userId: 1, source: 'salary', amount: '5000.00', frequency: 'monthly', description: 'Software Developer role' },
    { id: 2, userId: 1, source: 'investment', amount: '1000.00', frequency: 'monthly', description: 'Stock dividends' },
    { id: 3, userId: 1, source: 'rental', amount: '1000.00', frequency: 'monthly', description: 'Rental property' }
  ];

  const mockValuationHistory = [
    {
      id: 1,
      userId: 1,
      name: 'January Valuation',
      totalAnnualIncome: '72000.00',
      multiplier: '2.8',
      valuationAmount: '201600.00',
      incomeBreakdown: JSON.stringify({
        salary: 60000,
        investment: 12000
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
      totalAnnualIncome: '78000.00',
      multiplier: '3.0',
      valuationAmount: '234000.00',
      incomeBreakdown: JSON.stringify({
        salary: 60000,
        investment: 12000,
        rental: 6000
      }),
      notes: 'Added rental income',
      createdAt: new Date('2025-02-15'),
      updatedAt: new Date('2025-02-15'),
      isActive: true
    },
    mockValuation // Current valuation (March)
  ];

  const mockInsights = {
    findings: [
      'Your valuation has increased by 33.3% since January',
      'Income diversification has improved with the addition of rental income',
      'Current valuation multiplier (3.2) is higher than average for your industry (2.9)'
    ],
    recommendations: [
      'Consider increasing investment allocation for better income diversification',
      'Explore opportunities to increase rental income which has high stability',
      'Document income sources thoroughly for more accurate valuation assessment'
    ],
    metrics: {
      incomeStability: 'high',
      growthPotential: 'medium',
      diversificationScore: 75,
      industryComparison: 'above average'
    }
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the insights API request
    const apiRequestMock = vi.fn().mockResolvedValue({
      success: true,
      data: mockInsights
    });
    
    vi.mocked(queryClient.apiRequest).mockImplementation(apiRequestMock);
  });
  
  it('renders the valuation report with correct data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationReport 
          valuation={mockValuation}
          incomeData={mockIncomeData}
          valuationHistory={mockValuationHistory}
        />
      </QueryClientProvider>
    );
    
    // Check if the report title and valuation name are displayed
    expect(screen.getByText(/valuation report/i)).toBeInTheDocument();
    expect(screen.getByText(/current valuation/i)).toBeInTheDocument();
    
    // Check if valuation details are displayed
    expect(screen.getByText(/\$268,800/i)).toBeInTheDocument(); // Valuation amount
    expect(screen.getByText(/\$84,000/i)).toBeInTheDocument(); // Annual income
    expect(screen.getByText(/3\.2/i)).toBeInTheDocument(); // Multiplier
    
    // Check if report sections are present
    expect(screen.getByText(/valuation summary/i)).toBeInTheDocument();
    expect(screen.getByText(/income breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/historical trends/i)).toBeInTheDocument();
  });
  
  it('displays the income breakdown chart', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationReport 
          valuation={mockValuation}
          incomeData={mockIncomeData}
          valuationHistory={mockValuationHistory}
        />
      </QueryClientProvider>
    );
    
    // Check if income breakdown chart is rendered
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    
    // Check if income sources are displayed
    expect(screen.getByText(/salary/i)).toBeInTheDocument();
    expect(screen.getByText(/investment/i)).toBeInTheDocument();
    expect(screen.getByText(/rental/i)).toBeInTheDocument();
  });
  
  it('shows the historical trend chart', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationReport 
          valuation={mockValuation}
          incomeData={mockIncomeData}
          valuationHistory={mockValuationHistory}
        />
      </QueryClientProvider>
    );
    
    // Check if historical trend chart is rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
  
  it('displays AI-generated insights and recommendations', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationReport 
          valuation={mockValuation}
          incomeData={mockIncomeData}
          valuationHistory={mockValuationHistory}
        />
      </QueryClientProvider>
    );
    
    // Check if insights section is displayed
    expect(screen.getByText(/ai insights/i)).toBeInTheDocument();
    
    // Check if findings are displayed
    await waitFor(() => {
      expect(screen.getByText(/your valuation has increased by 33\.3% since january/i)).toBeInTheDocument();
      expect(screen.getByText(/income diversification has improved/i)).toBeInTheDocument();
    });
    
    // Check if recommendations are displayed
    await waitFor(() => {
      expect(screen.getByText(/consider increasing investment allocation/i)).toBeInTheDocument();
      expect(screen.getByText(/explore opportunities to increase rental income/i)).toBeInTheDocument();
    });
  });
  
  it('allows exporting the report as PDF', async () => {
    const user = userEvent.setup();
    
    const toPDFMock = vi.fn();
    vi.mocked(usePDF).mockReturnValue([{}, { toPDF: toPDFMock }]);
    
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationReport 
          valuation={mockValuation}
          incomeData={mockIncomeData}
          valuationHistory={mockValuationHistory}
        />
      </QueryClientProvider>
    );
    
    // Find the export button and click it
    const exportButton = screen.getByRole('button', { name: /export as pdf/i });
    await user.click(exportButton);
    
    // Check if toPDF was called
    expect(toPDFMock).toHaveBeenCalled();
  });
  
  it('shows a loading state while fetching insights', async () => {
    // Mock a delayed API response
    const delayedApiMock = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
            data: mockInsights
          });
        }, 100);
      });
    });
    
    vi.mocked(queryClient.apiRequest).mockImplementation(delayedApiMock);
    
    render(
      <QueryClientProvider client={queryClient}>
        <ValuationReport 
          valuation={mockValuation}
          incomeData={mockIncomeData}
          valuationHistory={mockValuationHistory}
        />
      </QueryClientProvider>
    );
    
    // Check if loading state is displayed
    expect(screen.getByText(/generating insights/i)).toBeInTheDocument();
    
    // Wait for insights to load
    await waitFor(() => {
      expect(screen.getByText(/your valuation has increased by 33\.3% since january/i)).toBeInTheDocument();
    });
  });
});