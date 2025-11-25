import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import {
  Clock,
  Truck,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Printer,
  RotateCw,
} from "lucide-react";

interface OrdersTabProps {
  orders: Order[];
  ordersSubTab: "pending" | "shipped" | "delivered";
  setOrdersSubTab: (tab: "pending" | "shipped" | "delivered") => void;
}

export function OrdersTab({
  orders,
  ordersSubTab,
  setOrdersSubTab,
}: OrdersTabProps) {
  const { toast } = useToast();

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      return await apiRequest(
        "PATCH",
        `/api/inventory/orders/${orderId}/status`,
        { status },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/orders"] });
      toast({ title: "Order updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const shippedOrders = orders.filter((o) => o.status === "shipped");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const displayOrders =
    ordersSubTab === "pending"
      ? pendingOrders
      : ordersSubTab === "shipped"
        ? shippedOrders
        : deliveredOrders;
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={ordersSubTab === "pending" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("pending")}
          data-testid="button-tab-pending-orders"
        >
          Pending Orders ({pendingOrders.length})
        </Button>
        <Button
          variant={ordersSubTab === "shipped" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("shipped")}
          data-testid="button-tab-shipped-orders"
        >
          Shipped Orders ({shippedOrders.length})
        </Button>
        <Button
          variant={ordersSubTab === "delivered" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("delivered")}
          data-testid="button-tab-delivered-orders"
        >
          Delivered Orders ({deliveredOrders.length})
        </Button>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o: any) => o.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o: any) => o.status === "shipped").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o: any) => o.status === "delivered").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {displayOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-muted-foreground">
                {ordersSubTab === "active"
                  ? "No active orders"
                  : "No completed orders"}
              </p>
            </CardContent>
          </Card>
        ) : displayOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-muted-foreground">
                {ordersSubTab === "pending"
                  ? "No pending orders"
                  : ordersSubTab === "shipped"
                    ? "No shipped orders"
                    : "No delivered orders"}
              </p>
            </CardContent>
          </Card>
        ) : (
          displayOrders.map((order: any) => {
            const items = order.items
              ? typeof order.items === "string"
                ? JSON.parse(order.items)
                : order.items
              : [];
            const hasReturn = order.status && order.returnNotes;

            return (
              <Card
                key={order.id}
                className="overflow-hidden"
                data-testid={`card-order-${order.id}`}
              >
                {/* Order Header */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-lg">
                            Order {order.id.substring(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Customer:{" "}
                            <span className="font-medium">
                              {order.customerName}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "shipped"
                                ? "secondary"
                                : "outline"
                          }
                          data-testid={`badge-status-${order.id}`}
                        >
                          {order.status === "pending" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {order.status === "shipped" && (
                            <Truck className="h-3 w-3 mr-1" />
                          )}
                          {order.status === "delivered" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                        {hasReturn && (
                          <Badge
                            variant="destructive"
                            data-testid={`badge-return-${order.id}`}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Return: {order.refundStatus || "pending"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right min-w-fit">
                      <p className="font-bold text-2xl text-primary">
                        ₹
                        {parseFloat(
                          order.totalAmount.toString(),
                        ).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="p-4 bg-background overflow-x-auto">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items found
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                            ITEM DETAILS
                          </th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">
                            QUANTITY
                          </th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">
                            UNIT PRICE
                          </th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">
                            SUBTOTAL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-2">
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 w-12 h-12 bg-muted rounded overflow-hidden">
                                  <img
                                    src={item.imageUrl || item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3C/svg%3E";
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.color && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs h-5"
                                      >
                                        {item.color}
                                      </Badge>
                                    )}
                                    {item.fabric && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs h-5"
                                      >
                                        {item.fabric}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span>×{item.quantity}</span>
                            </td>
                            <td className="py-3 px-2 text-right font-medium">
                              ₹
                              {item.price
                                ? parseFloat(
                                    item.price.toString(),
                                  ).toLocaleString("en-IN")
                                : "N/A"}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-primary">
                              ₹
                              {item.price
                                ? (
                                    parseFloat(item.price.toString()) *
                                    item.quantity
                                  ).toLocaleString("en-IN")
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Order Details Footer */}
                <div className="p-4 border-t bg-muted/20 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs mb-1">
                        Contact
                      </p>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.phone}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Shipping Address
                      </p>
                      <p className="font-medium line-clamp-2">
                        {order.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.city}, {order.state} - {order.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
