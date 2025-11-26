import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, ArrowRightLeft } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductForm } from "./ProductForm";

interface StoreInventory {
  storeId: string;
  storeName: string;
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
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedProductForMove, setSelectedProductForMove] =
    useState<Product | null>(null);
  const [moveData, setMoveData] = useState({
    fromStoreId: "",
    toStoreId: "",
    quantity: 1,
  });

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

  const { data: allStores = [] } = useQuery<Store[]>({
    queryKey: ["/api/inventory/all-stores"],
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

  const moveInventoryMutation = useMutation({
    mutationFn: async ({
      productId,
      fromStoreId,
      toStoreId,
      quantity,
    }: {
      productId: string;
      fromStoreId: string;
      toStoreId: string;
      quantity: number;
    }) => {
      return await apiRequest(
        "POST",
        `/api/inventory/products/${productId}/move`,
        {
          fromStoreId,
          toStoreId,
          quantity,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stores"] });
      toast({ title: "Inventory moved successfully" });
      setMoveDialogOpen(false);
      setSelectedProductForMove(null);
      setMoveData({ fromStoreId: "", toStoreId: "", quantity: 1 });
    },
    onError: () => {
      toast({ title: "Failed to move inventory", variant: "destructive" });
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

  const handleMoveInventory = () => {
    if (
      !selectedProductForMove ||
      !moveData.fromStoreId ||
      !moveData.toStoreId
    ) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (moveData.fromStoreId === moveData.toStoreId) {
      toast({
        title: "Source and destination must be different",
        variant: "destructive",
      });
      return;
    }
    moveInventoryMutation.mutate({
      productId: selectedProductForMove.id,
      fromStoreId: moveData.fromStoreId,
      toStoreId: moveData.toStoreId,
      quantity: moveData.quantity,
    });
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
                        ₹
                        {parseFloat(product.price.toString()).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {product.inStock}
                      </p>
                    </div>
                  </div>

                  {expandedProduct === product.id &&
                    storeInventoryMap[product.id] && (
                      <div className="mt-4 pt-4 border-t space-y-3">
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

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProductForMove(product);
                        setMoveDialogOpen(true);
                      }}
                      data-testid={`button-move-product-${product.id}`}
                    >
                      Move
                    </Button>
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

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Inventory Between Stores</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="to-store">To Store</Label>
              <Select
                value={moveData.toStoreId}
                onValueChange={(val) =>
                  setMoveData({ ...moveData, toStoreId: val })
                }
              >
                <SelectTrigger id="to-store" data-testid="select-to-store">
                  <SelectValue placeholder="Select destination store" />
                </SelectTrigger>
                <SelectContent>
                  {allStores.map((store: Store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="move-quantity">Quantity</Label>
              <Input
                id="move-quantity"
                type="number"
                min="1"
                value={moveData.quantity}
                onChange={(e) =>
                  setMoveData({
                    ...moveData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                data-testid="input-move-quantity"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setMoveDialogOpen(false)}
                data-testid="button-cancel-move"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMoveInventory}
                disabled={moveInventoryMutation.isPending}
                data-testid="button-confirm-move"
              >
                Move Inventory
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
