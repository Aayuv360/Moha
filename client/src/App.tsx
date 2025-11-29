import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./lib/store";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

// Role-based route imports
import { UserRoutes } from "@/features/user/routes";
import { AdminRoutes } from "@/features/admin/routes";
import { InventoryRoutes } from "@/features/inventory/routes";

// Layout imports
import { UserLayout } from "@/features/user/layouts/UserLayout";
import { AdminLayout } from "@/features/admin/layouts/AdminLayout";
import { InventoryLayout } from "@/features/inventory/layouts/InventoryLayout";

// Shared
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* User Routes with User Layout */}
        <Route
          path="/*"
          element={
            <UserLayout>
              <UserRoutes />
            </UserLayout>
          }
        />
        
        {/* Admin Routes with Admin Layout */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <AdminRoutes />
            </AdminLayout>
          }
        />
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Inventory Routes with Inventory Layout */}
        <Route
          path="/inventory/dashboard"
          element={
            <InventoryLayout>
              <InventoryRoutes />
            </InventoryLayout>
          }
        />
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
