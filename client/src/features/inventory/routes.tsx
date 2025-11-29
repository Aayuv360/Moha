import { Routes, Route } from "react-router-dom";
import { InventoryLoginPage, InventoryDashboardPage, InventoryProductDetailPage } from "@/features/inventory/pages";
import { InventoryLayout } from "@/features/inventory/layouts/InventoryLayout";
import NotFound from "@/pages/not-found";

export function InventoryRoutes() {
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
