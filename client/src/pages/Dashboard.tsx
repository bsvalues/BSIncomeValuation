import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Valuation, Income } from "@shared/schema";
import { BarChart3, Plus, Calendar, Trash2, CreditCard, TrendingUp, ArrowUpRight, AlertCircle } from "lucide-react";
import { IncomeChart } from "@/components/ui/income-chart";
import { ValuationHistoryChart } from "@/components/ui/valuation-history-chart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/components/ui/api-error";
import ServerError from "@/pages/ServerError";
import ErrorBoundary from "@/components/ErrorBoundary";

// Dashboard data types
interface IncomeSummary {
  source: string;
  total: number;
  count: number;
  averageAmount: number;
}

interface DashboardData {
  recentValuations: Valuation[];
  incomeSummaryByType: IncomeSummary[];
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  valuationCount: number;
  incomeCount: number;
  latestValuation: Valuation | null;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Get dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery<DashboardData, Error>({
    queryKey: ['/api/dashboard'],
    enabled: !!user,
  });

  // Get incomes and valuations for detailed tabs
  const { 
    data: valuations, 
    isLoading: valuationsLoading, 
    isError: isValuationsError,
    error: valuationsError,
    refetch: refetchValuations 
  } = useQuery<Valuation[], Error>({
    queryKey: [`/api/users/${user?.id}/valuations`],
    enabled: !!user,
  });

  const { 
    data: incomes, 
    isLoading: incomesLoading, 
    isError: isIncomesError,
    error: incomesError,
    refetch: refetchIncomes 
  } = useQuery<Income[], Error>({
    queryKey: [`/api/users/${user?.id}/incomes`],
    enabled: !!user,
  });
  
  // For detailed dashboard data
  const { 
    data: detailedData, 
    isLoading: detailedLoading,
    isError: isDetailedError,
    error: detailedError,
    refetch: refetchDetailed
  } = useQuery<any, Error>({
    queryKey: ['/api/dashboard/detailed'],
    enabled: !!user,
  });

  const handleDeleteValuation = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/valuations/${id}`, {});
      toast({
        title: "Valuation deleted",
        description: "The valuation has been removed successfully",
      });
      refetchValuations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete valuation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncome = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/incomes/${id}`, {});
      toast({
        title: "Income deleted",
        description: "The income source has been removed successfully",
      });
      refetchIncomes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete income source",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Error handler function for all API errors
  const handleApiError = useCallback((error: Error | null, entityType: string) => {
    if (!error) return null;
    
    // Check for network errors
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      return (
        <ApiError
          title={`Connection Error`}
          message={`We couldn't connect to the server to load your ${entityType}. Please check your internet connection.`}
          error={error}
        />
      );
    }
    
    // Check for 401 unauthorized
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return (
        <ApiError
          title="Session Expired"
          message="Your session has expired. Please log in again to continue."
          error={error}
        />
      );
    }
    
    // General error
    return (
      <ApiError
        title={`Error Loading ${entityType}`}
        message={`There was a problem loading your ${entityType}. Please try again.`}
        error={error}
      />
    );
  }, []);

  // If there's a critical error with dashboard data, show a server error
  if (isDashboardError && dashboardError?.message.includes('500')) {
    return <ServerError 
      message="We're having trouble loading your dashboard data. Our team has been notified of this issue."
      actionLink="/"
      actionText="Return to Home"
    />;
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ErrorBoundary>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-800">Your Dashboard</h1>
              <p className="text-slate-600 mt-1">Manage your income sources and valuations</p>
            </div>
            
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/valuation/new">
                <Button className="bg-primary-600 hover:bg-primary-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Valuation
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Dashboard Error Alert */}
          {isDashboardError && (
            <div className="mb-6">
              {handleApiError(dashboardError, 'dashboard data')}
            </div>
          )}

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="text-sm md:text-base">Overview</TabsTrigger>
              <TabsTrigger value="valuations" className="text-sm md:text-base">Valuations</TabsTrigger>
              <TabsTrigger value="incomes" className="text-sm md:text-base">Income Sources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {/* Income and Valuation Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-primary-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <CreditCard className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">Monthly</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Monthly Income</h3>
                    {dashboardLoading ? (
                      <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-2xl font-bold text-slate-800">
                        {formatCurrency(dashboardData?.totalMonthlyIncome || 0)}
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-primary-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <CreditCard className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">Annual</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Annual Income</h3>
                    {dashboardLoading ? (
                      <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-2xl font-bold text-slate-800">
                        {formatCurrency(dashboardData?.totalAnnualIncome || 0)}
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-primary-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <TrendingUp className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">Latest</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Latest Valuation</h3>
                    {dashboardLoading ? (
                      <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : dashboardData?.latestValuation ? (
                      <p className="text-2xl font-bold text-slate-800">
                        {formatCurrency(dashboardData?.latestValuation?.valuationAmount || 0)}
                      </p>
                    ) : (
                      <p className="text-lg text-slate-500">No valuation yet</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-primary-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <BarChart3 className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Income Sources</h3>
                    {dashboardLoading ? (
                      <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <div className="flex items-end">
                        <p className="text-2xl font-bold text-slate-800">{dashboardData?.incomeCount || 0}</p>
                        <p className="text-sm text-slate-500 ml-2 mb-1">sources</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-primary-700">Income Sources</CardTitle>
                    <CardDescription>Breakdown by income type</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {dashboardLoading ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-slate-500">Loading income data...</p>
                      </div>
                    ) : isDashboardError ? (
                      <div className="h-[300px] flex items-center justify-center">
                        {handleApiError(dashboardError, 'income data')}
                      </div>
                    ) : dashboardData?.incomeSummaryByType && dashboardData.incomeSummaryByType.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.incomeSummaryByType.map((summary) => (
                          <div key={summary.source} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-slate-800 capitalize">{summary.source}</h4>
                              <span className="text-sm font-medium text-primary-700">
                                {formatCurrency(summary.total)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                              <div 
                                className="bg-primary-600 h-2.5 rounded-full" 
                                style={{
                                  width: `${Math.min(100, (summary.total / dashboardData.totalAnnualIncome) * 100)}%`
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>{summary.count} sources</span>
                              <span>Avg: {formatCurrency(summary.averageAmount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-slate-500 mb-4">No income sources added yet</p>
                          <Link href="/valuation/new">
                            <Button variant="outline" size="sm">Add Income Sources</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-primary-700">Recent Valuations</CardTitle>
                    <CardDescription>Your latest valuation results</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {dashboardLoading ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-slate-500">Loading valuation data...</p>
                      </div>
                    ) : isDashboardError ? (
                      <div className="h-[300px] flex items-center justify-center">
                        {handleApiError(dashboardError, 'valuation data')}
                      </div>
                    ) : dashboardData?.recentValuations && dashboardData.recentValuations.length > 0 ? (
                      <div className="h-[300px] overflow-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-2 px-2 text-sm text-slate-600 font-medium">Date</th>
                              <th className="text-right py-2 px-2 text-sm text-slate-600 font-medium">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.recentValuations.map((valuation) => (
                              <tr key={valuation.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-2 text-sm text-slate-800">
                                  {formatDate(valuation.createdAt)}
                                </td>
                                <td className="py-3 px-2 text-sm text-right font-medium text-primary-700">
                                  {formatCurrency(valuation.valuationAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-slate-500 mb-4">No valuations created yet</p>
                          <Link href="/valuation/new">
                            <Button variant="outline" size="sm">Create Valuation</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-primary-700">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <p className="text-slate-500">Loading recent activity...</p>
                  ) : isDashboardError ? (
                    handleApiError(dashboardError, 'activity data')
                  ) : (
                    <div className="space-y-4">
                      {(dashboardData?.recentValuations && dashboardData.recentValuations.length > 0) ? (
                        <div className="space-y-4">
                          {dashboardData.recentValuations.slice(0, 3).map((valuation) => (
                            <div key={valuation.id} className="flex items-center gap-4 border-b border-slate-100 pb-4">
                              <div className="bg-primary-100 p-2 rounded-full">
                                <BarChart3 className="h-5 w-5 text-primary-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">New Valuation Created</p>
                                <p className="text-xs text-slate-500">{formatDate(valuation.createdAt)}</p>
                              </div>
                              <div className="text-sm font-medium text-primary-700">
                                {formatCurrency(valuation.valuationAmount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-500 mb-4">No recent activity</p>
                          <Link href="/valuation/new">
                            <Button variant="outline" size="sm">Get Started</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="valuations">
              {/* Historical Valuation Chart */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-primary-700">Valuation History</CardTitle>
                  <CardDescription>Track your valuation progress over time</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {valuationsLoading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <p className="text-slate-500">Loading valuation history...</p>
                    </div>
                  ) : isValuationsError ? (
                    <div className="h-[350px] flex items-center justify-center">
                      {handleApiError(valuationsError, 'valuation history')}
                    </div>
                  ) : valuations && valuations.length > 0 ? (
                    <ValuationHistoryChart valuations={valuations} />
                  ) : (
                    <div className="h-[350px] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-slate-500 mb-4">No valuation history available</p>
                        <Link href="/valuation/new">
                          <Button variant="outline" size="sm">Create Valuation</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid gap-6">
                {valuationsLoading ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-slate-500">Loading valuations...</p>
                    </CardContent>
                  </Card>
                ) : isValuationsError ? (
                  <Card>
                    <CardContent className="py-8">
                      {handleApiError(valuationsError, 'valuations')}
                    </CardContent>
                  </Card>
                ) : valuations && valuations.length > 0 ? (
                  valuations.map((valuation) => (
                    <Card key={valuation.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-primary-700">
                              Income Valuation
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(valuation.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="text-2xl font-bold text-primary-700">
                            {formatCurrency(valuation.valuationAmount)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="mr-4">
                            <span className="font-medium">Annual Income:</span>{" "}
                            {formatCurrency(valuation.totalAnnualIncome)}
                          </div>
                          <div>
                            <span className="font-medium">Multiplier:</span>{" "}
                            {Number(valuation.multiplier).toFixed(2)}x
                          </div>
                        </div>
                        {valuation.notes && (
                          <p className="mt-2 text-sm text-slate-500">{valuation.notes}</p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <Link href={`/valuation/${valuation.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteValuation(valuation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <h3 className="text-lg font-medium text-slate-800 mb-3">No Valuations Found</h3>
                      <p className="text-slate-500 mb-6">
                        You haven't created any valuations yet. Create a valuation to track your income value over time.
                      </p>
                      <Link href="/valuation/new">
                        <Button>Create Valuation</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="incomes">
              {/* Income sources breakdown chart */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-primary-700">Income Breakdown</CardTitle>
                  <CardDescription>Distribution of your income sources by type</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {incomesLoading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <p className="text-slate-500">Loading income data...</p>
                    </div>
                  ) : isIncomesError ? (
                    <div className="h-[350px] flex items-center justify-center">
                      {handleApiError(incomesError, 'income data')}
                    </div>
                  ) : incomes && incomes.length > 0 ? (
                    <IncomeChart data={incomes} />
                  ) : (
                    <div className="h-[350px] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-slate-500 mb-4">No income sources available</p>
                        <Link href="/valuation/new">
                          <Button variant="outline" size="sm">Add Income Sources</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid gap-6">
                {incomesLoading ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-slate-500">Loading income sources...</p>
                    </CardContent>
                  </Card>
                ) : isIncomesError ? (
                  <Card>
                    <CardContent className="py-8">
                      {handleApiError(incomesError, 'income sources')}
                    </CardContent>
                  </Card>
                ) : incomes && incomes.length > 0 ? (
                  incomes.map((income) => (
                    <Card key={income.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-primary-700 capitalize">
                              {income.source} Income
                            </CardTitle>
                            <CardDescription className="capitalize">{income.frequency}</CardDescription>
                          </div>
                          <div className="text-2xl font-bold text-primary-700">
                            {formatCurrency(income.amount)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        {income.description && (
                          <p className="text-sm text-slate-600">{income.description}</p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <Link href={`/valuation/new?edit=${income.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteIncome(income.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <h3 className="text-lg font-medium text-slate-800 mb-3">No Income Sources Found</h3>
                      <p className="text-slate-500 mb-6">
                        You haven't added any income sources yet. Add your income sources to create valuations.
                      </p>
                      <Link href="/valuation/new">
                        <Button>Add Income Sources</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </div>
  );
}