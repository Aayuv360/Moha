import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order, Product } from "@shared/schema";

interface TopProductsChartProps {
  orders: Order[];
  products: Product[];
}

export function TopProductsChart({ orders, products }: TopProductsChartProps) {
  const productSales = products.reduce((acc: any, product) => {
    let totalQty = 0;
    let totalRevenue = 0;

    orders.forEach((order) => {
      if (order.items) {
        const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        items.forEach((item: any) => {
          if (item.id === product.id || item.productId === product.id) {
            totalQty += item.quantity || 0;
            totalRevenue += (parseFloat(item.price || 0) * (item.quantity || 0));
          }
        });
      }
    });

    if (totalQty > 0) {
      acc.push({
        name: product.name.substring(0, 15),
        quantity: totalQty,
        revenue: Math.round(totalRevenue),
      });
    }
    return acc;
  }, [])
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        {productSales.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No sales data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productSales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value: any) => value.toLocaleString("en-IN")} />
              <Legend />
              <Bar yAxisId="left" dataKey="quantity" fill="#8b5cf6" name="Quantity Sold" />
              <Bar yAxisId="right" dataKey="revenue" fill="#f59e0b" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
