import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  LogOut,
  User as UserIcon,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOrCreateSessionId } from "@/lib/session";
import { cartService } from "@/features/user/services/cartService";
import type { WishlistItem } from "@shared/schema";

export function UserHeader() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const sessionId = getOrCreateSessionId();
  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-10 flex-1">
          <Link
            to="/"
            className="text-lg sm:text-xl md:text-2xl font-bold shrink-0"
          >
            Moha
          </Link>
          <Link
            to="/products"
            className="hidden sm:block text-xs sm:text-sm md:text-base hover:text-primary transition-colors"
          >
            Shop
          </Link>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-6 lg:gap-8">
          {/* WISHLIST */}
          <button
            onClick={() => {
              if (!token) {
                navigate("/login");
              } else {
                navigate("/wishlist");
              }
            }}
            className="flex flex-col items-center hover:text-primary cursor-pointer transition-colors p-1"
            data-testid="button-wishlist-header"
          >
            <div className="relative">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              {wishlistCount > 0 && (
                <span
                  className="
                    absolute top-0 right-0 
                    h-2 w-2 sm:h-2.5 sm:w-2.5
                    bg-primary 
                    rounded-full 
                    translate-x-1/3 -translate-y-1/3
                  "
                ></span>
              )}
            </div>
            <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm mt-0.5">
              Wishlist
            </span>
          </button>

          {/* CART */}
          <Link
            to="/cart"
            className="flex flex-col items-center hover:text-primary transition-colors p-1"
            data-testid="button-cart"
          >
            <div className="relative">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              {cartCount > 0 && (
                <span
                  className="
                    absolute top-0 right-0 
                    h-2 w-2 sm:h-2.5 sm:w-2.5
                    bg-primary 
                    rounded-full 
                    translate-x-1/3 -translate-y-1/3
                  "
                ></span>
              )}
            </div>
            <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm mt-0.5">
              Cart
            </span>
          </Link>

          {/* USER MENU */}
          {user ? (
            <div className="flex flex-col items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48 text-xs sm:text-sm"
                >
                  <DropdownMenuItem
                    disabled
                    className="text-xs sm:text-sm text-muted-foreground break-all"
                  >
                    {user.email}
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="text-xs sm:text-sm">
                    <Link to="/orders">Orders</Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-xs sm:text-sm"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm mt-0.5">
                Profile
              </span>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="text-xs sm:text-sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
