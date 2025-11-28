import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store, LogOut, BarChart3, Settings, RotateCw, ArrowLeft } from "lucide-react";
import type { Product, Order, Return } from "@shared/schema";
import { DashboardTab } from "@/components/InventoryDashboardTab";
import { ProductsTab } from "@/components/InventoryProductsTab";
import { OrdersTab } from "@/components/InventoryOrdersTab";
import { SettingsTab } from "@/components/InventorySettingsTab";
import { InventoryReturnsTab } from "@/components/InventoryReturnsTab";
import InventoryProductDetail from "@/pages/InventoryProductDetail";

export default function InventoryDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<
    "dashboard" | "products" | "orders" | "settings"
  >("dashboard");
  const [ordersSubTab, setOrdersSubTab] = useState<"pending" | "shipped" | "delivered" | "returns">(
    "pending",
  );

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isInventoryOwner) {
      setLocation("/inventory/login");
    }
  }, [user, setLocation]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/inventory/products"],
    enabled: !!user?.isInventoryOwner,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/inventory/orders"],
    enabled: !!user?.isInventoryOwner,
  });

  const { data: inventoryReturns = [] } = useQuery<Return[]>({
    queryKey: ["/api/inventory/returns"],
    enabled: !!user?.isInventoryOwner,
  });

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const totalSales = orders.length;
  const approvedReturns = inventoryReturns.filter((r) => r.status === "approved");
  const refundedAmount = approvedReturns.reduce(
    (sum, ret) => sum + parseFloat(ret.refundAmount.toString()),
    0,
  );
  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.totalAmount.toString()),
    0,
  ) - refundedAmount;
  const netRevenue = totalRevenue;
  const totalReturns = approvedReturns.length;
  const lowStockProducts = products.filter((p) => p.inStock <= 5).length;
  const totalInventoryValue = products.reduce(
    (sum, prod) => sum + (parseFloat(prod.price.toString()) * prod.inStock),
    0,
  );

  if (!user?.isInventoryOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <h1 className="text-2xl font-bold">
              {tab === "orders" ? "Order Management Dashboard" : "Inventory Dashboard"}
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-inventory-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-48 border-r bg-card">
          <nav className="space-y-1 p-4">
            <Button
              variant={tab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setTab("dashboard")}
              data-testid="button-tab-dashboard"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={tab === "products" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setTab("products")}
              data-testid="button-tab-products"
            >
              Products
            </Button>
            <Button
              variant={tab === "orders" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setTab("orders")}
              data-testid="button-tab-orders"
            >
              Orders
            </Button>
            <Button
              variant={tab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setTab("settings")}
              data-testid="button-tab-settings"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {tab === "dashboard" && (
              <DashboardTab
                totalSales={totalSales}
                totalRevenue={netRevenue}
                products={products}
                orders={orders}
                lowStockProducts={lowStockProducts}
                totalReturns={totalReturns}
                refundedAmount={refundedAmount}
                totalInventoryValue={totalInventoryValue}
                inventoryReturns={inventoryReturns}
              />
            )}

            {tab === "products" && !viewingProductId && (
              <ProductsTab
                products={products}
                editingProduct={editingProduct}
                setEditingProduct={setEditingProduct}
                showProductDialog={showProductDialog}
                setShowProductDialog={setShowProductDialog}
                selectedProducts={selectedProducts}
                setSelectedProducts={setSelectedProducts}
                onProductIdClick={setViewingProductId}
              />
            )}

            {tab === "products" && viewingProductId && (
              <>
                <div className="border-b pb-4 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setViewingProductId(null)}
                    data-testid="button-back-to-products"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Products
                  </Button>
                </div>
                <InventoryProductDetail
                  productId={viewingProductId}
                  onBack={() => setViewingProductId(null)}
                />
              </>
            )}

            {tab === "orders" && (
              <OrdersTab
                orders={orders}
                ordersSubTab={ordersSubTab}
                setOrdersSubTab={setOrdersSubTab}
                inventoryReturns={inventoryReturns}
              />
            )}

            {tab === "settings" && (
              <SettingsTab
                user={user}
                products={products}
                orders={orders}
                totalRevenue={totalRevenue}
                lowStockProducts={lowStockProducts}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
