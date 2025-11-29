import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

interface AdminRouteWrapperProps {
  children: ReactNode;
}

export function AdminRouteWrapper({ children }: AdminRouteWrapperProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (user && !user.isAdmin) {
    return null;
  }

  return <>{children}</>;
}
