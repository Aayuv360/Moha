import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
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

// Admin Role Pages & Layout
import { AdminLoginPage } from "@/features/admin/pages/AdminLogin";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboard";
import { AdminLayout } from "@/features/admin/layouts/AdminLayout";

// Inventory Role Pages & Layout
import { InventoryLoginPage, InventoryDashboardPage, InventoryProductDetailPage } from "@/features/inventory/pages";
import { InventoryLayout } from "@/features/inventory/layouts/InventoryLayout";

// Shared
import NotFound from "@/pages/not-found";

// User Routes Group
function UserRoutes() {
  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UserLayout>
  );
}

// Admin Routes Group
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route
        path="/dashboard"
        element={
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Inventory Routes Group
function InventoryRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<InventoryLoginPage />} />
      <Route
        path="/dashboard"
        element={
          <InventoryLayout>
            <InventoryDashboardPage />
          </InventoryLayout>
        }
      />
      <Route path="/product/:id" element={
        <InventoryLayout>
          <InventoryProductDetailPage />
        </InventoryLayout>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* User Routes - Default/Root */}
        <Route path="/*" element={<UserRoutes />} />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Inventory Routes */}
        <Route path="/inventory/*" element={<InventoryRoutes />} />

        {/* 404 - Catch all remaining */}
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
