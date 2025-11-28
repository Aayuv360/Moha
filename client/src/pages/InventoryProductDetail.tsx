import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { ProductAllocationForm } from "@/components/ProductAllocationForm";

interface InventoryProductDetailProps {
  productId: string;
}

export default function InventoryProductDetail({ productId }: InventoryProductDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/inventory/products", productId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/inventory/products/${productId}`, undefined);
      return response;
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/inventory/products/${productId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      toast({ title: "Product deleted successfully" });
      setLocation("/inventory/dashboard?tab=products");
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Button variant="ghost" onClick={() => setLocation("/inventory/dashboard?tab=products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </div>
    );
  }

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => setLocation("/inventory/dashboard?tab=products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-muted rounded-lg overflow-hidden">
              <img
                src={allImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === idx ? "border-primary" : "border-muted"
                    }`}
                    data-testid={`button-image-${idx}`}
                  >
                    <img src={img} alt={`Product ${idx}`} className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-2xl font-semibold text-primary">
                ₹{parseFloat(product.price.toString()).toLocaleString("en-IN")}
              </p>
            </div>

            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fabric</p>
                  <p className="font-medium">{product.fabric}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="font-medium">{product.color}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occasion</p>
                  <p className="font-medium">{product.occasion}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="font-medium">{product.inStock} units</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium text-xs">{product.trackingId}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed">{product.description}</p>
            </Card>

            {product.videoUrl && (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Video</p>
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                  data-testid="link-video"
                >
                  View Product Video
                </a>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowEditDialog(true)}
                className="flex-1"
                data-testid="button-edit-product"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1"
                disabled={deleteProductMutation.isPending}
                data-testid="button-delete-product"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <ProductAllocationForm
            editingProduct={product}
            onSuccess={() => {
              setShowEditDialog(false);
              queryClient.invalidateQueries({ queryKey: ["/api/inventory/products", productId] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
