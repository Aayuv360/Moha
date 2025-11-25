import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";
import type { Return, Order } from "@shared/schema";

interface ReturnsAnalyticsCardProps {
  returns: Return[];
  orders: Order[];
  refundedAmount: number;
  totalRevenue: number;
}

export function ReturnsAnalyticsCard({
  returns,
  orders,
  refundedAmount,
  totalRevenue,
}: ReturnsAnalyticsCardProps) {
  const totalReturns = returns.length;
  const approvedReturns = returns.filter((r) => r.status === "approved").length;
  const requestedReturns = returns.filter((r) => r.status === "requested").length;
  const returnRate = orders.length > 0 ? ((totalReturns / orders.length) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Returns & Refunds Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Total Returns</p>
            <p className="text-2xl font-bold mt-1">{totalReturns}</p>
            <p className="text-xs text-muted-foreground mt-1">{returnRate}% return rate</p>
          </div>

          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
            <p className="text-xs text-muted-foreground">Pending Requests</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{requestedReturns}</p>
            <Badge variant="outline" className="mt-2 text-xs">
              Awaiting Action
            </Badge>
          </div>

          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <p className="text-xs text-muted-foreground">Approved Returns</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{approvedReturns}</p>
            <Badge variant="default" className="mt-2 text-xs bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Processed
            </Badge>
          </div>

          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <p className="text-xs text-muted-foreground">Total Refunded</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              ₹{refundedAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRevenue > 0 ? ((refundedAmount / totalRevenue) * 100).toFixed(1) : 0}% of revenue
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">
              Returns are impacting your net revenue. Focus on quality and customer satisfaction.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
