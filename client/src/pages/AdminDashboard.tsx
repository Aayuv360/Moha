import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, Order } from "@shared/schema";
import { Shield, LogOut } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.isAdmin) {
      setLocation("/admin/login");
    }
  }, [user, setLocation]);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user?.isAdmin,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    enabled: !!user?.isAdmin,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/admin/all-products'],
    enabled: !!user?.isAdmin,
  });

  const handleBlockUser = async (userId: string) => {
    try {
      await apiRequest("POST", `/api/admin/users/${userId}/block`, {});
      toast({ title: "User blocked successfully" });
    } catch (error) {
      toast({ title: "Failed to block user", variant: "destructive" });
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await apiRequest("POST", `/api/admin/users/${userId}/unblock`, {});
      toast({ title: "User unblocked successfully" });
    } catch (error) {
      toast({ title: "Failed to unblock user", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-user-${u.id}`}>{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      {u.isBlocked && <Badge variant="destructive" className="mt-1">Blocked</Badge>}
                    </div>
                    <Button
                      size="sm"
                      variant={u.isBlocked ? "default" : "destructive"}
                      onClick={() => u.isBlocked ? handleUnblockUser(u.id) : handleBlockUser(u.id)}
                      data-testid={`button-${u.isBlocked ? 'unblock' : 'block'}-user-${u.id}`}
                    >
                      {u.isBlocked ? "Unblock" : "Block"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {orders.slice(0, 10).map((order: any) => (
                  <div key={order.id} className="p-3 border rounded">
                    <p className="font-medium" data-testid={`text-order-${order.id}`}>{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.email}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">₹{order.totalAmount}</span>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
