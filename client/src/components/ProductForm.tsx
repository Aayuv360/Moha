import { useMutation } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import type { Product } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(1, "Product name required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price must be valid"),
  fabric: z.string().min(1, "Fabric required"),
  color: z.string().min(1, "Color required"),
  occasion: z.string().min(1, "Occasion required"),
  category: z.string().min(1, "Category required"),
  inStock: z.coerce.number().min(0, "Stock must be 0 or more"),
  imageUrl: z.string().url("Valid image URL required"),
  multipleImages: z.string().optional().default(""),
  videoUrl: z.string().url("Valid video URL").optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  editingProduct: Product | null;
  onSuccess: () => void;
}

export function ProductForm({ editingProduct, onSuccess }: ProductFormProps) {
  const { toast } = useToast();

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
          inStock: editingProduct.inStock,
          imageUrl: editingProduct.imageUrl,
          multipleImages: Array.isArray(editingProduct.images)
            ? editingProduct.images.join(", ")
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
          inStock: 1,
          imageUrl: "",
          multipleImages: "",
          videoUrl: "",
        },
  });

  const addProductMutation = useMutation({
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
        inStock: data.inStock,
        imageUrl: data.imageUrl,
        images: images,
        videoUrl: data.videoUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      form.reset();
      toast({ title: "Product added successfully" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!editingProduct) return;
      const images = data.multipleImages
        ? data.multipleImages
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url)
        : [];

      return await apiRequest(
        "PATCH",
        `/api/inventory/products/${editingProduct.id}`,
        {
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
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      form.reset();
      toast({ title: "Product updated successfully" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate(data as any);
    } else {
      addProductMutation.mutate(data as any);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Saree name"
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
          name="fabric"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric</FormLabel>
              <FormControl>
                <Input
                  placeholder="Silk, Cotton..."
                  {...field}
                  data-testid="input-product-fabric"
                />
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
                <Input
                  placeholder="Red, Blue..."
                  {...field}
                  data-testid="input-product-color"
                />
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
                  data-testid="input-product-occasion"
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
              <FormControl>
                <Input
                  placeholder="Category name"
                  {...field}
                  data-testid="input-product-category"
                />
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
              <FormLabel>Stock Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  value={field.value || ""}
                  data-testid="input-product-stock"
                />
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
                <Input
                  type="url"
                  placeholder="https://..."
                  {...field}
                  data-testid="input-product-image"
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
            <FormItem>
              <FormLabel>Additional Image URLs</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="One URL per line"
                  {...field}
                  data-testid="input-product-images"
                />
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
              <FormLabel>Video URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://..."
                  {...field}
                  data-testid="input-product-video"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={
            addProductMutation.isPending || updateProductMutation.isPending
          }
          data-testid="button-product-submit"
        >
          {editingProduct ? "Update Product" : "Add Product"}
        </Button>
      </form>
    </Form>
  );
}
