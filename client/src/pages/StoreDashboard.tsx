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
import { Store, LogOut, Plus, Trash2, Clock, Truck, CheckCircle, Edit2, AlertCircle, RotateCcw, BarChart3, Settings, Trash, Download, MapPin, Phone, Mail, Printer, ChevronDown, RotateCw, AlertTriangle } from "lucide-react";
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

export default function StoreDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "products" | "orders" | "settings">("dashboard");
  const [categoryTab, setCategoryTab] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [refundNotes, setRefundNotes] = useState<{ [key: string]: string }>({});

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

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      if (!editingProduct) return;
      const images = data.multipleImages
        ? data.multipleImages.split(',').map(url => url.trim()).filter(url => url)
        : [];
      
      return await apiRequest("PATCH", `/api/store/products/${editingProduct.id}`, {
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
      setShowEditDialog(false);
      setEditingProduct(null);
      editForm.reset();
      toast({ title: "Product updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, returnNotes, refundStatus }: { orderId: string; status: string; returnNotes?: string; refundStatus?: string }) => {
      return await apiRequest("PATCH", `/api/store/orders/${orderId}/status`, { status, returnNotes, refundStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store/orders'] });
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

  const editForm = useForm<ProductForm>({
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
    editForm.reset({
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
    setShowEditDialog(true);
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

  const filteredOrders = orders
    .filter(order => {
      if (filterStatus !== "all" && order.status !== filterStatus) return false;
      if (searchQuery && !order.id.includes(searchQuery) && !order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={tab === "dashboard" ? "default" : "outline"}
            onClick={() => setTab("dashboard")}
            data-testid="button-tab-dashboard"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
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
          <Button
            variant={tab === "settings" ? "default" : "outline"}
            onClick={() => setTab("settings")}
            data-testid="button-tab-settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

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
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-product-modal">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-96 overflow-y-auto max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
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
                    <Button type="submit" className="w-full" disabled={addProductMutation.isPending} data-testid="button-add-product">
                      Add Product
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
                  <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-first-product">
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

                {showEditDialog && editingProduct && (
                  <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="max-h-96 overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                      </DialogHeader>
                      <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit((data) => updateProductMutation.mutate(data))} className="space-y-3">
                          <FormField
                            control={editForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Name</FormLabel>
                                <FormControl>
                                  <Input {...field} className="text-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Price</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} className="text-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="inStock"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Stock</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} className="text-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full" disabled={updateProductMutation.isPending} size="sm">
                            Update Product
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
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
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="Search by Order ID or Customer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-64"
                    data-testid="input-search-orders"
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40" data-testid="select-filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No orders found</p>
                  ) : (
                    filteredOrders.map((order: any) => {
                      const isExpanded = expandedOrder === order.id;
                      const hasReturn = order.returnNotes && order.returnNotes.trim() !== "";
                      let items = [];
                      try {
                        items = JSON.parse(order.items);
                      } catch {
                        items = [];
                      }
                      
                      return (
                        <Card key={order.id} className="overflow-hidden">
                          <div className="p-4 cursor-pointer hover-elevate" onClick={() => setExpandedOrder(isExpanded ? null : order.id)} data-testid={`button-expand-order-${order.id}`}>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-semibold text-base" data-testid={`text-order-customer-${order.id}`}>{order.customerName}</p>
                                    <p className="text-xs text-muted-foreground">Order #{order.id.substring(0, 8).toUpperCase()}</p>
                                  </div>
                                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                                <div className="flex gap-2 items-center mb-3 flex-wrap">
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
                                <div className="w-full bg-muted rounded-full h-2 mb-2">
                                  <div className={`h-full rounded-full transition-all ${order.status === 'delivered' ? 'bg-green-500 w-full' : order.status === 'shipped' ? 'bg-blue-500 w-2/3' : 'bg-yellow-500 w-1/3'}`} />
                                </div>
                              </div>
                              <div className="text-right min-w-fit">
                                <p className="font-bold text-lg">₹{parseFloat(order.totalAmount.toString()).toLocaleString('en-IN')}</p>
                                <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t bg-muted/30 p-4 space-y-4">
                              {/* Customer & Contact Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-background rounded border">
                                  <p className="text-xs font-semibold text-muted-foreground mb-3">Customer Information</p>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Name</p>
                                      <p className="text-sm font-medium">{order.customerName}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                                      <p className="text-sm font-medium break-all">{order.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                                      <p className="text-sm font-medium">{order.phone}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3 bg-background rounded border">
                                  <p className="text-xs font-semibold text-muted-foreground mb-3">Order Information</p>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Order ID</p>
                                      <p className="text-sm font-mono font-medium">{order.id.substring(0, 12)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Order Date</p>
                                      <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Shipping Address */}
                              <div className="p-3 bg-background rounded border">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Shipping Address</p>
                                <p className="text-sm font-medium">{order.address}</p>
                                <p className="text-sm text-muted-foreground">{order.city}, {order.state} - {order.pincode}</p>
                                <Button size="sm" variant="outline" className="mt-3 w-full text-xs" onClick={() => window.print()} data-testid={`button-print-address-${order.id}`}>
                                  <Printer className="h-3 w-3 mr-1" />
                                  Print Address Label
                                </Button>
                              </div>

                              {/* Order Items & Breakdown */}
                              <div className="p-3 bg-background rounded border">
                                <p className="text-xs font-semibold text-muted-foreground mb-3">Order Items ({items.length})</p>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No items found</p>
                                  ) : (
                                    <>
                                      {items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 pb-3 border-b last:border-b-0">
                                          {/* Product Image */}
                                          <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-muted rounded overflow-hidden border">
                                              <img
                                                src={item.imageUrl || item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3C/svg%3E";
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* Product Details */}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{item.name}</p>
                                            <div className="flex gap-2 flex-wrap mt-1">
                                              {item.color && <Badge variant="secondary" className="text-xs h-5">{item.color}</Badge>}
                                              {item.fabric && <Badge variant="secondary" className="text-xs h-5">{item.fabric}</Badge>}
                                              {item.occasion && <Badge variant="secondary" className="text-xs h-5">{item.occasion}</Badge>}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                              <div className="text-xs text-muted-foreground">
                                                <span className="font-semibold">Qty:</span> {item.quantity}
                                              </div>
                                              <div className="text-right">
                                                <p className="text-xs text-muted-foreground">
                                                  ₹{item.price ? parseFloat(item.price.toString()).toLocaleString('en-IN') : 'N/A'} each
                                                </p>
                                                <p className="text-sm font-bold">
                                                  ₹{item.price ? (parseFloat(item.price.toString()) * item.quantity).toLocaleString('en-IN') : 'N/A'}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="mt-3 pt-2 border-t-2 flex justify-between">
                                        <p className="text-sm font-semibold">Total Amount</p>
                                        <p className="text-lg font-bold text-primary">₹{parseFloat(order.totalAmount.toString()).toLocaleString('en-IN')}</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Return & Refund Section */}
                              {hasReturn && (
                                <div className="p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                                  <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-1"><RotateCw className="h-3 w-3" /> Return & Refund Information</p>
                                  <div className="space-y-2 mb-3 text-sm text-red-800 dark:text-red-200">
                                    <div>
                                      <p className="text-xs font-semibold text-red-700 dark:text-red-300">Reason for Return</p>
                                      <p className="font-medium">{order.returnNotes}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-red-700 dark:text-red-300">Refund Status</p>
                                      <p className="font-medium">{order.refundStatus || 'pending'}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="text-xs flex-1" data-testid={`button-approve-refund-${order.id}`}>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve Refund
                                    </Button>
                                    <Button size="sm" variant="destructive" className="text-xs flex-1" data-testid={`button-reject-refund-${order.id}`}>
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Update Order Status */}
                              <div className="border-t pt-3 space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground block">Update Order Status</label>
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                                  className="w-full text-sm border rounded px-3 py-2 bg-background"
                                  data-testid={`select-order-status-${order.id}`}
                                >
                                  <option value="pending">📋 Pending - Waiting for processing</option>
                                  <option value="shipped">🚚 Shipped - On the way</option>
                                  <option value="delivered">✓ Delivered - Order completed</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
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
                    <div className="p-3 border rounded bg-red-50 dark:bg-red-950">
                      <p className="text-xs text-muted-foreground mb-1">Low Stock (≤5)</p>
                      <p className="text-2xl font-bold text-red-600">{lowStockProducts}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Orders (CSV)
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Products (CSV)
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 text-destructive">Danger Zone</h3>
                  <Button variant="destructive" className="w-full justify-start">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
