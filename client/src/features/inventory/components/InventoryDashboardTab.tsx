import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order, Product, Return } from "@shared/schema";

const SalesTrendsChart = lazy(() =>
  import("./SalesTrendsChart").then((m) => ({ default: m.SalesTrendsChart }))
);
const TopProductsChart = lazy(() =>
  import("./TopProductsChart").then((m) => ({ default: m.TopProductsChart }))
);
const ReturnsAnalyticsCard = lazy(() =>
  import("./ReturnsAnalyticsCard").then((m) => ({ default: m.ReturnsAnalyticsCard }))
);
const ExportReportsCard = lazy(() =>
  import("./ExportReportsCard").then((m) => ({ default: m.ExportReportsCard }))
);

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-72 w-full" />
    </CardContent>
  </Card>
);

interface DashboardTabProps {
  totalSales: number;
  totalRevenue: number;
  products: Product[];
  orders: Order[];
  lowStockProducts: number;
  totalReturns?: number;
  refundedAmount?: number;
  totalInventoryValue?: number;
  inventoryReturns?: Return[];
}

export function DashboardTab({
  totalSales,
  totalRevenue,
  products,
  orders,
  lowStockProducts,
  totalReturns = 0,
  refundedAmount = 0,
  totalInventoryValue = 0,
  inventoryReturns = [],
}: DashboardTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">
              ₹{(totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Listed</p>
          </CardContent>
        </Card>
        <Card
          className={lowStockProducts > 0 ? "border-destructive" : ""}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl sm:text-3xl font-bold ${lowStockProducts > 0 ? "text-destructive" : ""}`}
            >
              {lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≤ 5 units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">
              ₹{(totalInventoryValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">Value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Order Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-4 border rounded">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {orders.filter((o: any) => o.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </div>
            <div className="text-center p-2 sm:p-4 border rounded">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {orders.filter((o: any) => o.status === "shipped").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Shipped</p>
            </div>
            <div className="text-center p-2 sm:p-4 border rounded">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {orders.filter((o: any) => o.status === "delivered").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Delivered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <SalesTrendsChart orders={orders} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TopProductsChart orders={orders} products={products} />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <ReturnsAnalyticsCard
          returns={inventoryReturns}
          orders={orders}
          refundedAmount={refundedAmount}
          totalRevenue={totalRevenue}
        />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <ExportReportsCard orders={orders} products={products} returns={inventoryReturns} />
      </Suspense>
    </div>
  );
}
