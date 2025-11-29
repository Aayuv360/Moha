import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut, User as UserIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function UserHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          Moha
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link to="/products" className="text-sm hover:text-primary">
            Shop
          </Link>
          <Link to="/wishlist" className="text-sm hover:text-primary">
            Wishlist
          </Link>
          <Link to="/orders" className="text-sm hover:text-primary">
            Orders
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/cart" data-testid="button-cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button size="sm" data-testid="button-login">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
