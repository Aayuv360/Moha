import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Store {
  id: string;
  name: string;
}

const CATEGORIES = [
  "Wedding Sarees",
  "Party Sarees",
  "Casual Sarees",
  "Traditional Sarees",
  "Designer Sarees",
  "Festival Sarees",
  "Silk Sarees",
  "Cotton Sarees",
];

const productSchema = z.object({
  name: z.string().min(1, "Product name required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price must be valid"),
  fabric: z.string().min(1, "Fabric required"),
  color: z.string().min(1, "Color required"),
  occasion: z.string().min(1, "Occasion required"),
  category: z.string().min(1, "Category required"),
  totalStock: z.coerce.number().min(1, "Stock must be at least 1"),
  imageUrl: z.string().url("Valid image URL required"),
  multipleImages: z.string().optional().default(""),
  videoUrl: z.string().url("Valid video URL").optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

type ChannelType = "Online" | "Shop" | "Both";

interface ProductAllocationFormProps {
  onSuccess: () => void;
  editingProduct?: any;
}

export function ProductAllocationForm({ onSuccess, editingProduct }: ProductAllocationFormProps) {
  const { toast } = useToast();
  const [channel, setChannel] = useState<ChannelType>("Both");
  const [shopStocks, setShopStocks] = useState<{ [key: string]: number }>({});
  const [onlineStock, setOnlineStock] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ title: "", message: "" });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: editingProduct
      ? {
          name: editingProduct.name,
          description: editingProduct.description,
          price: parseFloat(editingProduct.price.toString()),
          fabric: editingProduct.fabric,
          color: editingProduct.color,
          occasion: editingProduct.occasion,
          category: editingProduct.category,
          totalStock: editingProduct.inStock,
          imageUrl: editingProduct.imageUrl,
          multipleImages: Array.isArray(editingProduct.images)
            ? editingProduct.images.join("\n")
            : "",
          videoUrl: editingProduct.videoUrl || "",
        }
      : {
          name: "",
          description: "",
          price: 0,
          fabric: "Silk",
          color: "",
          occasion: "Wedding",
          category: "",
          totalStock: 1,
          imageUrl: "",
          multipleImages: "",
          videoUrl: "",
        },
  });

  const { data: allStores = [] } = useQuery<Store[]>({
    queryKey: ["/api/inventory/all-stores"],
  });

  const totalStock = form.watch("totalStock");

  // Initialize shop stocks when stores load or when editing
  useEffect(() => {
    if (allStores.length > 0) {
      if (editingProduct && editingProduct.storeInventory) {
        const initialShopStocks = allStores.reduce((acc, store) => {
          const allocation = editingProduct.storeInventory.find(
            (inv: any) => inv.storeId === store.id && inv.channel === "physical"
          );
          return { ...acc, [store.id]: allocation?.quantity || 0 };
        }, {});
        setShopStocks(initialShopStocks);

        // Set online stock for edit mode
        const onlineAlloc = editingProduct.storeInventory.find(
          (inv: any) => inv.channel === "online"
        );
        const onlineQty = onlineAlloc?.quantity || 0;
        setOnlineStock(onlineQty);

        // Determine channel based on existing allocations
        const hasOnline = onlineQty > 0;
        const hasPhysical = Object.values(initialShopStocks).some(qty => qty > 0);
        
        if (hasOnline && hasPhysical) {
          setChannel("Both");
        } else if (hasOnline) {
          setChannel("Online");
        } else if (hasPhysical) {
          setChannel("Shop");
        } else {
          setChannel("Both");
        }
      } else if (Object.keys(shopStocks).length === 0) {
        const initialShopStocks = allStores.reduce(
          (acc, store) => ({ ...acc, [store.id]: 0 }),
          {}
        );
        setShopStocks(initialShopStocks);
      }
    }
  }, [allStores, editingProduct]);

  // Handle channel change
  const handleChannelChange = (newChannel: ChannelType) => {
    setChannel(newChannel);

    if (newChannel === "Online") {
      setOnlineStock(totalStock);
      const resetShops = allStores.reduce(
        (acc, store) => ({ ...acc, [store.id]: 0 }),
        {}
      );
      setShopStocks(resetShops);
    } else if (newChannel === "Shop") {
      setOnlineStock(0);
    } else if (newChannel === "Both") {
      // Keep existing values
    }
  };

  // Handle total stock change
  const handleTotalStockChange = (newTotal: number) => {
    if (newTotal < 1) newTotal = 1;

    if (channel === "Online") {
      setOnlineStock(newTotal);
    } else if (channel === "Shop") {
      // Proportionally redistribute
      const currentShopTotal = Object.values(shopStocks).reduce((a, b) => a + b, 0);
      if (currentShopTotal > newTotal) {
        const ratio = newTotal / currentShopTotal;
        const newShopStocks = Object.entries(shopStocks).reduce(
          (acc, [storeId, stock]) => ({
            ...acc,
            [storeId]: Math.floor(stock * ratio),
          }),
          {}
        );
        setShopStocks(newShopStocks);
      }
    } else if (channel === "Both") {
      // Proportionally redistribute both
      const currentTotal = onlineStock + Object.values(shopStocks).reduce((a, b) => a + b, 0);
      if (currentTotal > newTotal) {
        const onlineRatio = onlineStock / currentTotal;
        const shopRatio = 1 - onlineRatio;

        const newOnlineStock = Math.floor(newTotal * onlineRatio);
        const remainingForShops = newTotal - newOnlineStock;

        const currentShopTotal = Object.values(shopStocks).reduce((a, b) => a + b, 0);
        const newShopStocks = Object.entries(shopStocks).reduce(
          (acc, [storeId, stock]) => ({
            ...acc,
            [storeId]: currentShopTotal > 0
              ? Math.floor(stock / currentShopTotal * remainingForShops)
              : 0,
          }),
          {}
        );

        setOnlineStock(newOnlineStock);
        setShopStocks(newShopStocks);
      }
    }
  };

  // Update shop stock
  const updateShopStock = (storeId: string, value: number) => {
    value = Math.max(0, value);
    setShopStocks({ ...shopStocks, [storeId]: value });
  };

  // Calculate allocation
  const shopTotal = Object.values(shopStocks).reduce((a, b) => a + b, 0);
  const totalAllocated = onlineStock + shopTotal;
  const unallocated = totalStock - totalAllocated;
  const isValid = unallocated === 0 && totalStock > 0;
  const isOverAllocated = unallocated < 0;

  const getStatusColor = () => {
    if (isValid) return "bg-green-600";
    if (isOverAllocated) return "bg-red-500";
    return "bg-yellow-500";
  };

  const getStatusText = () => {
    if (isOverAllocated) return `OVER-ALLOCATED: ${Math.abs(unallocated)} units`;
    if (isValid) return `Unallocated: 0 units`;
    return `Unallocated: ${unallocated} units`;
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const images = data.multipleImages
        ? data.multipleImages
            .split("\n")
            .map((url) => url.trim())
            .filter((url) => url && url.startsWith("http"))
        : [];

      // Prepare allocation data - include both online and physical allocations
      const storeInventory = Object.entries(shopStocks)
        .map(([storeId, quantity]) => (quantity > 0 ? { storeId, quantity } : null))
        .filter((x) => x !== null) as { storeId: string; quantity: number }[];

      const payload = {
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        fabric: data.fabric,
        color: data.color,
        occasion: data.occasion,
        category: data.category,
        inStock: data.totalStock,
        imageUrl: data.imageUrl,
        images: images.length > 0 ? images : [],
        videoUrl: data.videoUrl && data.videoUrl.startsWith("http") ? data.videoUrl : null,
        storeInventory: storeInventory,
        onlineStock: channel === "Online" || channel === "Both" ? onlineStock : 0,
        channel: channel,
      };

      if (editingProduct) {
        return await apiRequest("PATCH", `/api/inventory/products/${editingProduct.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/inventory/products", payload);
      }
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    if (!isValid) {
      setFeedbackData({
        title: "Validation Error",
        message: "Total allocated stock does not match the total inventory. Please correct the allocation.",
      });
      setShowFeedback(true);
      return;
    }

    try {
      await createProductMutation.mutateAsync(data);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      form.reset();
      setChannel("Both");
      setOnlineStock(0);
      const resetShops = allStores.reduce(
        (acc, store) => ({ ...acc, [store.id]: 0 }),
        {}
      );
      setShopStocks(resetShops);
      setFeedbackData({
        title: "Success!",
        message: editingProduct 
          ? `Product "${data.name}" updated successfully with stock allocation.`
          : `Product "${data.name}" saved successfully with stock allocation.`,
      });
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
        onSuccess();
      }, 1500);
    } catch (error: any) {
      setFeedbackData({
        title: "Error",
        message: error.message || "Failed to create product",
      });
      setShowFeedback(true);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* SECTION 1: PRODUCT CORE INFORMATION */}
          <section className="p-6 bg-gray-50 rounded-lg border">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              1. Product Core Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Product name"
                        {...field}
                        data-testid="input-product-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Stock Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="10"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          field.onChange(Math.max(1, val));
                          handleTotalStockChange(Math.max(1, val));
                        }}
                        data-testid="input-total-stock"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      This is the total inventory you have.
                    </p>
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
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="9999"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-product-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description"
                      {...field}
                      data-testid="input-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                control={form.control}
                name="fabric"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabric</FormLabel>
                    <FormControl>
                      <Input placeholder="Silk, Cotton..." {...field} data-testid="input-fabric" />
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
                      <Input placeholder="Red, Blue..." {...field} data-testid="input-color" />
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
                      <Input
                        placeholder="Wedding, Party..."
                        {...field}
                        data-testid="input-occasion"
                      />
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
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Main Image URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                      data-testid="input-image-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="multipleImages"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Additional Images (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter image URLs, one per line"
                      {...field}
                      className="resize-none min-h-24"
                      data-testid="input-multiple-images"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Each image URL on a new line
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Product Video URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                      data-testid="input-video-url"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to skip
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* SECTION 2: SALES CHANNELS */}
          <section className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              2. Select Sales Channels
            </h2>

            <div className="flex flex-wrap gap-4 mb-4">
              {(["Online", "Shop", "Both"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleChannelChange(ch)}
                  className={`px-6 py-3 rounded-xl transition duration-150 ease-in-out font-medium ${
                    channel === ch
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-50"
                  }`}
                  data-testid={`button-channel-${ch}`}
                >
                  {ch === "Online"
                    ? "Sell Online Only"
                    : ch === "Shop"
                      ? "Sell In Physical Shops Only"
                      : "Sell Both Online & In Shops"}
                </button>
              ))}
            </div>

            <p className="text-sm text-blue-700 font-medium" data-testid="text-channel-info">
              {channel === "Online"
                ? "All stock will be allocated to the Online Warehouse."
                : channel === "Shop"
                  ? totalStock > 1
                    ? "Stock must be distributed across the physical shops."
                    : `Product will be sold in physical shops. Stock must be assigned to one shop. (Total stock: ${totalStock})`
                  : totalStock > 1
                    ? "Stock must be split between the Online Warehouse and physical shops."
                    : "Since total stock is 1, it must be assigned entirely to either Online or a single Shop."}
            </p>
          </section>

          {/* SECTION 3: STOCK ALLOCATION */}
          <section className="p-6 bg-white rounded-lg border border-gray-300 shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              3. Stock Allocation
            </h2>

            {/* Allocation Summary */}
            <div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 mb-4 rounded-lg text-sm font-semibold bg-gray-100"
              data-testid="allocation-summary"
            >
              <div className="flex flex-col sm:flex-row sm:space-x-4 w-full sm:w-auto">
                <p className="text-gray-600">
                  Total Stock: <span className="text-gray-900">{totalStock}</span> units
                </p>
                <p className="text-gray-600">
                  Allocated:{" "}
                  <span className="text-green-600">{totalAllocated}</span> units
                </p>
              </div>
              <p
                className={`p-2 rounded-lg text-white font-bold transition duration-300 ${getStatusColor()}`}
                data-testid="allocation-status"
              >
                {getStatusText()}
              </p>
            </div>

            {/* Online Allocation */}
            {(channel === "Online" || channel === "Both") && (
              <div className="mb-6 p-4 border border-indigo-200 bg-indigo-50 rounded-lg">
                <h3 className="text-lg font-medium text-indigo-700 mb-3">
                  Online Sales Stock
                </h3>
                <label htmlFor="onlineStock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock for Online Warehouse
                </label>
                <Input
                  id="onlineStock"
                  type="number"
                  min="0"
                  value={onlineStock}
                  onChange={(e) => setOnlineStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full md:w-1/2"
                  data-testid="input-online-stock"
                />
              </div>
            )}

            {/* Shop Allocation */}
            {(channel === "Shop" || channel === "Both") && (
              <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-medium text-yellow-700 mb-3">
                  Physical Shop Allocation
                </h3>
                {allStores.filter(store => store.name !== "Online Store").length === 0 ? (
                  <p className="text-sm text-gray-600">No physical stores available</p>
                ) : (
                  <div className="space-y-3">
                    {allStores.filter(store => store.name !== "Online Store").map((store) => (
                      <div
                        key={store.id}
                        className="flex items-center space-x-3 p-3 bg-yellow-100 rounded-lg"
                      >
                        <label htmlFor={store.id} className="flex-1 text-sm font-medium text-gray-700">
                          {store.name}
                        </label>
                        <Input
                          id={store.id}
                          type="number"
                          min="0"
                          value={shopStocks[store.id] || 0}
                          onChange={(e) =>
                            updateShopStock(store.id, parseInt(e.target.value) || 0)
                          }
                          className="w-20 text-center"
                          data-testid={`input-store-${store.id}`}
                        />
                        <span className="text-sm text-gray-500">units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t flex justify-end">
            <Button
              type="submit"
              disabled={
                !isValid ||
                createProductMutation.isPending
              }
              className={`px-8 py-3 font-bold rounded-xl shadow-lg transition duration-300 ${
                isValid
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-400 text-white"
              }`}
              data-testid="button-save-product"
            >
              {createProductMutation.isPending
                ? "Saving..."
                : "Save Product & Allocation"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Feedback Modal */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{feedbackData.title}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">{feedbackData.message}</p>
          <Button onClick={() => setShowFeedback(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
