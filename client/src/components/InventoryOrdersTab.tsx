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
  ordersSubTab: "active" | "completed";
  setOrdersSubTab: (tab: "active" | "completed") => void;
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

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const completedOrders = orders.filter((o) => o.status === "delivered");
  const displayOrders =
    ordersSubTab === "active" ? activeOrders : completedOrders;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={ordersSubTab === "active" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("active")}
          data-testid="button-tab-active-orders"
        >
          Active Orders ({activeOrders.length})
        </Button>
        <Button
          variant={ordersSubTab === "completed" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("completed")}
          data-testid="button-tab-completed-orders"
        >
          Completed Orders ({completedOrders.length})
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
                        {parseFloat(order.totalAmount.toString()).toLocaleString(
                          "en-IN",
                        )}
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

                {/* Order Items Grid */}
                <div className="p-4 bg-background">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items found
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="border rounded-lg overflow-hidden bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="aspect-square bg-muted overflow-hidden">
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
                          <div className="p-3 space-y-2">
                            <div>
                              <p className="text-sm font-semibold truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ×{item.quantity}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.color && (
                                <Badge variant="secondary" className="text-xs h-5">
                                  {item.color}
                                </Badge>
                              )}
                              {item.fabric && (
                                <Badge variant="secondary" className="text-xs h-5">
                                  {item.fabric}
                                </Badge>
                              )}
                              {item.occasion && (
                                <Badge variant="secondary" className="text-xs h-5">
                                  {item.occasion}
                                </Badge>
                              )}
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-muted-foreground">
                                  Price
                                </span>
                                <span className="text-sm font-medium">
                                  ₹
                                  {item.price
                                    ? parseFloat(
                                        item.price.toString(),
                                      ).toLocaleString("en-IN")
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold">
                                  Subtotal
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  ₹
                                  {item.price
                                    ? (
                                        parseFloat(
                                          item.price.toString(),
                                        ) * item.quantity
                                      ).toLocaleString("en-IN")
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

                  <div className="flex gap-2 print:hidden pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex-1"
                      onClick={() => window.print()}
                      data-testid={`button-print-order-${order.id}`}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Print Order
                    </Button>

                    {ordersSubTab === "active" && (
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatusMutation.mutate({
                            orderId: order.id,
                            status: e.target.value,
                          })
                        }
                        className="text-xs border rounded px-2 py-1 bg-background flex-1"
                        data-testid={`select-order-status-${order.id}`}
                      >
                        <option value="pending">📋 Pending</option>
                        <option value="shipped">🚚 Shipped</option>
                        <option value="delivered">✓ Delivered</option>
                      </select>
                    )}
                  </div>

                  {hasReturn && (
                    <div className="p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800 text-sm">
                      <p className="text-red-900 dark:text-red-100 font-semibold text-xs mb-1 flex items-center gap-1">
                        <RotateCw className="h-3 w-3" /> Return Request
                      </p>
                      <p className="text-red-800 dark:text-red-200">
                        <span className="font-semibold">Reason:</span>{" "}
                        {order.returnNotes}
                      </p>
                      <p className="text-red-800 dark:text-red-200 text-xs mt-1">
                        <span className="font-semibold">Status:</span>{" "}
                        {order.refundStatus || "pending"}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
