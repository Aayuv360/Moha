import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, WishlistItem, InsertCartItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/session";

export default function Wishlist() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const sessionId = getOrCreateSessionId();

  const { data: wishlistItems = [], isLoading: loadingWishlist } = useQuery<
    WishlistItem[]
  >({
    queryKey: ["/api/wishlist"],
    enabled: !!token,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: products = [], isLoading: loadingProducts } = useQuery<
    Product[]
  >({
    queryKey: ["/api/onlineProducts"],
    enabled: !!token,
  });

  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;

  const addToCartMutation = useMutation({
    mutationFn: async (item: InsertCartItem) => {
      return await apiRequest("POST", "/api/cart", item, isUserCart ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/cart', cartIdentifier],
      });
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (product: Product) => {
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      sessionId: isUserCart ? undefined : sessionId,
      userId: user?.id,
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const wishlistedProducts = products.filter((p) =>
    wishlistItems.some((w) => w.productId === p.id),
  );

  const isLoading = loadingWishlist || loadingProducts;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-4">
            My Wishlist
          </h1>
          <p className="text-muted-foreground text-lg">
            Your favorite sarees saved for later
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : wishlistedProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-muted-foreground mb-6 text-center">
                Start adding sarees to your wishlist by clicking the heart icon
              </p>
              <Button
                onClick={() => setLocation("/products")}
                data-testid="button-browse-products"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <p
              className="text-sm text-muted-foreground mb-6"
              data-testid="text-wishlist-count"
            >
              {wishlistedProducts.length}{" "}
              {wishlistedProducts.length === 1 ? "item" : "items"} in your
              wishlist
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {wishlistedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
