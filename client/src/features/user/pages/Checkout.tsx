import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import type { CartItem, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import { cartService } from "../services/cartService";
import { CheckCircle2, Edit2, Trash2, Plus } from "lucide-react";
import {
  AddressForm,
  useFetchAddresses,
  useSaveAddressMutation,
  useDeleteAddressMutation,
  setSelectedAddressId as setSelectedAddressIdAction,
  setEditingAddressId as setEditingAddressIdAction,
} from "../components/address";
import type { RootState } from "@/lib/store";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

const checkoutSchema = insertOrderSchema.extend({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [localSelectedAddressId, setLocalSelectedAddressId] = useState<string | null>(null);
  const sessionId = getOrCreateSessionId();
  const { user, token } = useAuth();

  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;

  const { selectedAddressId, editingAddressId, addresses } = useSelector(
    (state: RootState) => state.address,
  );

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", cartIdentifier],
    queryFn: () => cartService.getCart(cartIdentifier, isUserCart, token),
  });

  useFetchAddresses(!!token);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      totalAmount: "0",
      items: "",
    },
  });

  // Get addressId from Cart page state - AFTER form is initialized
  const passedAddressId = (location.state as any)?.selectedAddressId;
  useEffect(() => {
    if (passedAddressId && addresses.length > 0) {
      setLocalSelectedAddressId(passedAddressId);
      const addressToUse = addresses.find((a) => a.id === passedAddressId);
      if (addressToUse) {
        form.setValue("customerName", addressToUse.name);
        form.setValue("phone", addressToUse.phone);
        form.setValue("address", addressToUse.address);
        form.setValue("city", addressToUse.city);
        form.setValue("state", addressToUse.state);
        form.setValue("pincode", addressToUse.pincode);
      }
    }
  }, [passedAddressId, addresses]);

  const saveAddressMutation = useSaveAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();

  const placeOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      return await apiRequest("POST", "/api/orders", data);
    },
    onSuccess: (data: any) => {
      setOrderId(data.id);
      setOrderPlaced(true);
      queryClient.setQueryData(["/api/cart", cartIdentifier], []);

      toast({
        title: "Order placed successfully!",
        description:
          "Thank you for your purchase. You will receive a confirmation email shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0,
  );
  const shipping = subtotal >= 5000 ? 0 : 200;
  const total = subtotal + shipping;

  const onSubmit = (data: CheckoutFormData) => {
    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      sessionId: sessionId,
    }));

    placeOrderMutation.mutate({
      ...data,
      addressId: localSelectedAddressId || selectedAddressId || undefined,
      totalAmount: total.toString(),
      items: JSON.stringify(orderItems),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (cartItems.length === 0 && !orderPlaced) {
    navigate("/cart");
    return null;
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-light mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-muted-foreground mb-2">
            Order ID: <span className="font-mono font-medium">{orderId}</span>
          </p>
          <p className="text-muted-foreground mb-8">
            Thank you for your purchase. You will receive a confirmation email
            with order details shortly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/products")}>
              Continue Shopping
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/")}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-8 md:mb-12">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Select Address</h3>
                {token && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      dispatch(setEditingAddressIdAction(null));
                      setShowAddressDialog(true);
                    }}
                    data-testid="button-add-address"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                )}
              </div>

              {token && addresses.length > 0 && !localSelectedAddressId ? (
                <>
                  <RadioGroup
                    value={localSelectedAddressId || ""}
                    onValueChange={(value) => {
                      setLocalSelectedAddressId(value);
                      const selectedAddr = addresses.find((a) => a.id === value);
                      if (selectedAddr) {
                        form.setValue("customerName", selectedAddr.name);
                        form.setValue("phone", selectedAddr.phone);
                        form.setValue("address", selectedAddr.address);
                        form.setValue("city", selectedAddr.city);
                        form.setValue("state", selectedAddr.state);
                        form.setValue("pincode", selectedAddr.pincode);
                      }
                    }}
                  >
                    <div className="space-y-3 mb-6">
                      {addresses.map((addr: any) => (
                        <div
                          key={addr.id}
                          className="flex items-start gap-3 p-4 border rounded-md hover-elevate cursor-pointer"
                          onClick={() => {
                            setLocalSelectedAddressId(addr.id);
                            form.setValue("customerName", addr.name);
                            form.setValue("phone", addr.phone);
                            form.setValue("address", addr.address);
                            form.setValue("city", addr.city);
                            form.setValue("state", addr.state);
                            form.setValue("pincode", addr.pincode);
                          }}
                          data-testid={`card-address-${addr.id}`}
                        >
                          <RadioGroupItem
                            value={addr.id}
                            id={`address-${addr.id}`}
                            className="mt-1"
                          />
                          <label
                            htmlFor={`address-${addr.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <p className="font-medium">{addr.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {addr.address}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {addr.city}, {addr.state} {addr.pincode}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {addr.phone}
                            </p>
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(setEditingAddressIdAction(addr.id));
                                setShowAddressDialog(true);
                              }}
                              className="p-1 hover-elevate"
                              data-testid={`button-edit-address-${addr.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAddressMutation.mutate(addr.id);
                              }}
                              className="p-1 hover-elevate text-destructive"
                              data-testid={`button-delete-address-${addr.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                  <Separator className="my-6" />
                </>
              ) : (
                <>
                  {localSelectedAddressId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-4"
                      onClick={() => setLocalSelectedAddressId(null)}
                      data-testid="button-change-address-checkout"
                    >
                      Change Address
                    </Button>
                  )}
                  <AddressForm
                    onSave={(data) => {
                      saveAddressMutation.mutate({ formData: data });
                      setLocalSelectedAddressId(null);
                    }}
                    isLoading={saveAddressMutation.isPending}
                  />
                </>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-serif font-medium mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img
                        src={
                          item.product.images
                            .replace(/[{}]/g, "")
                            .split(",")
                            .map((s: string) => s.replace(/"/g, ""))[0]
                        }
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        ₹
                        {(
                          parseFloat(item.product.price) * item.quantity
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0
                      ? "Free"
                      : `₹${shipping.toLocaleString("en-IN")}`}
                  </span>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-semibold">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </Card>
            <Button
              type="submit"
              size="lg"
              className="w-full mt-8"
              disabled={placeOrderMutation.isPending || !localSelectedAddressId}
              data-testid="button-place-order"
            >
              {placeOrderMutation.isPending
                ? "Placing Order..."
                : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
