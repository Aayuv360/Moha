import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { ProductAllocationForm } from "./ProductAllocationForm";

interface StoreInventory {
  storeId: string;
  storeName: string;
  quantity: number;
  channel: string;
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
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

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

  const { data: storeInventoryMap = {} } = useQuery({
    queryKey: ["/api/inventory/stores"],
    queryFn: async () => {
      const map: { [key: string]: StoreInventory[] } = {};
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      for (const product of products) {
        try {
          const res = await fetch(
            `/api/inventory/products/${product.id}/stores`,
            {
              headers,
              credentials: "include",
            },
          );
          if (res.ok) {
            map[product.id] = await res.json();
          }
        } catch (error) {
          console.error(
            `Failed to fetch stores for product ${product.id}:`,
            error,
          );
        }
      }
      return map;
    },
    enabled: products.length > 0,
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({
      productId,
      storeInventory,
    }: {
      productId: string;
      storeInventory: { storeId: string; quantity: number }[];
    }) => {
      return await apiRequest(
        "PATCH",
        `/api/inventory/products/${productId}/inventory`,
        {
          storeInventory,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stores"] });
      toast({ title: "Inventory updated successfully" });
      setExpandedProduct(null);
    },
    onError: () => {
      toast({ title: "Failed to update inventory", variant: "destructive" });
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
          <Dialog
            open={showProductDialog}
            onOpenChange={handleDialogOpenChange}
          >
            <DialogTrigger asChild>
              <Button
                onClick={handleAddProduct}
                data-testid="button-add-product-modal"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
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
            <div className="space-y-2 overflow-x-auto">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
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
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {product.trackingId}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Description</span>
                      <p className="text-sm line-clamp-1">{product.description}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Fabric</span>
                      <p className="text-sm font-medium">{product.fabric}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Color</span>
                      <p className="text-sm font-medium">{product.color}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Occasion</span>
                      <p className="text-sm font-medium">{product.occasion}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Price</span>
                      <p className="text-sm font-bold text-primary">
                        ₹{parseFloat(product.price.toString()).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Stock</span>
                      <p className="text-sm font-medium">{product.inStock}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Category</span>
                      <p className="text-sm font-medium">{product.category}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Image</span>
                      <p className="text-xs truncate text-blue-500">{product.imageUrl}</p>
                    </div>
                  </div>

                  {expandedProduct === product.id &&
                    storeInventoryMap[product.id] && (
                      <div className="mt-4 pt-4 border-t space-y-3 bg-muted/50 p-3 rounded">
                        <h4 className="font-semibold text-sm">
                          Store Inventory
                        </h4>
                        <div className="space-y-2">
                          {storeInventoryMap[product.id].map(
                            (store: StoreInventory) => (
                              <div
                                key={store.storeId}
                                className="flex gap-2 items-center"
                              >
                                <span className="text-xs flex-1">
                                  {store.storeName}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={store.quantity}
                                  onChange={(e) => {
                                    const updated = storeInventoryMap[
                                      product.id
                                    ].map((s: StoreInventory) =>
                                      s.storeId === store.storeId
                                        ? {
                                            ...s,
                                            quantity:
                                              parseInt(e.target.value) || 0,
                                          }
                                        : s,
                                    );
                                    queryClient.setQueryData(
                                      ["/api/inventory/stores"],
                                      {
                                        ...storeInventoryMap,
                                        [product.id]: updated,
                                      },
                                    );
                                  }}
                                  className="w-16 h-8"
                                  data-testid={`input-store-quantity-${store.storeId}`}
                                />
                              </div>
                            ),
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            updateInventoryMutation.mutate({
                              productId: product.id,
                              storeInventory: storeInventoryMap[product.id].map(
                                (s: StoreInventory) => ({
                                  storeId: s.storeId,
                                  quantity: s.quantity,
                                }),
                              ),
                            });
                          }}
                          disabled={updateInventoryMutation.isPending}
                          className="w-full"
                          data-testid={`button-save-inventory-${product.id}`}
                        >
                          Save Inventory
                        </Button>
                      </div>
                    )}

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setExpandedProduct(
                          expandedProduct === product.id ? null : product.id,
                        )
                      }
                      data-testid={`button-inventory-${product.id}`}
                    >
                      {expandedProduct === product.id ? "Hide" : "Show"} Inventory
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProduct(product)}
                      data-testid={`button-edit-product-${product.id}`}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
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
