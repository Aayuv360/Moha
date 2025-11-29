import { Routes, Route } from "react-router-dom";
import { AdminLoginPage } from "@/features/admin/pages/AdminLogin";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/dashboard" element={<AdminDashboardPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
