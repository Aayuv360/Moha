import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { CartItemCard } from "@/components/CartItemCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ShoppingBag } from "lucide-react";
import type { CartItem, Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/session";
import { useAuth } from "@/lib/auth";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export default function Cart() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const sessionId = getOrCreateSessionId();

  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;
  const cartEndpoint = isUserCart ? `/api/cart/user/${user.id}` : `/api/cart/${sessionId}`;

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ['/api/cart', cartIdentifier],
    queryFn: async () => {
      const endpoint = isUserCart ? `/api/cart/user/${user.id}` : `/api/cart/${sessionId}`;
      const options = isUserCart ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : undefined;
      return await apiRequest('GET', endpoint, undefined, options);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return await apiRequest('PATCH', `/api/cart/${id}`, { quantity }, isUserCart ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', cartIdentifier] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/cart/${id}`, {}, isUserCart ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', cartIdentifier] });
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateQuantity = (id: string, quantity: number) => {
    updateQuantityMutation.mutate({ id, quantity });
  };

  const handleRemoveItem = (id: string) => {
    removeItemMutation.mutate(id);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const shipping = subtotal >= 5000 ? 0 : 200;
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <LoadingSpinner />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <EmptyState
            icon={<ShoppingBag className="h-12 w-12 text-muted-foreground" />}
            title="Your cart is empty"
            description="Looks like you haven't added any sarees to your cart yet. Start shopping to fill it up!"
            actionLabel="Continue Shopping"
            actionHref="/products"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-8 md:mb-12">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-serif font-medium mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium" data-testid="text-subtotal">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium" data-testid="text-shipping">
                    {shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {subtotal < 5000 && (
                  <p className="text-xs text-muted-foreground">
                    Add ₹{(5000 - subtotal).toLocaleString('en-IN')} more for free shipping
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between mb-6">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-semibold" data-testid="text-total">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              <Link href="/checkout">
                <a className="block w-full" data-testid="link-checkout">
                  <Button size="lg" className="w-full" style={{ backgroundColor: '#9b083a' }}>
                    Proceed to Checkout
                  </Button>
                </a>
              </Link>

              <Link href="/products">
                <a className="block w-full mt-3" data-testid="link-continue-shopping">
                  <Button variant="outline" size="lg" className="w-full">
                    Continue Shopping
                  </Button>
                </a>
              </Link>
            </Card>
          </div>
        </div>
      </div>

      <footer className="bg-card border-t border-border py-8 md:py-12 px-4 md:px-6 mt-12 md:mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Moha. Celebrating India's textile heritage.
          </p>
        </div>
      </footer>
    </div>
  );
}