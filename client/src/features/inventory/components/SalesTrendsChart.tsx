import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@shared/schema";

interface SalesTrendsChartProps {
  orders: Order[];
}

export function SalesTrendsChart({ orders }: SalesTrendsChartProps) {
  const data = orders.reduce((acc: any[], order) => {
    const date = new Date(order.createdAt).toLocaleDateString("en-IN");
    const existing = acc.find((d) => d.date === date);
    if (existing) {
      existing.orders += 1;
      existing.revenue += parseFloat(order.totalAmount.toString());
    } else {
      acc.push({
        date,
        orders: 1,
        revenue: parseFloat(order.totalAmount.toString()),
      });
    }
    return acc;
  }, []).slice(-7);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trends (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No sales data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value: any) => value.toLocaleString("en-IN")} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                name="Orders"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                name="Revenue (₹)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
