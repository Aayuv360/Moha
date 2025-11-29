import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./lib/store";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

// User Role Pages
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Orders from "@/pages/Orders";
import Wishlist from "@/pages/Wishlist";
import { UserLayout } from "@/features/user/layouts/UserLayout";
import NotFound from "@/pages/not-found";

// Admin Role Pages
import { AdminLoginPage } from "@/features/admin/pages/AdminLogin";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboard";

// Inventory Role Pages
import { InventoryLoginPage } from "@/features/inventory/pages/InventoryLogin";
import { InventoryDashboardPage } from "@/features/inventory/pages/InventoryDashboard";
import InventoryProductDetail from "@/pages/InventoryProductDetail";

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<UserLayout><Home /></UserLayout>} />
        <Route path="/products" element={<UserLayout><Products /></UserLayout>} />
        <Route path="/product/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
        <Route path="/cart" element={<UserLayout><Cart /></UserLayout>} />
        <Route path="/checkout" element={<UserLayout><Checkout /></UserLayout>} />
        <Route path="/wishlist" element={<UserLayout><Wishlist /></UserLayout>} />
        <Route path="/orders" element={<UserLayout><Orders /></UserLayout>} />
        <Route path="/login" element={<UserLayout><Login /></UserLayout>} />
        <Route path="/register" element={<UserLayout><Register /></UserLayout>} />

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
