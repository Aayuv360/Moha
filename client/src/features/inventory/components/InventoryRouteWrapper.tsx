import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

interface InventoryRouteWrapperProps {
  children: ReactNode;
}

export function InventoryRouteWrapper({ children }: InventoryRouteWrapperProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.isInventoryOwner) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (user && !user.isInventoryOwner) {
    return null;
  }

  return <>{children}</>;
}
