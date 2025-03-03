import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="bg-primary-700 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">Income Valuation SaaS</h1>
          <p className="text-primary-100 text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Calculate the true value of your income streams with our advanced valuation tools
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/valuation/new">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Start a Valuation
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-primary-600">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-800 text-center mb-12">
            Why Choose Our Income Valuation Tool
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-primary-700 mb-4">Accurate Valuations</h3>
              <p className="text-slate-600">
                Our algorithm uses industry-standard multipliers for different income types to provide accurate valuations.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-primary-700 mb-4">Multiple Income Streams</h3>
              <p className="text-slate-600">
                Add and track multiple income sources to get a comprehensive view of your financial worth.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-primary-700 mb-4">Historical Tracking</h3>
              <p className="text-slate-600">
                Track how your income valuation changes over time with our historical data visualizations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-800 text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold mb-4">1</div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Add Your Income Sources</h3>
              <p className="text-slate-600">
                Enter details about your various income streams including the type, amount, and frequency.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold mb-4">2</div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Generate Valuation</h3>
              <p className="text-slate-600">
                Our system applies appropriate multipliers based on income type and calculates the total valuation.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold mb-4">3</div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Review and Save</h3>
              <p className="text-slate-600">
                Review your valuation results, save them to your dashboard, and track changes over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-800 mb-6">
            Ready to Discover Your Income's Value?
          </h2>
          <p className="text-slate-700 text-lg max-w-3xl mx-auto mb-8">
            Join thousands of users who have calculated their income valuation and gained insights into their financial worth.
          </p>
          <Link href="/valuation/new">
            <Button size="lg" className="bg-primary-600 text-white hover:bg-primary-700">
              Start Your Free Valuation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
