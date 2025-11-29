import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Filter, ShoppingBag, Search as SearchIcon } from "lucide-react";
import type { Product, InsertCartItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import gsap from "gsap";

interface ProductFilters {
  fabric: string;
  occasion: string;
  priceRange: string;
}

function parseUrlParams(searchString: string): ProductFilters {
  const params = new Map<string, string>();
  const parts = searchString.slice(1).split("&");
  
  for (const part of parts) {
    if (!part) continue;
    const [key, value] = part.split("=");
    if (key) {
      params.set(decodeURIComponent(key), decodeURIComponent(value || ""));
    }
  }

  const fabric = params.get("fabric") || "All";
  const occasion = params.get("occasion") || "All";
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");

  let priceRange = "all";
  if (minPrice && maxPrice) {
    priceRange = `${minPrice}-${maxPrice}`;
  }

  return { fabric, occasion, priceRange };
}

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filters = useMemo(() => parseUrlParams(location.search), [location.search]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", filters, searchQuery],
    queryFn: async () => {
      const params: string[] = [];
      
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (filters.fabric !== "All") params.push(`fabric=${encodeURIComponent(filters.fabric)}`);
      if (filters.occasion !== "All") params.push(`occasion=${encodeURIComponent(filters.occasion)}`);
      
      if (filters.priceRange !== "all") {
        const [min, max] = filters.priceRange.split("-");
        params.push(`minPrice=${encodeURIComponent(min)}`);
        params.push(`maxPrice=${encodeURIComponent(max)}`);
      }

      const queryString = params.length > 0 ? `?${params.join("&")}` : "";
      const url = `/api/onlineProducts${queryString}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (item: InsertCartItem) => {
      return await apiRequest(
        "POST",
        "/api/cart",
        item,
        user
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined,
      );
    },
    onSuccess: () => {
      const cartIdentifier = user?.id;
      queryClient.invalidateQueries({
        queryKey: ["/api/cart", cartIdentifier],
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

  const handleAddToCart = (product: Product, quantity: number) => {
    const sessionId = getOrCreateSessionId();

    const button = document.querySelector(
      `[data-testid="button-add-to-cart-${product.id}"]`,
    );
    if (button) {
      gsap.to(button, {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }

    addToCartMutation.mutate({
      productId: product.id,
      quantity: quantity,
      sessionId: user ? undefined : sessionId,
      userId: user?.id,
    });
  };

  const pushProductParams = (
    updates: Partial<Record<string, string | null>>,
  ) => {
    const params = new Map<string, string>();
    const parts = location.search.slice(1).split("&");
    
    for (const part of parts) {
      if (!part) continue;
      const [key, value] = part.split("=");
      if (key && value) {
        params.set(decodeURIComponent(key), decodeURIComponent(value));
      }
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === "" ||
        value === "All" ||
        value === "all"
      ) {
        params.delete(key);
        if (key === "priceRange") {
          params.delete("minPrice");
          params.delete("maxPrice");
        }
      } else if (key === "priceRange" && value !== "all") {
        const [min, max] = value.split("-");
        params.delete("priceRange");
        params.set("minPrice", min);
        params.set("maxPrice", max);
      } else {
        params.set(key, value);
      }
    });

    const queryArray: string[] = [];
    params.forEach((value, key) => {
      queryArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });

    const queryString = queryArray.join("&");
    navigate(queryString ? `/products?${queryString}` : "/products", {
      replace: false,
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    pushProductParams({ [key]: value });
  };

  const handleClearFilters = () => {
    pushProductParams({
      fabric: null,
      occasion: null,
      priceRange: null,
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-4">
            Our Collection
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            Explore our curated selection of handcrafted sarees, each piece a
            testament to India's rich textile heritage.
          </p>

          <div className="relative max-w-md w-full sm:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sarees..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <p
            className="text-sm text-muted-foreground"
            data-testid="text-product-count"
          >
            {products.length} {products.length === 1 ? "saree" : "sarees"} found
          </p>
          <Button
            variant="outline"
            className="md:hidden gap-2"
            onClick={() => setShowMobileFilters(true)}
            data-testid="button-show-filters"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </aside>

          {showMobileFilters && (
            <div className="fixed inset-0 z-50 bg-background p-4 overflow-y-auto lg:hidden">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isMobile
                onClose={() => setShowMobileFilters(false)}
              />
            </div>
          )}

          <div className="lg:col-span-3">
            {isLoading ? (
              <LoadingSpinner />
            ) : products.length === 0 ? (
              <EmptyState
                icon={
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                }
                title="No sarees found"
                description="Try adjusting your filters to see more results."
                actionLabel="Clear Filters"
                actionHref="/products"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
