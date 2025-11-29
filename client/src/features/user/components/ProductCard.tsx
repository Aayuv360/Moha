import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateSessionId } from "@/lib/session";
import { cartService } from "../services/cartService";
import type { WishlistItem } from "@shared/schema";
import { CartItem, Product } from "./cartTypes";
import { wishlistService } from "../services/wishlist";

gsap.registerPlugin(ScrollTrigger);

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  index: number;
}

export function ProductCard({ product, onAddToCart, index }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();
  const sessionId = getOrCreateSessionId();

  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;

  const { data: cart = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart", cartIdentifier],
    queryFn: () => cartService.getCart(cartIdentifier, isUserCart, token),
  });
  const cartItem = cart.find(
    (item) => item.product.trackingId === product.trackingId,
  );
  const cartQuantity = cartItem?.quantity || 0;

  const { data: wishlistItems = [] } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!token,
  });

  const isInWishlist = wishlistItems.some(
    (w) => w.productId === product.trackingId,
  );

  const updateCartMutation = useMutation({
    mutationFn: async (newQuantity: number) => {
      if (!cartItem) return;
      return await cartService.updateCartQuantity(
        cartItem.id,
        newQuantity,
        isUserCart,
        token,
      );
    },
    onSuccess: () => cartService.invalidateCartCache(cartIdentifier),
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async () => {
      if (!cartItem) return;
      return await cartService.removeFromCart(cartItem.id, isUserCart, token);
    },
    onSuccess: () => cartService.invalidateCartCache(cartIdentifier),
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: () =>
      wishlistService.toggleWishlist(product.trackingId, isInWishlist, token!),
    onSuccess: (response) => {
      const isNowInWishlist = response?.isInWishlist !== false;
      wishlistService.updateWishlistCache(product.trackingId, isNowInWishlist);

      toast({
        title: isNowInWishlist ? "Added to wishlist" : "Removed from wishlist",
        description: isNowInWishlist
          ? "Item added to your wishlist successfully."
          : "Item removed from your wishlist",
      });
    },
  });
  const images = product.images
    .replace(/[{}]/g, "")
    .split(",")
    .map((s: string) => s.replace(/"/g, ""));

  // Scroll animation for card
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

  // Image hover rotation
  useEffect(() => {
    if (isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) =>
          prev === images.length - 1 ? 0 : prev + 1,
        );
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, images.length]);

  useEffect(() => {
    if (product.inStock > 0 && product.inStock <= 5 && badgeRef.current) {
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      tl.to(badgeRef.current, {
        scale: 1.1,
        duration: 0.6,
        ease: "power1.inOut",
      });
      return () => tl.kill();
    }
  }, [product.inStock]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity < product.inStock)
      updateCartMutation.mutate(cartQuantity + 1);
  };

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity > 1) updateCartMutation.mutate(cartQuantity - 1);
    else if (cartQuantity === 1) removeFromCartMutation.mutate();
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to add items to wishlist",
        variant: "destructive",
      });
      return;
    }
    toggleWishlistMutation.mutate();
  };

  return (
    <div ref={cardRef} data-testid={`card-product-${product.id}`}>
      <Link to={`/product/${product.trackingId}`} className="block">
        <div>
          <div
            className="overflow-hidden bg-muted relative rounded-lg group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-80 object-cover object-center transition-all duration-500 group-hover:scale-102"
            />

            {/* Image indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {images.map((_: any, idx: number) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentImageIndex
                        ? "w-6 bg-white shadow-sm"
                        : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Sold out badge */}
            {product.inStock === 0 && (
              <div className="absolute top-2 right-2">
                <Badge
                  variant="secondary"
                  className="bg-black/75 text-white text-sm"
                >
                  Sold out
                </Badge>
              </div>
            )}

            {/* Low-stock badge */}
            {product.inStock > 0 && product.inStock <= 5 && (
              <div className="absolute top-2 right-2" ref={badgeRef}>
                <Badge
                  variant="destructive"
                  className="text-white text-sm bg-red-600/90"
                >
                  Only {product.inStock} left!
                </Badge>
              </div>
            )}
          </div>

          {/* Product details */}
          <div className="p-1.5 md:p-2 space-y-2">
            <div className="flex items-center justify-between">
              <h3
                className="
                  text-sm leading-snug h-[2.2rem]
                  sm:text-base sm:h-[2.6rem]
                  md:text-lg md:h-[3rem]
                  lg:text-xl lg:h-[3.4rem]
                  font-medium
                  line-clamp-2
                "
              >
                {product.name}
              </h3>

              <Button
                variant="ghost"
                size="icon"
                className="bg-white"
                onClick={handleWishlistToggle}
                disabled={toggleWishlistMutation.isPending}
                data-testid={`button-wishlist-${product.id}`}
              >
                <Heart
                  className={`h-4 w-4 transition-all ${isInWishlist ? "fill-primary text-primary" : ""}`}
                />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-base md:text-lg font-semibold">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {cartQuantity > 0 ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 border border-border rounded-md">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDecreaseQuantity}
                        disabled={
                          updateCartMutation.isPending ||
                          removeFromCartMutation.isPending
                        }
                        className="h-6 w-6 p-0"
                        data-testid={`button-decrease-qty-${product.id}`}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {cartQuantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleIncreaseQuantity}
                        disabled={
                          cartQuantity >= product.inStock ||
                          updateCartMutation.isPending
                        }
                        className="h-6 w-6 p-0"
                        data-testid={`button-increase-qty-${product.id}`}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={product.inStock === 0}
                    className="gap-2 flex-1"
                    data-testid={`button-add-to-cart-${product.id}`}
                  >
                    <ShoppingCart className="h-4 w-4" /> Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
