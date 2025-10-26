import { ShoppingCart, Heart, User, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { CartItem } from "@shared/schema";
import { getOrCreateSessionId } from "@/lib/session";

export function Navigation() {
  const [location] = useLocation();
  const sessionId = getOrCreateSessionId();

  const { data: cart = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/cart', sessionId],
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/">
            <a className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2" data-testid="link-home">
              <h1 className="text-2xl md:text-3xl font-serif font-light tracking-wide">
                Saree <span className="text-primary">Elegance</span>
              </h1>
            </a>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products">
              <a
                className={`text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${
                  location === '/products' ? 'text-primary' : 'text-foreground'
                }`}
                data-testid="link-products"
              >
                Shop
              </a>
            </Link>
            <Link href="/products?occasion=Wedding">
              <a className="text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors" data-testid="link-wedding">
                Wedding
              </a>
            </Link>
            <Link href="/products?occasion=Festive">
              <a className="text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors" data-testid="link-festive">
                Festive
              </a>
            </Link>
            <Link href="/products?occasion=Casual">
              <a className="text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors" data-testid="link-casual">
                Casual
              </a>
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex" data-testid="button-search">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-wishlist">
              <Heart className="h-5 w-5" />
            </Button>
            <Link href="/cart">
              <a data-testid="link-cart">
                <Button variant="ghost" size="icon" className="relative">
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
              </a>
            </Link>
            <Button variant="ghost" size="icon" data-testid="button-user">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
