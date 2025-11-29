import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { AdminHeader } from "@/components/headers/AdminHeader";
import { AdminFooter } from "@/components/footers/AdminFooter";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/admin/login", { replace: true });
    }
  }, [user, navigate]);

  if (user && !user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1">{children}</main>
      <AdminFooter />
    </div>
  );
}
