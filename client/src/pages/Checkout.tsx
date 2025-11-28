import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
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
import { insertOrderSchema, insertAddressSchema } from "@shared/schema";
import { z } from "zod";
import type { CartItem, Product, Address } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Edit2, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const addressFormSchema = insertAddressSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

function AddressForm({
  addressId,
  onSave,
  isLoading,
  defaultValues,
}: {
  addressId: string | null;
  onSave: (data: AddressFormData) => void;
  isLoading: boolean;
  defaultValues?: Address;
}) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: defaultValues || {
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Full name" data-testid="input-address-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Phone number" data-testid="input-address-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Street address" data-testid="input-address-street" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input {...field} placeholder="City" data-testid="input-address-city" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input {...field} placeholder="State" data-testid="input-address-state" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pincode</FormLabel>
              <FormControl>
                <Input {...field} placeholder="6-digit pincode" data-testid="input-address-pincode" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-save-address">
          {isLoading ? "Saving..." : "Save Address"}
        </Button>
      </form>
    </Form>
  );
}

export default function Checkout() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const sessionId = getOrCreateSessionId();
  const { user, token } = useAuth();

  const cartIdentifier = user?.id || sessionId;
  const isUserCart = !!user?.id;

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", cartIdentifier],
    queryFn: async () => {
      const endpoint = isUserCart
        ? `/api/cart/user/${user.id}`
        : `/api/cart/${sessionId}`;
      const options = isUserCart
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined;
      return await apiRequest("GET", endpoint, undefined, options);
    },
  });

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: !!token,
  });

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

  const saveAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      if (editingAddressId) {
        return await apiRequest("PATCH", `/api/addresses/${editingAddressId}`, data);
      }
      return await apiRequest("POST", "/api/addresses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setEditingAddressId(null);
      setShowAddressDialog(false);
      toast({
        title: "Address saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/addresses/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      if (selectedAddressId) setSelectedAddressId(null);
      toast({
        title: "Address deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      return await apiRequest("POST", "/api/orders", data);
    },
    onSuccess: (data: any) => {
      setOrderId(data.id);
      setOrderPlaced(true);
      queryClient.invalidateQueries({
        queryKey: ["/api/cart", cartIdentifier],
      });

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
      totalAmount: total.toString(),
      items: JSON.stringify(orderItems),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
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
        <Navigation />
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
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-8 md:mb-12">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-serif font-medium mb-6">
                Shipping Information
              </h2>

              <Form {...form}>
                {token && addresses.length > 0 && (
              <>
                <h3 className="text-lg font-medium mb-4">Saved Addresses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {addresses.map((addr) => (
                    <Card
                      key={addr.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? "ring-2 ring-primary"
                          : "hover-elevate"
                      }`}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        form.setValue("customerName", addr.name);
                        form.setValue("phone", addr.phone);
                        form.setValue("address", addr.address);
                        form.setValue("city", addr.city);
                        form.setValue("state", addr.state);
                        form.setValue("pincode", addr.pincode);
                      }}
                      data-testid={`card-address-${addr.id}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">{addr.name}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddressId(addr.id);
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
                      <p className="text-sm text-muted-foreground">{addr.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">{addr.phone}</p>
                    </Card>
                  ))}
                </div>
                <Separator className="my-6" />
              </>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif font-medium">
                {selectedAddressId ? "Delivery Address" : "Shipping Information"}
              </h2>
              {token && (
                <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAddressId(null)}
                      data-testid="button-add-new-address"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAddressId ? "Edit Address" : "Add New Address"}
                      </DialogTitle>
                    </DialogHeader>
                    <AddressForm
                      addressId={editingAddressId}
                      onSave={(data) => saveAddressMutation.mutate(data)}
                      isLoading={saveAddressMutation.isPending}
                      defaultValues={
                        editingAddressId
                          ? addresses.find((a) => a.id === editingAddressId)
                          : undefined
                      }
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your full name"
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your@email.com"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="10-digit phone number"
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Street address"
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="City"
                              data-testid="input-city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="State"
                              data-testid="input-state"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="6-digit pincode"
                              data-testid="input-pincode"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-8"
                    disabled={placeOrderMutation.isPending}
                    data-testid="button-place-order"
                  >
                    {placeOrderMutation.isPending
                      ? "Placing Order..."
                      : "Place Order"}
                  </Button>
                </form>
              </Form>
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
          </div>
        </div>
      </div>
    </div>
  );
}
