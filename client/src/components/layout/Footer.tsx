import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 text-slate-300 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-semibold text-white mb-2">Income Valuation SaaS</h3>
            <p className="text-slate-400 max-w-md">
              Calculate the true value of your income streams with our advanced valuation tools.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold text-white uppercase mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/dashboard">
                    <a className="text-slate-400 hover:text-white transition">
                      Dashboard
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/valuation/new">
                    <a className="text-slate-400 hover:text-white transition">
                      Create Valuation
                    </a>
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-slate-400 hover:text-white transition">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white uppercase mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white uppercase mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-700 text-sm text-slate-500 flex flex-col md:flex-row md:justify-between">
          <p>© {currentYear} Income Valuation SaaS. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-slate-400 hover:text-white">
              Twitter
            </a>
            <a href="#" className="text-slate-400 hover:text-white">
              LinkedIn
            </a>
            <a href="#" className="text-slate-400 hover:text-white">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
