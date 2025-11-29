import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLoginPage } from "@/features/admin/pages/AdminLogin";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboard";
import { AdminLayout } from "@/features/admin/layouts/AdminLayout";
import NotFound from "@/pages/not-found";

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
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
