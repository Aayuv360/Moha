import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order, Product } from "@shared/schema";

interface DashboardTabProps {
  totalSales: number;
  totalRevenue: number;
  products: Product[];
  orders: Order[];
  lowStockProducts: number;
}

export function DashboardTab({
  totalSales,
  totalRevenue,
  products,
  orders,
  lowStockProducts,
}: DashboardTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From all orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Listed products</p>
          </CardContent>
        </Card>
        <Card
          className={lowStockProducts > 0 ? "border-destructive" : ""}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${lowStockProducts > 0 ? "text-destructive" : ""}`}
            >
              {lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products ≤ 5 units
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {orders.filter((o: any) => o.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter((o: any) => o.status === "shipped").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Shipped</p>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">
                {orders.filter((o: any) => o.status === "delivered").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Delivered</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
