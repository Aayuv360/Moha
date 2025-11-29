import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./lib/store";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

// User Role Pages & Layout
import { HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage, LoginPage, RegisterPage, OrdersPage, WishlistPage } from "@/features/user/pages";
import { UserLayout } from "@/features/user/layouts/UserLayout";

// Admin Role Pages
import { AdminLoginPage } from "@/features/admin/pages/AdminLogin";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboard";

// Inventory Role Pages
import { InventoryLoginPage, InventoryDashboardPage, InventoryProductDetailPage } from "@/features/inventory/pages";

// Shared
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<UserLayout><HomePage /></UserLayout>} />
        <Route path="/products" element={<UserLayout><ProductsPage /></UserLayout>} />
        <Route path="/product/:id" element={<UserLayout><ProductDetailPage /></UserLayout>} />
        <Route path="/cart" element={<UserLayout><CartPage /></UserLayout>} />
        <Route path="/checkout" element={<UserLayout><CheckoutPage /></UserLayout>} />
        <Route path="/wishlist" element={<UserLayout><WishlistPage /></UserLayout>} />
        <Route path="/orders" element={<UserLayout><OrdersPage /></UserLayout>} />
        <Route path="/login" element={<UserLayout><LoginPage /></UserLayout>} />
        <Route path="/register" element={<UserLayout><RegisterPage /></UserLayout>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        {/* Inventory Routes */}
        <Route path="/inventory/login" element={<InventoryLoginPage />} />
        <Route path="/inventory/dashboard" element={<InventoryDashboardPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppRouter />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
