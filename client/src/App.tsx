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

// Shared
import NotFound from "@/pages/not-found";

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
