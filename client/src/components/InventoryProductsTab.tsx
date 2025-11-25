import { useState, useMutation } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";

interface ProductsTabProps {
  products: Product[];
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  showProductDialog: boolean;
  setShowProductDialog: (show: boolean) => void;
  selectedProducts: Set<string>;
  setSelectedProducts: (products: Set<string>) => void;
}

export function ProductsTab({
  products,
  editingProduct,
  setEditingProduct,
  showProductDialog,
  setShowProductDialog,
  selectedProducts,
  setSelectedProducts,
}: ProductsTabProps) {
  const { toast } = useToast();
  const categories = Array.from(
    new Set(products.map((p: any) => p.category || "Uncategorized")),
  ).sort();
  
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories.length > 0 ? categories[0] : "Uncategorized"
  );

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(
        "DELETE",
        `/api/inventory/products/${productId}`,
        {},
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductDialog(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowProductDialog(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductDialog(true);
  };

  const categoryProducts = products.filter(
    (p: any) => (p.category || "Uncategorized") === selectedCategory,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Your Products ({products.length})
        </h2>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedProducts.size}
            </Button>
          )}
          <Dialog open={showProductDialog} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={handleAddProduct} data-testid="button-add-product-modal">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <ProductForm
                editingProduct={editingProduct}
                onSuccess={() => {
                  setEditingProduct(null);
                  setShowProductDialog(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No products yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category}`}
              >
                {category} ({products.filter((p: any) => (p.category || "Uncategorized") === category).length})
              </Button>
            ))}
          </div>

          {categoryProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No products in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedProducts);
                        if (e.target.checked) {
                          newSelected.add(product.id);
                        } else {
                          newSelected.delete(product.id);
                        }
                        setSelectedProducts(newSelected);
                      }}
                      data-testid={`checkbox-product-${product.id}`}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {product.trackingId}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs">
                    {product.fabric && (
                      <span className="bg-secondary px-2 py-1 rounded">
                        {product.fabric}
                      </span>
                    )}
                    {product.color && (
                      <span className="bg-secondary px-2 py-1 rounded">
                        {product.color}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div>
                      <p className="text-sm font-bold text-primary">
                        ₹{parseFloat(product.price.toString()).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {product.inStock}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditProduct(product)}
                      data-testid={`button-edit-product-${product.id}`}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDeleteProduct(product.id)}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
