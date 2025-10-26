
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

gsap.registerPlugin(ScrollTrigger);

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  index: number;
}

export function ProductCard({ product, onAddToCart, index }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.imageUrl];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top bottom-=100",
          toggleActions: "play none none none",
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: (index % 4) * 0.1,
      });
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  useEffect(() => {
    if (isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, images.length]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart(product);
  };

  return (
    <div ref={cardRef} data-testid={`card-product-${product.id}`}>
      <Link href={`/product/${product.id}`}>
        <a className="block">
          <Card className="group overflow-hidden hover-elevate transition-all duration-300">
            <div 
              className="aspect-[3/4] overflow-hidden bg-muted relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              />
              
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentImageIndex 
                          ? 'w-6 bg-white shadow-sm' 
                          : 'w-1.5 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                data-testid={`button-wishlist-${product.id}`}
              >
                <Heart className="h-4 w-4" />
              </Button>
              {product.inStock === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="secondary" className="text-sm">
                    Out of Stock
                  </Badge>
                </div>
              )}
            </div>

            <div className="p-4 md:p-5">
              <div className="mb-2">
                <Badge variant="secondary" className="text-xs">
                  {product.fabric}
                </Badge>
              </div>
              <h3 className="text-lg md:text-xl font-serif font-medium mb-2 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl md:text-3xl font-semibold">
                  ₹{parseFloat(product.price).toLocaleString('en-IN')}
                </p>
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={product.inStock === 0}
                  className="gap-2"
                  data-testid={`button-add-to-cart-${product.id}`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </Card>
        </a>
      </Link>
    </div>
  );
}
