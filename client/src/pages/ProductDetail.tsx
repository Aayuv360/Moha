
import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import gsap from "gsap";
import { Navigation } from "@/components/Navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Heart, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, InsertCartItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/session";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const { toast } = useToast();
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', params?.id],
    enabled: !!params?.id,
  });

  const images = product?.images && product.images.length > 0 
    ? product.images 
    : product?.imageUrl ? [product.imageUrl] : [];

  const addToCartMutation = useMutation({
    mutationFn: async (item: InsertCartItem) => {
      return await apiRequest('POST', '/api/cart', item);
    },
    onSuccess: () => {
      const sessionId = getOrCreateSessionId();
      queryClient.invalidateQueries({ queryKey: ['/api/cart', sessionId] });
      
      if (buttonRef.current) {
        gsap.timeline()
          .to(buttonRef.current, {
            scale: 1.15,
            duration: 0.3,
            ease: "back.out(3)",
          })
          .to(buttonRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
      }

      toast({
        title: "Added to cart",
        description: "Item has been added to your cart successfully.",
      });
    },
  });

  useEffect(() => {
    if (product) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        
        tl.from(imageRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.8,
        })
          .from(
            contentRef.current?.children || [],
            {
              y: 30,
              opacity: 0,
              duration: 0.6,
              stagger: 0.1,
            },
            "-=0.4"
          );
      });

      return () => ctx.revert();
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const sessionId = getOrCreateSessionId();
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      sessionId,
    });
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomContainerRef.current) return;
    
    const rect = zoomContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

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
          <h1 className="text-2xl font-serif mb-4">Product not found</h1>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const specifications = [
    { label: "Fabric", value: product.fabric },
    { label: "Color", value: product.color },
    { label: "Occasion", value: product.occasion },
    { label: "Category", value: product.category },
  ];

  const features = [
    {
      icon: <Truck className="h-5 w-5" />,
      title: "Free Shipping",
      description: "On orders above ₹5,000",
    },
    {
      icon: <RotateCcw className="h-5 w-5" />,
      title: "Easy Returns",
      description: "7-day return policy",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Authentic",
      description: "100% genuine product",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <Link href="/products">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 md:mb-8 cursor-pointer" data-testid="link-back">
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-4">
            {/* Main Image with Navigation and Zoom */}
            <div 
              ref={zoomContainerRef}
              className="aspect-[3/4] bg-muted rounded-lg overflow-hidden relative group/detail sticky top-20 cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div 
                ref={imageRef}
                className="w-full h-full relative overflow-hidden"
              >
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: isZooming ? 'scale(2)' : 'scale(1)',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }}
                />
              </div>
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white h-12 w-12 rounded-full shadow-lg opacity-0 group-hover/detail:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-700" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white h-12 w-12 rounded-full shadow-lg opacity-0 group-hover/detail:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-700" />
                  </button>
                  
                  {/* Image counter */}
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                      idx === currentImageIndex 
                        ? 'border-primary ring-2 ring-primary/20 scale-105' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={contentRef} className="flex flex-col">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-4">
                {product.fabric}
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-4">
                {product.name}
              </h1>
              <p className="text-3xl md:text-4xl font-semibold mb-6" data-testid="text-price">
                ₹{parseFloat(product.price).toLocaleString('en-IN')}
              </p>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                {specifications.map((spec) => (
                  <div key={spec.label}>
                    <p className="text-sm text-muted-foreground mb-1">{spec.label}</p>
                    <p className="font-medium">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                ref={buttonRef}
                size="lg"
                className="flex-1 gap-2"
                onClick={handleAddToCart}
                disabled={product.inStock === 0 || addToCartMutation.isPending}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {addToCartMutation.isPending ? 'Adding...' : product.inStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button variant="outline" size="lg" data-testid="button-add-to-wishlist">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4 mt-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="text-primary mt-1">{feature.icon}</div>
                  <div>
                    <p className="font-medium mb-1">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-16 md:mt-24">
          <h2 className="text-2xl md:text-3xl font-serif font-normal mb-8 md:mb-12">
            You May Also Like
          </h2>
          <div className="text-center text-muted-foreground py-12">
            <Link href="/products">
              <Button variant="outline" size="lg">Explore More Sarees</Button>
            </Link>
          </div>
        </section>
      </div>

      <footer className="bg-card border-t border-border py-8 md:py-12 px-4 md:px-6 mt-12 md:mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Saree Elegance. Celebrating India's textile heritage.
          </p>
        </div>
      </footer>
    </div>
  );
}
