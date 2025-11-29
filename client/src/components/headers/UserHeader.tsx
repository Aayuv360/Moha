import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, LogOut, User as UserIcon, Heart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getOrCreateSessionId } from "@/lib/session";
import { cartService } from "@/features/user/services/cartService";
import type { WishlistItem } from "@shared/schema";

export function UserHeader() {
  const { user, logout, token } = useAuth();
  const sessionId = getOrCreateSessionId();
  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;

  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart", cartIdentifier],
    queryFn: () => cartService.getCart(cartIdentifier, isUserCart, token),
  });

  const { data: wishlistItems = [] } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!token,
  });

  const cartCount = cartItems.length;
  const wishlistCount = wishlistItems.length;

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
          <Link to="/wishlist" className="text-sm hover:text-primary flex items-center gap-2">
            Wishlist
            {wishlistCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {wishlistCount}
              </Badge>
            )}
          </Link>
          <Link to="/orders" className="text-sm hover:text-primary">
            Orders
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/cart" data-testid="button-cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {cartCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {cartCount}
              </Badge>
            )}
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
