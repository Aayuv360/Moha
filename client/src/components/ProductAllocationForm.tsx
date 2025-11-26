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
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Store {
  id: string;
  name: string;
}

interface AllocationItem {
  storeName: string;
  quantity: number;
}

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

export function ProductAllocationForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [channel, setChannel] = useState<"online" | "physical" | "both">("both");
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [unallocated, setUnallocated] = useState(0);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
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

  useEffect(() => {
    if (step === 3 && channel !== "online" && allStores.length > 0) {
      if (allocations.length === 0) {
        setAllocations(
          allStores.map((store) => ({
            storeName: store.name,
            quantity: 0,
          }))
        );
      }
    }
  }, [step, channel, allStores, allocations.length]);

  const totalAllocated = allocations.reduce((sum, a) => sum + a.quantity, 0);
  const totalStock = form.watch("totalStock");

  useEffect(() => {
    setUnallocated(totalStock - totalAllocated);
  }, [totalStock, totalAllocated]);

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const images = data.multipleImages
        ? data.multipleImages
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url)
        : [];

      return await apiRequest("POST", "/api/inventory/products", {
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        fabric: data.fabric,
        color: data.color,
        occasion: data.occasion,
        category: data.category,
        inStock: data.totalStock,
        imageUrl: data.imageUrl,
        images: images,
        videoUrl: data.videoUrl || null,
      });
    },
  });

  const allocateInventoryMutation = useMutation({
    mutationFn: async (productId: string) => {
      const storeInventory = allocations
        .map((a) => {
          const store = allStores.find((s) => s.name === a.storeName);
          return store ? { storeId: store.id, quantity: a.quantity } : null;
        })
        .filter((x) => x !== null) as { storeId: string; quantity: number }[];

      if (storeInventory.length === 0 && channel !== "online") {
        throw new Error("No stores selected for allocation");
      }

      return await apiRequest("PATCH", `/api/inventory/products/${productId}/inventory`, {
        storeInventory,
      });
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (channel === "physical" && allocations.every((a) => a.quantity === 0)) {
        toast({
          title: "Invalid allocation",
          description: "Please allocate at least some stock to physical stores",
          variant: "destructive",
        });
        return;
      }
      if (channel === "online") {
        setAllocations([]);
      }
      setStep(3);
    } else if (step === 3) {
      if (channel === "both" && unallocated !== 0) {
        toast({
          title: "Invalid allocation",
          description: "All stock must be allocated",
          variant: "destructive",
        });
        return;
      }

      try {
        const product = await createProductMutation.mutateAsync(data);
        await allocateInventoryMutation.mutateAsync(product.id);
        queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
        form.reset();
        setStep(1);
        setChannel("both");
        setAllocations([]);
        toast({ title: "Product added successfully with allocations" });
        onSuccess();
      } catch (error: any) {
        toast({
          title: "Failed to create product",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Product Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">1. Product Core Information</h3>
              <p className="text-sm text-muted-foreground">Enter basic product details</p>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} data-testid="input-product-name" />
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
                      placeholder="10"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-total-stock"
                    />
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
                    <Input
                      type="number"
                      step="0.01"
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
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
                    <Input placeholder="Wedding, Party..." {...field} data-testid="input-occasion" />
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
                    <Input placeholder="Category name" {...field} data-testid="input-category" />
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
                  <FormLabel>Main Image URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} data-testid="input-image-url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 2: Sales Channels */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">2. Select Sales Channels</h3>
              <p className="text-sm text-muted-foreground">Choose where to sell this product</p>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant={channel === "online" ? "default" : "outline"}
                className="w-full justify-start h-auto py-3"
                onClick={() => setChannel("online")}
                data-testid="button-channel-online"
              >
                <div className="text-left">
                  <div className="font-semibold">Sell Online Only</div>
                  <div className="text-xs text-muted-foreground">Available in online warehouse</div>
                </div>
              </Button>

              <Button
                type="button"
                variant={channel === "physical" ? "default" : "outline"}
                className="w-full justify-start h-auto py-3"
                onClick={() => setChannel("physical")}
                data-testid="button-channel-physical"
              >
                <div className="text-left">
                  <div className="font-semibold">Sell In Physical Shops Only</div>
                  <div className="text-xs text-muted-foreground">Available in physical stores</div>
                </div>
              </Button>

              <Button
                type="button"
                variant={channel === "both" ? "default" : "outline"}
                className="w-full justify-start h-auto py-3"
                onClick={() => setChannel("both")}
                data-testid="button-channel-both"
              >
                <div className="text-left">
                  <div className="font-semibold">Sell Both Online & In Shops</div>
                  <div className="text-xs text-muted-foreground">Split inventory between channels</div>
                </div>
              </Button>
            </div>

            {channel === "both" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Stock must be split between the online warehouse and physical shops.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 3: Stock Allocation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">3. Stock Allocation</h3>
              <p className="text-sm text-muted-foreground">Allocate stock to locations</p>
            </div>

            <Card className="p-4 bg-muted">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total Stock: {totalStock} units</span>
                <span className="font-semibold">Allocated: {totalAllocated} units</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 bg-gray-300 rounded-full flex-1 overflow-hidden">
                  <div
                    className={`h-full transition-all ${unallocated > 0 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${(totalAllocated / totalStock) * 100}%` }}
                  />
                </div>
                <span
                  className={`font-bold text-sm ${unallocated > 0 ? "text-yellow-600" : "text-green-600"}`}
                >
                  {unallocated > 0 ? `${unallocated} unallocated` : "All allocated!"}
                </span>
              </div>
            </Card>

            {channel === "online" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>All stock is in the online warehouse.</AlertDescription>
              </Alert>
            )}

            {(channel === "physical" || channel === "both") && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Physical Shop Allocation</h4>
                {allStores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No physical stores available</p>
                ) : (
                  <div className="space-y-3 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    {allocations.map((allocation, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{allocation.storeName}</p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max={totalStock}
                          value={allocation.quantity}
                          onChange={(e) => {
                            const newAllocations = [...allocations];
                            newAllocations[idx].quantity = parseInt(e.target.value) || 0;
                            setAllocations(newAllocations);
                          }}
                          className="w-20"
                          placeholder="0"
                          data-testid={`input-allocation-${idx}`}
                        />
                        <span className="text-sm text-muted-foreground">units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2 justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            data-testid="button-previous"
          >
            Previous
          </Button>

          <Button
            type="submit"
            disabled={
              createProductMutation.isPending ||
              allocateInventoryMutation.isPending
            }
            data-testid="button-next-or-submit"
          >
            {step === 3 ? "Save Product & Allocation" : "Next"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
