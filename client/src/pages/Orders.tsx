import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Calendar, CreditCard, RotateCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order, Return } from "@shared/schema";

interface ReturnRequest {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  maxQuantity: number;
  price: number;
}

export default function Orders() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnQuantity, setReturnQuantity] = useState(1);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: !!token,
  });

  const { data: userReturns = [] } = useQuery<Return[]>({
    queryKey: ['/api/returns'],
    enabled: !!token,
  });

  const createReturnMutation = useMutation({
    mutationFn: async (returnData: any) => {
      return await apiRequest("POST", "/api/returns", returnData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] });
      setReturnDialogOpen(false);
      setReturnReason("");
      setReturnQuantity(1);
      setSelectedReturn(null);
      toast({ title: "Return request submitted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to submit return request", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-light mb-2">
            Order History
          </h1>
          <p className="text-muted-foreground">
            View and track your past purchases
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6 text-center">
                Start shopping to see your orders here
              </p>
              <Button onClick={() => setLocation('/products')} data-testid="button-browse-products">
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const items = JSON.parse(order.items);
              const statusColors: Record<string, string> = {
                pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
                shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
                delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
              };

              return (
                <Card key={order.id} data-testid={`order-card-${order.id}`}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-medium">
                          Order #{order.id.substring(0, 8)}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(order.createdAt), 'PPP')}
                        </div>
                      </div>
                      <Badge className={statusColors[order.status] || statusColors.pending}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Items</h3>
                        <div className="space-y-2">
                          {items.map((item: any, index: number) => {
                            const hasExistingReturn = userReturns.some(
                              r => r.orderId === order.id && r.productId === item.productId && r.status !== "rejected"
                            );
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm"
                                data-testid={`order-item-${index}`}
                              >
                                <div className="flex-1">
                                  <span>
                                    {item.productName} × {item.quantity}
                                  </span>
                                  {hasExistingReturn && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                      Return request pending
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    ₹{(parseFloat(item.price) * item.quantity).toLocaleString()}
                                  </span>
                                  {!hasExistingReturn && order.status === "delivered" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedReturn({
                                          orderId: order.id,
                                          productId: item.productId,
                                          productName: item.productName,
                                          quantity: item.quantity,
                                          maxQuantity: item.quantity,
                                          price: parseFloat(item.price),
                                        });
                                        setReturnQuantity(1);
                                        setReturnReason("");
                                        setReturnDialogOpen(true);
                                      }}
                                      data-testid={`button-request-return-${index}`}
                                    >
                                      <RotateCw className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span className="text-sm">Total Amount</span>
                        </div>
                        <span className="text-lg font-semibold" data-testid={`order-total-${order.id}`}>
                          ₹{parseFloat(order.totalAmount).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium">Shipping Address:</p>
                        <p>{order.customerName}</p>
                        <p>{order.address}, {order.city}</p>
                        <p>{order.state} - {order.pincode}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent data-testid="dialog-return-request">
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              {selectedReturn && `Return ${selectedReturn.productName}`}
            </DialogDescription>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="return-quantity">Quantity</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReturnQuantity(Math.max(1, returnQuantity - 1))}
                    data-testid="button-decrease-quantity"
                  >
                    −
                  </Button>
                  <input
                    type="number"
                    min="1"
                    max={selectedReturn.maxQuantity}
                    value={returnQuantity}
                    onChange={(e) =>
                      setReturnQuantity(
                        Math.min(selectedReturn.maxQuantity, Math.max(1, parseInt(e.target.value) || 1))
                      )
                    }
                    className="flex-1 border rounded px-2 py-1 text-center"
                    data-testid="input-return-quantity"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setReturnQuantity(Math.min(selectedReturn.maxQuantity, returnQuantity + 1))
                    }
                    data-testid="button-increase-quantity"
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {selectedReturn.maxQuantity}
                </p>
              </div>

              <div>
                <Label htmlFor="return-reason">Reason for Return</Label>
                <Textarea
                  id="return-reason"
                  placeholder="Please describe why you want to return this item..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="mt-2"
                  data-testid="textarea-return-reason"
                />
              </div>

              <div className="bg-muted p-3 rounded">
                <p className="text-sm">
                  <span className="font-medium">Refund Amount: </span>
                  ₹{(selectedReturn.price * returnQuantity).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setReturnDialogOpen(false)}
                  data-testid="button-cancel-return"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!returnReason.trim()) {
                      toast({ title: "Please provide a reason for return", variant: "destructive" });
                      return;
                    }
                    createReturnMutation.mutate({
                      orderId: selectedReturn.orderId,
                      productId: selectedReturn.productId,
                      quantity: returnQuantity,
                      reason: returnReason,
                      refundAmount: (selectedReturn.price * returnQuantity).toString(),
                      inventoryId: orders.find(o => o.id === selectedReturn.orderId)?.inventoryId,
                    });
                  }}
                  disabled={createReturnMutation.isPending}
                  data-testid="button-submit-return"
                >
                  {createReturnMutation.isPending ? "Submitting..." : "Submit Return Request"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
