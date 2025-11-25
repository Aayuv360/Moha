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
import { Store, LogOut, Plus, Trash2, Clock, Truck, CheckCircle, Edit2, AlertCircle, RotateCcw, BarChart3, Settings, Trash, Download, MapPin, Phone, Mail, Printer, ChevronDown, RotateCw, AlertTriangle, Image } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function InventoryDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "products" | "orders" | "settings">("dashboard");
  const [ordersSubTab, setOrdersSubTab] = useState<"active" | "completed">("active");
  const [categoryTab, setCategoryTab] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [refundNotes, setRefundNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!user?.isStoreOwner) {
      setLocation("/inventory/login");
    }
  }, [user, setLocation]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/inventory/products'],
    enabled: !!user?.isStoreOwner,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/inventory/orders'],
    enabled: !!user?.isStoreOwner,
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const images = data.multipleImages
        ? data.multipleImages.split(',').map(url => url.trim()).filter(url => url)
        : [];
      
      return await apiRequest("POST", "/api/inventory/products", {
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
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      form.reset();
      setShowProductDialog(false);
      toast({ title: "Product added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add product", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/inventory/products/${productId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      if (!editingProduct) return;
      const images = data.multipleImages
        ? data.multipleImages.split(',').map(url => url.trim()).filter(url => url)
        : [];
      
      return await apiRequest("PATCH", `/api/inventory/products/${editingProduct.id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      setShowProductDialog(false);
      setEditingProduct(null);
      form.reset();
      toast({ title: "Product updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, returnNotes, refundStatus }: { orderId: string; status: string; returnNotes?: string; refundStatus?: string }) => {
      return await apiRequest("PATCH", `/api/inventory/orders/${orderId}/status`, { status, returnNotes, refundStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/orders'] });
      toast({ title: "Order updated successfully" });
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      fabric: product.fabric,
      color: product.color,
      occasion: product.occasion,
      category: product.category,
      inStock: product.inStock.toString(),
      imageUrl: product.imageUrl,
      multipleImages: Array.isArray(product.images) ? product.images.join(", ") : "",
      videoUrl: product.videoUrl || "",
    });
    setShowProductDialog(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.reset({
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
    });
    setShowProductDialog(true);
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  // Get unique categories sorted
  const categories = Array.from(
    new Set(products.map((p: any) => p.category || "Uncategorized"))
  ).sort();

  // Set default category on products load
  useEffect(() => {
    if (categories.length > 0 && !categoryTab) {
      setCategoryTab(categories[0]);
    }
  }, [categories, categoryTab]);

  // Get products for selected category
  const categoryProducts = products.filter(
    (p: any) => (p.category || "Uncategorized") === categoryTab
  );

  // Analytics calculations
  const totalSales = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);
  const lowStockProducts = products.filter(p => p.inStock <= 5).length;
  const topProducts = products
    .sort((a, b) => b.inStock - a.inStock)
    .slice(0, 5);

  // Filter orders by status
  const activeOrders = orders.filter(o => o.status !== 'delivered');
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const displayOrders = ordersSubTab === 'active' ? activeOrders : completedOrders;

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast({ title: "No products selected", variant: "destructive" });
      return;
    }
    if (window.confirm(`Delete ${selectedProducts.size} products?`)) {
      for (const productId of selectedProducts) {
        await deleteProductMutation.mutateAsync(productId);
      }
      setSelectedProducts(new Set());
    }
  };

  if (!user?.isStoreOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-store-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-48 border-r bg-card">
          <nav className="space-y-1 p-4">
            <Button
              variant={tab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setTab("dashboard")}
              data-testid="button-tab-dashboard"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={tab === "products" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setTab("products")}
              data-testid="button-tab-products"
            >
              Products
            </Button>
            <Button
              variant={tab === "orders" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setTab("orders")}
              data-testid="button-tab-orders"
            >
              Orders
            </Button>
            <Button
              variant={tab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setTab("settings")}
              data-testid="button-tab-settings"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {tab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{totalSales}</div>
                      <p className="text-xs text-muted-foreground mt-1">Orders received</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div>
                      <p className="text-xs text-muted-foreground mt-1">From all orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{products.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">Listed products</p>
                    </CardContent>
                  </Card>
                  <Card className={lowStockProducts > 0 ? "border-destructive" : ""}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alert</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${lowStockProducts > 0 ? "text-destructive" : ""}`}>{lowStockProducts}</div>
                      <p className="text-xs text-muted-foreground mt-1">Products ≤ 5 units</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top 5 Products by Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topProducts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No products yet</p>
                      ) : (
                        topProducts.map((product, idx) => (
                          <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="text-sm font-semibold text-muted-foreground">#{idx + 1}</div>
                              <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded object-cover" onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3C/svg%3E"; }} />
                              <div className="flex-1">
                                <p className="font-medium text-sm truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₹{product.price}</p>
                              <Badge variant={product.inStock <= 5 ? "destructive" : "default"} className="text-xs mt-1">
                                Stock: {product.inStock}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded">
                        <div className="text-2xl font-bold text-yellow-600">{orders.filter((o: any) => o.status === 'pending').length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pending</p>
                      </div>
                      <div className="text-center p-4 border rounded">
                        <div className="text-2xl font-bold text-blue-600">{orders.filter((o: any) => o.status === 'shipped').length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Shipped</p>
                      </div>
                      <div className="text-center p-4 border rounded">
                        <div className="text-2xl font-bold text-green-600">{orders.filter((o: any) => o.status === 'delivered').length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Delivered</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === "products" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Your Products ({products.length})</h2>
                  <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={handleAddProduct} data-testid="button-add-product-modal">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit((data) => editingProduct ? updateProductMutation.mutate(data) : addProductMutation.mutate(data))} className="space-y-4">
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
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-product-category">
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem key={category} value={category} data-testid={`option-product-category-${category}`}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                          <Button type="submit" className="w-full" disabled={editingProduct ? updateProductMutation.isPending : addProductMutation.isPending} data-testid={editingProduct ? "button-update-product" : "button-add-product"}>
                            {editingProduct ? "Update Product" : "Add Product"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {products.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 text-center">
                      <p className="text-muted-foreground mb-4">No products yet</p>
                      <Button onClick={handleAddProduct} data-testid="button-add-first-product">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Product
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={categoryTab === category ? "default" : "outline"}
                          onClick={() => setCategoryTab(category)}
                          data-testid={`button-category-${category}`}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>

                    {selectedProducts.size > 0 && (
                      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                        <CardContent className="pt-4 flex items-center justify-between">
                          <p className="text-sm font-medium">{selectedProducts.size} product(s) selected</p>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleBulkDelete}
                            data-testid="button-bulk-delete"
                          >
                            <Trash className="h-3 w-3 mr-2" />
                            Delete Selected
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {categoryProducts.length === 0 ? (
                      <Card>
                        <CardContent className="pt-8 text-center">
                          <p className="text-muted-foreground">No products in this category</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {categoryProducts.map((product: any) => (
                          <Card key={product.id} className={`overflow-hidden hover-elevate transition-all ${selectedProducts.has(product.id) ? "ring-2 ring-primary" : ""}`}>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedProducts);
                                  if (e.target.checked) {
                                    newSet.add(product.id);
                                  } else {
                                    newSet.delete(product.id);
                                  }
                                  setSelectedProducts(newSet);
                                }}
                                className="absolute top-2 left-2 z-10 w-4 h-4 cursor-pointer"
                                data-testid={`checkbox-product-${product.id}`}
                              />
                              <div className="aspect-video bg-muted overflow-hidden">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                            </div>
                            <CardContent className="pt-2 pb-2">
                              <p className="font-semibold text-sm truncate" data-testid={`text-product-${product.id}`}>{product.name}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate" data-testid={`text-tracking-${product.id}`}>ID: {product.trackingId.substring(0, 12)}</p>
                              <p className="text-sm font-bold text-primary mt-1">₹{product.price}</p>
                              
                              <div className="flex gap-1 flex-wrap mt-1 mb-2">
                                <Badge variant="secondary" className="text-xs h-5">{product.fabric}</Badge>
                                {product.inStock <= 5 ? (
                                  <Badge variant="destructive" className="text-xs h-5 flex items-center gap-0.5">
                                    <AlertCircle className="h-2.5 w-2.5" />
                                    {product.inStock}
                                  </Badge>
                                ) : (
                                  <Badge className="text-xs h-5">{product.inStock}</Badge>
                                )}
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-7 text-xs"
                                  onClick={() => handleEditProduct(product)}
                                  data-testid={`button-edit-product-${product.id}`}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7"
                                  onClick={() => deleteProductMutation.mutate(product.id)}
                                  data-testid={`button-delete-product-${product.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "orders" && (
              <div className="space-y-6">
                {/* Orders Sub-Tabs */}
                <div className="flex gap-2 border-b">
                  <Button
                    variant={ordersSubTab === "active" ? "default" : "ghost"}
                    className="rounded-b-none"
                    onClick={() => setOrdersSubTab("active")}
                    data-testid="button-orders-active"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Active Orders ({activeOrders.length})
                  </Button>
                  <Button
                    variant={ordersSubTab === "completed" ? "default" : "ghost"}
                    className="rounded-b-none"
                    onClick={() => setOrdersSubTab("completed")}
                    data-testid="button-orders-completed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed Orders ({completedOrders.length})
                  </Button>
                </div>

                {/* Order Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending
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
                        Shipped
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
                        Delivered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'delivered').length}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Orders with Items Display */}
                <div className="space-y-4">
                  {displayOrders.length === 0 ? (
                    <Card>
                      <CardContent className="pt-8 text-center">
                        <p className="text-muted-foreground">{ordersSubTab === 'active' ? 'No active orders' : 'No completed orders'}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    displayOrders.map((order: any) => {
                      const items = order.items ? (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) : [];
                      const hasReturn = order.status && order.returnNotes;

                      return (
                        <Card key={order.id} className="overflow-hidden" data-testid={`card-order-${order.id}`}>
                          {/* Order Header */}
                          <div className="p-4 border-b bg-muted/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div>
                                    <p className="font-semibold text-lg">Order {order.id.substring(0, 8)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Customer: <span className="font-medium">{order.customerName}</span></p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'shipped' ? 'secondary' : 'outline'} data-testid={`badge-status-${order.id}`}>
                                    {order.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                    {order.status === 'shipped' && <Truck className="h-3 w-3 mr-1" />}
                                    {order.status === 'delivered' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                  {hasReturn && (
                                    <Badge variant="destructive" data-testid={`badge-return-${order.id}`}>
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Return: {order.refundStatus || 'pending'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right min-w-fit">
                                <p className="font-bold text-2xl text-primary">₹{parseFloat(order.totalAmount.toString()).toLocaleString('en-IN')}</p>
                                <p className="text-xs text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                            </div>
                          </div>

                          {/* Order Items Grid */}
                          <div className="p-4 bg-background">
                            {items.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">No items found</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {items.map((item: any, idx: number) => (
                                  <div key={idx} className="border rounded-lg overflow-hidden bg-card hover:shadow-sm transition-shadow">
                                    {/* Item Image */}
                                    <div className="aspect-square bg-muted overflow-hidden">
                                      <img
                                        src={item.imageUrl || item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3C/svg%3E";
                                        }}
                                      />
                                    </div>
                                    
                                    {/* Item Details */}
                                    <div className="p-3 space-y-2">
                                      <div>
                                        <p className="text-sm font-semibold truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                                      </div>

                                      {/* Attributes */}
                                      <div className="flex flex-wrap gap-1">
                                        {item.color && <Badge variant="secondary" className="text-xs h-5">{item.color}</Badge>}
                                        {item.fabric && <Badge variant="secondary" className="text-xs h-5">{item.fabric}</Badge>}
                                        {item.occasion && <Badge variant="secondary" className="text-xs h-5">{item.occasion}</Badge>}
                                      </div>

                                      {/* Pricing */}
                                      <div className="border-t pt-2">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-xs text-muted-foreground">Price</span>
                                          <span className="text-sm font-medium">₹{item.price ? parseFloat(item.price.toString()).toLocaleString('en-IN') : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-semibold">Subtotal</span>
                                          <span className="text-sm font-bold text-primary">₹{item.price ? (parseFloat(item.price.toString()) * item.quantity).toLocaleString('en-IN') : 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Order Details Footer */}
                          <div className="p-4 border-t bg-muted/20 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Customer Info */}
                              <div className="text-sm">
                                <p className="text-muted-foreground text-xs mb-1">Contact</p>
                                <p className="font-medium">{order.customerName}</p>
                                <p className="text-xs text-muted-foreground">{order.email}</p>
                                <p className="text-xs text-muted-foreground">{order.phone}</p>
                              </div>

                              {/* Shipping Address */}
                              <div className="text-sm">
                                <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Shipping Address</p>
                                <p className="font-medium line-clamp-2">{order.address}</p>
                                <p className="text-xs text-muted-foreground">{order.city}, {order.state} - {order.pincode}</p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 print:hidden pt-2 border-t">
                              <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => window.print()} data-testid={`button-print-order-${order.id}`}>
                                <Printer className="h-3 w-3 mr-1" />
                                Print Order
                              </Button>
                              
                              {ordersSubTab === 'active' && (
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                                  className="text-xs border rounded px-2 py-1 bg-background flex-1"
                                  data-testid={`select-order-status-${order.id}`}
                                >
                                  <option value="pending">📋 Pending</option>
                                  <option value="shipped">🚚 Shipped</option>
                                  <option value="delivered">✓ Delivered</option>
                                </select>
                              )}
                            </div>

                            {/* Return Info */}
                            {hasReturn && (
                              <div className="p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800 text-sm">
                                <p className="text-red-900 dark:text-red-100 font-semibold text-xs mb-1 flex items-center gap-1"><RotateCw className="h-3 w-3" /> Return Request</p>
                                <p className="text-red-800 dark:text-red-200"><span className="font-semibold">Reason:</span> {order.returnNotes}</p>
                                <p className="text-red-800 dark:text-red-200 text-xs mt-1"><span className="font-semibold">Status:</span> {order.refundStatus || 'pending'}</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Store Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Store Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Store Name:</span> <span className="font-medium">{user?.name}</span></p>
                        <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{user?.email}</span></p>
                        <p><span className="text-muted-foreground">Total Products:</span> <span className="font-medium">{products.length}</span></p>
                        <p><span className="text-muted-foreground">Total Orders:</span> <span className="font-medium">{orders.length}</span></p>
                        <p><span className="text-muted-foreground">Total Revenue:</span> <span className="font-medium">₹{totalRevenue.toLocaleString('en-IN')}</span></p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Inventory Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded">
                          <p className="text-xs text-muted-foreground mb-1">Total Stock</p>
                          <p className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.inStock, 0)}</p>
                        </div>
                        <div className="p-3 border rounded">
                          <p className="text-xs text-muted-foreground mb-1">Low Stock Items</p>
                          <p className="text-2xl font-bold text-destructive">{lowStockProducts}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          aside {
            display: none !important;
          }
          header {
            display: none !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
