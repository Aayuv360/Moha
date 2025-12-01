import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, StoreProductInventory, Order } from "@shared/schema";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { ProductAllocationForm } from "./ProductAllocationForm";
import InventoryProductDetail from "../pages/InventoryProductDetail";

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
  onProductIdClick?: (productId: string) => void;
  viewingProductId?: string | null;
}

function VirtualizedProductTable({
  products,
  selectedProducts,
  setSelectedProducts,
  expandedProducts,
  toggleExpanded,
  handleEditProduct,
  handleDeleteProduct,
  calculateSoldStock,
  calculateAllocatedStock,
  storeMap,
  setProductDetails,
}: any) {
  const [visibleStart, setVisibleStart] = useState(0);
  const itemsPerPage = 10;
  const visibleEnd = Math.min(visibleStart + itemsPerPage, products.length);
  const visibleProducts = products.slice(visibleStart, visibleEnd);

  return (
    <div className="w-full space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs sm:text-sm">
          <tbody>
            {visibleProducts.map((product) => {
              const isExpanded = expandedProducts.has(product.id);
              return (
                <>
                  <tr
                    key={product.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                    data-testid={`card-product-${product.id}`}
                  >
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 w-6 sm:w-8">
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
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold whitespace-nowrap truncate max-w-xs">{product.name}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-[10px] sm:text-xs text-muted-foreground hidden sm:table-cell">
                      <button
                        onClick={() => setProductDetails(product)}
                        className="text-primary hover:underline cursor-pointer break-all"
                        data-testid={`link-product-id-${product.id}`}
                      >
                        {product.trackingId}
                      </button>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 hidden md:table-cell text-xs whitespace-nowrap">{product.fabric}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 hidden lg:table-cell text-xs whitespace-nowrap">{product.color}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 hidden lg:table-cell text-xs whitespace-nowrap">{product.occasion}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-bold text-primary text-xs sm:text-sm whitespace-nowrap">
                      ₹
                      {parseFloat(product.price.toString()).toLocaleString(
                        "en-IN",
                      )}
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-medium hidden sm:table-cell text-xs whitespace-nowrap">
                      {product.inStock + calculateSoldStock(product.id)}
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-medium hidden sm:table-cell text-xs whitespace-nowrap">{product.inStock}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-medium hidden md:table-cell text-xs whitespace-nowrap">
                      {calculateSoldStock(product.id)}
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-medium">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpanded(product.id)}
                        className="h-7 sm:h-8 px-1 sm:px-2 text-xs sm:text-sm"
                        data-testid={`button-expand-allocation-${product.id}`}
                      >
                        {calculateAllocatedStock(product)}
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                        )}
                      </Button>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                          className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                          data-testid={`button-delete-product-${product.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                {isExpanded && product.storeInventory && (
                  <tr className="bg-muted/20 border-b">
                    <td colSpan={11} className="px-2 sm:px-3 md:px-4 py-2 sm:py-4">
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-semibold text-xs sm:text-sm">
                          Stock Allocation by Store:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                          {product.storeInventory.map(
                            (allocation: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-white dark:bg-slate-900 p-3 rounded border"
                                data-testid={`allocation-item-${product.id}-${idx}`}
                              >
                                <div className="text-sm font-medium">
                                  {storeMap[allocation.storeId] ||
                                    allocation.storeId}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Channel: {allocation.channel}
                                </div>
                                <div className="text-sm font-semibold mt-2">
                                  Quantity: {allocation.quantity}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
      </div>
      {products.length > itemsPerPage && (
        <div className="flex gap-1 sm:gap-2 justify-center mt-3 sm:mt-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setVisibleStart(Math.max(0, visibleStart - itemsPerPage))
            }
            disabled={visibleStart === 0}
            className="text-xs sm:text-sm"
          >
            Previous
          </Button>
          <span className="text-xs sm:text-sm text-muted-foreground py-2 px-2 sm:px-3">
            {visibleStart + 1}-{visibleEnd} of {products.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setVisibleStart(
                Math.min(
                  products.length - itemsPerPage,
                  visibleStart + itemsPerPage,
                ),
              )
            }
            disabled={visibleEnd >= products.length}
            className="text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
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
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const categories = Array.from(
    new Set(products.map((p: any) => p.category || "Uncategorized")),
  ).sort();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories.length > 0 ? categories[0] : "Uncategorized",
  );

  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );

  const { data: allStores = [] } = useQuery<Store[]>({
    queryKey: ["/api/inventory/all-stores"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/inventory/orders"],
  });

  const storeMap = allStores.reduce(
    (acc, store) => ({ ...acc, [store.id]: store.name }),
    { online: "online" } as { [key: string]: string },
  );
  const calculateSoldStock = (productId: string): number => {
    let totalSold = 0;

    orders.forEach((order) => {
      try {
        const items = JSON.parse(order.items);
        items.forEach((item: any) => {
          if (item.productId === productId) {
            totalSold += item.quantity || 0;
          }
        });
      } catch {
        // Skip malformed order items
      }
    });

    return totalSold;
  };

  const calculateAllocatedStock = (product: any): number => {
    if (!product.storeInventory || !Array.isArray(product.storeInventory)) {
      return 0;
    }
    return product.storeInventory.reduce(
      (sum: number, alloc: any) => sum + (alloc.quantity || 0),
      0,
    );
  };

  const toggleExpanded = (productId: string) => {
    const updated = new Set(expandedProducts);
    if (updated.has(productId)) {
      updated.delete(productId);
    } else {
      updated.add(productId);
    }
    setExpandedProducts(updated);
  };

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
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          Your Products ({products.length})
        </h2>

        <div className="flex gap-2 flex-wrap justify-end">
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
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(category), setProductDetails(null);
                }}
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
              {productDetails ? (
                <>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setProductDetails(null)}
                      className="m-4"
                      data-testid="button-back-to-products"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Products
                    </Button>
                  </div>

                  <InventoryProductDetail
                    product={productDetails}
                    onBack={() => setProductDetails(null)}
                  />
                </>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-semibold">
                          <input
                            type="checkbox"
                            checked={
                              selectedProducts.size ===
                                categoryProducts.length &&
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
                        <th className="px-4 py-3 text-left font-semibold">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Fabric
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Color
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Occasion
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Initial Stock
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Current Stock
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Sold Stock
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Allocated
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  </table>
                  <VirtualizedProductTable
                    products={categoryProducts}
                    selectedProducts={selectedProducts}
                    setSelectedProducts={setSelectedProducts}
                    expandedProducts={expandedProducts}
                    toggleExpanded={toggleExpanded}
                    handleEditProduct={handleEditProduct}
                    handleDeleteProduct={handleDeleteProduct}
                    calculateSoldStock={calculateSoldStock}
                    calculateAllocatedStock={calculateAllocatedStock}
                    storeMap={storeMap}
                    setProductDetails={setProductDetails}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
