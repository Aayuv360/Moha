import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { InventoryHeader } from "@/components/headers/InventoryHeader";
import { InventoryFooter } from "@/components/footers/InventoryFooter";

interface InventoryLayoutProps {
  children: ReactNode;
}

export function InventoryLayout({ children }: InventoryLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.isInventoryOwner) {
      navigate("/inventory/login", { replace: true });
    }
  }, [user, navigate]);

  if (user && !user.isInventoryOwner) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <InventoryHeader />
      <main className="flex-1">{children}</main>
      <InventoryFooter />
    </div>
  );
}
