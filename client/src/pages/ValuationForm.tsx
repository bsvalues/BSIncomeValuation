import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertIncomeSchema, insertValuationSchema } from "@shared/schema";
import { Plus, Trash2, Info, Check, ArrowRight } from "lucide-react";

// Extend the income schema
const incomeFormSchema = z.object({
  incomes: z.array(
    z.object({
      source: z.enum(["salary", "business", "freelance", "investment", "rental", "other"]),
      amount: z.string().min(1, "Amount is required"),
      frequency: z.enum(["monthly", "yearly", "quarterly", "weekly"]),
      description: z.string().optional(),
    })
  ).min(1, "At least one income source is required"),
  notes: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeFormSchema>;

const defaultIncome = {
  source: "salary" as const,
  amount: "",
  frequency: "monthly" as const,
  description: "",
};

const getSourceMultiplier = (source: string): number => {
  // Different multipliers for different income types
  switch (source) {
    case "salary": return 0.8;
    case "business": return 3.5;
    case "freelance": return 2.0;
    case "investment": return 15.0;
    case "rental": return 10.0;
    case "other": return 1.0;
    default: return 1.0;
  }
};

const frequencyMultiplier = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export default function ValuationForm() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hardcoded user ID for now - in a real app, this would come from auth
  const userId = 1;

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      incomes: [defaultIncome],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "incomes",
  });

  const onSubmit = async (data: IncomeFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Calculate total annual income and valuation
      let totalAnnualIncome = 0;
      let weightedMultiplier = 0;
      let totalWeightedIncome = 0;
      
      // Create all income sources
      for (const income of data.incomes) {
        const amount = parseFloat(income.amount);
        const annualAmount = amount * frequencyMultiplier[income.frequency];
        totalAnnualIncome += annualAmount;
        
        // Calculate weighted multiplier
        const sourceMultiplier = getSourceMultiplier(income.source);
        weightedMultiplier += (annualAmount * sourceMultiplier);
        totalWeightedIncome += annualAmount;
        
        // Save income to database
        await apiRequest("POST", "/api/incomes", {
          userId,
          source: income.source,
          amount: amount,
          frequency: income.frequency,
          description: income.description || null,
        });
      }
      
      // Calculate final weighted multiplier
      const finalMultiplier = totalWeightedIncome > 0 
        ? weightedMultiplier / totalWeightedIncome 
        : 1.0;
      
      // Calculate valuation amount
      const valuationAmount = totalAnnualIncome * finalMultiplier;
      
      // Create valuation
      const valuation = await apiRequest("POST", "/api/valuations", {
        userId,
        totalAnnualIncome,
        multiplier: finalMultiplier,
        valuationAmount,
        notes: data.notes || null,
      });
      
      // Get the valuation ID from the response
      const valuationResponse = await valuation.json();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/incomes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/valuations`] });

      toast({
        title: "Valuation Created",
        description: "Your income valuation has been calculated successfully",
      });
      
      // Redirect to the valuation result page
      setLocation(`/valuation/${valuationResponse.id}`);
    } catch (error) {
      console.error("Error creating valuation:", error);
      toast({
        title: "Error",
        description: "There was an error creating your valuation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-800 mb-6">Create New Valuation</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-primary-700">Income Sources</CardTitle>
            <CardDescription>
              Add all your income sources to get an accurate valuation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-slate-200 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-slate-800">Income Source {index + 1}</h3>
                        {index > 0 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`incomes.${index}.source`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Income Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select income type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="salary">Salary</SelectItem>
                                  <SelectItem value="business">Business</SelectItem>
                                  <SelectItem value="freelance">Freelance</SelectItem>
                                  <SelectItem value="investment">Investment</SelectItem>
                                  <SelectItem value="rental">Rental</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="flex items-center gap-1 text-xs">
                                <Info className="h-3 w-3" />
                                Different income types have different valuation multipliers
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`incomes.${index}.frequency`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequency</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`incomes.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`incomes.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Salary from ABC Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append(defaultIncome)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Income Source
                  </Button>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes about this valuation" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-primary-600 hover:bg-primary-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Calculating</>
                    ) : (
                      <>
                        Calculate Valuation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
