import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InventoryReturnsTab } from "./InventoryReturnsTab";
import type { Order, Return } from "@shared/schema";
import { FixedSizeList as List } from "react-virtualized";
import {
  Clock,
  Truck,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Printer,
  RotateCw,
  ChevronDown,
} from "lucide-react";

interface OrdersTabProps {
  orders: Order[];
  ordersSubTab: "pending" | "shipped" | "delivered" | "returns";
  setOrdersSubTab: (tab: "pending" | "shipped" | "delivered" | "returns") => void;
  inventoryReturns?: Return[];
}

export function OrdersTab({
  orders,
  ordersSubTab,
  setOrdersSubTab,
  inventoryReturns = [],
}: OrdersTabProps) {
  const { toast } = useToast();
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

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
      setSelectedOrderIds(new Set());
      toast({ title: "Order updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      orderIds,
      status,
    }: {
      orderIds: string[];
      status: string;
    }) => {
      return await Promise.all(
        orderIds.map((id) =>
          apiRequest("PATCH", `/api/inventory/orders/${id}/status`, { status }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/orders"] });
      setSelectedOrderIds(new Set());
      toast({ title: "Orders updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update orders", variant: "destructive" });
    },
  });

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === displayOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(displayOrders.map((o) => o.id)));
    }
  };

  const getNextStatus = (currentStatus: string): string => {
    if (currentStatus === "pending") return "shipped";
    if (currentStatus === "shipped") return "delivered";
    return currentStatus;
  };

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
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        <Button
          variant={ordersSubTab === "pending" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("pending")}
          data-testid="button-tab-pending-orders"
          className="text-xs sm:text-sm"
          size="sm"
        >
          <span className="hidden sm:inline">Pending Orders</span>
          <span className="sm:hidden">Pending</span> ({pendingOrders.length})
        </Button>
        <Button
          variant={ordersSubTab === "shipped" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("shipped")}
          data-testid="button-tab-shipped-orders"
          className="text-xs sm:text-sm"
          size="sm"
        >
          <span className="hidden sm:inline">Shipped Orders</span>
          <span className="sm:hidden">Shipped</span> ({shippedOrders.length})
        </Button>
        <Button
          variant={ordersSubTab === "delivered" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("delivered")}
          data-testid="button-tab-delivered-orders"
          className="text-xs sm:text-sm"
          size="sm"
        >
          <span className="hidden sm:inline">Delivered Orders</span>
          <span className="sm:hidden">Delivered</span> ({deliveredOrders.length})
        </Button>
        <Button
          variant={ordersSubTab === "returns" ? "default" : "outline"}
          onClick={() => setOrdersSubTab("returns")}
          data-testid="button-tab-returns-orders"
          className="text-xs sm:text-sm"
          size="sm"
        >
          <RotateCw className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Returns</span>
          <span className="sm:hidden">Return</span> ({inventoryReturns.length})
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

      {/* Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              {ordersSubTab === "pending" && (
                <Button
                  size="sm"
                  onClick={() =>
                    bulkUpdateMutation.mutate({
                      orderIds: Array.from(selectedOrderIds),
                      status: "shipped",
                    })
                  }
                  disabled={bulkUpdateMutation.isPending}
                  data-testid="button-bulk-mark-shipped"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Mark as Shipped
                </Button>
              )}
              {ordersSubTab === "shipped" && (
                <Button
                  size="sm"
                  onClick={() =>
                    bulkUpdateMutation.mutate({
                      orderIds: Array.from(selectedOrderIds),
                      status: "delivered",
                    })
                  }
                  disabled={bulkUpdateMutation.isPending}
                  data-testid="button-bulk-mark-delivered"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Delivered
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedOrderIds(new Set())}
                data-testid="button-clear-selection"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Returns Tab Content */}
      {ordersSubTab === "returns" ? (
        <InventoryReturnsTab returns={inventoryReturns} />
      ) : (
        /* Orders List */
        <VirtualizedOrdersList
          displayOrders={displayOrders}
          ordersSubTab={ordersSubTab}
          selectedOrderIds={selectedOrderIds}
          toggleOrderSelection={toggleOrderSelection}
          updateOrderStatusMutation={updateOrderStatusMutation}
          getNextStatus={getNextStatus}
          inventoryReturns={inventoryReturns}
        />
      )}
    </div>
  );
}

function VirtualizedOrdersList({
  displayOrders,
  ordersSubTab,
  selectedOrderIds,
  toggleOrderSelection,
  updateOrderStatusMutation,
  getNextStatus,
  inventoryReturns,
}: any) {
  const itemSize = 300;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const order = displayOrders[index];
    const items = order.items
      ? typeof order.items === "string"
        ? JSON.parse(order.items)
        : order.items
      : [];
    const approvedReturn = inventoryReturns.find(
      (ret: Return) => ret.orderId === order.id && ret.status === "approved"
    );
    const hasReturn = order.status && order.returnNotes;
    const isReturned = ordersSubTab === "delivered" && approvedReturn;

    return (
      <div style={style} className="pr-4">
        <Card
          className="overflow-hidden h-full"
          data-testid={`card-order-${order.id}`}
        >
                {/* Order Header */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        data-testid={`checkbox-order-${order.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <p className="font-semibold text-lg">
                              Order {order.orderTrackingId}
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
                              isReturned
                                ? "secondary"
                                : order.status === "delivered"
                                  ? "default"
                                  : order.status === "shipped"
                                    ? "secondary"
                                    : "outline"
                            }
                            data-testid={`badge-status-${order.id}`}
                          >
                            {isReturned && (
                              <RotateCw className="h-3 w-3 mr-1" />
                            )}
                            {!isReturned && order.status === "pending" && (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {!isReturned && order.status === "shipped" && (
                              <Truck className="h-3 w-3 mr-1" />
                            )}
                            {!isReturned && order.status === "delivered" && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {isReturned
                              ? "Returned"
                              : order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                          </Badge>
                          {hasReturn && !isReturned && (
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
                    </div>
                    <div className="text-right min-w-fit">
                      <div className="flex gap-2 justify-end mb-3">
                        {order.status !== "delivered" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateOrderStatusMutation.mutate({
                                orderId: order.id,
                                status: getNextStatus(order.status),
                              })
                            }
                            disabled={updateOrderStatusMutation.isPending}
                            data-testid={`button-update-status-${order.id}`}
                          >
                            {order.status === "pending" && (
                              <>
                                <Truck className="h-4 w-4 mr-1" />
                                Ship
                              </>
                            )}
                            {order.status === "shipped" && (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Deliver
                              </>
                            )}
                          </Button>
                        )}
                      </div>
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
                <div className="p-4 border-t bg-muted/20 space-y-4">
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

                  {/* Order Timeline */}
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground text-xs font-semibold mb-3">
                      ORDER TIMELINE
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-3 pb-2 border-b">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div className="flex-1">
                          <p className="text-muted-foreground">Order Placed</p>
                          <p className="font-medium">
                            {new Date(order.createdAt).toLocaleDateString("en-IN")} at{" "}
                            {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      {order.shippedAt && (
                        <div className="flex items-start gap-3 pb-2 border-b">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-muted-foreground">Shipped</p>
                            <p className="font-medium">
                              {new Date(order.shippedAt).toLocaleDateString("en-IN")} at{" "}
                              {new Date(order.shippedAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div className="flex items-start gap-3 pb-2 border-b">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-muted-foreground">Delivered</p>
                            <p className="font-medium">
                              {new Date(order.deliveredAt).toLocaleDateString("en-IN")} at{" "}
                              {new Date(order.deliveredAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      {approvedReturn && (
                        <>
                          <div className="flex items-start gap-3 pb-2 border-b">
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                            <div className="flex-1">
                              <p className="text-muted-foreground">Return Requested</p>
                              <p className="font-medium">
                                {new Date(approvedReturn.createdAt).toLocaleDateString("en-IN")} at{" "}
                                {new Date(approvedReturn.createdAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          {approvedReturn.approvedAt && (
                            <div className="flex items-start gap-3 pb-2">
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-600 mt-1.5" />
                              <div className="flex-1">
                                <p className="text-muted-foreground">Return Approved</p>
                                <p className="font-medium">
                                  {new Date(approvedReturn.approvedAt).toLocaleDateString("en-IN")} at{" "}
                                  {new Date(approvedReturn.approvedAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
        </div>
      )}
    </div>
  );
}
