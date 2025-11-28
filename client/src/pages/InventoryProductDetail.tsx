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
  productId: Product;
  onBack?: () => void;
}

export default function InventoryProductDetail({
  product,
  onBack,
}: InventoryProductDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  console.log(product);
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "DELETE",
        `/api/inventory/products/${product.id}`,
        {},
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      toast({ title: "Product deleted successfully" });
      if (onBack) {
        onBack();
      } else {
        setLocation("/inventory/dashboard?tab=products");
      }
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

  const allImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [];

  if (!product || allImages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found or has no images</p>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-muted rounded-lg overflow-hidden">
              <img
                src={allImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-56 sm:h-96 object-cover"
              />
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 sm:gap-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === idx
                        ? "border-primary"
                        : "border-muted"
                    }`}
                    data-testid={`button-image-${idx}`}
                  >
                    <img
                      src={img}
                      alt={`Product ${idx}`}
                      className="w-full h-12 sm:h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-xl sm:text-2xl font-semibold text-primary">
                ₹{parseFloat(product.price.toString()).toLocaleString("en-IN")}
              </p>
            </div>

            <Card className="p-3 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Fabric</p>
                  <p className="font-medium text-sm">{product.fabric}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Color</p>
                  <p className="font-medium text-sm">{product.color}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Occasion</p>
                  <p className="font-medium text-sm">{product.occasion}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Category</p>
                  <p className="font-medium text-sm">{product.category}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Stock</p>
                  <p className="font-medium text-sm">{product.inStock} units</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium text-xs">{product.trackingId}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed">{product.description}</p>
            </Card>

            {product.videoUrl && (
              <Card className="p-3 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Video</p>
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs sm:text-sm"
                  data-testid="link-video"
                >
                  View Product Video
                </a>
              </Card>
            )}

            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => setShowEditDialog(true)}
                className="flex-1"
                data-testid="button-edit-product"
                size="sm"
              >
                <Edit2 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit Product</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1"
                disabled={deleteProductMutation.isPending}
                data-testid="button-delete-product"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
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
              queryClient.invalidateQueries({
                queryKey: ["/api/inventory/products", productId],
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
