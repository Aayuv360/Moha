import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function InventoryHeader() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <Link to="/inventory/dashboard" className="text-2xl font-bold">
            Inventory Management
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          <Link to="/inventory/dashboard" className="text-sm hover:text-primary">
            Dashboard
          </Link>
          <Link to="/inventory/dashboard" className="text-sm hover:text-primary">
            Products
          </Link>
          <Link to="/inventory/dashboard" className="text-sm hover:text-primary">
            Orders
          </Link>
          <Link to="/inventory/dashboard" className="text-sm hover:text-primary">
            Returns
          </Link>
          <Link to="/inventory/dashboard" className="text-sm hover:text-primary">
            Reports
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-inventory-menu">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => authContext?.logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/inventory/login">
              <Button size="sm" data-testid="button-inventory-login">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
