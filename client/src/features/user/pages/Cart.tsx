import { useQuery, useMutation } from "@tanstack/react-query";
import { CartItemCard } from "../components/CartItemCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag, MapPin, Package } from "lucide-react";
import type { CartItem, Product } from "@shared/schema";
import { getOrCreateSessionId } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import { cartService } from "../services/cartService";
import { useState, useEffect } from "react";
import {
  AddressModal,
  useFetchAddresses,
  PincodeModal,
  setSelectedAddressId,
} from "../components/address";
import { getSelectedAddress } from "../services/addressSelectionService";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/lib/store";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export default function Cart() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sessionId = getOrCreateSessionId();
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"select" | "add">("select");
  const [pincodeModalOpen, setPincodeModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedPincode, setSelectedPincode] = useState<string | null>(null);
  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;
  const { addresses } = useSelector((state: RootState) => state.address);

  useFetchAddresses(!!token);

  useEffect(() => {
    const loadAddress = async () => {
      const result = await getSelectedAddress(addresses, token);
      setSelectedAddress(result.address);
      setSelectedPincode(result.pincode);
      if (result.address?.id) {
        dispatch(setSelectedAddressId(result.address.id));
      }
    };
    if (token) {
      loadAddress();
    }
  }, [addresses, token, dispatch]);

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", cartIdentifier],
    queryFn: () => cartService.getCart(cartIdentifier, isUserCart, token),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return await cartService.updateCartQuantity(
        id,
        quantity,
        isUserCart,
        token,
        cartIdentifier,
      );
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
      return await cartService.removeFromCart(
        id,
        isUserCart,
        token,
        cartIdentifier,
      );
    },
    onSuccess: () => {
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
    0,
  );
  const shipping = subtotal >= 5000 ? 0 : 200;
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-8 md:mb-12">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Address Section */}
            {user && (
              <Card className="p-4 md:p-6">
                {selectedAddress || selectedPincode ? (
                  <div className="space-y-3 flex justify-between">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        {selectedAddress ? (
                          <div>
                            <p className="font-medium">
                              {selectedAddress.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedAddress.address}, {selectedAddress.city},{" "}
                              {selectedAddress.state} -{" "}
                              {selectedAddress.pincode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ph: {selectedAddress.phone}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">
                              Delivery to: {selectedPincode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pincode verified
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setModalOpen(true);
                        setMode("select");
                      }}
                      className="hover:bg-primary/10 hover:text-primary"
                      data-testid="button-change-address"
                    >
                      Change Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-5 w-5" />
                      <p className="font-medium">Check Delivery</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No saved addresses. Enter your pincode to check delivery
                      availability.
                    </p>
                    <Button
                      onClick={() => setPincodeModalOpen(true)}
                      data-testid="button-enter-pincode"
                    >
                      Enter Pincode
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {modalOpen && (
              <AddressModal
                modalOpen={modalOpen}
                setModalOpen={setModalOpen}
                mode={mode}
                setMode={setMode}
              />
            )}

            <PincodeModal
              open={pincodeModalOpen}
              onClose={() => setPincodeModalOpen(false)}
              onValidPincode={(pincode) => setSelectedPincode(pincode)}
            />

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
              <h2 className="text-xl font-serif font-medium mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium" data-testid="text-subtotal">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium" data-testid="text-shipping">
                    {shipping === 0
                      ? "Free"
                      : `₹${shipping.toLocaleString("en-IN")}`}
                  </span>
                </div>
                {subtotal < 5000 && (
                  <p className="text-xs text-muted-foreground">
                    Add ₹{(5000 - subtotal).toLocaleString("en-IN")} more for
                    free shipping
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between mb-6">
                <span className="text-lg font-medium">Total</span>
                <span
                  className="text-2xl font-semibold"
                  data-testid="text-total"
                >
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full"
                style={{ backgroundColor: "#9b083a" }}
                disabled={!selectedAddress && !selectedPincode}
                data-testid="button-proceed-checkout"
                onClick={() => {
                  if (selectedAddress || selectedPincode) {
                    navigate("/checkout");
                  }
                }}
              >
                Proceed to Checkout
              </Button>

              <Link
                to="/products"
                className="block w-full mt-3"
                data-testid="link-continue-shopping"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full hover:bg-primary/10 hover:text-primary"
                >
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
