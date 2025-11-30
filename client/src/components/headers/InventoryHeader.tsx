import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Package, Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function InventoryHeader() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
          <Link to="/inventory/dashboard" className="text-sm sm:text-lg md:text-2xl font-bold truncate">
            Inventory
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3 md:gap-4 lg:gap-6">
          <Link to="/inventory/dashboard" className="text-xs sm:text-sm md:text-base hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/inventory/dashboard" className="text-xs sm:text-sm md:text-base hover:text-primary transition-colors">
            Products
          </Link>
          <Link to="/inventory/dashboard" className="text-xs sm:text-sm md:text-base hover:text-primary transition-colors">
            Orders
          </Link>
          <Link to="/inventory/dashboard" className="text-xs sm:text-sm md:text-base hover:text-primary transition-colors">
            Returns
          </Link>
          <Link to="/inventory/dashboard" className="text-xs sm:text-sm md:text-base hover:text-primary transition-colors">
            Reports
          </Link>
        </nav>

        {/* Mobile Menu */}
        <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 sm:h-10 sm:w-10" data-testid="button-inventory-menu-mobile">
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/inventory/dashboard" className="cursor-pointer">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/inventory/dashboard" className="cursor-pointer">Products</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/inventory/dashboard" className="cursor-pointer">Orders</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/inventory/dashboard" className="cursor-pointer">Returns</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/inventory/dashboard" className="cursor-pointer">Reports</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-inventory-menu" className="h-9 w-9 sm:h-10 sm:w-10">
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground break-all">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()} className="text-xs sm:text-sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/inventory/login">
              <Button size="sm" data-testid="button-inventory-login" className="text-xs sm:text-sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
