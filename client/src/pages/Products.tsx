import { useState } from "react";
import { useLocation } from "wouter";
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
import gsap from "gsap";

interface ProductFilters {
  search: string;
  fabric: string;
  occasion: string;
  priceRange: string;
}

function parseProductParams(location: string): ProductFilters {
  const params = new URLSearchParams(location.split("?")[1] || "");
  const search = params.get("search") || "";
  const fabric = params.get("fabric") || "All";
  const occasion = params.get("occasion") || "All";
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");

  let priceRange = "all";
  if (minPrice && maxPrice) {
    priceRange = `${minPrice}-${maxPrice}`;
  }

  return { search, fabric, occasion, priceRange };
}

export default function Products() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filters = parseProductParams(location);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const apiParams = new URLSearchParams();
      if (filters.search) apiParams.append("search", filters.search);
      if (filters.fabric !== "All") apiParams.append("fabric", filters.fabric);
      if (filters.occasion !== "All")
        apiParams.append("occasion", filters.occasion);

      if (filters.priceRange !== "all") {
        const [min, max] = filters.priceRange.split("-");
        apiParams.append("minPrice", min);
        apiParams.append("maxPrice", max);
      }

      const queryString = apiParams.toString();
      const url = queryString
        ? `/api/products?${queryString}`
        : "/api/products";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const onlineProducts = products.filter(
    (product: any) =>
      product.storeInventory &&
      product.storeInventory.some(
        (alloc: any) => alloc.channel === "online" && alloc.quantity > 0,
      ),
  );

  const addToCartMutation = useMutation({
    mutationFn: async (item: InsertCartItem) => {
      return await apiRequest("POST", "/api/cart", item);
    },
    onSuccess: () => {
      const sessionId = getOrCreateSessionId();
      queryClient.invalidateQueries({
        queryKey: [`/api/cart?sessionId=${sessionId}`],
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
      quantity: 1,
      sessionId,
    });
  };

  const pushProductParams = (
    updates: Partial<Record<string, string | null>>,
  ) => {
    const newParams = new URLSearchParams(location.split("?")[1] || "");

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === "" ||
        value === "All" ||
        value === "all"
      ) {
        newParams.delete(key);
        if (key === "priceRange") {
          newParams.delete("minPrice");
          newParams.delete("maxPrice");
        }
      } else if (key === "priceRange" && value !== "all") {
        const [min, max] = value.split("-");
        newParams.set("minPrice", min);
        newParams.set("maxPrice", max);
      } else {
        newParams.set(key, value);
      }
    });

    const queryString = newParams.toString();
    setLocation(queryString ? `/products?${queryString}` : "/products", {
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
    pushProductParams({ search: query || null });
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
              value={filters.search}
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
            ) : onlineProducts.length === 0 ? (
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
                {onlineProducts.map((product, index) => (
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
