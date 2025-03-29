import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ComparisonChart from '../../../client/src/components/pro-forma/ComparisonChart';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Bar: () => <div data-testid="bar" />,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />
  };
});

describe('ComparisonChart', () => {
  // Sample scenarios for comparison
  const sampleScenarios = [
    { 
      name: 'Scenario 1', 
      data: { 
        propertyInfo: { location: 'Richland' },
        financing: { purchasePrice: 300000 }
      },
      analysis: { 
        capRate: 4.5, 
        cashOnCash: 6.2, 
        roi: 8.5,
        valuation: 320000
      }
    },
    { 
      name: 'Scenario 2', 
      data: { 
        propertyInfo: { location: 'Kennewick' },
        financing: { purchasePrice: 350000 }
      },
      analysis: { 
        capRate: 5.1, 
        cashOnCash: 5.8, 
        roi: 7.9,
        valuation: 380000
      }
    },
    { 
      name: 'Scenario 3', 
      data: { 
        propertyInfo: { location: 'Pasco' },
        financing: { purchasePrice: 290000 }
      },
      analysis: { 
        capRate: 4.9, 
        cashOnCash: 6.5, 
        roi: 8.1,
        valuation: 310000
      }
    }
  ];

  it('renders a bar chart when chart type is "bar"', () => {
    render(
      <ComparisonChart 
        scenarios={sampleScenarios} 
        metricKey="capRate"
        chartType="bar"
        title="Cap Rate Comparison"
      />
    );
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('Cap Rate Comparison')).toBeInTheDocument();
  });

  it('renders a line chart when chart type is "line"', () => {
    render(
      <ComparisonChart 
        scenarios={sampleScenarios} 
        metricKey="cashOnCash"
        chartType="line"
        title="Cash on Cash Comparison"
      />
    );
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText('Cash on Cash Comparison')).toBeInTheDocument();
  });

  it('formats the data using the specified metricKey', () => {
    const { rerender } = render(
      <ComparisonChart 
        scenarios={sampleScenarios} 
        metricKey="capRate"
        chartType="bar"
        title="Cap Rate Comparison"
      />
    );
    
    // Component doesn't expose data directly, but we can check for proper rendering
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Try with a different metric key
    rerender(
      <ComparisonChart 
        scenarios={sampleScenarios} 
        metricKey="roi"
        chartType="bar"
        title="ROI Comparison"
      />
    );
    
    expect(screen.getByText('ROI Comparison')).toBeInTheDocument();
  });

  it('handles empty scenarios array', () => {
    render(
      <ComparisonChart 
        scenarios={[]} 
        metricKey="capRate"
        chartType="bar"
        title="Cap Rate Comparison"
      />
    );
    
    // Should show an empty state message
    expect(screen.getByText(/No scenarios to compare/i)).toBeInTheDocument();
  });
});