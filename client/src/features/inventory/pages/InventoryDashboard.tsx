import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Settings,
  ArrowLeft,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Product, Order, Return } from "@shared/schema";
import { InventoryDashboardTab as DashboardTab, InventoryProductsTab as ProductsTab, InventoryOrdersTab as OrdersTab, InventorySettingsTab as SettingsTab, InventoryReturnsTab } from "../components";
import InventoryProductDetail from "./InventoryProductDetail";
import { InventoryLayout } from "../layouts/InventoryLayout";

export function InventoryDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<
    "dashboard" | "products" | "orders" | "settings"
  >("dashboard");
  const [ordersSubTab, setOrdersSubTab] = useState<
    "pending" | "shipped" | "delivered" | "returns"
  >("pending");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );

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

  const totalSales = orders.length;
  const approvedReturns = inventoryReturns.filter(
    (r) => r.status === "approved",
  );
  const refundedAmount = approvedReturns.reduce(
    (sum, ret) => sum + parseFloat(ret.refundAmount.toString()),
    0,
  );
  const totalRevenue =
    orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount.toString()),
      0,
    ) - refundedAmount;
  const netRevenue = totalRevenue;
  const totalReturns = approvedReturns.length;
  const lowStockProducts = products.filter((p) => p.inStock <= 5).length;
  const totalInventoryValue = products.reduce(
    (sum, prod) => sum + parseFloat(prod.price.toString()) * prod.inStock,
    0,
  );

  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab);
    setMobileMenuOpen(false);
  };

  const NavButtons = () => (
    <>
      <Button
        variant={tab === "dashboard" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabChange("dashboard")}
        data-testid="button-tab-dashboard"
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Dashboard
      </Button>
      <Button
        variant={tab === "products" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabChange("products")}
        data-testid="button-tab-products"
      >
        Products
      </Button>
      <Button
        variant={tab === "orders" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabChange("orders")}
        data-testid="button-tab-orders"
      >
        Orders
      </Button>
      <Button
        variant={tab === "settings" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabChange("settings")}
        data-testid="button-tab-settings"
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </>
  );

  return (
    <InventoryLayout>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)]">
        <aside className="hidden lg:block w-48 border-r bg-card">
          <nav className="space-y-1 p-4">
            <NavButtons />
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
                viewingProductId={viewingProductId}
              />
            )}

            {tab === "products" && viewingProductId && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setViewingProductId(null)}
                  className="mb-4"
                  data-testid="button-back-to-products"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
                <InventoryProductDetail
                  productId={viewingProductId}
                  onBack={() => setViewingProductId(null)}
                />
              </>
            )}

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
    </InventoryLayout>
  );
}
