import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order, Product, User } from "@shared/schema";

interface SettingsTabProps {
  user: User | null;
  products: Product[];
  orders: Order[];
  totalRevenue: number;
  lowStockProducts: number;
}

export function SettingsTab({
  user,
  products,
  orders,
  totalRevenue,
  lowStockProducts,
}: SettingsTabProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Inventory Information</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Inventory Name:</span>{" "}
                <span className="font-medium">{user?.name}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{user?.email}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total Products:</span>{" "}
                <span className="font-medium">{products.length}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total Orders:</span>{" "}
                <span className="font-medium">{orders.length}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total Revenue:</span>{" "}
                <span className="font-medium">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Inventory Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Stock
                </p>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + p.inStock, 0)}
                </p>
              </div>
              <div className="p-3 border rounded">
                <p className="text-xs text-muted-foreground mb-1">
                  Low Stock Items
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {lowStockProducts}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
