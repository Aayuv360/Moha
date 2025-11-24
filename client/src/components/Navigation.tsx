import { ShoppingCart, Heart, User, Search, LogOut, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { CartItem, WishlistItem } from "@shared/schema";
import { getOrCreateSessionId } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const sessionId = getOrCreateSessionId();
  const { user, token, logout } = useAuth();

  const { data: cart = [] } = useQuery<CartItem[]>({
    queryKey: [`/api/cart?sessionId=${sessionId}`],
  });

  const { data: wishlistItems = [] } = useQuery<WishlistItem[]>({
    queryKey: ['/api/wishlist'],
    enabled: !!token,
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2 cursor-pointer">
              <h1 className="text-2xl md:text-3xl font-serif font-light tracking-wide">
                <span style={{ color: '#9b083a' }}>Moha</span>
              </h1>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className={`text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${
                location === '/products' ? 'text-primary' : 'text-foreground'
              }`}
              data-testid="link-products"
            >
              Shop
            </Link>
            <Link
              href="/products?occasion=Wedding"
              className="text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors"
              data-testid="link-wedding"
            >
              Wedding
            </Link>
            <Link
              href="/products?occasion=Festive"
              className="text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors"
              data-testid="link-festive"
            >
              Festive
            </Link>
            <Link
              href="/products?occasion=Casual"
              className="text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors"
              data-testid="link-casual"
            >
              Casual
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex" data-testid="button-search">
              <Search className="h-5 w-5" />
            </Button>
            <Link href="/wishlist" asChild>
              <Button variant="ghost" size="icon" className="relative" data-testid="link-wishlist">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    data-testid="badge-wishlist-count"
                  >
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/cart" asChild>
              <Button variant="ghost" size="icon" className="relative" data-testid="link-cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    data-testid="badge-cart-count"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-user-menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-sm">
                    {user.name}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-sm text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/orders')} data-testid="link-orders">
                    <Package className="h-4 w-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" asChild>
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
