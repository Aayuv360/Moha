import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Order } from "@shared/schema";
import { Store, LogOut, Plus, Trash2, Clock, Truck, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const productSchema = z.object({
  name: z.string().min(1, "Product name required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().transform(v => v.toString()),
  fabric: z.string().min(1, "Fabric required"),
  color: z.string().min(1, "Color required"),
  occasion: z.string().min(1, "Occasion required"),
  category: z.string().min(1, "Category required"),
  inStock: z.string().transform(v => parseInt(v)).pipe(z.number().min(0)),
  imageUrl: z.string().url("Valid image URL required"),
  multipleImages: z.string().optional().default(""),
  videoUrl: z.string().url("Valid video URL").optional().or(z.literal("")),
});

type ProductForm = z.infer<typeof productSchema>;

export default function StoreDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"products" | "orders">("products");

  useEffect(() => {
    if (!user?.isStoreOwner) {
      setLocation("/store/login");
    }
  }, [user, setLocation]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/store/products'],
    enabled: !!user?.isStoreOwner,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/store/orders'],
    enabled: !!user?.isStoreOwner,
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const images = data.multipleImages
        ? data.multipleImages.split(',').map(url => url.trim()).filter(url => url)
        : [];
      
      return await apiRequest("POST", "/api/store/products", {
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        fabric: data.fabric,
        color: data.color,
        occasion: data.occasion,
        category: data.category,
        inStock: data.inStock,
        imageUrl: data.imageUrl,
        images: images,
        videoUrl: data.videoUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store/products'] });
      form.reset();
      toast({ title: "Product added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add product", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/store/products/${productId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store/products'] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/store/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store/orders'] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      fabric: "Silk",
      color: "",
      occasion: "Wedding",
      category: "",
      inStock: "1",
      imageUrl: "",
      multipleImages: "",
      videoUrl: "",
    },
  });

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!user?.isStoreOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Store Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-store-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "products" ? "default" : "outline"}
            onClick={() => setTab("products")}
            data-testid="button-tab-products"
          >
            Products
          </Button>
          <Button
            variant={tab === "orders" ? "default" : "outline"}
            onClick={() => setTab("orders")}
            data-testid="button-tab-orders"
          >
            Orders
          </Button>
        </div>

        {tab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Add Product</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => addProductMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Saree name" {...field} data-testid="input-product-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Product description" {...field} data-testid="input-product-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="9999" {...field} data-testid="input-product-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fabric"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fabric</FormLabel>
                          <FormControl>
                            <Input placeholder="Silk, Cotton..." {...field} data-testid="input-product-fabric" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input placeholder="Red, Blue..." {...field} data-testid="input-product-color" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="occasion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occasion</FormLabel>
                          <FormControl>
                            <Input placeholder="Wedding, Party..." {...field} data-testid="input-product-occasion" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input placeholder="Silk Collection..." {...field} data-testid="input-product-category" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5" {...field} data-testid="input-product-stock" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Image URL</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://..." {...field} data-testid="input-product-image" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="multipleImages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Images (comma-separated URLs)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="https://image1.jpg, https://image2.jpg, https://image3.jpg" {...field} data-testid="input-product-images" className="resize-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Video URL (optional)</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://video.mp4" {...field} data-testid="input-product-video" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={addProductMutation.isPending} data-testid="button-add-product">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Your Products ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {products.map((product: any) => (
                    <div key={product.id} className="p-3 border rounded flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-product-${product.id}`}>{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1" data-testid={`text-tracking-${product.id}`}>Tracking ID: {product.trackingId}</p>
                        <p className="text-sm text-muted-foreground">₹{product.price}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{product.fabric}</Badge>
                          <Badge variant="secondary">{product.occasion}</Badge>
                          <Badge>Stock: {product.inStock}</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        data-testid={`button-delete-product-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pending Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'pending').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipped Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'shipped').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Delivered Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'delivered').length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Order Management & Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  ) : (
                    orders.map((order: any) => (
                      <div key={order.id} className="p-4 border rounded-lg hover-elevate transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-semibold" data-testid={`text-order-${order.id}`}>{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">Order ID: {order.id.substring(0, 8)}...</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{order.totalAmount}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="mb-3 flex gap-2 items-center">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-medium">Order Status:</span>
                              <Badge 
                                variant={order.status === 'delivered' ? 'default' : order.status === 'shipped' ? 'secondary' : 'outline'}
                                data-testid={`badge-status-${order.id}`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  order.status === 'delivered' ? 'bg-green-500 w-full' :
                                  order.status === 'shipped' ? 'bg-blue-500 w-2/3' :
                                  'bg-yellow-500 w-1/3'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                          className="w-full text-sm border rounded px-3 py-2 bg-background"
                          data-testid={`select-order-status-${order.id}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
