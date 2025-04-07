import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  level: number;
  bio: string | null;
  riskTolerance: string | null;
  expiryDate: Date | null;
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<User>;
  refetchUser: () => Promise<User | null>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authError, setAuthError] = useState<Error | null>(null);

  const { 
    data: user, 
    error: queryError, 
    isLoading,
    refetch 
  } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error("Failed to fetch user");
        }
        return await res.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          return null;
        }
        throw error;
      }
    },
    initialData: null
  });

  const refetchUser = useCallback(async () => {
    const { data } = await refetch();
    return data as User | null;
  }, [refetch]);

  useEffect(() => {
    if (queryError) {
      setAuthError(queryError as Error);
    }
  }, [queryError]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Login failed");
      }
      
      const userData = await res.json();
      await queryClient.invalidateQueries({queryKey: ["user"]});
      return userData;
    } catch (error) {
      setAuthError(error as Error);
      throw error;
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      const res = await apiRequest("POST", "/api/auth/logout");
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Logout failed");
      }
      
      await queryClient.invalidateQueries({queryKey: ["user"]});
      await queryClient.setQueryData(["user"], null);
    } catch (error) {
      setAuthError(error as Error);
      throw error;
    }
  }, [queryClient]);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Registration failed");
      }
      
      const user = await res.json();
      await queryClient.invalidateQueries({queryKey: ["user"]});
      return user;
    } catch (error) {
      setAuthError(error as Error);
      throw error;
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: authError,
        login,
        logout,
        register,
        refetchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}