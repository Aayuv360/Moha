import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { cartService } from "@/features/user/services/cartService";

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isInventoryOwner: boolean;
  inventoryId: string | null;
  isBlocked: boolean;
  createdAt: Date;
  password?: string; // Optional since it's never sent to frontend
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const InventoryToken = localStorage.getItem("token");
      if (InventoryToken) {
        try {
          const userData = await apiRequest("GET", "/api/auth/me", undefined, {
            headers: {
              Authorization: `Bearer ${InventoryToken}`,
            },
          });
          setUser(userData);
          setToken(InventoryToken);
        } catch (error) {
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", {
      email,
      password,
    });

    setUser(response.user);
    setToken(response.token);
    localStorage.setItem("token", response.token);

    const sessionId = localStorage.getItem("sessionId");
    if (sessionId && response.token) {
      try {
        await cartService.mergeCartsOnLogin(sessionId, response.token);
      } catch (error) {
        console.error("Failed to merge carts:", error);
      }
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await apiRequest("POST", "/api/auth/register", {
      email,
      password,
      name,
    });

    setUser(response.user);
    setToken(response.token);
    localStorage.setItem("token", response.token);

    const sessionId = localStorage.getItem("sessionId");
    if (sessionId && response.token) {
      try {
        await cartService.mergeCartsOnLogin(sessionId, response.token);
      } catch (error) {
        console.error("Failed to merge carts:", error);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("checkout_pincode");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
