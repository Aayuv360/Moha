import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Store } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function StoreLogin() {
  const [, setLocation] = useLocation();
  const { user, setUser, setToken } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.isInventoryOwner) {
      setLocation("/store/dashboard");
    }
  }, [user, setLocation]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/auth/inventory-login",
        data,
      );
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      setLocation("/store/dashboard");
      toast({
        title: "Login successful",
        description: "Welcome to your store dashboard",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid store credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-2">
          <div className="bg-primary text-primary-foreground rounded-lg p-3">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Store Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your online store</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Store Login</CardTitle>
            <CardDescription>
              Enter your store credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="store@example.com"
                          {...field}
                          data-testid="input-store-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••"
                          {...field}
                          data-testid="input-store-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-store-login"
                >
                  {isLoading ? "Logging in..." : "Login to Store"}
                </Button>
              </form>
            </Form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                Demo Store Credentials:
              </p>
              <p className="text-xs text-muted-foreground">
                Email: <span className="font-mono">store@example.com</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Password: <span className="font-mono">password123</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Not a store owner?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => setLocation("/")}
              data-testid="button-back-to-home"
            >
              Back to home
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            Need help?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => setLocation("/")}
              data-testid="button-contact-support"
            >
              Contact support
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
