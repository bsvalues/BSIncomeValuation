import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-primary-700 text-white py-4 shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="text-2xl font-bold text-white hover:text-primary-100 transition cursor-pointer">
                Income Valuation SaaS
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <div className={`text-sm font-medium ${isActive('/') ? 'text-white' : 'text-primary-100 hover:text-white'} transition cursor-pointer`}>
                Home
              </div>
            </Link>
            <Link href="/dashboard">
              <div className={`text-sm font-medium ${isActive('/dashboard') ? 'text-white' : 'text-primary-100 hover:text-white'} transition cursor-pointer`}>
                Dashboard
              </div>
            </Link>
            <Link href="/valuation/new">
              <Button size="sm" className="bg-white text-primary-700 hover:bg-primary-50">
                New Valuation
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-white p-2"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <Link href="/">
                <div 
                  className={`px-2 py-1 rounded ${isActive('/') ? 'bg-primary-600 text-white' : 'text-primary-100 hover:text-white'} cursor-pointer`}
                  onClick={closeMenu}
                >
                  Home
                </div>
              </Link>
              <Link href="/dashboard">
                <div 
                  className={`px-2 py-1 rounded ${isActive('/dashboard') ? 'bg-primary-600 text-white' : 'text-primary-100 hover:text-white'} cursor-pointer`}
                  onClick={closeMenu}
                >
                  Dashboard
                </div>
              </Link>
              <Link href="/valuation/new">
                <div 
                  className="px-2 py-1 bg-white text-primary-700 hover:bg-primary-50 rounded cursor-pointer"
                  onClick={closeMenu}
                >
                  New Valuation
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
