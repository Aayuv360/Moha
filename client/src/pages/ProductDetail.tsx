import { useCallback, useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import gsap from "gsap";
import { Navigation } from "@/components/Navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Heart,
  Truck,
  RotateCcw,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product, CartItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/session";
import { useAuth } from "@/lib/auth";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const { toast } = useToast();
  const { user, token } = useAuth();

  const zoomRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sessionId = getOrCreateSessionId();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [zoomActive, setZoomActive] = useState(false);

  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/onlineProducts", params?.id],
    enabled: !!params?.id,
  });

  const { data: cart = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart", cartIdentifier],
    queryFn: async () => {
      const endpoint = isUserCart
        ? `/api/cart/user/${user.id}`
        : `/api/cart/${sessionId}`;
      const options = isUserCart
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;
      return await apiRequest("GET", endpoint, undefined, options);
    },
  });

  const cartItem = cart.find((item) => item.productId === product?.id);
  const cartQuantity = cartItem?.quantity || 0;

  const images =
    product?.images
      .replace(/[{}]/g, "")
      .split(",")
      .map((s: string) => s.replace(/"/g, "")) ?? [];

  const updateCartMutation = useMutation({
    mutationFn: async (newQuantity: number) => {
      if (!cartItem) return;
      return await apiRequest(
        "PATCH",
        `/api/cart/${cartItem.id}`,
        { quantity: newQuantity },
        isUserCart
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined,
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["/api/cart", cartIdentifier],
      }),
  });

  const addToCartMutation = useMutation({
    mutationFn: async (item: any) =>
      await apiRequest(
        "POST",
        "/api/cart",
        item,
        user ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      ),
    onSuccess: () => {
      const cacheKey = user?.id
        ? `/api/cart/user/${user.id}`
        : `/api/cart/${getOrCreateSessionId()}`;
      queryClient.invalidateQueries({ queryKey: [cacheKey] });

      if (buttonRef.current) {
        gsap
          .timeline()
          .to(buttonRef.current, {
            scale: 1.05,
            duration: 0.2,
            ease: "power1.out",
          })
          .to(buttonRef.current, { scale: 1, duration: 0.2 });
      }

      toast({
        title: "Added to cart",
        description: "Item added to your cart successfully.",
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async () => {
      if (!cartItem) return;
      return await apiRequest(
        "DELETE",
        `/api/cart/${cartItem.id}`,
        {},
        isUserCart
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined,
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["/api/cart", cartIdentifier],
      }),
  });

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity < (product?.inStock ?? 0)) {
      updateCartMutation.mutate(cartQuantity + 1);
    }
  };

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity > 1) updateCartMutation.mutate(cartQuantity - 1);
    else if (cartQuantity === 1) removeFromCartMutation.mutate();
  };

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const sessionId = getOrCreateSessionId();
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      sessionId: user ? undefined : sessionId,
      userId: user?.id,
    });
  }, [product, addToCartMutation, user]);

  const handleImageMove = useCallback((e: any) => {
    if (!zoomRef.current) return;
    const rect = zoomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((i) => (i === images?.length - 1 ? 0 : i + 1));
  }, [images?.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  useEffect(() => {
    if (!product) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(imageRef.current, {
          opacity: 0,
          x: -30,
          duration: 0.8,
          delay: 0.1,
        })
        .from(
          contentRef.current?.children || [],
          { y: 30, opacity: 0, duration: 0.6, stagger: 0.1 },
          "-=0.6",
        );
    });

    return () => ctx.revert();
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-serif mb-6 text-gray-800">
            Product not found
          </h1>
          <p className="text-muted-foreground mb-8">
            The item you were looking for could not be located.
          </p>
          <Link href="/products">
            <Button size="lg">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const specs = [
    { label: "Fabric", value: product.fabric },
    { label: "Color", value: product.color },
    { label: "Occasion", value: product.occasion },
    { label: "Category", value: product.category },
  ];

  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Free Shipping",
      description: "On all orders above ₹5,000 across India.",
    },
    {
      icon: <RotateCcw className="h-6 w-6" />,
      title: "Easy Returns",
      description: "Hassle-free 7-day return and exchange policy.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Authenticity Guaranteed",
      description: "100% genuine, handloom-certified textile products.",
    },
  ];

  const formattedPrice = `₹${parseFloat(product.price).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <Link href="/products">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition mb-8 cursor-pointer">
            <ChevronLeft className="h-4 w-4" /> All Products
          </span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* IMAGE */}
          <div className="space-y-4">
            <div
              ref={zoomRef}
              className="aspect-[3/4] bg-muted rounded-xl overflow-hidden shadow-lg relative group"
              onMouseMove={handleImageMove}
              onMouseEnter={() => setZoomActive(true)}
              onMouseLeave={() => setZoomActive(false)}
              role="img"
              aria-label={`Main image of ${product.name}, image ${currentImageIndex + 1} of ${images.length}`}
            >
              <img
                ref={imageRef}
                src={images[currentImageIndex]}
                alt={`${product.name} - View ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-[transform,filter] duration-300"
                style={{
                  transform: zoomActive ? "scale(2)" : "scale(1)",
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  filter: zoomActive ? "brightness(1.05)" : "brightness(1)",
                }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white h-10 w-10 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-gray-700"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white h-10 w-10 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === i
                        ? "scale-[1.1]"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full rounded-[4px]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div ref={contentRef} className="flex flex-col">
            <div className="mb-4">
              <Badge
                variant="secondary"
                className="mb-4 text-xs tracking-wider uppercase"
              >
                {product.fabric} - {product.category}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-serif mb-3 leading-tight text-gray-900">
                {product.name}
              </h1>
              <p className="text-4xl font-bold text-primary mb-2">
                {formattedPrice}
              </p>
              <p className="text-sm text-green-600 font-medium">
                {product.inStock > 0 ? "In Stock" : "Expected soon"}
              </p>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Product Story</h2>
              <p className="text-gray-600 leading-relaxed text-base">
                {product.description}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4 items-center sm:items-start">
              {cartQuantity > 0 ? (
                <div className="flex items-center gap-2 border border-border rounded-md overflow-hidden">
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={handleDecreaseQuantity}
                    disabled={
                      updateCartMutation.isPending ||
                      removeFromCartMutation.isPending
                    }
                    className="h-10 w-10 p-0 text-lg sm:text-xl"
                    data-testid={`button-decrease-qty-${product.id}`}
                  >
                    −
                  </Button>
                  <span className="w-10 text-center text-lg font-medium">
                    {cartQuantity}
                  </span>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={handleIncreaseQuantity}
                    disabled={
                      cartQuantity >= product.inStock ||
                      updateCartMutation.isPending
                    }
                    className="h-10 w-10 p-0 text-lg sm:text-xl"
                    data-testid={`button-increase-qty-${product.id}`}
                  >
                    +
                  </Button>
                </div>
              ) : (
                <Button
                  ref={buttonRef}
                  size="lg"
                  className="flex-1 gap-2 text-lg py-3 transition-transform duration-200 hover:shadow-xl hover:shadow-primary/30"
                  onClick={handleAddToCart}
                  disabled={
                    product.inStock === 0 || addToCartMutation.isPending
                  }
                >
                  <ShoppingCart className="h-5 w-5" />
                  {product.inStock === 0
                    ? "Out of Stock"
                    : addToCartMutation.isPending
                      ? "Adding to Cart..."
                      : "Add to Cart"}
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className="gap-2 w-full sm:w-auto hover:bg-primary/5 hover:text-primary/60 border-primary/30"
              >
                <Heart className="h-5 w-5 fill-primary text-primary" />
                Wishlist
              </Button>
            </div>

            <Separator className="my-8" />

            {/* KEY DETAILS */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Key Details</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                {specs.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <p className="text-xs font-medium uppercase text-muted-foreground tracking-wider mb-1">
                      {s.label}
                    </p>
                    <p className="font-semibold text-gray-800">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* FEATURES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card transition-all hover:bg-gray-50 border border-gray-100"
                >
                  <span className="text-primary mt-0.5 shrink-0 bg-primary/10 p-2 rounded-full">
                    {f.icon}
                  </span>
                  <div>
                    <p className="font-bold text-base text-gray-900">
                      {f.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
