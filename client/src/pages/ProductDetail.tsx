import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { Product, InsertCartItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/session";
import { useAuth } from "@/lib/auth";
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
export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const { toast } = useToast();
  const { user, token } = useAuth();

  const zoomRef = useRef<HTMLImageElement>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [zoomActive, setZoomActive] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // @ts-ignore
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/onlineProducts", params?.id],
    enabled: !!params?.id,
  });

  const images = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images;
    }
    if (product?.imageUrl) {
      return [product.imageUrl];
    }
    return [];
  }, [product]);

  /** ADD TO CART */
  // @ts-ignore
  const addToCartMutation = useMutation({
    mutationFn: async (item) => await apiRequest("POST", "/api/cart", item, user ? {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } : undefined),

    onSuccess: () => {
      const cacheKey = user?.id ? `/api/cart/user/${user.id}` : `/api/cart/${getOrCreateSessionId()}`;
      queryClient.invalidateQueries({ queryKey: [cacheKey] });

      if (buttonRef.current) {
        // GSAP Animation for Add to Cart button feedback
        // @ts-ignore
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

  /** ANIMATIONS */
  useEffect(() => {
    if (!product) return;

    // @ts-ignore
    const ctx = gsap.context(() => {
      // @ts-ignore
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(imageRef.current, {
          opacity: 0,
          x: -30,
          duration: 0.8,
          delay: 0.1,
        })
        // @ts-ignore
        .from(
          contentRef.current?.children || [],
          { y: 30, opacity: 0, duration: 0.6, stagger: 0.1 },
          "-=0.6",
        );
    });

    return () => ctx.revert();
  }, [product]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const sessionId = getOrCreateSessionId();
    // @ts-ignore
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      sessionId: user ? undefined : sessionId,
      userId: user?.id,
    });
  }, [product, addToCartMutation, user]);

  const handleImageMove = useCallback((e) => {
    if (!zoomRef.current) return;

    const rect = zoomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

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
          <div className="space-y-4">
            <div
              ref={zoomRef}
              className="aspect-[3/4] bg-muted rounded-xl overflow-hidden shadow-lg relative group cursor-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2224%22%20height=%2224%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22currentColor%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20class=%22lucide%20lucide-zoom-in%22><circle%20cx=%2211%22%20cy=%2211%22%20r=%228%22/><line%20x1=%2221%22%20y1=%2221%22%20x2=%2216.65%22%20y2=%2216.65%22/><line%20x1=%2211%22%20y1=%228%22%20x2=%2211%22%20y2=%2214%22/><line%20x1=%228%22%20y1=%2211%22%20x2=%2214%22%20y2=%2211%22/></svg>'),crosshair] sticky top-20"
              onMouseMove={handleImageMove}
              onMouseEnter={() => setZoomActive(true)}
              onMouseLeave={() => setZoomActive(false)}
              role="img"
              aria-label={`Main image of ${product.name}, image ${currentImageIndex + 1} of ${images.length}`}
            >
              <img
                ref={imageRef}
                src={
                  images[currentImageIndex] ||
                  "https://placehold.co/400x533/CCCCCC/333333?text=Image+Error"
                }
                alt={`${product.name} - View ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-[transform,filter] duration-300"
                style={{
                  transform: zoomActive ? "scale(2)" : "scale(1)",
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  filter: zoomActive ? "brightness(1.05)" : "brightness(1)",
                }}
                onError={(e) =>
                  (e.currentTarget.src =
                    "https://placehold.co/400x533/CCCCCC/333333?text=Image+Error")
                }
              />

              {/* NAV BUTTONS */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white h-10 w-10 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={zoomActive}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white h-10 w-10 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={zoomActive}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* THUMBNAILS */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 p-0.5 ${
                      currentImageIndex === i
                        ? "border-primary ring-2 ring-primary/40 scale-[1.03]"
                        : "border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover rounded-[4px]"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://placehold.co/100x100/CCCCCC/333333?text=Thumb+Error")
                      }
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — DETAILS */}
          <div ref={contentRef} className="flex flex-col pt-0 lg:pt-8">
            {/* TITLE & PRICE */}
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

            {/* DESCRIPTION */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Product Story</h2>
              <p className="text-gray-600 leading-relaxed text-base">
                {product.description}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                ref={buttonRef}
                size="lg"
                className="flex-1 gap-2 text-lg py-3 transition-transform duration-200 hover:shadow-xl hover:shadow-primary/30"
                onClick={handleAddToCart}
                // @ts-ignore
                disabled={product.inStock === 0 || addToCartMutation.isPending}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.inStock === 0
                  ? "Out of Stock"
                  : // @ts-ignore
                    addToCartMutation.isPending
                    ? "Adding to Cart..."
                    : "Add to Cart"}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="gap-2 w-full sm:w-auto hover:bg-red-50 hover:text-red-600 border-red-300"
              >
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                Wishlist
              </Button>
            </div>

            <Separator className="my-8" />

            {/* SPECIFICATIONS */}
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

            {/* FEATURES / TRUST BADGES */}
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

        {/* SUGGESTED ITEMS - Placeholder content for a clean design */}
        <section className="mt-24">
          <h2 className="text-3xl font-serif text-center mb-12 text-gray-800">
            Complete the Look
          </h2>
          {/* 
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="group cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                  <img
                    src={`https://placehold.co/300x400/D2B48C/2A2A2A?text=Accessory+${i}`}
                    alt={`Suggested Item ${i}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 bg-white">
                  <p className="text-sm font-medium text-gray-700">
                    Jewelry Set {i}
                  </p>
                  <p className="text-lg font-semibold text-primary mt-1">
                    ₹3,500
                  </p>
                </div>
              </div>
            ))}
          </div> */}

          <div className="text-center pt-16">
            <Link href="/products">
              <Button variant="outline" size="lg" className="text-base">
                Browse More Collections
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="bg-card border-t py-12 mt-20 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Moha Heritage Textiles. Celebrating India's textile
            heritage.
          </p>
          <div className="flex justify-center space-x-4 mt-3 text-xs text-gray-500">
            <a href="#" className="hover:text-primary">
              Shipping
            </a>
            <a href="#" className="hover:text-primary">
              Returns
            </a>
            <a href="#" className="hover:text-primary">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
