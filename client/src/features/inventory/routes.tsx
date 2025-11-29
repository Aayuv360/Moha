import { Routes, Route } from "react-router-dom";
import { InventoryLoginPage, InventoryDashboardPage, InventoryProductDetailPage } from "@/features/inventory/pages";
import NotFound from "@/pages/not-found";

export function InventoryRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<InventoryLoginPage />} />
      <Route path="/dashboard" element={<InventoryDashboardPage />} />
      <Route path="/product/:id" element={<InventoryProductDetailPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
