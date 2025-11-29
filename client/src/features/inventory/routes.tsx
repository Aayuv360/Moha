import { Routes, Route, Navigate } from "react-router-dom";
import { InventoryLoginPage, InventoryDashboardPage, InventoryProductDetailPage } from "@/features/inventory/pages";
import { InventoryLayout } from "@/features/inventory/layouts/InventoryLayout";
import { InventoryProtectedRoute } from "@/features/inventory/components/InventoryProtectedRoute";
import NotFound from "@/pages/not-found";

export function InventoryRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/inventory/login" replace />} />
      <Route
        path="/login"
        element={
          <InventoryProtectedRoute>
            <InventoryLoginPage />
          </InventoryProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <InventoryLayout>
            <InventoryDashboardPage />
          </InventoryLayout>
        }
      />
      <Route
        path="/product/:id"
        element={
          <InventoryLayout>
            <InventoryProductDetailPage />
          </InventoryLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
