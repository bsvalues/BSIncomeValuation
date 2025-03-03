import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };
  
  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    return user.fullName 
      ? `${user.fullName.split(' ')[0][0]}${user.fullName.split(' ')[1]?.[0] || ''}`
      : user.username.substring(0, 2).toUpperCase();
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
            
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <div className={`text-sm font-medium ${isActive('/dashboard') ? 'text-white' : 'text-primary-100 hover:text-white'} transition cursor-pointer`}>
                    Dashboard
                  </div>
                </Link>
                <Link href="/calculator">
                  <div className={`text-sm font-medium ${isActive('/calculator') ? 'text-white' : 'text-primary-100 hover:text-white'} transition cursor-pointer`}>
                    Calculator
                  </div>
                </Link>
                <Link href="/valuation/new">
                  <Button size="sm" className="bg-white text-primary-700 hover:bg-primary-50">
                    New Valuation
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-1 focus:outline-none">
                      <Avatar className="h-8 w-8 bg-primary-600 text-white border-2 border-white hover:bg-primary-500 transition">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="font-normal text-xs text-muted-foreground">Signed in as</div>
                      <div className="font-medium">{user?.username}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <div className={`text-sm font-medium ${isActive('/login') ? 'text-white' : 'text-primary-100 hover:text-white'} transition cursor-pointer`}>
                    Login
                  </div>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-white text-primary-700 hover:bg-primary-50">
                    Register
                  </Button>
                </Link>
              </>
            )}
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
              
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/dashboard') ? 'bg-primary-600 text-white' : 'text-primary-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Dashboard
                    </div>
                  </Link>
                  <Link href="/calculator">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/calculator') ? 'bg-primary-600 text-white' : 'text-primary-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Calculator
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
                  <div className="pt-2 border-t border-primary-600">
                    <div className="px-2 py-1 text-sm flex items-center text-primary-100">
                      <User className="mr-2 h-4 w-4" />
                      <span>Signed in as <span className="font-semibold text-white">{user?.username}</span></span>
                    </div>
                    <button 
                      className="mt-2 px-2 py-1 w-full text-left text-red-300 hover:text-white flex items-center"
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/login') ? 'bg-primary-600 text-white' : 'text-primary-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Login
                    </div>
                  </Link>
                  <Link href="/register">
                    <div 
                      className="px-2 py-1 bg-white text-primary-700 hover:bg-primary-50 rounded cursor-pointer"
                      onClick={closeMenu}
                    >
                      Register
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
