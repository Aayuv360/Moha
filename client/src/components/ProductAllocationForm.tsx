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
  images: z.string().min(1, "At least one image URL required"),
  videoUrl: z.string().url("Valid video URL").optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;
type ChannelType = "Online" | "Shop" | "Both";

interface ProductAllocationFormProps {
  onSuccess: () => void;
  editingProduct?: any;
}

export function ProductAllocationForm({
  onSuccess,
  editingProduct,
}: ProductAllocationFormProps) {
  const [channel, setChannel] = useState<ChannelType>("Both");
  const [shopStocks, setShopStocks] = useState<{ [key: string]: number }>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ title: "", message: "" });
  const onChangeChannel = (newChannel: ChannelType) => {
    setChannel(newChannel);
    if (newChannel === "Online") {
      const onlineStore = allStores.find(
        (store) => store.name === "Online Store",
      );
      if (onlineStore) {
        setShopStocks({
          [onlineStore.id]: totalStock,
        });
      }
    } else {
      const reset = Object.fromEntries(allStores.map((store) => [store.id, 0]));
      setShopStocks(reset);
    }
  };

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
          images: Array.isArray(editingProduct.images)
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
          images: "",
          videoUrl: "",
        },
  });

  const { data: allStores = [] } = useQuery<Store[]>({
    queryKey: ["/api/inventory/all-stores"],
  });

  const totalStock = form.watch("totalStock");

  useEffect(() => {
    if (allStores.length > 0) {
      if (editingProduct && editingProduct.storeInventory) {
        const initialShopStocks = allStores.reduce((acc, store) => {
          const allocation = editingProduct.storeInventory.find(
            (inv: any) => inv.storeId === store.id,
          );
          return { ...acc, [store.id]: allocation?.quantity || 0 };
        }, {});
        setShopStocks(initialShopStocks);

        const hasOnline = editingProduct.storeInventory.some(
          (item) => item.channel === "online" && item.quantity > 0,
        );
        const hasPhysical = editingProduct.storeInventory.some(
          (item) => item.channel === "physical" && item.quantity > 0,
        );

        if (hasOnline && hasPhysical) setChannel("Both");
        else if (hasOnline) setChannel("Online");
        else if (hasPhysical) setChannel("Shop");
        else setChannel("Both");
      } else if (Object.keys(shopStocks).length === 0) {
        const initialShopStocks = allStores.reduce(
          (acc, store) => ({ ...acc, [store.id]: 0 }),
          {},
        );
        setShopStocks(initialShopStocks);
      }
    }
  }, [allStores, editingProduct]);

  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    if (channel === "Online") {
      setStores(allStores.filter((store) => store.name === "Online Store"));
    } else if (channel === "Shop") {
      setStores(allStores.filter((store) => store.name !== "Online Store"));
    } else {
      setStores(allStores);
    }
  }, [channel]);

  const updateShopStock = (storeId: string, value: number) => {
    value = Math.max(0, value);
    setShopStocks({ ...shopStocks, [storeId]: value });
  };

  const totalAllocated = Object.values(shopStocks).reduce((a, b) => a + b, 0);
  const unallocated = totalStock - totalAllocated;

  const isValid = unallocated === 0 && totalStock > 0;
  const isOverAllocated = unallocated < 0;

  const getStatusColor = () => {
    if (isValid) return "bg-green-600";
    if (isOverAllocated) return "bg-red-500";
    return "bg-yellow-500";
  };

  const getStatusText = () => {
    if (isOverAllocated)
      return `OVER-ALLOCATED: ${Math.abs(unallocated)} units`;
    if (isValid) return `Unallocated: 0 units`;
    return `Unallocated: ${unallocated} units`;
  };

  const storeInventory = Object.entries(shopStocks)
    .map(([storeId, quantity]) => (quantity > 0 ? { storeId, quantity } : null))
    .filter((x) => x !== null) as { storeId: string; quantity: number }[];

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const images = data.images
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url && url.startsWith("http"));

      const payload = {
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        fabric: data.fabric,
        color: data.color,
        occasion: data.occasion,
        category: data.category,
        inStock: data.totalStock,
        images: images.length > 0 ? images : [],
        videoUrl:
          data.videoUrl && data.videoUrl.startsWith("http")
            ? data.videoUrl
            : null,
        storeInventory,
        onlineStock: 0,
        channel,
      };

      if (editingProduct) {
        return await apiRequest(
          "PATCH",
          `/api/inventory/products/${editingProduct.id}`,
          payload,
        );
      } else {
        return await apiRequest("POST", "/api/inventory/products", payload);
      }
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    if (!isValid) {
      setFeedbackData({
        title: "Validation Error",
        message:
          "Total allocated stock does not match the total inventory. Please correct the allocation.",
      });
      setShowFeedback(true);
      return;
    }

    try {
      await createProductMutation.mutateAsync(data);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      form.reset();
      setChannel("Both");

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
              {/* PRODUCT NAME */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TOTAL STOCK */}
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
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          field.onChange(Math.max(1, val)); // only update form
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PRICE */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* DESCRIPTION */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* FABRIC / COLOR / OCCASION / CATEGORY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                control={form.control}
                name="fabric"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabric</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                        <SelectTrigger>
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

            {/* PRODUCT IMAGES */}
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Product Images (URLs)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      className="resize-none min-h-32"
                      placeholder="Paste image URLs (one per line)&#10;Example:&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* VIDEO URL */}
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Product Video URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* SALES CHANNEL SECTION */}
          <section className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              2. Select Sales Channels
            </h2>

            <div className="flex flex-wrap gap-4 mb-4">
              {(["Online", "Shop", "Both"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onChangeChannel(ch)}
                  className={`px-6 py-3 rounded-xl transition duration-150 ease-in-out font-medium ${
                    channel === ch
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <p className="text-sm text-blue-700 font-medium">
              {channel === "Online"
                ? "All stock will be allocated to the Online Warehouse."
                : channel === "Shop"
                  ? `Product will be sold in physical shops.`
                  : "Stock must be split between the Online Warehouse and physical shops."}
            </p>
          </section>

          {/* STOCK ALLOCATION */}
          <section className="p-6 bg-white rounded-lg border border-gray-300 shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              3. Stock Allocation
            </h2>

            <div className="flex justify-between p-4 mb-4 rounded-lg text-sm bg-gray-100">
              <p>Total Stock: {totalStock} units</p>
              <p>Allocated: {totalAllocated} units</p>
              <p className={`p-2 rounded text-white ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>

            <div className="space-y-3">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center space-x-3 p-3 bg-yellow-100 rounded-lg"
                >
                  <label className="flex-1">{store.name}</label>
                  <Input
                    type="number"
                    min="0"
                    value={shopStocks[store.id] || 0}
                    onChange={(e) =>
                      updateShopStock(store.id, parseInt(e.target.value) || 0)
                    }
                    className="w-20 text-center"
                  />
                  <span>units</span>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-4 border-t flex justify-end">
            <Button
              type="submit"
              disabled={!isValid || createProductMutation.isPending}
              className={`px-8 py-3 font-bold rounded-xl shadow-lg transition ${
                isValid
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-400 text-white"
              }`}
            >
              {createProductMutation.isPending
                ? "Saving..."
                : "Save Product & Allocation"}
            </Button>
          </div>
        </form>
      </Form>

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
