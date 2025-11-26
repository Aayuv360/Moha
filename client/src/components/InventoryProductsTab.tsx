import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { ProductAllocationForm } from "./ProductAllocationForm";

interface StoreInventory {
  storeId: string;
  quantity: number;
  channel: string;
}

interface Store {
  id: string;
  name: string;
}

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
    categories.length > 0 ? categories[0] : "Uncategorized",
  );

  const { data: allStores = [] } = useQuery<Store[]>({
    queryKey: ["/api/inventory/all-stores"],
  });

  const storeMap = allStores.reduce(
    (acc, store) => ({ ...acc, [store.id]: store.name }),
    { online: "online" } as { [key: string]: string },
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
    onError: () => {
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
    if (!open) setEditingProduct(null);
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
              <Trash2 className="h-4 w-4 mr-2" /> Delete {selectedProducts.size}
            </Button>
          )}

          <Dialog
            open={showProductDialog}
            onOpenChange={handleDialogOpenChange}
          >
            <DialogTrigger asChild>
              <Button
                onClick={handleAddProduct}
                data-testid="button-add-product-modal"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <ProductAllocationForm
                editingProduct={editingProduct || undefined}
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
                {category} (
                {
                  products.filter(
                    (p: any) => (p.category || "Uncategorized") === category,
                  ).length
                }
                )
              </Button>
            ))}
          </div>

          {categoryProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No products in this category
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.size === categoryProducts.length &&
                          categoryProducts.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(
                              new Set(categoryProducts.map((p) => p.id)),
                            );
                          } else {
                            setSelectedProducts(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Fabric
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Color</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Occasion
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Price</th>
                    <th className="px-4 py-3 text-left font-semibold">Stock</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {categoryProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                      data-testid={`card-product-${product.id}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => {
                            const updated = new Set(selectedProducts);
                            if (e.target.checked) updated.add(product.id);
                            else updated.delete(product.id);
                            setSelectedProducts(updated);
                          }}
                        />
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {product.trackingId}
                      </td>

                      <td className="px-4 py-3">{product.fabric}</td>
                      <td className="px-4 py-3">{product.color}</td>
                      <td className="px-4 py-3">{product.occasion}</td>
                      <td className="px-4 py-3 font-bold text-primary">
                        ₹
                        {parseFloat(product.price.toString()).toLocaleString(
                          "en-IN",
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {product.inStock}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
