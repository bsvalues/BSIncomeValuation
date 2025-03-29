import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface ScenarioData {
  name: string;
  data: {
    propertyInfo: {
      location: string;
    };
    financing: {
      purchasePrice: number;
    };
  };
  analysis: {
    capRate: number;
    cashOnCash: number;
    roi: number;
    valuation: number;
  };
}

interface ComparisonChartProps {
  scenarios: ScenarioData[];
  metricKey: keyof ScenarioData['analysis'];
  chartType: 'bar' | 'line';
  title: string;
}

/**
 * Renders a comparison chart for different property scenarios
 */
const ComparisonChart: React.FC<ComparisonChartProps> = ({ 
  scenarios, 
  metricKey, 
  chartType = 'bar',
  title 
}) => {
  // Format data for the chart
  const formatData = () => {
    return scenarios.map(scenario => ({
      name: scenario.name,
      value: scenario.analysis[metricKey],
      location: scenario.data.propertyInfo.location,
      purchasePrice: scenario.data.financing.purchasePrice
    }));
  };

  // If there are no scenarios to compare, show a message
  if (scenarios.length === 0) {
    return (
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-gray-500">No scenarios to compare</p>
      </div>
    );
  }

  const data = formatData();

  return (
    <div className="w-full h-80 p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        {chartType === 'bar' ? (
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [
                `${typeof value === 'number' ? value.toFixed(2) : value}`, 
                metricKey
              ]}
            />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name={metricKey} />
          </BarChart>
        ) : (
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [
                `${typeof value === 'number' ? value.toFixed(2) : value}`, 
                metricKey
              ]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              name={metricKey} 
              activeDot={{ r: 8 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;