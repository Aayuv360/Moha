import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import type { Order } from "@shared/schema";

export default function Orders() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: !!token,
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
                          {items.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                              data-testid={`order-item-${index}`}
                            >
                              <span>
                                {item.productName} × {item.quantity}
                              </span>
                              <span className="font-medium">
                                ₹{(parseFloat(item.price) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
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
    </div>
  );
}
